/**
 * pages/delais.js — Analyse des delais
 */
(function() {
  'use strict';

  var C = ANEF.constants;
  var U = ANEF.utils;
  var D = ANEF.data;
  var M = ANEF.math;
  var CH = ANEF.charts;
  var F = ANEF.filters;

  var state = {
    summaries: [],
    snapshots: [],
    grouped: null,
    filters: {},
    horizonMonths: 12
  };

  document.addEventListener('DOMContentLoaded', async function() {
    CH.registerDarkTheme();
    var loading = document.getElementById('loading');
    var main = document.getElementById('main-content');

    try {
      var snapshots = await D.loadData();
      if (!snapshots.length) {
        loading.innerHTML = '<div class="error-msg"><p>' + ANEF.t('delais.no_data_available') + '</p></div>';
        return;
      }

      state.snapshots = snapshots;
      state.grouped = D.groupByDossier(snapshots);
      state.summaries = D.computeDossierSummaries(state.grouped);
      state.filters = F.readFiltersFromURL();

      loading.style.display = 'none';
      main.style.display = 'block';

      var prefectures = D.getUniquePrefectures(state.summaries);
      initFilters(prefectures);
      initEstimator(prefectures);
      initHorizonToggle();
      renderKMCompletion();
      renderAll();

      // Lazy-render bar chart when details is opened
      var details = document.getElementById('barchart-details');
      if (details) {
        details.addEventListener('toggle', function() {
          if (details.open) renderAll();
        });
      }

    } catch (error) {
      loading.innerHTML = '<div class="error-msg"><p>' + ANEF.t('common.error') + ' : ' + U.escapeHtml(error.message) + '</p></div>';
    }
  });

  function initFilters(prefectures) {
    // Statuts présents dans les dossiers en cours (page délais exclut les dossiers terminés)
    var availableStatuses = {};
    for (var si = 0; si < state.summaries.length; si++) {
      if (state.summaries[si].isFinished) continue;
      var st = (state.summaries[si].statut || '').toLowerCase();
      if (st) availableStatuses[st] = true;
    }
    var availableList = Object.keys(availableStatuses);

    F.createPrefectureMultiSelect('filter-prefecture-container', prefectures, state.filters.prefecture, function(v) {
      state.filters.prefecture = v; syncAndRender();
    });
    F.createStatusFilter('filter-status-container', state.filters.statut, function(v) {
      state.filters.statut = v; syncAndRender();
    }, { filterStatuses: availableList });
    F.createOutcomeFilter('filter-outcome-container', state.filters.outcome, function(v) {
      state.filters.outcome = v; syncAndRender();
    });
  }

  function syncAndRender() {
    F.writeFiltersToURL(state.filters);
    renderAll();
  }

  // Signature des filtres → cache des dérivés. Le toggle "détails" rappelle
  // renderAll sans changer les filtres : on réutilise alors filtered/grouped.
  function filterSig() {
    var f = state.filters;
    var p = f.prefecture;
    // Inclut TOUS les champs lus par applyFilters (statut/step/prefecture/outcome/
    // complement/search), même ceux sans UI sur cette page : sig complète par contrat.
    return [f.statut || '', f.step || '', f.outcome || '', f.complement || '',
            f.search || '', (Array.isArray(p) ? p.slice().sort().join(',') : (p || ''))
           ].join('||');
  }

  function getFiltered() {
    var sig = filterSig();
    if (state._sig !== sig) {
      // Exclude finished dossiers (step ≥ 11 or negative outcome) from all stats —
      // they skew averages toward longer durations.
      state._filtered = D.applyFilters(state.summaries, state.filters)
        .filter(function(s) { return !s.isFinished; });
      var hashes = state._filtered.map(function(s) { return s.fullHash; });
      state._filteredGrouped = getFilteredGrouped(hashes);
      // Snapshots BRUTS pour computeDurationByStatus (cf. note dans data.js).
      state._filteredSnapshots = D.getSnapshotsForHashes(state.snapshots, hashes);
      state._sig = sig;
    }
    return state._filtered;
  }

  function getFilteredGrouped(filteredHashes) {
    var set = {};
    for (var i = 0; i < filteredHashes.length; i++) set[filteredHashes[i]] = true;
    var out = new Map();
    state.grouped.forEach(function(snaps, hash) {
      if (set[hash]) out.set(hash, snaps);
    });
    return out;
  }

  /** Cycle median on closed-favorable dossiers (relatable, no censoring math).
   *  Plus the competing-risks horizons table (Aalen-Johansen). */
  function renderKMCompletion() {
    // 1) Cycle median on closed favorable
    var fav = state.summaries.filter(function(s) {
      return C.isPositiveStatus(s.statut) && s.daysSinceDeposit != null;
    }).map(function(s) { return s.daysSinceDeposit; }).sort(function(a, b) { return a - b; });
    var valEl = document.getElementById('km-completion-value');
    var noteEl = document.getElementById('km-completion-note');
    if (valEl && noteEl) {
      if (fav.length === 0) {
        valEl.textContent = '—';
        noteEl.textContent = ANEF.t('delais.cycle_note_empty') || 'Pas assez de données pour estimer la médiane.';
      } else {
        var cycleMed = fav[Math.floor(fav.length / 2)];
        valEl.textContent = U.formatDuration(cycleMed);
        noteEl.innerHTML = (ANEF.t('delais.cycle_note') || '{n} décrets observés')
          .replace('{n}', fav.length.toLocaleString('fr-FR'));
      }
    }

    // 2) Competing-risks horizons table
    var cr = M.aalenJohansenCompetingRisks ? M.aalenJohansenCompetingRisks(state.summaries, state.grouped) : null;
    var crTbody = document.getElementById('cr-tbody');
    if (cr && crTbody) {
      var horizons = [12, 24, 36, 48, 60];
      var html = '';
      horizons.forEach(function(m) {
        var h = cr.horizons[m];
        if (!h) return;
        var labelKey = 'delais.cr_horizon_' + m + 'mo';
        var label = ANEF.t(labelKey) || (m / 12) + ' an' + (m > 12 ? 's' : '');
        html += '<tr>'
          + '<td><strong>' + label + '</strong></td>'
          + '<td class="num" style="color:var(--green)">' + h.favorable.toFixed(1).replace('.', ',') + ' %</td>'
          + '<td class="num" style="color:var(--red)">' + h.negative.toFixed(1).replace('.', ',') + ' %</td>'
          + '<td class="num" style="color:var(--orange)">' + h.pending.toFixed(1).replace('.', ',') + ' %</td>'
          + '</tr>';
      });
      crTbody.innerHTML = html;
      // Footnote: cite the 4-year split as a concrete read
      var foot = document.getElementById('cr-footnote');
      if (foot && cr.horizons[48]) {
        var h48 = cr.horizons[48];
        foot.innerHTML = (ANEF.t('delais.cr_footnote') || 'Lecture : à 4 ans après dépôt, {fav}% des dossiers ont obtenu un décret, {neg}% un refus ou RAPO, et {pend}% sont encore en attente — la « longue traîne » que la médiane simple masquait.')
          .replace('{fav}', h48.favorable.toFixed(0))
          .replace('{neg}', h48.negative.toFixed(0))
          .replace('{pend}', h48.pending.toFixed(0));
      }
    }

    // Ping-pong KPI — % of dossiers that re-entered the same statut at least once
    var ppValEl = document.getElementById('pingpong-value');
    if (ppValEl && D.computePingPongStats) {
      var pp = D.computePingPongStats(state.snapshots);
      if (pp.nDossiers > 0) {
        ppValEl.textContent = pp.pctPingPong.toFixed(1).replace('.', ',') + ' %';
      } else {
        ppValEl.textContent = '—';
      }
    }
  }

  /** anef-statut fork: render the backward-transitions panel. Runs on every
   *  filter change so the table reflects the current selection. */
  function renderBackwardTransitions() {
    var tbody = document.getElementById('backward-tbody');
    var empty = document.getElementById('backward-empty');
    if (!tbody) return;
    var grouped = state._filteredGrouped || state.grouped;
    var rows = D.computeBackwardTransitions(grouped).slice(0, 15);
    if (!rows.length) {
      tbody.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';
    var html = '';
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      html += '<tr>'
        + '<td>' + r.from_etape + ' — ' + U.escapeHtml(r.from_phase) + '</td>'
        + '<td>' + r.to_etape + ' — ' + U.escapeHtml(r.to_phase) + '</td>'
        + '<td class="num">' + r.count.toLocaleString('fr-FR') + '</td>'
        + '</tr>';
    }
    tbody.innerHTML = html;
  }

  function renderAll() {
    var filtered = getFiltered();
    var filteredGrouped = state._filteredGrouped;

    var countEl = document.getElementById('filter-count');
    if (filtered.length === 0) {
      countEl.textContent = ANEF.t('delais.no_match');
    } else {
      countEl.textContent = ANEF.tn('delais.dossiers_ongoing', filtered.length);
    }

    // Chart: cumulative time since deposit (first arrival at each step).
    var durations = D.computeDurationByStatus(state._filteredSnapshots)
      .filter(function(d) { return d.etape >= 2 && d.count >= 3; });

    // Table: time SPENT at each step (observed transitions only)
    var waitTimes = D.computeStepWaitTimes(filteredGrouped)
      .filter(function(d) { return d.etape >= 2 && d.count >= 3; });

    renderDurationBarChart(durations);
    renderPercentileTable(waitTimes);
    renderBackwardTransitions();
    renderFunnel();
    renderSankey();
    renderPerEtapeOutcomes();
  }

  // ─── Pass 9: Pipeline funnel ─────────────────────────────

  function renderFunnel() {
    var container = document.getElementById('funnel-container');
    var noData = document.getElementById('funnel-no-data');
    if (!container) return;

    var grouped = state._filteredGrouped || state.grouped;
    var rows = M.pipelineFunnel ? M.pipelineFunnel(grouped, null) : null;
    if (!rows || !rows.length || rows.every(function(r) { return r.n_reached === 0; })) {
      container.innerHTML = '';
      container.appendChild(noData);
      noData.style.display = 'block';
      return;
    }
    noData.style.display = 'none';

    var maxReached = 0;
    rows.forEach(function(r) { if (r.n_reached > maxReached) maxReached = r.n_reached; });

    var html = '';
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (r.n_reached === 0) continue;
      var widthPct = Math.max(8, Math.round(r.n_reached / maxReached * 100));
      var pg = r.n_progressed, st = r.n_stuck, ng = r.n_terminal_negative;
      var sumSeg = pg + st + ng;
      var pPg = sumSeg > 0 ? pg / sumSeg * 100 : 0;
      var pSt = sumSeg > 0 ? st / sumSeg * 100 : 0;
      var pNg = sumSeg > 0 ? ng / sumSeg * 100 : 0;

      var stepName = C.PHASE_NAMES[r.etape] || ANEF.t('delais.funnel_step', { n: r.etape });
      var titleLine = r.etape + '. ' + U.escapeHtml(stepName);
      var nLine = ANEF.t('delais.funnel_n_reached', { n: r.n_reached });

      var segs = '';
      if (pPg > 0) {
        var label = pPg > 12 ? pg : '';
        segs += '<div class="funnel-bar-segment funnel-bar-segment-progressed" style="flex-basis:' + pPg + '%" title="' + U.escapeHtml(ANEF.t('delais.funnel_tip_progressed', { n: pg })) + '">' + label + '</div>';
      }
      if (pSt > 0) {
        var labelSt = pSt > 12 ? st : '';
        segs += '<div class="funnel-bar-segment funnel-bar-segment-stuck" style="flex-basis:' + pSt + '%" title="' + U.escapeHtml(ANEF.t('delais.funnel_tip_stuck', { n: st })) + '">' + labelSt + '</div>';
      }
      if (pNg > 0) {
        var labelNg = pNg > 12 ? ng : '';
        segs += '<div class="funnel-bar-segment funnel-bar-segment-neg" style="flex-basis:' + pNg + '%" title="' + U.escapeHtml(ANEF.t('delais.funnel_tip_neg', { n: ng })) + '">' + labelNg + '</div>';
      }

      html += '<div class="funnel-row">' +
        '<div class="funnel-label">' + titleLine + ' <span class="funnel-n">(' + nLine + ')</span></div>' +
        '<div class="funnel-bar-wrap"><div class="funnel-bar" style="width:' + widthPct + '%">' + segs + '</div></div>';
      if (i < rows.length - 1 && rows[i + 1].n_reached > 0) {
        var med = r.median_days_to_next;
        var arrow = med != null
          ? '↓ ' + ANEF.t('delais.funnel_med_to_next', { dur: U.formatDuration(med) })
          : '↓';
        html += '<div class="funnel-arrow">' + arrow + '</div>';
      }
      html += '</div>';
    }
    container.innerHTML = html;
  }

  // ─── Pass 9: Sankey ──────────────────────────────────────

  function renderSankey() {
    var canvas = document.getElementById('sankey-chart');
    var noData = document.getElementById('sankey-no-data');
    var foot = document.getElementById('sankey-footnote');
    if (!canvas) return;

    var grouped = state._filteredGrouped || state.grouped;
    var result = M.transitionFlows ? M.transitionFlows(grouped, null, { minFlow: 5 }) : null;
    if (!result || !result.flows.length) {
      canvas.style.display = 'none';
      noData.style.display = 'block';
      if (foot) foot.style.display = 'none';
      CH.destroy('sankeyFlows');
      return;
    }
    canvas.style.display = 'block';
    noData.style.display = 'none';
    if (foot) {
      foot.style.display = 'block';
      foot.textContent = ANEF.t('delais.sankey_foot_n', {
        shown: result.totalFlows,
        hidden: result.hiddenFlows
      });
    }

    // Sankey plugin requires window.Chart's sankey controller to be loaded.
    if (!window.Chart || !window.Chart.controllers || !window.Chart.controllers.sankey) {
      // CDN missing — quietly degrade by hiding section
      canvas.style.display = 'none';
      noData.style.display = 'block';
      noData.textContent = ANEF.t('delais.sankey_lib_missing');
      return;
    }

    var data = result.flows.map(function(f) { return { from: f.from, to: f.to, flow: f.flow }; });

    var stepColorByLabel = {};
    for (var i = 1; i <= 12; i++) stepColorByLabel['Étape ' + i] = C.STEP_COLORS[i] || '#64748b';
    stepColorByLabel['Favorable'] = '#10b981';
    stepColorByLabel['Refus'] = '#ef4444';

    var config = {
      type: 'sankey',
      data: {
        datasets: [{
          data: data,
          colorFrom: function(c) { return stepColorByLabel[c.dataset.data[c.dataIndex].from] || '#64748b'; },
          colorTo: function(c) { return stepColorByLabel[c.dataset.data[c.dataIndex].to] || '#64748b'; },
          colorMode: 'gradient',
          borderWidth: 0,
          alpha: 0.5,
          size: 'max'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(item) {
                var d = item.dataset.data[item.dataIndex];
                return d.from + ' → ' + d.to + ' : ' + d.flow.toLocaleString('fr-FR');
              }
            }
          }
        }
      }
    };

    CH.create('sankeyFlows', 'sankey-chart', config);
  }

  // ─── Pass 9: Per-étape outcomes ──────────────────────────

  function initHorizonToggle() {
    var btns = document.querySelectorAll('.horizon-btn[data-horizon]');
    btns.forEach(function(b) {
      b.addEventListener('click', function() {
        var h = parseInt(b.getAttribute('data-horizon'), 10);
        if (h && h !== state.horizonMonths) {
          state.horizonMonths = h;
          btns.forEach(function(x) { x.classList.remove('is-active'); });
          b.classList.add('is-active');
          renderPerEtapeOutcomes();
        }
      });
    });
  }

  function renderPerEtapeOutcomes() {
    var container = document.getElementById('per-etape-container');
    var noData = document.getElementById('per-etape-no-data');
    if (!container) return;
    var grouped = state._filteredGrouped || state.grouped;
    var rows = M.perEtapeOutcomes ? M.perEtapeOutcomes(grouped, null) : null;
    if (!rows || !rows.length || rows.every(function(r) { return r.n_reached === 0; })) {
      container.innerHTML = '';
      container.appendChild(noData);
      noData.style.display = 'block';
      return;
    }
    noData.style.display = 'none';

    var H = state.horizonMonths;
    var html = '';
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (r.n_reached === 0) continue;
      if (!r.horizons || !r.horizons[H]) continue;
      var h = r.horizons[H];
      var fav = Math.max(0, h.favorable || 0);
      var neg = Math.max(0, h.negative || 0);
      var pend = Math.max(0, 100 - fav - neg);

      var stepName = C.PHASE_NAMES[r.etape] || ANEF.t('delais.funnel_step', { n: r.etape });
      var lowSample = r.n_reached < 20;
      var rowCls = 'per-etape-row' + (lowSample ? ' is-low-sample' : '');

      var segs = '';
      if (fav > 0) segs += '<div class="per-etape-seg per-etape-seg-fav" style="flex-basis:' + fav + '%" title="' + ANEF.t('delais.peo_tip_fav', { pct: fav.toFixed(1).replace('.', ',') }) + '">' + (fav > 12 ? fav.toFixed(0) + '%' : '') + '</div>';
      if (pend > 0) segs += '<div class="per-etape-seg per-etape-seg-pending" style="flex-basis:' + pend + '%" title="' + ANEF.t('delais.peo_tip_pending', { pct: pend.toFixed(1).replace('.', ',') }) + '">' + (pend > 12 ? pend.toFixed(0) + '%' : '') + '</div>';
      if (neg > 0) segs += '<div class="per-etape-seg per-etape-seg-neg" style="flex-basis:' + neg + '%" title="' + ANEF.t('delais.peo_tip_neg', { pct: neg.toFixed(1).replace('.', ',') }) + '">' + (neg > 12 ? neg.toFixed(0) + '%' : '') + '</div>';

      var label = r.etape + '. ' + U.escapeHtml(stepName);
      var nLabel = ANEF.t('delais.peo_n_entered', { n: r.n_reached });
      var lowBadge = lowSample ? ' <span class="low-sample-badge">' + ANEF.t('delais.peo_low_sample') + '</span>' : '';

      var numerics =
        '<span class="num-fav">' + fav.toFixed(0) + '%</span> · ' +
        '<span class="num-pending">' + pend.toFixed(0) + '%</span> · ' +
        '<span class="num-neg">' + neg.toFixed(0) + '%</span>';

      html += '<div class="' + rowCls + '">' +
        '<div class="per-etape-row-label">' + label + ' <span class="per-etape-n">(' + nLabel + ')</span>' + lowBadge + '</div>' +
        '<div class="per-etape-bar">' + segs + '</div>' +
        '<div class="per-etape-numerics">' + numerics + '</div>' +
      '</div>';
    }
    container.innerHTML = html || ('<p class="no-data">' + ANEF.t('delais.peo_empty') + '</p>');
  }

  // ─── Estimator ───────────────────────────────────────────

  var estimatorStatut = 'verification_formelle_a_traiter';
  var estimatorPrefecture = '';

  function initEstimator(prefectures) {
    ANEF.ui.createStatusSelect('estimator-status-container', {
      includeAll: false,
      defaultValue: 'verification_formelle_a_traiter',
      placeholder: ANEF.t('delais.search_status'),
      onChange: function(statusCode) {
        estimatorStatut = statusCode;
        updateEstimator();
      }
    });

    F.createSearchablePrefectureDropdown('estimator-prefecture-container', prefectures, '', function(v) {
      estimatorPrefecture = v;
      updateEstimator();
    }, { allLabel: ANEF.t('delais.all_prefectures') });

    updateEstimator();
  }

  function updateEstimator() {
    var statut = estimatorStatut;
    var pref = estimatorPrefecture || null;
    var currentInfo = C.STATUTS[statut];
    var currentRang = currentInfo ? currentInfo.rang : 0;

    // Collect all snapshots, optionally filtered by prefecture
    var snaps = state.snapshots;
    if (pref) {
      var prefHashes = {};
      for (var p = 0; p < state.summaries.length; p++) {
        if (state.summaries[p].prefecture === pref) prefHashes[state.summaries[p].fullHash] = true;
      }
      snaps = snaps.filter(function(s) { return prefHashes[s.public_id || s.dossier_hash]; });
    }

    // Group days since deposit by rang
    var byRang = {};
    for (var i = 0; i < snaps.length; i++) {
      var sn = snaps[i];
      if (!sn.date_depot || !sn.date_statut || !sn.etape) continue;
      var d = U.daysDiff(sn.date_depot, sn.date_statut);
      if (d === null) continue;
      var snStatut = sn.statut ? sn.statut.toLowerCase() : '';
      var snInfo = snStatut ? C.STATUTS[snStatut] : null;
      var snRang = snInfo ? snInfo.rang : (sn.etape * 100);
      if (!byRang[snRang]) byRang[snRang] = [];
      byRang[snRang].push(d);
    }

    var currentDays = byRang[currentRang] || [];

    // Collect all target days from rangs beyond current
    var targetDays = [];
    var rangs = Object.keys(byRang).map(Number).sort(function(a, b) { return a - b; });
    for (var e = 0; e < rangs.length; e++) {
      if (rangs[e] > currentRang) {
        targetDays = targetDays.concat(byRang[rangs[e]]);
      }
    }

    var confEl = document.getElementById('est-confidence');

    if (!currentDays.length || !targetDays.length) {
      U.setText('est-p25', '\u2014');
      U.setText('est-p50', '\u2014');
      U.setText('est-p75', '\u2014');
      confEl.innerHTML = '<span class="confidence-dot confidence-low"></span> ' + ANEF.t('delais.not_enough_data');
      return;
    }

    // Conditional remaining time estimation:
    // For each target dossier, compute excess over current median.
    // Keep only positive diffs (dossiers that took longer than your current median).
    // This avoids selection bias where fast-completing dossiers skew the estimate to 0.
    var medianCurrent = M.percentile(currentDays, 50);
    var remainingDays = [];
    for (var t = 0; t < targetDays.length; t++) {
      var diff = targetDays[t] - medianCurrent;
      if (diff > 0) remainingDays.push(diff);
    }

    // Fallback: if too few positive diffs, use all diffs clamped to 0
    if (remainingDays.length < 3) {
      remainingDays = [];
      for (var t2 = 0; t2 < targetDays.length; t2++) {
        remainingDays.push(Math.max(0, targetDays[t2] - medianCurrent));
      }
    }

    if (!remainingDays.length) {
      U.setText('est-p25', '\u2014');
      U.setText('est-p50', '\u2014');
      U.setText('est-p75', '\u2014');
      confEl.innerHTML = '<span class="confidence-dot confidence-low"></span> ' + ANEF.t('delais.not_enough_data');
      return;
    }

    var remainP25 = Math.round(M.percentile(remainingDays, 25));
    var remainP50 = Math.round(M.percentile(remainingDays, 50));
    var remainP75 = Math.round(M.percentile(remainingDays, 75));

    U.setText('est-p25', U.formatDuration(remainP25));
    U.setText('est-p50', U.formatDuration(remainP50));
    U.setText('est-p75', U.formatDuration(remainP75));

    var totalSample = currentDays.length + targetDays.length;
    var confidence = totalSample >= 15 ? 'high' : totalSample >= 6 ? 'medium' : 'low';
    var cls = confidence === 'high' ? 'confidence-high' : confidence === 'medium' ? 'confidence-medium' : 'confidence-low';
    var label = confidence === 'high' ? ANEF.t('delais.confidence_high')
              : confidence === 'medium' ? ANEF.t('delais.confidence_medium')
              : ANEF.t('delais.confidence_low');
    confEl.innerHTML = '<span class="confidence-dot ' + cls + '"></span> ' + label +
      ' \u2014 ' + ANEF.t('delais.confidence_basis', {
        current: ANEF.tn('delais.dossiers_at_status', currentDays.length),
        target: ANEF.tn('delais.dossiers_more_advanced', targetDays.length)
      });
  }

  // Short names for step 9 sub-statuts (acronyms SDANF/SCEC kept, descriptor i18n)
  var STEP9_SHORT = {
    'controle_a_affecter': 'SDANF ' + ANEF.t('delais.step9_affect'),
    'controle_a_effectuer': 'SDANF ' + ANEF.t('delais.step9_control'),
    'controle_en_attente_pec': 'SCEC ' + ANEF.t('delais.step9_transmit'),
    'controle_pec_a_faire': 'SCEC ' + ANEF.t('delais.step9_verify')
  };

  /** Build label — for step 9 sub-statuts show detailed name */
  function labelWithStatus(d) {
    if (d.statut && STEP9_SHORT[d.statut]) {
      var sub = C.formatSubStep(d.rang);
      return sub + '. ' + d.phase + ' (' + STEP9_SHORT[d.statut] + ')';
    }
    return d.etape + '. ' + d.phase;
  }

  /** Short label for chart axes */
  function shortLabel(d) {
    if (d.statut && STEP9_SHORT[d.statut]) {
      return C.formatSubStep(d.rang) + '. ' + STEP9_SHORT[d.statut];
    }
    return d.etape + '. ' + d.phase;
  }

  /** Ultra-short label for cramped mobile viewports — uses PHASE_SHORT */
  function compactLabel(d) {
    if (d.statut && STEP9_SHORT[d.statut]) {
      return C.formatSubStep(d.rang) + ' ' + STEP9_SHORT[d.statut];
    }
    return d.etape + '. ' + (C.PHASE_SHORT[d.etape] || d.phase);
  }

  // ─── Duration Bar Chart ──────────────────────────────────

  function renderDurationBarChart(durations) {
    var canvas = document.getElementById('duration-bar-chart');
    var noData = document.getElementById('duration-bar-no-data');

    if (!durations.length) {
      canvas.style.display = 'none';
      noData.style.display = 'block';
      CH.destroy('durationBar');
      return;
    }

    canvas.style.display = 'block';
    noData.style.display = 'none';

    // Use container width (not viewport) — more reliable when chart is inside a narrow card
    var containerW = canvas.parentElement.getBoundingClientRect().width;
    var isMobile = containerW < 500;
    var chartLabels = durations.map(isMobile ? compactLabel : shortLabel);
    var fullLabels = durations.map(labelWithStatus);
    var step9Colors = { 'controle_a_affecter': '#f59e0b', 'controle_a_effectuer': '#d97706', 'controle_en_attente_pec': '#b45309', 'controle_pec_a_faire': '#92400e' };
    var colors = durations.map(function(d) {
      if (d.statut && step9Colors[d.statut]) return step9Colors[d.statut];
      return C.STEP_COLORS[d.etape] || C.STEP_COLORS[0];
    });

    var avgValues = durations.map(function(d) { return d.avg_days; });
    var medValues = durations.map(function(d) { return d.median_days; });

    var datasets = [
      {
        label: ANEF.t('delais.legend_average'),
        data: avgValues,
        backgroundColor: colors.map(function(c) { return c + '99'; }),
        borderColor: colors,
        borderWidth: 1,
        borderRadius: 4
      },
      {
        label: ANEF.t('delais.legend_median'),
        data: medValues,
        backgroundColor: '#f59e0b55',
        borderColor: '#f59e0b',
        borderWidth: 1,
        borderRadius: 4
      }
    ];

    var daySuffix = ANEF.t('dur.day_short');
    var config = CH.barConfig(chartLabels, datasets, { suffix: daySuffix, ySuffix: daySuffix, datalabels: false });

    // Horizontal layout: step labels on Y-axis (readable, no rotation),
    // days on X-axis. One row per step — scales nicely for 12+ bars.
    config.options.indexAxis = 'y';
    config.options.scales = {
      x: {
        ticks: { color: '#94a3b8', callback: function(v) { return v + ' ' + daySuffix; } },
        grid: { color: '#1e293b' },
        beginAtZero: true
      },
      y: {
        ticks: { color: '#e2e8f0', font: { size: isMobile ? 10 : 12 }, autoSkip: false },
        grid: { display: false }
      }
    };
    config.options.plugins.legend = { position: 'top', labels: { color: '#e2e8f0', usePointStyle: true, boxWidth: 12 } };
    config.options.plugins.tooltip = config.options.plugins.tooltip || {};
    config.options.plugins.tooltip.callbacks = config.options.plugins.tooltip.callbacks || {};
    config.options.plugins.tooltip.callbacks.title = function(items) {
      return fullLabels[items[0].dataIndex] || items[0].label;
    };
    config.options.plugins.tooltip.callbacks.label = function(item) {
      return item.dataset.label + ' : ' + U.formatDuration(Math.round(item.raw));
    };
    CH.create('durationBar', 'duration-bar-chart', config);
  }

  // ─── Percentile Table ────────────────────────────────────

  function renderPercentileTable(durations) {
    var tbody = document.getElementById('percentile-tbody');
    if (!durations.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="no-data">' + ANEF.t('delais.no_data') + '</td></tr>';
      return;
    }

    var html = '';
    for (var i = 0; i < durations.length; i++) {
      var d = durations[i];
      var days = d.days || [];
      html += '<tr>' +
        '<td>' + U.escapeHtml(labelWithStatus(d)) + '</td>' +
        '<td class="num">' + (days.length ? U.formatDuration(Math.round(M.percentile(days, 25))) : '\u2014') + '</td>' +
        '<td class="num">' + (days.length ? U.formatDuration(Math.round(M.percentile(days, 50))) : '\u2014') + '</td>' +
        '<td class="num">' + (days.length ? U.formatDuration(Math.round(M.percentile(days, 75))) : '\u2014') + '</td>' +
        '<td class="num">' + d.count + '</td>' +
      '</tr>';
    }
    tbody.innerHTML = html;
  }


})();
