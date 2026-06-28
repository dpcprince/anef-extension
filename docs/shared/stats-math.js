/**
 * shared/stats-math.js — Fonctions statistiques avancees
 */
(function() {
  'use strict';

  window.ANEF = window.ANEF || {};

  var _numAsc = function(a, b) { return a - b; };

  /** Percentile sur un tableau DÉJÀ trié croissant (évite de re-trier). */
  function percentileSorted(sorted, p) {
    if (!sorted.length) return 0;
    var idx = (p / 100) * (sorted.length - 1);
    var lo = Math.floor(idx);
    var hi = Math.ceil(idx);
    if (lo === hi) return sorted[lo];
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
  }

  /** Percentile (p entre 0 et 100) */
  function percentile(arr, p) {
    if (!arr.length) return 0;
    return percentileSorted(arr.slice().sort(_numAsc), p);
  }

  /** Quartiles depuis un tableau DÉJÀ trié. */
  function quartilesSorted(sorted) {
    if (!sorted.length) return { min: 0, q1: 0, median: 0, q3: 0, max: 0 };
    return {
      min: sorted[0],
      q1: percentileSorted(sorted, 25),
      median: percentileSorted(sorted, 50),
      q3: percentileSorted(sorted, 75),
      max: sorted[sorted.length - 1]
    };
  }

  /** Quartiles => {min, q1, median, q3, max} */
  function quartiles(arr) {
    if (!arr.length) return { min: 0, q1: 0, median: 0, q3: 0, max: 0 };
    // Un seul tri partagé au lieu de 4 (1 ici + 3 dans percentile).
    return quartilesSorted(arr.slice().sort(_numAsc));
  }

  /** Box plot data with outliers */
  function boxPlotData(arr) {
    // Un seul tri réutilisé pour quartiles ET le calcul des outliers (était 5 tris).
    var sorted = arr.slice().sort(_numAsc);
    var q = quartilesSorted(sorted);
    var iqr = q.q3 - q.q1;
    var lowerFence = q.q1 - 1.5 * iqr;
    var upperFence = q.q3 + 1.5 * iqr;
    var outliers = [];
    var whiskerMin = q.max;
    var whiskerMax = q.min;
    for (var i = 0; i < sorted.length; i++) {
      if (sorted[i] < lowerFence || sorted[i] > upperFence) {
        outliers.push(sorted[i]);
      } else {
        if (sorted[i] < whiskerMin) whiskerMin = sorted[i];
        if (sorted[i] > whiskerMax) whiskerMax = sorted[i];
      }
    }
    return {
      min: whiskerMin,
      q1: q.q1,
      median: q.median,
      q3: q.q3,
      max: whiskerMax,
      outliers: outliers
    };
  }

  /**
   * Compute cohorts by deposit quarter
   * Returns: { "2024-T1": { total, reachedStep6, reachedStep9, reachedStep12, summaries }, ... }
   */
  function computeCohorts(summaries, granularity) {
    var groupFn = granularity === 'semester'
      ? ANEF.utils.groupBySemester
      : granularity === 'month'
        ? ANEF.utils.groupByMonth
        : ANEF.utils.groupByQuarter;

    var groups = groupFn(summaries, 'dateDepot');
    var result = {};

    var keys = Object.keys(groups).sort();
    for (var k = 0; k < keys.length; k++) {
      var key = keys[k];
      var items = groups[key];
      var total = items.length;
      var reached6 = 0, reached9 = 0, reached12 = 0;
      for (var i = 0; i < items.length; i++) {
        var step = items[i].currentStep;
        if (step >= 6) reached6++;
        if (step >= 9) reached9++;
        if (step >= 12) reached12++;
      }
      result[key] = {
        total: total,
        reachedStep6: reached6,
        reachedStep9: reached9,
        reachedStep12: reached12,
        pctStep6: total > 0 ? Math.round(reached6 / total * 100) : 0,
        pctStep9: total > 0 ? Math.round(reached9 / total * 100) : 0,
        pctStep12: total > 0 ? Math.round(reached12 / total * 100) : 0,
        summaries: items
      };
    }
    return result;
  }

  /**
   * Estimate remaining duration from currentStep to step 12
   * Uses transition durations: returns {p25, p50, p75, confidence, sampleSize}
   */
  function estimateRemainingDuration(currentStep, prefecture, transitionsByKey) {
    var totalP25 = 0, totalP50 = 0, totalP75 = 0;
    var minSample = Infinity;
    var totalSample = 0;
    var stepsCount = 0;

    for (var from = currentStep; from < 12; from++) {
      var to = from + 1;
      var key = from + '-' + to;
      var data = transitionsByKey[key];
      if (!data || !data.days || !data.days.length) continue;

      var days = data.days;
      // Filter by prefecture if provided
      if (prefecture && data.daysByPref && data.daysByPref[prefecture] && data.daysByPref[prefecture].length >= 3) {
        days = data.daysByPref[prefecture];
      }

      var sortedDays = days.slice().sort(_numAsc);
      totalP25 += percentileSorted(sortedDays, 25);
      totalP50 += percentileSorted(sortedDays, 50);
      totalP75 += percentileSorted(sortedDays, 75);
      if (days.length < minSample) minSample = days.length;
      totalSample += days.length;
      stepsCount++;
    }

    if (stepsCount === 0) {
      return { p25: null, p50: null, p75: null, confidence: 'none', sampleSize: 0 };
    }

    var avgSample = totalSample / stepsCount;
    var confidence = avgSample >= 10 ? 'high' : avgSample >= 5 ? 'medium' : 'low';

    return {
      p25: Math.round(totalP25),
      p50: Math.round(totalP50),
      p75: Math.round(totalP75),
      confidence: confidence,
      sampleSize: Math.round(avgSample)
    };
  }

  /**
   * Compute transition data with per-prefecture breakdown
   * Returns Map: key => { from, to, days[], daysByPref: {pref: days[]} }
   */
  function computeTransitionsDetailed(grouped) {
    var transitions = {};

    grouped.forEach(function(snaps) {
      for (var i = 1; i < snaps.length; i++) {
        var prev = snaps[i - 1];
        var curr = snaps[i];
        if (!prev.date_statut || !curr.date_statut) continue;
        var days = ANEF.utils.daysDiff(prev.date_statut, curr.date_statut);
        if (days === null || days < 0) continue;

        var key = prev.etape + '-' + curr.etape;
        if (!transitions[key]) {
          transitions[key] = {
            from_etape: prev.etape,
            to_etape: curr.etape,
            from_phase: prev.phase || ANEF.constants.PHASE_NAMES[prev.etape],
            to_phase: curr.phase || ANEF.constants.PHASE_NAMES[curr.etape],
            days: [],
            daysByPref: {}
          };
        }
        transitions[key].days.push(days);

        var pref = curr.prefecture || prev.prefecture;
        if (pref) {
          if (!transitions[key].daysByPref[pref]) transitions[key].daysByPref[pref] = [];
          transitions[key].daysByPref[pref].push(days);
        }
      }
    });

    return transitions;
  }

  /**
   * Survival curve for a specific step
   * Returns sorted array: [{days, pctRemaining}, ...]
   */
  function survivalCurve(summaries, snapshots, grouped, targetStep) {
    // Find dossiers that were at targetStep at some point
    var durations = [];
    var now = new Date(); // hoisté hors de la boucle (était re-alloué par dossier)

    grouped.forEach(function(snaps, hash) {
      var atStep = [];
      for (var i = 0; i < snaps.length; i++) {
        if (snaps[i].etape === targetStep) atStep.push(snaps[i]);
      }
      if (!atStep.length) return;

      // Find how long they stayed at this step
      var entryDate = atStep[0].date_statut;
      var exitDate = null;

      // Look for next snap with different step
      for (var j = 0; j < snaps.length; j++) {
        if (snaps[j].etape > targetStep && snaps[j].date_statut) {
          exitDate = snaps[j].date_statut;
          break;
        }
      }

      if (entryDate) {
        var d;
        if (exitDate) {
          d = ANEF.utils.daysDiff(entryDate, exitDate);
        } else {
          // Still at this step
          d = ANEF.utils.daysDiff(entryDate, now);
        }
        if (d !== null && d >= 0) {
          durations.push({ days: d, censored: !exitDate });
        }
      }
    });

    if (!durations.length) return [];

    // Simple Kaplan-Meier
    durations.sort(function(a, b) { return a.days - b.days; });

    var n = durations.length;
    var atRisk = n;
    var survival = 1.0;
    var curve = [{ days: 0, pctRemaining: 100 }];

    for (var i = 0; i < durations.length; i++) {
      if (!durations[i].censored) {
        survival *= (atRisk - 1) / atRisk;
        curve.push({
          days: durations[i].days,
          pctRemaining: Math.round(survival * 100 * 10) / 10
        });
      }
      atRisk--;
    }

    return curve;
  }

  /**
   * Aalen-Johansen competing-risks estimator. For each dossier with date_depot,
   * we classify the observed outcome as 'favorable' (decree published),
   * 'negative' (refus / RAPO / irrecevabilité / CSS), or 'censored' (still
   * pending). The standard KM is mis-specified here because many "censored"
   * observations will NEVER reach the favorable event — they'll move to a
   * competing endpoint or stay pending indefinitely. The right answer is the
   * cumulative incidence function (CIF) for each cause, computed jointly so
   * the increments sum to 1 − S(t):
   *
   *   CIF_k(t) = ∑_{t_i ≤ t} S(t_i^-) · d_k(t_i) / n(t_i)
   *
   * where S is the overall survival (P[no event yet]), d_k is the count of
   * cause-k events at t_i, and n(t_i) is the at-risk count.
   *
   * Returns:
   *   {
   *     curve: [{ t, S, cifFav, cifNeg }, …]      // KM + CIF at each event time
   *     horizons: { '12':{fav,neg,pending}, '24':{...}, '36':{...}, '48':{...}, '60':{...} }
   *     n, events: { favorable, negative }
   *   }
   *
   * Usage: aalenJohansenCompetingRisks(summaries, grouped) — same signature
   * as a naive KM time-to-completion. Drop-in replacement for the headline KPI.
   */
  function aalenJohansenCompetingRisks(summaries, grouped, todayDate) {
    var today = todayDate || new Date();
    // Use the shared FAV/NEG sets (Pass 9 broader definitions). RAPO is
    // INTENTIONALLY excluded from NEG — see _NEG_STATUTS comment for rationale.
    var FAV = _FAV_STATUTS;
    var NEG = _NEG_STATUTS;

    var obs = [];
    grouped.forEach(function(snaps) {
      if (!snaps.length) return;
      var depot = snaps[snaps.length - 1].date_depot;
      if (!depot) return;
      // Find earliest snapshot at any terminal status, by category.
      var favDate = null, negDate = null;
      for (var i = 0; i < snaps.length; i++) {
        var st = (snaps[i].statut || '').toLowerCase();
        if (FAV[st] && !favDate) favDate = snaps[i].date_statut;
        else if (NEG[st] && !negDate) negDate = snaps[i].date_statut;
      }
      // Pass 9 rule: any FAV in history wins (RAPO recoveries to décret count
      // as favorable, even if the NEG event came first chronologically). This
      // matches the user's classification spec for the approval rate metric.
      var event = null, eventDate = null;
      if (favDate) { event = 'favorable'; eventDate = favDate; }
      else if (negDate) { event = 'negative'; eventDate = negDate; }

      var t;
      if (event) {
        t = ANEF.utils.daysDiff(depot, eventDate);
        if (t == null || t < 0) return;
        obs.push({ t: t, event: event });
      } else {
        t = ANEF.utils.daysDiff(depot, today);
        if (t == null || t < 0) return;
        obs.push({ t: t, event: null });
      }
    });

    if (!obs.length) return { curve: [], horizons: {}, n: 0, events: { favorable: 0, negative: 0 } };

    obs.sort(function(a, b) {
      if (a.t !== b.t) return a.t - b.t;
      // Events before censorings at ties (CLDR/Aalen convention)
      return (a.event ? 0 : 1) - (b.event ? 0 : 1);
    });

    var n = obs.length;
    var atRisk = n;
    var S = 1.0;
    var cifFav = 0, cifNeg = 0;
    var curve = [{ t: 0, S: 1, cifFav: 0, cifNeg: 0 }];
    var nFav = 0, nNeg = 0;

    var i = 0;
    while (i < obs.length) {
      var tk = obs[i].t;
      var dFav = 0, dNeg = 0, dCens = 0;
      var j = i;
      while (j < obs.length && obs[j].t === tk) {
        if (obs[j].event === 'favorable') dFav++;
        else if (obs[j].event === 'negative') dNeg++;
        else dCens++;
        j++;
      }
      if (atRisk > 0 && (dFav + dNeg) > 0) {
        cifFav += S * dFav / atRisk;
        cifNeg += S * dNeg / atRisk;
        S *= 1 - (dFav + dNeg) / atRisk;
        nFav += dFav; nNeg += dNeg;
        curve.push({ t: tk, S: S, cifFav: cifFav, cifNeg: cifNeg });
      }
      atRisk -= (dFav + dNeg + dCens);
      i = j;
    }

    // Sample at common horizons (months → days)
    function pickAt(daysHorizon) {
      // Find largest curve point with t ≤ daysHorizon
      var lo = 0, hi = curve.length;
      while (lo < hi) {
        var mid = (lo + hi) >>> 1;
        if (curve[mid].t <= daysHorizon) lo = mid + 1; else hi = mid;
      }
      var idx = Math.max(0, lo - 1);
      var p = curve[idx];
      return {
        favorable: Math.round(1000 * p.cifFav) / 10,
        negative: Math.round(1000 * p.cifNeg) / 10,
        pending: Math.round(1000 * (1 - p.cifFav - p.cifNeg)) / 10
      };
    }
    var horizons = {};
    [12, 24, 36, 48, 60].forEach(function(months) {
      horizons[months] = pickAt(Math.round(months * 30.44));
    });

    return {
      curve: curve,
      horizons: horizons,
      n: obs.length,
      events: { favorable: nFav, negative: nNeg },
      // P(eventually favorable) approximated by the last CIF point seen
      ultimateFav: Math.round(1000 * cifFav) / 10,
      ultimateNeg: Math.round(1000 * cifNeg) / 10
    };
  }

  // ─── Conditional outcomes for "Mon dossier" — landmark analysis ──────────
  //
  // The key prediction we want for a user is "given my current situation, what
  // happens next?" The naive answer (filter by étape + age-at-depot) misses the
  // strongest signal: a dossier that's been STUCK at étape E for 18 months has
  // a very different forward distribution than one that just arrived at étape E.
  //
  // Landmark analysis fixes this. Among historical dossiers that were ALSO at
  // étape E and had ALREADY spent at least `daysAtEtape − tolerance` days
  // there, what fraction exited to favorable / negative / never-exited in the
  // months that followed FROM that landmark moment?
  //
  // Small-cohort handling: three layers stacked.
  //   (1) Empirical-Bayes shrinkage. Always blend the prefecture estimate
  //       toward the national prior with prior weight k = 30. So nLocal=5
  //       contributes 14%; nLocal=60 contributes 67%. No cliff at any
  //       threshold; small cohorts smoothly defer to the population.
  //   (2) Tolerance widening. If the NATIONAL cohort is < 20 at ±90d, widen
  //       to ±180d, then ±365d. The returned `tolerance` field tells callers
  //       how wide we had to go (so the UI can label the precision).
  //   (3) Hard floor. If even ±365d gives < 10 nationally, refuse to predict.
  //
  // Modes:
  //   landmark mode (daysAtEtape >= 0): cohort = dossiers whose spell at étape
  //     E reached at least (daysAtEtape − tolerance). Outcomes measured from
  //     the landmark moment forward. This is the accurate mode.
  //   entry-age fallback (daysAtEtape null, daysAtDepot provided): cohort =
  //     dossiers that arrived at étape E when their dossier was comparably old.
  //     Less accurate (ignores how long the user has been stuck) but works when
  //     the user can't or won't provide an étape-entry date.
  //
  // Aalen-Johansen helper used by aalenJohansenCompetingRisks (the headline
  // KPI on Accueil/Délais). Not used by conditionalOutcomes anymore —
  // `_conditionalHorizons` below replaces it for the Mon dossier cohort,
  // where the at-risk pool is small and censoring is concentrated near
  // the landmark moment, which inflates AJ's per-event weights.
  function _aalenJohansen(obs) {
    if (!obs.length) {
      return { curve: [{ t: 0, S: 1, cifF: 0, cifN: 0 }], horizons: {}, ultimate_pct_never_closed: 100 };
    }
    obs = obs.slice().sort(function(a, b) {
      if (a.t !== b.t) return a.t - b.t;
      return (a.event ? 0 : 1) - (b.event ? 0 : 1);
    });
    var atRisk = obs.length;
    var S = 1, cifF = 0, cifN = 0;
    var curve = [{ t: 0, S: 1, cifF: 0, cifN: 0 }];
    var i = 0;
    while (i < obs.length) {
      var tk = obs[i].t;
      var dF = 0, dN = 0, dC = 0;
      var j = i;
      while (j < obs.length && obs[j].t === tk) {
        if (obs[j].event === 'fav' || obs[j].event === 'favorable') dF++;
        else if (obs[j].event === 'neg' || obs[j].event === 'negative') dN++;
        else dC++;
        j++;
      }
      if (atRisk > 0 && (dF + dN) > 0) {
        cifF += S * dF / atRisk;
        cifN += S * dN / atRisk;
        S *= 1 - (dF + dN) / atRisk;
        curve.push({ t: tk, S: S, cifF: cifF, cifN: cifN });
      }
      atRisk -= (dF + dN + dC);
      i = j;
    }
    function at(days) {
      var lo = 0, hi = curve.length;
      while (lo < hi) { var m = (lo + hi) >>> 1; if (curve[m].t <= days) lo = m + 1; else hi = m; }
      var p = curve[Math.max(0, lo - 1)];
      return {
        favorable: Math.round(1000 * p.cifF) / 10,
        negative: Math.round(1000 * p.cifN) / 10,
        pending: Math.round(1000 * (1 - p.cifF - p.cifN)) / 10
      };
    }
    var horizons = {};
    [6, 12, 24].forEach(function(m) { horizons[m] = at(Math.round(m * 30.44)); });
    // Median time to any (competing) event: smallest t where S ≤ 0.5
    var medianDays = null;
    for (var c = 0; c < curve.length; c++) {
      if (curve[c].S <= 0.5) { medianDays = curve[c].t; break; }
    }
    return {
      curve: curve,
      horizons: horizons,
      ultimate_pct_never_closed: Math.round(1000 * S) / 10,
      medianDaysToEvent: medianDays
    };
  }

  // Shared status classifiers for survival math. Kept local rather than in
  // ANEF.constants because these are SURVIVAL-math classifiers (event-level
  // terminals on a time axis), distinct from the dashboard's broader
  // isPositive/isFinished/isNegative which classify CURRENT state.
  //
  // FAV set (Pass 9): broader than the original Pass 4 set. Includes step-11
  // `inseree_dans_decret` (committed-to-decree) and `demande_traitee` (matches
  // isPositiveStatus in constants.js) — both are "the prefecture has approved".
  var _FAV_STATUTS = {
    decret_naturalisation_publie: 1,
    decret_naturalisation_publie_jo: 1,
    decret_publie: 1,
    inseree_dans_decret: 1,
    demande_traitee: 1
  };
  // NEG set (Pass 9): includes the "en délais recours" variants from
  // NEGATIVE_STATUSES in constants.js. EXCLUDES `demande_en_cours_rapo` —
  // RAPO is a TRANSIENT recovery state, not a terminal event. Dossiers in
  // RAPO can recover to FAV (decree); they only count as unfavorable when
  // RAPO is their LATEST status (handled in `_classifyTerminal`).
  var _NEG_STATUTS = {
    decision_negative_en_delais_recours: 1,
    decision_notifiee: 1,
    irrecevabilite_manifeste: 1,
    irrecevabilite_manifeste_en_delais_recours: 1,
    css_en_delais_recours: 1,
    css_notifie: 1
  };

  /**
   * Classify a dossier's terminal status for the approval-rate metric.
   * Encodes the user's rule: "RAPO is unfavorable unless it leads to a décret".
   *
   * Returns one of: 'fav' | 'neg' | 'open'
   *
   *   'fav'  — history contains any FAV status (any-FAV-wins rule)
   *   'neg'  — current status is `demande_en_cours_rapo` OR history contains
   *            any NEG status (and no FAV)
   *   'open' — none of the above; dossier is still in progress
   *
   * Used by approval rate (Préfectures), Mon dossier classification,
   * pipeline funnel terminal_negative classification, and recent-decrees
   * filtering.
   */
  function _classifyTerminal(snaps) {
    if (!snaps || !snaps.length) return 'open';
    // Any FAV in history wins — the "RAPO recovered to décret" rule
    for (var i = 0; i < snaps.length; i++) {
      var st = (snaps[i].statut || '').toLowerCase();
      if (_FAV_STATUTS[st]) return 'fav';
    }
    var last = snaps[snaps.length - 1];
    var lastStatut = (last.statut || '').toLowerCase();
    if (lastStatut === 'demande_en_cours_rapo') return 'neg';
    for (var j = 0; j < snaps.length; j++) {
      var st2 = (snaps[j].statut || '').toLowerCase();
      if (_NEG_STATUTS[st2]) return 'neg';
    }
    return 'open';
  }

  function _canonPref(p) {
    if (!p) return null;
    return String(p)
      .replace(/^Pr[ée]fecture\s+(de\s+la|du|des|de\s+l['’]|de|d['’])\s*/i, '')
      .toLowerCase().replace(/\s+/g, '-').replace(/['’]/g, "'");
  }

  // Build spells on a given timeline (étape-E entry, or dépôt date).
  //
  // For each dossier in `grouped` whose history allows it, return one
  // observation on the chosen timeline:
  //   - landmark mode: t = days from entry-to-étape-E to first terminal event
  //     (or to lastObs if censored). Dossiers that never visited étape E are
  //     dropped.
  //   - depot mode: t = days from dépôt to first terminal event (or to
  //     lastObs). Dossiers without a dépôt date are dropped.
  // NO bucketing, NO tolerance. Every qualifying dossier contributes one obs.
  // The conditional-CIF math (see `_conditionalCIFAtUser`) does the real work
  // of asking "given you've survived to time T, what happens in [T, T+K]?".
  function _buildSpells(grouped, etape, prefCanon, opts) {
    opts = opts || {};
    var mode = opts.mode || 'landmark';
    var local = [], national = [];
    var U = ANEF.utils;
    grouped.forEach(function(snaps) {
      if (!snaps.length) return;
      var last = snaps[snaps.length - 1];
      var dossierPref = _canonPref(last.prefecture);

      var anchorDate = null;
      if (mode === 'landmark') {
        for (var i = 0; i < snaps.length; i++) {
          if (snaps[i].etape === etape && snaps[i].date_statut) {
            anchorDate = snaps[i].date_statut;
            break;
          }
        }
      } else {
        // depot mode: timeline starts at the dossier's dépôt date
        anchorDate = last.date_depot;
      }
      if (!anchorDate) return;

      var lastObs = last.checked_at || last.date_statut;
      var forward = U.daysDiffSigned(anchorDate, lastObs);
      if (forward == null || forward < 0) return;

      // Terminal event (FAV or NEG) at or after the anchor.
      // Pass 9 rule: any FAV in history wins (RAPO recoveries to décret count
      // as favorable, even if the NEG event came first chronologically).
      // Same-date events count: an étape-12 entry snap that IS the FAV decree
      // should yield event='fav' at t=0, not censored.
      var favDate = null, negDate = null;
      for (var j = 0; j < snaps.length; j++) {
        if (!snaps[j].date_statut || snaps[j].date_statut < anchorDate) continue;
        var st = (snaps[j].statut || '').toLowerCase();
        if (_FAV_STATUTS[st] && !favDate) favDate = snaps[j].date_statut;
        else if (_NEG_STATUTS[st] && !negDate) negDate = snaps[j].date_statut;
      }
      var event = null, eventDate = null;
      if (favDate) { event = 'fav'; eventDate = favDate; }
      else if (negDate) { event = 'neg'; eventDate = negDate; }

      var t = event ? U.daysDiffSigned(anchorDate, eventDate) : forward;
      if (t == null || t < 0) return;

      var member = { t: t, event: event };
      national.push(member);
      if (prefCanon && dossierPref === prefCanon) local.push(member);
    });
    return { local: local, national: national };
  }

  // Compute the full Aalen-Johansen step curve for a cohort, then read the
  // CONDITIONAL incidence between (T_user, T_user + K) for each horizon K.
  //
  // The math:
  //   S(t)      = P(no terminal event by time t)         — overall survival
  //   CIF_k(t)  = P(reached event of cause k by time t)  — competing-risks CIF
  //
  // Given the user has survived to T_user on this timeline (i.e. is currently
  // at étape E with T months at étape, no terminal yet), the probability of
  // event k in the next K months is:
  //
  //   P(event k in (T, T+K] | survived to T) =
  //       (CIF_k(T+K) − CIF_k(T)) / S(T)
  //
  // And the conditional probability of still being pending at T+K is:
  //
  //   P(pending at T+K | survived to T) = S(T+K) / S(T)
  //
  // No bucketing, no tolerance. Every cohort member contributes via the AJ
  // at-risk math. The only condition is S(T) > a small floor (else the user
  // is in extrapolation territory — almost everyone in the cohort has already
  // had an event by their T_user).
  function _conditionalCIFAtUser(obs, T_user, horizons_months) {
    if (!obs.length) return null;
    var sorted = obs.slice().sort(function(a, b) {
      if (a.t !== b.t) return a.t - b.t;
      return (a.event ? 0 : 1) - (b.event ? 0 : 1);
    });
    var atRisk = sorted.length;
    var S = 1, cifF = 0, cifN = 0;
    var curve = [{ t: 0, S: 1, cifF: 0, cifN: 0 }];
    var i = 0;
    while (i < sorted.length) {
      var tk = sorted[i].t;
      var dF = 0, dN = 0, dC = 0;
      var j = i;
      while (j < sorted.length && sorted[j].t === tk) {
        if (sorted[j].event === 'fav') dF++;
        else if (sorted[j].event === 'neg') dN++;
        else dC++;
        j++;
      }
      if (atRisk > 0 && (dF + dN) > 0) {
        cifF += S * dF / atRisk;
        cifN += S * dN / atRisk;
        S *= 1 - (dF + dN) / atRisk;
        curve.push({ t: tk, S: S, cifF: cifF, cifN: cifN });
      }
      atRisk -= (dF + dN + dC);
      i = j;
    }

    // Read the curve at a given time (returns the last step at t ≤ d)
    function at(d) {
      var lo = 0, hi = curve.length;
      while (lo < hi) { var m = (lo + hi) >>> 1; if (curve[m].t <= d) lo = m + 1; else hi = m; }
      return curve[Math.max(0, lo - 1)];
    }

    var pUser = at(T_user);
    var S_user = pUser.S;

    // Effective at-risk count at T_user — what fraction of the original cohort
    // is "still pending at the user's position". We surface this as the
    // sample size for the conditional estimates.
    var nAtRisk = Math.round(obs.length * S_user);

    // Hard floor on S(T_user): if too few of the cohort survived past T_user,
    // the conditional estimates are extrapolation. The user has effectively
    // been at this étape longer than almost anyone else in the data.
    if (S_user < 0.02 || nAtRisk < 3) {
      return {
        horizons: null,
        n: obs.length,
        nAtRisk: nAtRisk,
        SAtUser: S_user,
        extrapolation: true
      };
    }

    var horizons = {};
    horizons_months.forEach(function(m) {
      var t_h = T_user + Math.round(m * 30.44);
      var pH = at(t_h);
      var favInc = pH.cifF - pUser.cifF;
      var negInc = pH.cifN - pUser.cifN;
      // Conditional probabilities — divide by S(T_user) to normalise.
      var pFav = favInc / S_user;
      var pNeg = negInc / S_user;
      var pPend = pH.S / S_user;
      // Numerical safety: clip to [0, 1] then renormalise to sum to 1.
      pFav = Math.max(0, Math.min(1, pFav));
      pNeg = Math.max(0, Math.min(1, pNeg));
      pPend = Math.max(0, Math.min(1, pPend));
      var sum = pFav + pNeg + pPend;
      if (sum > 0) { pFav /= sum; pNeg /= sum; pPend /= sum; }
      horizons[m] = {
        favorable: Math.round(1000 * pFav) / 10,
        negative: Math.round(1000 * pNeg) / 10,
        pending: Math.round(1000 * pPend) / 10
      };
    });

    return {
      horizons: horizons,
      n: obs.length,
      nAtRisk: nAtRisk,
      SAtUser: S_user,
      extrapolation: false
    };
  }

  /**
   * Conditional outcome probabilities for "Mon dossier".
   *
   * Uses CONDITIONAL CUMULATIVE INCIDENCE (no bucketing, no tolerance):
   * for the chosen timeline (time-at-étape-E in landmark mode, time-since-dépôt
   * in fallback mode), every qualifying dossier contributes one observation.
   * Aalen-Johansen gives us the full CIF curves; we then evaluate at the user's
   * exact T and at T+K for each horizon K, returning the conditional probability
   *
   *   P(event in (T, T+K] | survived to T) = (CIF(T+K) − CIF(T)) / S(T)
   *
   * Returns parallel `local` and `national` blocks for direct comparison, plus
   * top-level scope metadata. The math is the same in both modes — only the
   * timeline (and therefore the cohort definition) differs.
   *
   * Parameters:
   *   grouped       Map<hash, snapshot[]>
   *   etape         integer 1..12 — the user's current étape
   *   prefCanon     canonicalised prefecture key (e.g. 'hauts-de-seine') or null
   *   opts          {
   *     daysAtEtape  number  — days the user has been at this étape (landmark mode, preferred)
   *     daysAtDepot  number  — days since dépôt (fallback when daysAtEtape is null)
   *     hardFloor    number  — refuse to predict below this national N, default 10
   *   }
   *
   * Returns: {
   *   local:    { horizons, n, nAtRisk, SAtUser, extrapolation } | null
   *   national: { horizons, n, nAtRisk, SAtUser, extrapolation }
   *   nLocal, nNational         — total cohort sizes (for context)
   *   mode                      — 'landmark' | 'entry_age'
   *   tUser                     — the T value used (days) on the timeline
   *   medianDaysToEvent         — convenience for stuck flag (national curve)
   *   pendingAt12mo             — convenience for stuck flag (national, conditional)
   *   insufficient              — boolean
   * }
   */
  function conditionalOutcomes(grouped, etape, prefCanon, opts) {
    opts = opts || {};
    var hardFloor = opts.hardFloor != null ? opts.hardFloor : 10;

    var useLandmark = (opts.daysAtEtape != null && opts.daysAtEtape >= 0);
    var tUser = useLandmark ? opts.daysAtEtape : opts.daysAtDepot;
    if (tUser == null || tUser < 0) {
      return { insufficient: true, reason: 'missing_pivot' };
    }
    var mode = useLandmark ? 'landmark' : 'entry_age';

    var cohorts = _buildSpells(grouped, etape, prefCanon, {
      mode: useLandmark ? 'landmark' : 'depot'
    });

    if (cohorts.national.length < hardFloor) {
      return {
        insufficient: true,
        nLocal: cohorts.local.length,
        nNational: cohorts.national.length,
        mode: mode
      };
    }

    var horizonsMonths = [6, 12, 24];
    var hNational = _conditionalCIFAtUser(cohorts.national, tUser, horizonsMonths);
    var hLocal = cohorts.local.length > 0
      ? _conditionalCIFAtUser(cohorts.local, tUser, horizonsMonths)
      : null;

    // National-level convenience signals for the stuck flag. We compute the
    // median time-to-event among the historical cohort (unconditional) and the
    // 12-month conditional pending share for the user.
    var medianDays = null;
    if (hNational && hNational.horizons) {
      // Use the curve at user's T: when does pending fall below 0.5? That's the
      // remaining-time-to-typical-outcome from where the user stands.
      // (Approximation: use the 12mo conditional pending as a proxy.)
      var pending12 = hNational.horizons[12] ? hNational.horizons[12].pending : 100;
      if (pending12 < 50) medianDays = 365;  // crude bound
      else if (hNational.horizons[24] && hNational.horizons[24].pending < 50) medianDays = 730;
      else medianDays = null;  // > 2 years
    }

    return {
      local: hLocal,
      national: hNational,
      nLocal: cohorts.local.length,
      nNational: cohorts.national.length,
      mode: mode,
      tUser: tUser,
      medianDaysToEvent: medianDays,
      pendingAt12mo: hNational && hNational.horizons && hNational.horizons[12]
        ? hNational.horizons[12].pending : null,
      // Convenience: % of the historical cohort that's still pending at T_user
      // (national). Tells the user "how unusual is it to still be here?"
      pctStillPendingAtUser: hNational ? Math.round(1000 * hNational.SAtUser) / 10 : null
    };
  }

  // ─── Pass 9 helpers ─────────────────────────────────────────────────────
  //
  // Process-overview KPIs (Préfectures, Délais, Mon dossier). All share the
  // same single-walk-over-grouped pattern — accept an optional prefCanon
  // filter (null = national) and return aggregated stats.

  /**
   * Per-étape outcomes — for each étape 1..12, conditional CIF at +6/+12/+24mo
   * for dossiers that entered that étape (T_user = 0 in landmark terms).
   *
   * Single-pass optimisation: walks grouped ONCE building 12 spell arrays
   * (one per étape), then 12 AJ runs. Avoids 12 walks over grouped.
   *
   * Returns: [{ etape, n_reached, horizons: { 6, 12, 24 } }, …] length 12.
   */
  function perEtapeOutcomes(grouped, prefCanon) {
    var U = ANEF.utils;
    // For each étape 1..12 we build a spell array: each dossier that entered
    // that étape contributes ONE observation = its t_to_first_terminal from
    // entry, or its t_to_lastObs censored.
    var byEtape = {};
    for (var e = 1; e <= 12; e++) byEtape[e] = [];

    grouped.forEach(function(snaps) {
      if (!snaps.length) return;
      var last = snaps[snaps.length - 1];
      if (prefCanon && _canonPref(last.prefecture) !== prefCanon) return;
      var lastObs = last.checked_at || last.date_statut;

      // Find the FIRST entry date for each étape this dossier visited
      var entries = {};  // etape -> first date_statut at that étape
      for (var i = 0; i < snaps.length; i++) {
        var et = snaps[i].etape;
        if (typeof et !== 'number' || et < 1 || et > 12) continue;
        if (!snaps[i].date_statut) continue;
        if (entries[et] == null) entries[et] = snaps[i].date_statut;
      }
      // For each étape entered, compute t to first terminal (FAV-wins) or
      // forward censoring time. Same logic as _buildSpells but inlined for
      // multiple étapes per dossier.
      for (var etk in entries) {
        var entryDate = entries[etk];
        var forward = U.daysDiffSigned(entryDate, lastObs);
        if (forward == null || forward < 0) continue;
        var favDate = null, negDate = null;
        for (var j = 0; j < snaps.length; j++) {
          // Same-date events count: entering étape 12 at decret status yields
          // event='fav' at t=0, not censored.
          if (!snaps[j].date_statut || snaps[j].date_statut < entryDate) continue;
          var st = (snaps[j].statut || '').toLowerCase();
          if (_FAV_STATUTS[st] && !favDate) favDate = snaps[j].date_statut;
          else if (_NEG_STATUTS[st] && !negDate) negDate = snaps[j].date_statut;
        }
        var event = null, eventDate = null;
        if (favDate) { event = 'fav'; eventDate = favDate; }
        else if (negDate) { event = 'neg'; eventDate = negDate; }
        var t = event ? U.daysDiffSigned(entryDate, eventDate) : forward;
        if (t == null || t < 0) continue;
        byEtape[+etk].push({ t: t, event: event });
      }
    });

    var out = [];
    for (var ek = 1; ek <= 12; ek++) {
      var spells = byEtape[ek];
      if (!spells.length) {
        out.push({ etape: ek, n_reached: 0, horizons: null });
        continue;
      }
      // Use existing _aalenJohansen — it gives us the horizons table directly
      var aj = _aalenJohansen(spells);
      out.push({
        etape: ek,
        n_reached: spells.length,
        horizons: aj.horizons,
        ultimate_pct_never_closed: aj.ultimate_pct_never_closed
      });
    }
    return out;
  }

  /**
   * Pipeline funnel — for each étape, classify visiting dossiers as
   * progressed / stuck / terminal_negative, plus median days to next étape.
   *
   * Classification uses dossier's overall max étape (the only sane definition
   * that keeps row counts monotonic across backward transitions):
   *   - progressed: max_etape > E
   *   - terminal_negative: max_etape ≤ E AND _classifyTerminal === 'neg'
   *   - stuck: max_etape ≤ E AND not terminal_negative AND not isFinished()
   * Note: step-11 + RAPO mirrors isFinished() — treated as 'stuck', not terminal.
   *
   * median_days_to_next: forward-strict transitions only (E→E+1, first exit).
   * Omitted (null) when n_progressed < 10.
   *
   * Returns: [{ etape, n_reached, n_progressed, n_stuck, n_terminal_negative,
   *            median_days_to_next }, …] length 12.
   */
  function pipelineFunnel(grouped, prefCanon) {
    var U = ANEF.utils;
    var C = ANEF.constants;
    // For each étape: counters + a days-to-E+1 array for forward-strict transitions
    var rows = {};
    for (var e = 1; e <= 12; e++) {
      rows[e] = {
        etape: e, n_reached: 0, n_progressed: 0, n_stuck: 0, n_terminal_negative: 0,
        _daysToNext: []
      };
    }

    grouped.forEach(function(snaps) {
      if (!snaps.length) return;
      var last = snaps[snaps.length - 1];
      if (prefCanon && _canonPref(last.prefecture) !== prefCanon) return;

      // Dossier's max étape (high-water mark)
      var maxEtape = 0;
      var entries = {};  // etape -> first date_statut
      for (var i = 0; i < snaps.length; i++) {
        var et = snaps[i].etape;
        if (typeof et !== 'number' || et < 1 || et > 12) continue;
        if (et > maxEtape) maxEtape = et;
        if (!snaps[i].date_statut) continue;
        if (entries[et] == null) entries[et] = snaps[i].date_statut;
      }
      if (maxEtape === 0) return;

      var terminalClass = _classifyTerminal(snaps);
      // For each étape this dossier visited, increment counters
      for (var etk in entries) {
        var E = +etk;
        var row = rows[E];
        row.n_reached++;
        if (maxEtape > E) {
          row.n_progressed++;
          // If E+1 was also visited, compute the forward-strict time E→E+1.
          // We only count when the dossier visited E+1 as its NEXT étape
          // (i.e., it didn't skip — entry[E+1] exists and is after entry[E]).
          if (entries[E + 1]) {
            var dt = U.daysDiffSigned(entries[E], entries[E + 1]);
            if (dt != null && dt >= 0) row._daysToNext.push(dt);
          }
        } else if (terminalClass === 'neg') {
          row.n_terminal_negative++;
        } else {
          // stuck: current étape ≤ E and no terminal NEG.
          // Note: if current = E and statut is `decret_naturalisation_publie`,
          // the dossier IS finished but our _classifyTerminal would say 'fav'.
          // Such dossiers shouldn't be in "stuck" — only happens at étape 12.
          if (terminalClass === 'fav') {
            // Already counted as progressed when maxEtape > E. If maxEtape === E
            // and terminalClass === 'fav', it's at terminal FAV — count as
            // progressed (the dossier "made it through" at this étape).
            row.n_progressed++;
          } else {
            row.n_stuck++;
          }
        }
      }
    });

    return Object.keys(rows).sort(function(a, b) { return +a - +b; }).map(function(k) {
      var r = rows[k];
      var med = null;
      if (r._daysToNext.length >= 10) {
        var sorted = r._daysToNext.slice().sort(function(a, b) { return a - b; });
        med = sorted[Math.floor(sorted.length / 2)];
      }
      return {
        etape: r.etape,
        n_reached: r.n_reached,
        n_progressed: r.n_progressed,
        n_stuck: r.n_stuck,
        n_terminal_negative: r.n_terminal_negative,
        median_days_to_next: med
      };
    });
  }

  /**
   * Transition flows for the Sankey diagram. Walks grouped, counts each
   * (from_etape, to_etape) transition. Adds two virtual terminal nodes
   * (Favorable, Refus) for dossiers that reached a terminal status — the
   * transition from the étape-where-the-terminal-fired to the virtual node.
   *
   * Flows below `minFlow` (default 5) are filtered out to keep the diagram
   * readable; the dropped count is returned as `hiddenFlows`.
   *
   * Returns: { flows: [{from:'Étape 3', to:'Étape 4', flow:N, kind:'forward'|'backward'|'terminal'}], hiddenFlows: N, totalFlows: N }
   */
  function transitionFlows(grouped, prefCanon, opts) {
    opts = opts || {};
    var minFlow = opts.minFlow != null ? opts.minFlow : 5;
    var pairCounts = {};  // "from|to" -> count

    grouped.forEach(function(snaps) {
      if (!snaps.length) return;
      var last = snaps[snaps.length - 1];
      if (prefCanon && _canonPref(last.prefecture) !== prefCanon) return;

      // Build the sequence of distinct étapes the dossier visited (consecutive
      // dedupe). Also flag when a FAV or NEG terminal was reached and at which étape.
      var sequence = [];
      var terminalKind = null;
      var terminalEtape = null;
      for (var i = 0; i < snaps.length; i++) {
        var et = snaps[i].etape;
        var st = (snaps[i].statut || '').toLowerCase();
        if (typeof et === 'number' && et >= 1 && et <= 12) {
          if (sequence.length === 0 || sequence[sequence.length - 1] !== et) {
            sequence.push(et);
          }
        }
        if (!terminalKind) {
          if (_FAV_STATUTS[st]) { terminalKind = 'Favorable'; terminalEtape = et; }
          else if (_NEG_STATUTS[st] || st === 'demande_en_cours_rapo') {
            // RAPO contributes to "Refus" flow ONLY if no FAV ever appears
            // (handled below via _classifyTerminal check post-walk).
            if (terminalKind !== 'Favorable') { terminalKind = 'Refus'; terminalEtape = et; }
          }
        }
      }

      // Override: if classifier says 'fav' but our walk picked 'Refus', trust
      // the classifier (any-FAV-wins rule).
      var cls = _classifyTerminal(snaps);
      if (cls === 'fav') terminalKind = 'Favorable';
      else if (cls === 'open') terminalKind = null;
      // else cls === 'neg' → keep what walk found, or set Refus at last étape
      if (cls === 'neg' && terminalKind == null) {
        terminalKind = 'Refus';
        terminalEtape = last.etape;
      }

      // Pairwise transitions
      for (var k = 1; k < sequence.length; k++) {
        var from = 'Étape ' + sequence[k - 1];
        var to = 'Étape ' + sequence[k];
        var key = from + '|' + to;
        pairCounts[key] = (pairCounts[key] || 0) + 1;
      }
      // Terminal flow: from the dossier's last observed étape to the virtual node
      if (terminalKind && terminalEtape) {
        var fromT = 'Étape ' + terminalEtape;
        var keyT = fromT + '|' + terminalKind;
        pairCounts[keyT] = (pairCounts[keyT] || 0) + 1;
      }
    });

    var flows = [];
    var hidden = 0;
    Object.keys(pairCounts).forEach(function(k) {
      var parts = k.split('|');
      var from = parts[0], to = parts[1];
      var n = pairCounts[k];
      if (n < minFlow) { hidden += n; return; }
      var kind;
      if (to === 'Favorable' || to === 'Refus') kind = 'terminal';
      else {
        var fromNum = parseInt(from.replace('Étape ', ''), 10);
        var toNum = parseInt(to.replace('Étape ', ''), 10);
        kind = (toNum < fromNum) ? 'backward' : 'forward';
      }
      flows.push({ from: from, to: to, flow: n, kind: kind });
    });
    flows.sort(function(a, b) { return b.flow - a.flow; });
    return { flows: flows, hiddenFlows: hidden, totalFlows: flows.length };
  }

  /**
   * Recent decrees from a prefecture (or national). Returns up to `limit`
   * dossiers that reached `decret_naturalisation_publie` in the last
   * `windowDays`, sorted by date_statut descending. Used by Mon dossier
   * "Derniers décrets de ta préfecture" section.
   *
   * Each returned entry: { hash, numeroDecret, datePublication, cycleDays, prefecture }
   */
  function recentDecrees(grouped, prefCanon, limit, windowDays) {
    limit = limit || 10;
    windowDays = windowDays || 90;
    var U = ANEF.utils;
    var todayMs = new Date().getTime();
    var cutoffMs = todayMs - windowDays * 86400000;
    var results = [];
    grouped.forEach(function(snaps) {
      if (!snaps.length) return;
      var last = snaps[snaps.length - 1];
      if (prefCanon && _canonPref(last.prefecture) !== prefCanon) return;
      // Find the first FAV snapshot (chronologically) — that's when the
      // décret was reached.
      var favSnap = null;
      for (var i = 0; i < snaps.length; i++) {
        var st = (snaps[i].statut || '').toLowerCase();
        if (_FAV_STATUTS[st]) { favSnap = snaps[i]; break; }
      }
      if (!favSnap || !favSnap.date_statut) return;
      var pubMs = new Date(String(favSnap.date_statut).slice(0, 10) + 'T00:00:00Z').getTime();
      if (isNaN(pubMs) || pubMs < cutoffMs) return;
      var depot = last.date_depot;
      var cycle = depot ? U.daysDiffSigned(depot, favSnap.date_statut) : null;
      results.push({
        hash: last.public_id || last.dossier_hash || null,
        numeroDecret: favSnap.numero_decret || last.numero_decret || null,
        datePublication: favSnap.date_statut,
        cycleDays: cycle,
        prefecture: last.prefecture || null
      });
    });
    results.sort(function(a, b) { return b.datePublication.localeCompare(a.datePublication); });
    return results.slice(0, limit);
  }

  /**
   * Cohort position percentile — among dossiers deposited within ±monthsWindow
   * of the user's dépôt date (optionally filtered to the user's prefecture),
   * what percentage have a currentStep strictly LESS than user's currentStep?
   *
   * Returns: { percentile (0-100, higher = more advanced), n_cohort }
   * Null when cohort < 10.
   */
  function cohortPositionPercentile(summaries, depotDate, currentStep, prefCanon, monthsWindow) {
    if (!depotDate || currentStep == null) return null;
    monthsWindow = monthsWindow || 2;
    var depotMs = new Date(String(depotDate).slice(0, 10) + 'T00:00:00Z').getTime();
    if (isNaN(depotMs)) return null;
    var windowMs = monthsWindow * 30.44 * 86400000;
    var cohort = [];
    for (var i = 0; i < summaries.length; i++) {
      var s = summaries[i];
      if (!s.dateDepot) continue;
      if (prefCanon && _canonPref(s.prefecture) !== prefCanon) continue;
      var sMs = new Date(String(s.dateDepot).slice(0, 10) + 'T00:00:00Z').getTime();
      if (isNaN(sMs)) continue;
      if (Math.abs(sMs - depotMs) > windowMs) continue;
      if (s.currentStep == null) continue;
      cohort.push(s.currentStep);
    }
    if (cohort.length < 10) return { percentile: null, n_cohort: cohort.length, insufficient: true };
    var nAhead = 0;
    for (var k = 0; k < cohort.length; k++) {
      if (cohort[k] < currentStep) nAhead++;
    }
    return {
      percentile: Math.round(1000 * nAhead / cohort.length) / 10,
      n_cohort: cohort.length,
      insufficient: false
    };
  }

  /**
   * Next-step distribution from a given étape. Returns the distribution of
   * NEXT étapes for dossiers that have moved past `fromEtape`.
   *
   * Result: { transitions: [{to_etape, count, pct, median_days}], n_exited, n_still_at, total }
   * - Sorted by count desc. `to_etape` may be a string ('Favorable', 'Refus')
   *   for direct terminal transitions, or a number for étape transitions.
   * - Filters out transitions with count < 3.
   */
  function nextStepDistribution(grouped, fromEtape, prefCanon) {
    var U = ANEF.utils;
    var counts = {};
    var daysByTo = {};
    var nExited = 0, nStillAt = 0, total = 0;

    grouped.forEach(function(snaps) {
      if (!snaps.length) return;
      var last = snaps[snaps.length - 1];
      if (prefCanon && _canonPref(last.prefecture) !== prefCanon) return;

      // Did this dossier ever visit fromEtape?
      var entryDate = null;
      for (var i = 0; i < snaps.length; i++) {
        if (snaps[i].etape === fromEtape && snaps[i].date_statut) {
          entryDate = snaps[i].date_statut;
          break;
        }
      }
      if (!entryDate) return;
      total++;

      // Find the first snapshot AFTER entryDate that's at a DIFFERENT étape
      // OR a terminal status.
      var exitTarget = null;  // 'number' or 'Favorable' or 'Refus'
      var exitDate = null;
      for (var j = 0; j < snaps.length; j++) {
        // Same-date terminal events count: if a dossier entered étape E at a
        // FAV statut, that IS the "next step" (Favorable, t=0).
        if (!snaps[j].date_statut || snaps[j].date_statut < entryDate) continue;
        var st = (snaps[j].statut || '').toLowerCase();
        if (_FAV_STATUTS[st]) { exitTarget = 'Favorable'; exitDate = snaps[j].date_statut; break; }
        if (_NEG_STATUTS[st]) { exitTarget = 'Refus'; exitDate = snaps[j].date_statut; break; }
        if (typeof snaps[j].etape === 'number' && snaps[j].etape !== fromEtape) {
          exitTarget = snaps[j].etape; exitDate = snaps[j].date_statut; break;
        }
      }
      if (exitTarget == null) {
        // Still at fromEtape at lastObs
        if (last.etape === fromEtape) nStillAt++;
        return;
      }
      nExited++;
      var key = String(exitTarget);
      counts[key] = (counts[key] || 0) + 1;
      if (!daysByTo[key]) daysByTo[key] = [];
      var dt = U.daysDiffSigned(entryDate, exitDate);
      if (dt != null && dt >= 0) daysByTo[key].push(dt);
    });

    var transitions = [];
    Object.keys(counts).forEach(function(k) {
      var c = counts[k];
      if (c < 3) return;  // hide rare transitions
      var days = daysByTo[k];
      var med = null;
      if (days && days.length >= 5) {
        days.sort(function(a, b) { return a - b; });
        med = days[Math.floor(days.length / 2)];
      }
      var to_etape = (k === 'Favorable' || k === 'Refus') ? k : parseInt(k, 10);
      transitions.push({
        to_etape: to_etape,
        count: c,
        pct: nExited > 0 ? Math.round(1000 * c / nExited) / 10 : 0,
        median_days: med
      });
    });
    transitions.sort(function(a, b) { return b.count - a.count; });
    return {
      transitions: transitions,
      n_exited: nExited,
      n_still_at: nStillAt,
      total: total
    };
  }

  ANEF.math = {
    percentile: percentile,
    quartiles: quartiles,
    boxPlotData: boxPlotData,
    computeCohorts: computeCohorts,
    estimateRemainingDuration: estimateRemainingDuration,
    computeTransitionsDetailed: computeTransitionsDetailed,
    survivalCurve: survivalCurve,
    aalenJohansenCompetingRisks: aalenJohansenCompetingRisks,
    conditionalOutcomes: conditionalOutcomes,
    // Pass 9
    classifyTerminal: _classifyTerminal,
    perEtapeOutcomes: perEtapeOutcomes,
    pipelineFunnel: pipelineFunnel,
    transitionFlows: transitionFlows,
    recentDecrees: recentDecrees,
    cohortPositionPercentile: cohortPositionPercentile,
    nextStepDistribution: nextStepDistribution
  };
})();
