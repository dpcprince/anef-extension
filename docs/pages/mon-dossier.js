/**
 * pages/mon-dossier.js — Comparaison personnelle (fork add-on)
 *
 * Page additive : prend les mêmes données que les autres pages, propose à
 * l'usager de saisir 3-4 champs et affiche où son dossier se situe par rapport
 * à des cohortes comparables, en utilisant deux métriques :
 *   - B : temps depuis dépôt au moment de la première arrivée au statut courant
 *   - D : temps cumulé à l'étape courante, somme de tous les spells
 *         (résiste au ping-pong entre sous-statuts d'une même étape)
 *
 * Les inputs peuvent être pré-remplis via :
 *   - query string : ?prefecture=...&statut=...&depot=YYYY-MM-DD&entree-etape=YYYY-MM-DD
 *   - localStorage : 'anef-mondossier' (persisté à chaque modification)
 *   - postMessage  : window.postMessage({ source: 'anef-statut-extension', dossier: {...} })
 */
(function() {
  'use strict';

  var U = ANEF.utils;
  var D = ANEF.data;
  var C = ANEF.constants;
  var M = ANEF.math;

  var state = {
    summaries: [],
    snapshots: [],
    grouped: null,
    cohortsByPrefStatut: null,
    cohortsByStatut: null,
    cohortsByPrefEtape: null,
    cohortsByEtape: null,
    prefectures: [],
    inputs: {
      prefecture: '',
      statut: '',
      dateDepot: '',
      dateEntretien: '',       // NEW — used for entretien-bucketed analysis
      dateEntreeEtape: ''
    },
    // Sync banner state machine: pending → success/unavailable/no_data
    syncState: 'pending'
  };

  document.addEventListener('DOMContentLoaded', async function() {
    var loading = document.getElementById('loading');
    var main = document.getElementById('main-content');
    try {
      var snapshots = await D.loadData();
      if (!snapshots.length) {
        loading.innerHTML = '<div class="error-msg"><p>' + ANEF.t('mondossier.no_data') + '</p></div>';
        return;
      }
      state.snapshots = snapshots;
      state.grouped = D.groupByDossier(snapshots);
      state.summaries = D.computeDossierSummaries(state.grouped);
      state.prefectures = D.getUniquePrefectures(state.summaries);
      buildCohorts();
      buildSpeedRank();

      loading.style.display = 'none';
      main.style.display = 'block';

      initInputs();
      initMethodologyModal();
      // Order matters: listenForExtensionPostMessage BEFORE hydrate so we
      // catch the content script's message (it fires at document_idle and
      // mon-dossier.js runs after DOMContentLoaded — but the page hash adds
      // race risk; better to register the listener first).
      listenForExtensionPostMessage();
      armSyncTimeout();
      hydrateFromURL();
      hydrateFromStorage();
      // Initial state: if URL/storage already populated all required inputs,
      // we don't need to show "pending" — flip to no_data with a softer message.
      if (state.syncState === 'pending' && state.inputs.prefecture && state.inputs.statut && state.inputs.dateDepot) {
        // The user already had data locally; sync banner can flip to a quiet info.
        // (We still leave the timeout armed in case extension fires shortly.)
      }
      render();
    } catch (err) {
      loading.innerHTML = '<div class="error-msg"><p>'
        + ANEF.t('common.error') + ' : ' + U.escapeHtml(err.message) + '</p></div>';
    }
  });

  /** Canonicalise prefecture string the same way the dashboard does elsewhere. */
  function canonPref(p) {
    if (!p) return null;
    return String(p)
      // \s* (not \s+) so apostrophe-suffix connectors like "Préfecture de l'Eure"
      // (no whitespace after the apostrophe) are also stripped.
      .replace(/^Pr[ée]fecture\s+(de\s+la|du|des|de\s+l['’]|de|d['’])\s*/i, '')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/['’]/g, "'");
  }

  /** Walk snapshots to build the four cohort indexes. Runs once at load. */
  function buildCohorts() {
    state.cohortsByPrefStatut = {};
    state.cohortsByStatut = {};
    state.cohortsByPrefEtape = {};   // key: "pref|etape" where etape is an integer 1-12
    state.cohortsByEtape = {};       // key: etape integer 1-12

    // Iterate by summary (which has the *normalized* prefecture used in the
    // dropdown) and pull the matching snaps from state.grouped. This makes
    // the cohort prefecture canonicalisation identical to the dropdown's,
    // avoiding the mismatch between raw snapshot prefectures (e.g. "Préfecture
    // de Police (Paris)") and normalized summary prefectures (e.g. "Préfecture
    // de Police").
    state.summaries.forEach(function(summary) {
      // summaries are keyed by full hash; the displayed .hash is a short
      // display ID, the actual map key is .fullHash.
      var snaps = state.grouped.get(summary.fullHash);
      if (!snaps || !snaps.length) return;
      var depot = summary.dateDepot || snaps[snaps.length - 1].date_depot;
      if (!depot) return;
      var pref = canonPref(summary.prefecture);

      // Metric B : days since dépôt at FIRST entry to each statut
      var seenStatuts = {};
      for (var i = 0; i < snaps.length; i++) {
        var st = (snaps[i].statut || '').toLowerCase();
        if (!st || seenStatuts[st]) continue;
        seenStatuts[st] = true;
        var d = U.daysDiff(depot, snaps[i].date_statut);
        if (d == null || d < 0) continue;
        pushCohort(state.cohortsByStatut, st, d);
        if (pref) pushCohort(state.cohortsByPrefStatut, pref + '|' + st, d);
      }

      // Metric D : cumulative days at each étape (integer 1-12). Keyed by
      // étape number rather than phase string, because PHASE_NAMES[etape]
      // (used at lookup time) can differ from snaps[i].phase (raw label),
      // especially for étape 9 ("Contrôle SDANF" vs "Contrôle SDANF & SCEC").
      var etapeTotal = {};
      var curEtape = null;
      var spellIn = null;
      for (var j = 0; j < snaps.length; j++) {
        var etape = snaps[j].etape;
        var t = snaps[j].date_statut;
        if (typeof etape !== 'number' || !t) continue;
        if (etape !== curEtape) {
          if (curEtape != null && spellIn) {
            var len = U.daysDiff(spellIn, t);
            if (len != null) etapeTotal[curEtape] = (etapeTotal[curEtape] || 0) + len;
          }
          curEtape = etape;
          spellIn = t;
        }
      }
      // Close the final open spell with "today" if the last snapshot's étape
      // matches the current spell's étape.
      var lastEtape = snaps[snaps.length - 1].etape;
      if (curEtape === lastEtape && spellIn) {
        var today = new Date();
        var openLen = U.daysDiff(spellIn, today);
        if (openLen != null) etapeTotal[curEtape] = (etapeTotal[curEtape] || 0) + openLen;
      }
      Object.keys(etapeTotal).forEach(function(p) {
        var v = etapeTotal[p];
        if (v <= 0) return;
        pushCohort(state.cohortsByEtape, p, v);
        if (pref) pushCohort(state.cohortsByPrefEtape, pref + '|' + p, v);
      });
    });

    // Sort each cohort ascending for percentile compute
    Object.keys(state.cohortsByStatut).forEach(function(k) { state.cohortsByStatut[k].sort(numAsc); });
    Object.keys(state.cohortsByPrefStatut).forEach(function(k) { state.cohortsByPrefStatut[k].sort(numAsc); });
    Object.keys(state.cohortsByEtape).forEach(function(k) { state.cohortsByEtape[k].sort(numAsc); });
    Object.keys(state.cohortsByPrefEtape).forEach(function(k) { state.cohortsByPrefEtape[k].sort(numAsc); });
  }

  function pushCohort(bag, key, value) {
    if (!bag[key]) bag[key] = [];
    bag[key].push(value);
  }
  function numAsc(a, b) { return a - b; }

  function quantile(sortedAsc, q) {
    if (!sortedAsc.length) return null;
    var k = (sortedAsc.length - 1) * q;
    var f = Math.floor(k);
    var c = Math.min(f + 1, sortedAsc.length - 1);
    if (f === c) return sortedAsc[f];
    return sortedAsc[f] + (sortedAsc[c] - sortedAsc[f]) * (k - f);
  }

  /** Inputs — prefecture native select + statut via ANEF.ui + 2 date inputs */
  function initInputs() {
    // Prefecture select (native — kept simple; the canonical list is small enough)
    var prefContainer = document.getElementById('md-prefecture-container');
    var sel = document.createElement('select');
    sel.className = 'md-date-input';  // reuse the same border/padding styling
    var emptyOpt = document.createElement('option');
    emptyOpt.value = '';
    emptyOpt.textContent = ANEF.t('mondossier.pref_choose') || '— choisir —';
    sel.appendChild(emptyOpt);
    // D.getUniquePrefectures returns an array of strings (the normalized
    // prefecture labels), not objects with .label. Treat them as strings.
    var prefsSorted = state.prefectures.slice().sort(function(a, b) {
      return String(a || '').localeCompare(String(b || ''), 'fr');
    });
    prefsSorted.forEach(function(label) {
      if (!label) return;
      var o = document.createElement('option');
      var canon = canonPref(label);
      o.value = canon || '';
      o.textContent = label;
      sel.appendChild(o);
    });
    sel.addEventListener('change', function() {
      state.inputs.prefecture = sel.value;
      persist();
      render();
    });
    prefContainer.appendChild(sel);
    state._prefSelect = sel;

    // Statut select (reuse the rich component). Capture the API so
    // setStatut() can drive the visible dropdown label when hydrating
    // from URL, localStorage, or a postMessage from the extension.
    if (ANEF.ui && ANEF.ui.createStatusSelect) {
      state._statutSelect = ANEF.ui.createStatusSelect('md-statut-container', {
        defaultValue: 'all',
        includeAll: true,
        onChange: function(code) {
          state.inputs.statut = (code === 'all' || !code) ? '' : String(code).toLowerCase();
          persist();
          render();
        }
      });
    }

    // Date inputs
    var depotInput = document.getElementById('md-depot');
    var entretienInput = document.getElementById('md-entretien');
    var entreeInput = document.getElementById('md-entree-etape');
    var today = new Date().toISOString().slice(0, 10);
    depotInput.max = today;
    entretienInput.max = today;
    entreeInput.max = today;
    depotInput.addEventListener('input', function() {
      state.inputs.dateDepot = depotInput.value;
      persist();
      render();
    });
    entretienInput.addEventListener('input', function() {
      state.inputs.dateEntretien = entretienInput.value;
      persist();
      render();
    });
    entreeInput.addEventListener('input', function() {
      state.inputs.dateEntreeEtape = entreeInput.value;
      persist();
      render();
    });
    state._depotInput = depotInput;
    state._entretienInput = entretienInput;
    state._entreeInput = entreeInput;
  }

  function hydrateFromURL() {
    var p = new URLSearchParams(location.search);
    var pref = p.get('prefecture');
    var st = p.get('statut');
    var dep = p.get('depot');
    var ent = p.get('entretien');
    var ee = p.get('entree-etape');
    if (pref) setPrefecture(pref);
    if (st) setStatut(String(st).toLowerCase());
    if (dep) setDate('depot', dep);
    if (ent) setDate('entretien', ent);
    if (ee) setDate('entree-etape', ee);
    if (p.get('from') === 'extension') {
      setSyncState('success', { source: 'url-deeplink' });
    }
  }

  function hydrateFromStorage() {
    if (state.inputs.prefecture || state.inputs.statut || state.inputs.dateDepot) return;
    try {
      var raw = localStorage.getItem('anef-mondossier');
      if (!raw) return;
      var obj = JSON.parse(raw);
      if (obj.prefecture) setPrefecture(obj.prefecture);
      if (obj.statut) setStatut(obj.statut);
      if (obj.dateDepot) setDate('depot', obj.dateDepot);
      if (obj.dateEntretien) setDate('entretien', obj.dateEntretien);
      if (obj.dateEntreeEtape) setDate('entree-etape', obj.dateEntreeEtape);
    } catch (e) { /* ignore */ }
  }

  function listenForExtensionPostMessage() {
    window.addEventListener('message', function(ev) {
      if (ev.source !== window) return;
      if (!ev.data || ev.data.source !== 'anef-statut-extension') return;
      console.log('[mon-dossier] received message from extension:', ev.data);
      // Sentinel: presence of this message alone proves the extension is installed.
      // Cancel the "no extension" timeout.
      if (_syncPendingTimer) { clearTimeout(_syncPendingTimer); _syncPendingTimer = null; }
      var d = ev.data.dossier;
      if (!d || (!d.prefecture && !d.statut && !d.dateDepot)) {
        // Extension found, but chrome.storage had no dossier yet — user
        // hasn't visited their ANEF page since installing.
        setSyncState('no_data');
        return;
      }
      if (d.prefecture) setPrefecture(d.prefecture);
      if (d.statut) setStatut(String(d.statut).toLowerCase());
      if (d.dateDepot) setDate('depot', d.dateDepot);
      if (d.dateEntretien) setDate('entretien', d.dateEntretien);
      if (d.dateEntreeEtape) setDate('entree-etape', d.dateEntreeEtape);
      if (d.prefecture && d.statut && d.dateDepot) {
        setSyncState('success');
      } else {
        setSyncState('no_data');
      }
      render();
    });
  }

  function setPrefecture(v) {
    state.inputs.prefecture = v;
    if (state._prefSelect) state._prefSelect.value = v;
  }
  function setStatut(v) {
    state.inputs.statut = v;
    // Update the rich select's visible label via the setValue API captured
    // in initInputs(). Without this the form would compute correctly but
    // show "Toutes les étapes" — confusing when arriving via deep-link.
    if (state._statutSelect && state._statutSelect.setValue) {
      state._statutSelect.setValue(v);
    }
  }
  function setDate(which, v) {
    if (which === 'depot') {
      state.inputs.dateDepot = v;
      if (state._depotInput) state._depotInput.value = v;
    } else if (which === 'entretien') {
      state.inputs.dateEntretien = v;
      if (state._entretienInput) state._entretienInput.value = v;
    } else {
      state.inputs.dateEntreeEtape = v;
      if (state._entreeInput) state._entreeInput.value = v;
    }
  }

  // ─── Sync banner state machine ─────────────────────────────
  // States:
  //   pending      → blue, "looking for ANEF extension..."
  //   success      → green, "Data filled from extension"
  //   no_data      → grey, "Extension found, but no dossier data yet — visit your ANEF page first"
  //   unavailable  → amber, "No ANEF extension detected — fill in manually OR install"
  // The dashboard-sync.js content script posts a sentinel message even when
  // it has no data, so we can distinguish "extension absent" from "extension
  // present but no data". After 1.5s without any extension signal, we flip
  // pending → unavailable.
  function setSyncState(newState, meta) {
    state.syncState = newState;
    var banner = document.getElementById('md-sync-banner');
    var icon = document.getElementById('md-sync-icon');
    var text = document.getElementById('md-sync-text');
    var btn = document.getElementById('md-sync-action');
    if (!banner) return;
    banner.className = 'md-sync-banner md-sync-' + newState.replace('_', '-');
    var icons = { pending: '⏳', success: '✓', no_data: 'ℹ', unavailable: '⚠' };
    if (icon) icon.textContent = icons[newState] || '';
    if (text) text.textContent = ANEF.t('mondossier.sync_' + newState);
    if (btn) {
      if (newState === 'unavailable') {
        btn.style.display = '';
        btn.textContent = ANEF.t('mondossier.sync_install_btn');
        btn.onclick = function() { window.open('guide.html#installation', '_blank'); };
      } else {
        btn.style.display = 'none';
      }
    }
  }

  var _syncPendingTimer = null;
  function armSyncTimeout() {
    if (_syncPendingTimer) return;
    _syncPendingTimer = setTimeout(function() {
      if (state.syncState === 'pending') setSyncState('unavailable');
    }, 1500);
  }
  function persist() {
    try { localStorage.setItem('anef-mondossier', JSON.stringify(state.inputs)); }
    catch (e) {}
  }

  /** Render the right pane based on current inputs. */
  function render() {
    var i = state.inputs;
    var empty = document.getElementById('empty-state');
    var results = document.getElementById('results');
    if (!i.prefecture || !i.statut || !i.dateDepot) {
      empty.classList.remove('hidden');
      results.classList.add('hidden');
      return;
    }
    empty.classList.add('hidden');
    results.classList.remove('hidden');

    var today = new Date();
    var depot = new Date(i.dateDepot);
    if (isNaN(depot)) return;
    var daysDepot = Math.floor((today - depot) / 86400000);

    var daysEtape = null;
    if (i.dateEntreeEtape) {
      var e = new Date(i.dateEntreeEtape);
      if (!isNaN(e)) daysEtape = Math.floor((today - e) / 86400000);
    }

    var statutInfo = C.STATUTS[i.statut.toUpperCase()] || C.STATUTS[i.statut] || null;
    var phase = statutInfo ? (C.PHASE_NAMES[statutInfo.etape] || ('Étape ' + statutInfo.etape)) : '?';
    var etape = statutInfo ? statutInfo.etape : null;

    // Ton dossier tiles — U.setText takes an ID string, not an element
    U.setText('md-out-depot', U.formatDuration(daysDepot));
    U.setText('md-out-etape', phase);
    // Prefer human-readable explication; fall back to the raw code for status
    // codes we don't have a friendly description for.
    var statutLabel = (statutInfo && statutInfo.explication) || i.statut;
    var statutEl = document.getElementById('md-out-statut');
    if (statutEl) {
      statutEl.textContent = statutLabel;
      // Always expose the raw code on hover, since the explication is the
      // user-friendly version and the code is what shows up in the URL/share.
      statutEl.title = i.statut;
    }
    U.setText('md-out-at-etape', daysEtape != null ? U.formatDuration(daysEtape) : '—');

    // Préfecture context tiles
    var prefSummaries = state.summaries.filter(function(s) {
      return canonPref(s.prefecture) === i.prefecture;
    });
    var prefName = prefSummaries.length ? prefSummaries[0].prefecture : i.prefecture;
    var prefNameEl = document.getElementById('md-pref-name');
    if (prefNameEl) prefNameEl.textContent = prefName;
    var nTotal = prefSummaries.length;
    var nFav = 0, nOpen = 0;
    var cycleDays = [];
    prefSummaries.forEach(function(s) {
      // Use the shared classifier — summaries don't carry an `isPositive`
      // field; only `isFinished` exists upstream. C.isPositiveStatus matches
      // the same logic the rest of the dashboard uses.
      if (C.isPositiveStatus(s.statut)) {
        nFav++;
        if (s.daysSinceDeposit != null) cycleDays.push(s.daysSinceDeposit);
      }
      if (!s.isFinished) nOpen++;
    });
    cycleDays.sort(numAsc);
    var cycleMed = quantile(cycleDays, 0.5);
    U.setText('md-pref-total', String(nTotal));
    U.setText('md-pref-cycle', cycleMed != null ? U.formatDuration(Math.round(cycleMed)) : '—');
    U.setText('md-pref-open', nTotal ? Math.round(100 * nOpen / nTotal) + ' %' : '—');
    U.setText('md-pref-favorable', nTotal ? Math.round(100 * nFav / nTotal) + ' %' : '—');

    // Outcome probabilities at horizons (competing-risks on conditional cohort).
    // Landmark mode (daysEtape filled) compares against dossiers that were
    // ALSO stuck at this étape for at least this long, which is the right
    // signal for "what happens next?". Falls back to entry-age matching when
    // dateEntreeEtape is blank.
    renderOutcomes(etape, daysDepot, daysEtape, i.prefecture, prefName);

    // Action card — référé carence eligibility (>12 months at étape)
    var actionCard = document.getElementById('action-card');
    if (daysEtape != null && daysEtape > 365) {
      actionCard.classList.remove('hidden');
    } else {
      actionCard.classList.add('hidden');
    }

    // Pass 9 additions
    renderPositionTile(i.dateDepot, statutInfo ? statutInfo.etape : null, i.prefecture);
    renderSinceChangeTile(i.dateEntreeEtape);
    renderNextStep(statutInfo ? statutInfo.etape : null, i.prefecture, prefName);
    renderPrefExtras(i.prefecture, prefName);
    renderRecentDecrees(i.prefecture);
  }

  /** Build one outcomes table for a cohort (local or national).
   *  Returns the <table>...</table> HTML.
   *  The cohort has: { horizons, n (total entered étape), nAtRisk (still pending
   *  at user's T), SAtUser (= nAtRisk/n), extrapolation (bool) }. */
  function _outcomesTableHtml(cohort) {
    if (!cohort) return '';
    var head = '<thead><tr>'
      + '<th>' + (ANEF.t('mondossier.outcomes_col_horizon') || 'Horizon') + '</th>'
      + '<th class="num">' + (ANEF.t('mondossier.outcomes_col_fav') || '% décret') + '</th>'
      + '<th class="num">' + (ANEF.t('mondossier.outcomes_col_neg') || '% refus / RAPO') + '</th>'
      + '<th class="num">' + (ANEF.t('mondossier.outcomes_col_pending') || '% encore en attente') + '</th>'
      + '</tr></thead>';

    // Extrapolation: the user's T_user is past the bulk of the cohort. Show a
    // single explanatory row instead of nonsense numbers.
    if (cohort.extrapolation || !cohort.horizons) {
      return '<table class="percentile-table">' + head + '<tbody><tr>'
        + '<td colspan="4" class="muted" style="text-align:center;padding:1rem;color:var(--text-dim);font-size:0.88rem">'
        + (ANEF.t('mondossier.extrapolation_msg') ||
           'Très peu de dossiers comparables ont été observés aussi longtemps à cette étape — pas assez de signal pour donner des probabilités fiables.')
        + '</td></tr></tbody></table>';
    }

    // Small-sample warning: nAtRisk < 10 means the conditional estimate is
    // noisy. We still show the numbers but greyed out + warn.
    var thin = cohort.nAtRisk < 10;
    var valStyle = thin ? ';opacity:0.65' : '';

    var rows = '';
    [6, 12, 24].forEach(function(m) {
      var h = cohort.horizons[m];
      var label = ANEF.t('mondossier.outcomes_horizon_' + m + 'mo')
        || (m === 6 ? '+6 mois' : m === 12 ? '+1 an' : '+2 ans');
      if (!h) {
        rows += '<tr>'
          + '<td><strong>' + label + '</strong></td>'
          + '<td colspan="3" class="muted" style="text-align:center;color:var(--text-dim);font-size:0.85rem">—</td>'
          + '</tr>';
        return;
      }
      rows += '<tr>'
        + '<td><strong>' + label + '</strong></td>'
        + '<td class="num" style="color:var(--green)' + valStyle + '">' + h.favorable.toFixed(1).replace('.', ',') + ' %</td>'
        + '<td class="num" style="color:var(--red)' + valStyle + '">' + h.negative.toFixed(1).replace('.', ',') + ' %</td>'
        + '<td class="num" style="color:var(--orange)' + valStyle + '">' + h.pending.toFixed(1).replace('.', ',') + ' %</td>'
        + '</tr>';
    });
    return '<table class="percentile-table">' + head + '<tbody>' + rows + '</tbody></table>';
  }

  /** Render the competing-risks outcomes — TWO tables stacked (prefecture +
   *  national) so the user can compare directly. Prefecture cohort is shown
   *  even when small, with n surfaced per row + thin-sample formatting. */
  function renderOutcomes(etape, daysDepot, daysEtape, prefCanon, prefLabel) {
    var container = document.getElementById('md-outcomes-tables');
    var subEl = document.getElementById('md-outcomes-subtitle');
    var footEl = document.getElementById('md-outcomes-footnote');
    var stuckCard = document.getElementById('md-stuck-card');
    var stuckMsg = document.getElementById('md-stuck-msg');
    var modeBanner = document.getElementById('md-mode-banner');
    var modeBannerMsg = document.getElementById('md-mode-banner-msg');
    if (!container) return;

    if (etape == null || !window.ANEF || !ANEF.math || !ANEF.math.conditionalOutcomes) {
      container.innerHTML = '<p class="no-data" style="text-align:center;padding:1rem;color:var(--text-dim)">'
        + (ANEF.t('mondossier.outcomes_no_data') || 'Renseigne le statut pour activer cette analyse.')
        + '</p>';
      if (footEl) footEl.textContent = '';
      if (stuckCard) stuckCard.classList.add('hidden');
      if (modeBanner) modeBanner.classList.add('hidden');
      return;
    }

    var useLandmark = (daysEtape != null && daysEtape >= 0);
    var co = ANEF.math.conditionalOutcomes(state.grouped, etape, prefCanon, {
      daysAtEtape: useLandmark ? daysEtape : null,
      daysAtDepot: daysDepot
    });

    if (!co || co.insufficient) {
      container.innerHTML = '<p class="no-data" style="text-align:center;padding:1rem;color:var(--text-dim)">'
        + (ANEF.t('mondossier.outcomes_cohort_small') || 'Cohorte nationale trop petite pour cette combinaison.')
        + '</p>';
      if (footEl) footEl.textContent = '';
      if (stuckCard) stuckCard.classList.add('hidden');
      if (modeBanner) modeBanner.classList.add('hidden');
      return;
    }

    // Mode banner: gently suggest filling in dateEntreeEtape when in fallback
    if (modeBanner && modeBannerMsg) {
      if (!useLandmark) {
        modeBannerMsg.textContent = ANEF.t('mondossier.mode_banner_entry_age') ||
          'Renseigne la date d\'entrée à l\'étape pour activer une analyse plus précise.';
        modeBanner.classList.remove('hidden');
      } else {
        modeBanner.classList.add('hidden');
      }
    }

    // Subtitle: pivot value rounded to nearest month + a positioning hint.
    // The math no longer uses any tolerance/bucketing — conditional CIF runs
    // on the full cohort with no matching parameters to explain to the user.
    if (subEl) {
      var pivotDays = useLandmark ? daysEtape : daysDepot;
      var pivotRounded = Math.max(30, Math.round(pivotDays / 30.44) * 30);
      var pivotHuman = U.formatDuration(pivotRounded);
      var pivotPhrase = useLandmark
        ? (ANEF.t('mondossier.pivot_landmark') || 'environ {pivot} à cette étape').replace('{pivot}', pivotHuman)
        : (ANEF.t('mondossier.pivot_entry') || 'environ {pivot} d\'ancienneté à l\'entrée de l\'étape').replace('{pivot}', pivotHuman);
      var positionHint = '';
      if (co.pctStillPendingAtUser != null) {
        positionHint = ' ' + (ANEF.t('mondossier.position_hint') ||
          '({pct}% des dossiers du panel sont encore à ce stade au même moment que toi — le reste a déjà eu une issue.)')
          .replace('{pct}', co.pctStillPendingAtUser.toFixed(0));
      }
      subEl.innerHTML = ((ANEF.t('mondossier.outcomes_subtitle_v2') ||
        'Parmi les dossiers du panel à l\'étape {etape} avec ton ancienneté ({pivot}), voici la probabilité qu\'ils obtiennent un décret, un refus ou restent en attente dans les prochains mois.')
        .replace('{etape}', etape)
        .replace('{pivot}', pivotPhrase)) + positionHint;
    }

    // Two stacked tables: prefecture, then national. Show both always (so the
    // user can compare); the prefecture table includes a clear "no comparable
    // dossiers" message when the local cohort is empty.
    var prefHeader = (ANEF.t('mondossier.section_local') || 'Dans ta préfecture ({pref})')
      .replace('{pref}', prefLabel);
    var natHeader = ANEF.t('mondossier.section_national') || 'Au niveau national';

    function _cohortHint(cohort) {
      if (!cohort) return '';
      return ' <span style="color:var(--text-dim);font-weight:normal;font-size:0.85rem">'
        + (ANEF.t('mondossier.cohort_size_hint') ||
            '— {n} dossier(s) entré(s) à cette étape, dont {nAtRisk} encore au même stade que toi')
          .replace('{n}', cohort.n).replace('{nAtRisk}', cohort.nAtRisk)
        + '</span>';
    }

    var prefSection;
    if (co.local) {
      prefSection = '<div class="md-outcomes-section">'
        + '<h3 style="font-size:1rem;margin:0 0 0.5rem">' + U.escapeHtml(prefHeader) + _cohortHint(co.local) + '</h3>'
        + _outcomesTableHtml(co.local)
        + '</div>';
    } else {
      prefSection = '<div class="md-outcomes-section">'
        + '<h3 style="font-size:1rem;margin:0 0 0.5rem">' + U.escapeHtml(prefHeader) + '</h3>'
        + '<p class="no-data" style="text-align:left;color:var(--text-dim);font-style:italic">'
        + (ANEF.t('mondossier.no_local_cohort') ||
            'Aucun dossier de ta préfecture n\'a encore été observé à cette étape dans le panel. La vue nationale ci-dessous reste valable.')
        + '</p></div>';
    }
    var natSection = '<div class="md-outcomes-section" style="margin-top:1rem">'
      + '<h3 style="font-size:1rem;margin:0 0 0.5rem">' + U.escapeHtml(natHeader) + _cohortHint(co.national) + '</h3>'
      + _outcomesTableHtml(co.national)
      + '</div>';

    container.innerHTML = prefSection + natSection;

    // Footnote: clarify the conditional reading + flag a long tail when pending stays high.
    if (footEl) {
      var pendNat = co.pendingAt12mo != null ? Math.round(co.pendingAt12mo) : null;
      var footParts = [];
      footParts.push(ANEF.t('mondossier.footnote_conditional') ||
        'Lecture : chaque ligne donne la probabilité conditionnelle pour les dossiers qui sont encore à ce stade au même moment du parcours que le tien — pas pour l\'ensemble des dossiers passés par cette étape.');
      if (pendNat != null && pendNat > 50) {
        footParts.push((ANEF.t('mondossier.footnote_slow_tail') ||
          '{pend}% au national restent encore en attente même un an après ta position — cette étape a une longue traîne.')
          .replace('{pend}', pendNat));
      }
      footEl.textContent = footParts.join(' ');
    }

    // Stuck flag — uses the NATIONAL signal (more reliable than thin local).
    if (stuckCard && stuckMsg) {
      var pending12 = co.pendingAt12mo != null ? co.pendingAt12mo : 100;
      var medianMonths = co.medianDaysToEvent != null ? Math.round(co.medianDaysToEvent / 30.44) : 999;
      var stuck = medianMonths > 24 || pending12 > 70;
      if (stuck) {
        var medStr = co.medianDaysToEvent != null ? (medianMonths + ' mois') : (ANEF.t('mondossier.gt5yrs') || 'plus de 5 ans');
        stuckMsg.innerHTML = (ANEF.t('mondossier.stuck_message_v2') ||
          'Pour les dossiers comparables au tien, le délai typique avant une issue est de <strong>{med}</strong>, ' +
          'et <strong>{pending}%</strong> sont encore en attente après 12 mois. ' +
          'Ton dossier connaît des délais inhabituellement longs — un courrier de relance ou un référé peuvent être pertinents.')
          .replace('{med}', medStr)
          .replace('{pending}', pending12.toFixed(0));
        stuckCard.classList.remove('hidden');
      } else {
        stuckCard.classList.add('hidden');
      }
    }
  }

  // ─── Pass 9 — Mon dossier extensions ────────────────────

  /** Pre-compute the national speed ranking (cycle median dépôt → décret).
   *  Used by the "rang vitesse" tile in the prefecture profile. */
  function buildSpeedRank() {
    var byPref = {};  // canonPref -> array of cycle days for FAV-closed dossiers
    state.summaries.forEach(function(s) {
      if (!s.prefecture || s.daysSinceDeposit == null) return;
      if (!C.isPositiveStatus(s.statut)) return;
      var k = canonPref(s.prefecture);
      if (!k) return;
      if (!byPref[k]) byPref[k] = [];
      byPref[k].push(s.daysSinceDeposit);
    });
    var entries = [];
    Object.keys(byPref).forEach(function(k) {
      var arr = byPref[k];
      if (arr.length < 5) return;  // need a credible sample
      arr.sort(numAsc);
      entries.push({ pref: k, median: arr[Math.floor(arr.length / 2)], n: arr.length });
    });
    entries.sort(function(a, b) { return a.median - b.median; });
    state._speedRank = {};
    state._speedTotal = entries.length;
    entries.forEach(function(e, idx) {
      state._speedRank[e.pref] = { rank: idx + 1, median: e.median };
    });
  }

  function renderPositionTile(dateDepot, etape, prefCanon) {
    var valEl = document.getElementById('md-out-position');
    var subEl = document.getElementById('md-out-position-sub');
    if (!valEl || !subEl || etape == null || !dateDepot) {
      if (valEl) valEl.textContent = '—';
      if (subEl) subEl.textContent = '';
      return;
    }
    if (!M.cohortPositionPercentile) {
      valEl.textContent = '—';
      subEl.textContent = '';
      return;
    }
    var res = M.cohortPositionPercentile(state.summaries, dateDepot, etape, prefCanon, 2);
    if (!res || res.insufficient) {
      // Fall back to national
      res = M.cohortPositionPercentile(state.summaries, dateDepot, etape, null, 2);
      if (!res || res.insufficient) {
        valEl.textContent = '—';
        subEl.textContent = (ANEF.t('mondossier.position_insufficient') ||
          'Pas assez de dossiers déposés à la même période.');
        return;
      }
      valEl.textContent = res.percentile.toFixed(0) + '%';
      subEl.textContent = (ANEF.t('mondossier.position_national_sub') ||
        'Plus avancé que {pct}% des dossiers nationaux déposés à la même période ({n}).')
        .replace('{pct}', res.percentile.toFixed(0))
        .replace('{n}', res.n_cohort);
    } else {
      valEl.textContent = res.percentile.toFixed(0) + '%';
      subEl.textContent = (ANEF.t('mondossier.position_local_sub') ||
        'Plus avancé que {pct}% des dossiers de ta préfecture déposés à la même période ({n}).')
        .replace('{pct}', res.percentile.toFixed(0))
        .replace('{n}', res.n_cohort);
    }
  }

  function renderSinceChangeTile(dateEntreeEtape) {
    var valEl = document.getElementById('md-out-since-change');
    var subEl = document.getElementById('md-out-since-change-sub');
    if (!valEl || !subEl) return;
    if (!dateEntreeEtape) {
      valEl.textContent = '—';
      subEl.textContent = ANEF.t('mondossier.since_change_unknown') ||
        'Saisis la date d\'entrée à l\'étape pour le calculer.';
      return;
    }
    var d = new Date(dateEntreeEtape);
    if (isNaN(d)) { valEl.textContent = '—'; subEl.textContent = ''; return; }
    var today = new Date();
    var days = Math.floor((today - d) / 86400000);
    if (days < 0) days = 0;
    valEl.textContent = U.formatDuration(days);
    // Color cue when very long (>180 d)
    valEl.style.color = days > 365 ? 'var(--red)' :
                       days > 180 ? 'var(--orange)' :
                       'var(--primary-light)';
    subEl.textContent = ANEF.t('mondossier.since_change_sub') ||
      'Temps écoulé depuis ton dernier changement de statut connu.';
  }

  function renderNextStep(fromEtape, prefCanon, prefLabel) {
    var container = document.getElementById('md-next-container');
    var noData = document.getElementById('md-next-no-data');
    if (!container || fromEtape == null || !M.nextStepDistribution) {
      if (container) container.innerHTML = '';
      if (noData) { noData.style.display = 'block'; container.appendChild(noData); }
      return;
    }

    // Try local cohort first; fall back to national if insufficient
    var local = M.nextStepDistribution(state.grouped, fromEtape, prefCanon);
    var national = M.nextStepDistribution(state.grouped, fromEtape, null);
    var useLocal = local && local.transitions.length >= 2 && local.total >= 10;
    var data = useLocal ? local : national;
    var scopeLabel = useLocal ? prefLabel : ANEF.t('mondossier.next_scope_national');

    if (!data || !data.transitions.length) {
      container.innerHTML = '';
      if (noData) { noData.style.display = 'block'; container.appendChild(noData); }
      return;
    }

    var html = '<p class="md-stats-line" style="margin-top:0.25rem;margin-bottom:0.5rem">' +
      ANEF.t('mondossier.next_basis', {
        scope: U.escapeHtml(scopeLabel),
        n: data.n_exited,
        total: data.total
      }) + '</p>';

    html += '<div class="per-etape-list">';
    data.transitions.forEach(function(t) {
      var label;
      if (t.to_etape === 'Favorable') {
        label = ANEF.t('mondossier.next_label_fav');
      } else if (t.to_etape === 'Refus') {
        label = ANEF.t('mondossier.next_label_neg');
      } else {
        var n = t.to_etape;
        var stepName = C.PHASE_NAMES[n] || ('Étape ' + n);
        var arrow = n > fromEtape ? '→' : (n < fromEtape ? '↺' : '↻');
        label = arrow + ' ' + n + '. ' + stepName;
      }
      var medStr = t.median_days != null ? ' · ' + ANEF.t('mondossier.next_med', { dur: U.formatDuration(t.median_days) }) : '';
      var color = t.to_etape === 'Favorable' ? '#10b981' :
                  t.to_etape === 'Refus' ? '#ef4444' :
                  (typeof t.to_etape === 'number' && t.to_etape < fromEtape ? '#f59e0b' : '#3b82f6');
      var pctW = Math.max(2, Math.min(100, t.pct));
      html += '<div class="per-etape-row">' +
        '<div class="per-etape-row-label">' + U.escapeHtml(label) +
        ' <span class="per-etape-n">(' + t.count + ' dossier' + (t.count > 1 ? 's' : '') + medStr + ')</span></div>' +
        '<div class="per-etape-bar"><div class="per-etape-seg" style="flex-basis:' + pctW + '%;background:' + color + '">' +
        (pctW > 10 ? t.pct.toFixed(0) + '%' : '') + '</div></div>' +
        '<div class="per-etape-numerics" style="color:' + color + ';font-weight:600">' + t.pct.toFixed(0) + '%</div>' +
      '</div>';
    });
    html += '</div>';

    if (data.n_still_at) {
      html += '<p class="md-stats-line" style="margin-top:0.5rem">' +
        ANEF.t('mondossier.next_still_at', { n: data.n_still_at }) + '</p>';
    }

    container.innerHTML = html;
  }

  function renderPrefExtras(prefCanon, prefLabel) {
    var apprEl = document.getElementById('md-pref-approval');
    var apprSub = document.getElementById('md-pref-approval-sub');
    var rankEl = document.getElementById('md-pref-speed-rank');
    var rankSub = document.getElementById('md-pref-speed-sub');
    var volEl = document.getElementById('md-pref-volume');
    var volSub = document.getElementById('md-pref-volume-sub');

    // Compute approval rate inline (cheap, uses _classifyTerminal)
    if (apprEl && M.classifyTerminal) {
      var ok = 0, ng = 0;
      state.grouped.forEach(function(snaps) {
        if (!snaps.length) return;
        var last = snaps[snaps.length - 1];
        if (canonPref(last.prefecture) !== prefCanon) return;
        var cls = M.classifyTerminal(snaps);
        if (cls === 'fav') ok++;
        else if (cls === 'neg') ng++;
      });
      var nDec = ok + ng;
      if (nDec === 0) {
        apprEl.textContent = '—';
        apprSub.textContent = ANEF.t('mondossier.appr_none') || 'Aucun dossier décidé dans le panel.';
      } else {
        var pct = Math.round(1000 * ok / nDec) / 10;
        apprEl.textContent = pct + '%';
        apprEl.style.color = pct >= 80 ? 'var(--green)' : pct >= 60 ? 'var(--orange)' : 'var(--red)';
        if (nDec < 10) apprEl.style.opacity = '0.65';
        apprSub.textContent = ANEF.t('mondossier.appr_basis', { ok: ok, n: nDec }) || (ok + ' favorables / ' + nDec + ' décidés');
      }
    }

    if (rankEl) {
      var r = state._speedRank ? state._speedRank[prefCanon] : null;
      if (r && state._speedTotal) {
        rankEl.textContent = r.rank + ' / ' + state._speedTotal;
        rankSub.textContent = ANEF.t('mondossier.speed_rank_sub', {
          med: U.formatDuration(r.median)
        }) || ('Cycle médian local : ' + U.formatDuration(r.median));
      } else {
        rankEl.textContent = '—';
        rankSub.textContent = ANEF.t('mondossier.speed_rank_insufficient') ||
          'Pas assez de décrets observés pour classer.';
      }
    }

    if (volEl && D.computeVolumeWindow) {
      var v = D.computeVolumeWindow(state.summaries, state.grouped, prefCanon, 90);
      if (v) {
        volEl.textContent = v.n_decreed + ' / ' + v.n_deposited;
        volSub.textContent = ANEF.t('mondossier.volume_sub_detail', {
          dec: v.n_decreed,
          dep: v.n_deposited
        }) || (v.n_decreed + ' décrets, ' + v.n_deposited + ' dépôts (90 derniers jours)');
      }
    }
  }

  function renderRecentDecrees(prefCanon) {
    var list = document.getElementById('md-recent-list');
    var empty = document.getElementById('md-recent-empty');
    var subtitle = document.getElementById('md-recent-subtitle');
    if (!list || !M.recentDecrees) return;
    var decrees = M.recentDecrees(state.grouped, prefCanon, 10, 90);
    if (!decrees.length) {
      list.innerHTML = '';
      if (empty) { empty.style.display = 'block'; list.appendChild(empty); }
      if (subtitle) subtitle.textContent = ANEF.t('mondossier.recent_decrees_sub_empty') ||
        'Pas de décret observé dans le panel pour cette préfecture sur 90 jours — la pratique peut varier sans que le panel l\'ait capté.';
      return;
    }
    if (empty) empty.style.display = 'none';
    if (subtitle) {
      subtitle.textContent = ANEF.t('mondossier.recent_decrees_sub_n', { n: decrees.length }) ||
        (decrees.length + ' décret(s) publié(s) dans le panel au cours des 90 derniers jours.');
    }
    var html = '';
    decrees.forEach(function(d) {
      var num = d.numeroDecret ? '#' + U.escapeHtml(String(d.numeroDecret)) :
        (ANEF.t('mondossier.recent_decree_no_num') || 'N° non observé');
      var date = d.datePublication ? U.formatDateFr(d.datePublication) : '—';
      var cycle = d.cycleDays != null ? ANEF.t('mondossier.recent_cycle', { dur: U.formatDuration(d.cycleDays) }) : '';
      html += '<div class="recent-decret-item">' +
        '<div class="recent-decret-num">' + num + '</div>' +
        '<div class="recent-decret-date">' + date + '</div>' +
        '<div class="recent-decret-cycle">' + cycle + '</div>' +
      '</div>';
    });
    list.innerHTML = html;
  }

  function initMethodologyModal() {
    var btn = document.getElementById('md-method-open');
    var modal = document.getElementById('md-method-modal');
    var close = document.getElementById('md-method-close');
    if (!btn || !modal || !close) return;
    btn.addEventListener('click', function() { modal.classList.add('open'); });
    close.addEventListener('click', function() { modal.classList.remove('open'); });
    modal.addEventListener('click', function(e) {
      if (e.target === modal) modal.classList.remove('open');
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') modal.classList.remove('open');
    });
  }

})();
