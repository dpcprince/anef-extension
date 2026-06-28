/**
 * pages/faq.js — FAQ page driven by live panel data.
 *
 * Four sections:
 *   A. Le refus — à quoi ça ressemble vraiment (data deep-dive)
 *   B. Le RAPO — comprendre et déposer un recours (data + procedural how-to)
 *   C. « Je suis bloqué à l'étape X » — per-step data
 *   D. Faut-il s'inquiéter ? — signals that (don't) predict rejection
 *
 * Each entry: (key, computer) — computer reads grouped data and returns
 * a values object that the i18n answer template interpolates. Section B
 * has a few entries that are pure procedural (no `computer` needed —
 * the i18n string carries the full text).
 */
(function() {
  'use strict';

  var C = ANEF.constants;
  var U = ANEF.utils;
  var D = ANEF.data;
  var M = ANEF.math;

  var FAV = {
    'decret_naturalisation_publie': 1, 'decret_naturalisation_publie_jo': 1,
    'decret_publie': 1, 'inseree_dans_decret': 1, 'demande_traitee': 1
  };
  var NEG = {
    'decision_negative_en_delais_recours': 1, 'css_notifie': 1,
    'irrecevabilite_manifeste': 1, 'irrecevabilite_manifeste_en_delais_recours': 1,
    'css_en_delais_recours': 1, 'decision_notifiee': 1, 'controle_demande_notifiee': 1
  };

  document.addEventListener('DOMContentLoaded', async function() {
    var loading = document.getElementById('loading');
    var main = document.getElementById('main-content');
    try {
      var snapshots = await D.loadData();
      if (!snapshots.length) {
        loading.innerHTML = '<div class="error-msg"><p>' + ANEF.t('faq.no_data') + '</p></div>';
        return;
      }
      var grouped = D.groupByDossier(snapshots);
      var totEl = document.getElementById('faq-dossier-count');
      if (totEl) totEl.textContent = grouped.size.toLocaleString('fr-FR');

      loading.style.display = 'none';
      main.style.display = 'block';

      renderAll(grouped);
    } catch (err) {
      loading.innerHTML = '<div class="error-msg"><p>' + ANEF.t('common.error') + ' : ' + U.escapeHtml(err.message) + '</p></div>';
    }
  });

  function median(arr) {
    if (!arr.length) return null;
    var s = arr.slice().sort(function(a, b) { return a - b; });
    return s[Math.floor(s.length / 2)];
  }

  // ─── Computers — each returns a values object ──────────────

  function computeOverallOutcomes(grouped) {
    var n_fav = 0, n_neg = 0, n_rapo = 0;
    grouped.forEach(function(snaps) {
      var has_fav = false, has_neg = false;
      for (var i = 0; i < snaps.length; i++) {
        var st = (snaps[i].statut || '').toLowerCase();
        if (FAV[st]) has_fav = true;
        if (NEG[st]) has_neg = true;
      }
      var last = (snaps[snaps.length - 1].statut || '').toLowerCase();
      if (has_fav) n_fav++;
      else if (last === 'demande_en_cours_rapo') n_rapo++;
      else if (has_neg) n_neg++;
    });
    var total = grouped.size;
    var decided = n_fav + n_neg;
    return {
      total: total,
      n_fav: n_fav, n_neg: n_neg, n_rapo: n_rapo,
      decided: decided,
      pct_fav_all: (100 * n_fav / total).toFixed(1),
      pct_neg_all: (100 * n_neg / total).toFixed(1),
      pct_rapo_all: (100 * n_rapo / total).toFixed(1),
      pct_neg_decided: decided > 0 ? (100 * n_neg / decided).toFixed(1) : '0',
      pct_fav_decided: decided > 0 ? (100 * n_fav / decided).toFixed(1) : '0',
      pct_neg_pessimistic: (100 * (n_neg + n_rapo) / (decided + n_rapo)).toFixed(1)
    };
  }

  function computeRejectionTiming(grouped) {
    var byStatut = {};
    var late_neg_n = 0;  // rejections that hit AFTER étape 10
    grouped.forEach(function(snaps) {
      var firstNegIdx = -1, firstNegSt = null;
      for (var i = 0; i < snaps.length; i++) {
        var st = (snaps[i].statut || '').toLowerCase();
        if (NEG[st]) { firstNegIdx = i; firstNegSt = st; break; }
      }
      if (firstNegIdx < 0) return;
      if (!byStatut[firstNegSt]) byStatut[firstNegSt] = { n: 0, from_etapes: {}, days: [] };
      byStatut[firstNegSt].n++;
      var maxPre = 0;
      for (var j = 0; j < firstNegIdx; j++) {
        var e = snaps[j].etape || 0;
        if (e > maxPre) maxPre = e;
      }
      byStatut[firstNegSt].from_etapes[maxPre] = (byStatut[firstNegSt].from_etapes[maxPre] || 0) + 1;
      if (maxPre >= 10) late_neg_n++;
      var depot = snaps[0].date_depot;
      if (depot && snaps[firstNegIdx].date_statut) {
        var dd = U.daysDiffSigned(depot, snaps[firstNegIdx].date_statut);
        if (dd != null && dd >= 0) byStatut[firstNegSt].days.push(dd);
      }
    });
    // Add medians
    Object.keys(byStatut).forEach(function(k) {
      byStatut[k].median_days = median(byStatut[k].days);
    });
    byStatut._late_neg_n = late_neg_n;
    return byStatut;
  }

  function computeMED(grouped) {
    var n_med = 0, n_recovered = 0, n_stuck = 0, n_neg = 0, n_fav = 0;
    grouped.forEach(function(snaps) {
      var hasMED = false;
      for (var i = 0; i < snaps.length; i++) {
        if ((snaps[i].statut || '').toLowerCase() === 'verification_formelle_mise_en_demeure') { hasMED = true; break; }
      }
      if (!hasMED) return;
      n_med++;
      var hasFav = false, hasNeg = false;
      for (var i = 0; i < snaps.length; i++) {
        var st = (snaps[i].statut || '').toLowerCase();
        if (FAV[st]) hasFav = true;
        if (NEG[st]) hasNeg = true;
      }
      var last = (snaps[snaps.length - 1].statut || '').toLowerCase();
      if (hasFav) n_fav++;
      else if (hasNeg) n_neg++;
      else if (last === 'verification_formelle_mise_en_demeure') n_stuck++;
      else n_recovered++;
    });
    return { n_med: n_med, n_recovered: n_recovered, n_stuck: n_stuck, n_neg: n_neg, n_fav: n_fav };
  }

  function computeRapo(grouped) {
    var n_total = 0, n_active = 0, n_recovered = 0, n_confirmed_neg = 0;
    var recovery_days = [], confirm_days = [], active_ages = [];
    grouped.forEach(function(snaps) {
      var rapoIdx = -1;
      for (var i = 0; i < snaps.length; i++) {
        if ((snaps[i].statut || '').toLowerCase() === 'demande_en_cours_rapo') { rapoIdx = i; break; }
      }
      if (rapoIdx < 0) return;
      n_total++;
      var last = snaps[snaps.length - 1];
      var lastSt = (last.statut || '').toLowerCase();
      var rapoDate = snaps[rapoIdx].date_statut;
      if (lastSt === 'demande_en_cours_rapo') {
        n_active++;
        var age = U.daysDiffSigned(rapoDate, new Date());
        if (age != null && age >= 0) active_ages.push(age);
        return;
      }
      var hasFav = false;
      for (var i = 0; i < snaps.length; i++) { if (FAV[(snaps[i].statut || '').toLowerCase()]) { hasFav = true; break; } }
      var dd = U.daysDiffSigned(rapoDate, last.date_statut);
      if (hasFav) { n_recovered++; if (dd != null && dd >= 0) recovery_days.push(dd); }
      else if (NEG[lastSt]) { n_confirmed_neg++; if (dd != null && dd >= 0) confirm_days.push(dd); }
    });
    var resolved = n_recovered + n_confirmed_neg;
    return {
      n_total: n_total, n_active: n_active, n_recovered: n_recovered,
      n_confirmed_neg: n_confirmed_neg, n_resolved: resolved,
      success_pct: resolved > 0 ? (100 * n_recovered / resolved).toFixed(1) : '0',
      median_recovery: median(recovery_days),
      median_confirm: median(confirm_days),
      median_active_age: median(active_ages),
      max_active_age: active_ages.length ? Math.max.apply(null, active_ages) : null
    };
  }

  function computeEtape8(grouped) {
    var to_neg = [], to_progress = [];
    grouped.forEach(function(snaps) {
      var et8 = null;
      for (var i = 0; i < snaps.length; i++) {
        if (snaps[i].etape === 8 && snaps[i].date_statut) { et8 = snaps[i]; break; }
      }
      if (!et8) return;
      for (var i = 0; i < snaps.length; i++) {
        var d = snaps[i].date_statut;
        if (!d || d < et8.date_statut) continue;
        var st = (snaps[i].statut || '').toLowerCase();
        var et = snaps[i].etape || 0;
        if (NEG[st]) {
          var dd = U.daysDiffSigned(et8.date_statut, d);
          if (dd != null && dd >= 0) to_neg.push(dd);
          break;
        }
        if (et >= 9) {
          var dd2 = U.daysDiffSigned(et8.date_statut, d);
          if (dd2 != null && dd2 >= 0) to_progress.push(dd2);
          break;
        }
      }
    });
    return { median_to_progress: median(to_progress), median_to_neg: median(to_neg), n_progressed: to_progress.length, n_neg: to_neg.length };
  }

  // Time spent at any étape before progression — used for per-step "how long is normal?"
  function computeMedianAtEtape(grouped, targetEtape) {
    var durations = [];
    grouped.forEach(function(snaps) {
      var entry = null, exit = null;
      for (var i = 0; i < snaps.length; i++) {
        if (snaps[i].etape === targetEtape && snaps[i].date_statut && !entry) entry = snaps[i].date_statut;
        if (entry && snaps[i].date_statut > entry && (snaps[i].etape || 0) !== targetEtape) {
          exit = snaps[i].date_statut; break;
        }
      }
      if (entry && exit) {
        var dd = U.daysDiffSigned(entry, exit);
        if (dd != null && dd >= 0) durations.push(dd);
      }
    });
    return { median: median(durations), n: durations.length };
  }

  function computeCycle(grouped) {
    var fav_cyc = [], neg_cyc = [];
    grouped.forEach(function(snaps) {
      var depot = snaps[0].date_depot;
      if (!depot) return;
      var favDate = null, negDate = null;
      for (var i = 0; i < snaps.length; i++) {
        var st = (snaps[i].statut || '').toLowerCase();
        if (FAV[st] && !favDate) favDate = snaps[i].date_statut;
        if (NEG[st] && !negDate) negDate = snaps[i].date_statut;
      }
      if (favDate) {
        var dd = U.daysDiffSigned(depot, favDate);
        if (dd != null && dd >= 0) fav_cyc.push(dd);
      } else if (negDate) {
        var dd2 = U.daysDiffSigned(depot, negDate);
        if (dd2 != null && dd2 >= 0) neg_cyc.push(dd2);
      }
    });
    return { fav_median: median(fav_cyc), neg_median: median(neg_cyc), n_fav: fav_cyc.length, n_neg: neg_cyc.length };
  }

  function computeComplement(grouped) {
    var n_with_compl = 0, n_compl_fav = 0, n_compl_neg = 0;
    grouped.forEach(function(snaps) {
      var hadCompl = false;
      for (var i = 0; i < snaps.length; i++) { if (snaps[i].has_complement) { hadCompl = true; break; } }
      if (!hadCompl) return;
      n_with_compl++;
      var hasFav = false, hasNeg = false;
      for (var i = 0; i < snaps.length; i++) {
        var st = (snaps[i].statut || '').toLowerCase();
        if (FAV[st]) hasFav = true;
        if (NEG[st]) hasNeg = true;
      }
      if (hasFav) n_compl_fav++;
      else if (hasNeg) n_compl_neg++;
    });
    return {
      pct_with_compl: Math.round(100 * n_with_compl / grouped.size),
      n_with_compl: n_with_compl
    };
  }

  function computePingPong(grouped) {
    function hasPP(snaps) {
      var seq = [];
      for (var i = 0; i < snaps.length; i++) {
        var st = (snaps[i].statut || '').toLowerCase();
        if (st) seq.push(st);
      }
      var seen = {};
      for (var i = 0; i < seq.length; i++) {
        if (seen[seq[i]] != null && seen[seq[i]] !== i - 1) return true;
        seen[seq[i]] = i;
      }
      return false;
    }
    var fav_n = 0, fav_pp = 0, neg_n = 0, neg_pp = 0;
    grouped.forEach(function(snaps) {
      var hasFav = false, hasNeg = false;
      for (var i = 0; i < snaps.length; i++) {
        var st = (snaps[i].statut || '').toLowerCase();
        if (FAV[st]) hasFav = true;
        if (NEG[st]) hasNeg = true;
      }
      if (hasFav) { fav_n++; if (hasPP(snaps)) fav_pp++; }
      else if (hasNeg && (snaps[snaps.length - 1].statut || '').toLowerCase() !== 'demande_en_cours_rapo') {
        neg_n++; if (hasPP(snaps)) neg_pp++;
      }
    });
    return {
      fav_pct: fav_n > 0 ? (100 * fav_pp / fav_n).toFixed(1) : '0',
      neg_pct: neg_n > 0 ? (100 * neg_pp / neg_n).toFixed(1) : '0',
      fav_n: fav_n, neg_n: neg_n
    };
  }

  function computePrefSpread(grouped) {
    if (!M.classifyTerminal) return null;
    var byPref = {};
    grouped.forEach(function(snaps) {
      if (!snaps.length) return;
      var p = (snaps[snaps.length - 1].prefecture || '').toString();
      if (!p) return;
      var canon = p.replace(/^Pr[ée]fecture\s+(de\s+la|du|des|de\s+l['’]|de|d['’])\s*/i, '');
      if (!byPref[canon]) byPref[canon] = { fav: 0, neg: 0, name: p };
      var cls = M.classifyTerminal(snaps);
      if (cls === 'fav') byPref[canon].fav++;
      else if (cls === 'neg') byPref[canon].neg++;
    });
    var rates = [];
    Object.keys(byPref).forEach(function(p) {
      var v = byPref[p]; var dec = v.fav + v.neg;
      if (dec < 20) return;
      rates.push({ pref: v.name, dec: dec, fav: v.fav, neg: v.neg, neg_pct: 100 * v.neg / dec });
    });
    if (!rates.length) return null;
    rates.sort(function(a, b) { return b.neg_pct - a.neg_pct; });
    return {
      n_pref: rates.length,
      strictest: rates[0].pref,
      strictest_pct: rates[0].neg_pct.toFixed(1),
      strictest_n: rates[0].dec,
      most_lenient: rates[rates.length - 1].pref,
      most_lenient_pct: rates[rates.length - 1].neg_pct.toFixed(1),
      most_lenient_n: rates[rates.length - 1].dec
    };
  }

  // ─── Render helpers ─────────────────────────────────────────

  function fmtDur(days) {
    if (days == null) return '—';
    return U.formatDuration(Math.round(days));
  }

  function renderEntry(container, key, computer, opts) {
    opts = opts || {};
    var values = computer ? computer() : {};
    if (computer && values === null) return;  // skip if computer returned null
    // Convert numeric duration fields to formatted strings
    Object.keys(values).forEach(function(k) {
      if (typeof values[k] === 'number' && k.indexOf('days') !== -1) {
        values[k + '_fmt'] = fmtDur(values[k]);
      }
    });
    var q = ANEF.t('faq.' + key + '.q');
    var a = ANEF.t('faq.' + key + '.a', values);
    var dets = document.createElement('details');
    dets.className = 'faq-entry';
    var sum = document.createElement('summary');
    sum.className = 'faq-question';
    sum.innerHTML = '<span>' + q + '</span><span class="faq-chevron">+</span>';
    dets.appendChild(sum);
    var ans = document.createElement('div');
    ans.className = 'faq-answer';
    ans.innerHTML = a;
    if (opts.link) {
      ans.innerHTML += '<p style="margin-top:0.5rem"><a href="' + opts.link.href + '" class="faq-link">' + opts.link.label + ' →</a></p>';
    }
    dets.appendChild(ans);
    container.appendChild(dets);
  }

  function renderAll(grouped) {
    // Pre-compute once
    var ov = computeOverallOutcomes(grouped);
    var rt = computeRejectionTiming(grouped);
    var rapo = computeRapo(grouped);
    var medianFmt = function(d) { return fmtDur(d); };

    // ────────── Section A: Le refus ──────────
    var a = document.getElementById('faq-cat-rejection');

    renderEntry(a, 'A1_how_many_rejected', function() {
      return ov;
    });

    renderEntry(a, 'A2_when_rejection', function() {
      var dn = rt['decision_negative_en_delais_recours'] || { n: 0, from_etapes: {}, median_days: null };
      var cn = rt['controle_demande_notifiee'] || { n: 0, median_days: null };
      var fromEt8 = dn.from_etapes[8] || 0;
      return {
        n_classic: dn.n,
        pct_from_et8: dn.n > 0 ? Math.round(100 * fromEt8 / dn.n) : 0,
        med_classic_fmt: fmtDur(dn.median_days),
        n_sdanf: cn.n,
        med_sdanf_fmt: fmtDur(cn.median_days),
        n_late: rt._late_neg_n
      };
    });

    renderEntry(a, 'A3_rejection_types', function() {
      var dn = rt['decision_negative_en_delais_recours'] || { n: 0 };
      var cn = rt['controle_demande_notifiee'] || { n: 0 };
      var cs = rt['css_notifie'] || { n: 0 };
      var dnt = rt['decision_notifiee'] || { n: 0 };
      return { n_classic: dn.n, n_sdanf: cn.n, n_css: cs.n, n_post_rapo: dnt.n };
    });

    renderEntry(a, 'A4_long_wait_means_neg', function() {
      var c = computeCycle(grouped);
      return { fav_fmt: fmtDur(c.fav_median), neg_fmt: fmtDur(c.neg_median), n_fav: c.n_fav, n_neg: c.n_neg };
    });

    renderEntry(a, 'A5_prefecture_matters', function() {
      var p = computePrefSpread(grouped);
      if (!p) return { strictest: '—', strictest_pct: '0', strictest_n: 0, most_lenient: '—', most_lenient_pct: '0', most_lenient_n: 0, n_pref: 0 };
      return p;
    }, { link: { href: 'prefectures.html', label: ANEF.t('faq.link_prefs') } });

    // ────────── Section B: Le RAPO ──────────
    var b = document.getElementById('faq-cat-rapo');

    // B1: What is a RAPO — fully procedural, no computer
    renderEntry(b, 'B1_what_is_rapo', null);

    // B2: How to file — procedural with deadline reminder
    renderEntry(b, 'B2_how_to_file', null);

    // B3: Success rate (data)
    renderEntry(b, 'B3_success_rate', function() {
      return rapo;
    });

    // B4: How long does it take (data + procedural 4-month implicit timer)
    renderEntry(b, 'B4_how_long', function() {
      return {
        n_active: rapo.n_active,
        active_median_fmt: fmtDur(rapo.median_active_age),
        active_max_fmt: fmtDur(rapo.max_active_age),
        median_confirm_fmt: fmtDur(rapo.median_confirm),
        median_recovery_fmt: rapo.median_recovery != null ? fmtDur(rapo.median_recovery) : '—'
      };
    });

    // B5: What if RAPO is denied — procedural
    renderEntry(b, 'B5_after_rapo_denied', null);

    // ────────── Section C: Per-step ──────────
    var c = document.getElementById('faq-cat-steps');

    renderEntry(c, 'C1_etape3_med', function() {
      return computeMED(grouped);
    });

    renderEntry(c, 'C3_etape8_decision', function() {
      var t = computeEtape8(grouped);
      return {
        med_progress_fmt: fmtDur(t.median_to_progress),
        med_neg_fmt: fmtDur(t.median_to_neg),
        n_progress: t.n_progressed,
        n_neg: t.n_neg
      };
    });

    renderEntry(c, 'C4_etape9_sdanf', function() {
      var m = computeMedianAtEtape(grouped, 9);
      return { median_fmt: fmtDur(m.median), n: m.n };
    });

    renderEntry(c, 'C5_etape10_decret_prep', function() {
      var m = computeMedianAtEtape(grouped, 10);
      return { median_fmt: fmtDur(m.median), n: m.n, n_late: rt._late_neg_n };
    });

    renderEntry(c, 'C6_etape11_publication', function() {
      var m = computeMedianAtEtape(grouped, 11);
      return { median_fmt: fmtDur(m.median), n: m.n };
    });

    // ────────── Section D: Worries ──────────
    var d = document.getElementById('faq-cat-worries');

    renderEntry(d, 'D1_long_wait', function() {
      var c2 = computeCycle(grouped);
      return { fav_fmt: fmtDur(c2.fav_median), neg_fmt: fmtDur(c2.neg_median), n_fav: c2.n_fav };
    });

    renderEntry(d, 'D2_complement', function() {
      return computeComplement(grouped);
    });

    renderEntry(d, 'D3_pingpong', function() {
      return computePingPong(grouped);
    });

    renderEntry(d, 'D4_backward', function() {
      // Count dossiers that ever went backward
      var n_backward = 0;
      grouped.forEach(function(snaps) {
        var maxSeen = 0;
        for (var i = 0; i < snaps.length; i++) {
          var e = snaps[i].etape || 0;
          if (e < maxSeen && e > 0) { n_backward++; return; }
          if (e > maxSeen) maxSeen = e;
        }
      });
      return {
        n_backward: n_backward,
        pct_backward: (100 * n_backward / grouped.size).toFixed(1)
      };
    });
  }

})();
