# Fork changes — anef-statut fork of Letranger-dev/anef-extension

Fork of [Letranger-dev/anef-extension](https://github.com/Letranger-dev/anef-extension) cloned 28 June 2026 from `main`. Lives at [github.com/dpcprince/anef-extension](https://github.com/dpcprince/anef-extension) with the dashboard deployed at [dpcprince.github.io/anef-extension/](https://dpcprince.github.io/anef-extension/).

The dashboard lives in `docs/`, served as GitHub Pages from that folder. The extension lives in the repo root. Both are modified in-place to keep diffs PR-friendly.

## Philosophy

Same UI, same architecture, same style. Improvements added on top, bugs fixed in place. Anything we'd PR back is a small surgical diff; anything that materially changes the editorial line is documented as our fork's value-add.

## Data flow

The fork **reads from upstream's Supabase pool** but does **not write back** — see [Data architecture](#data-architecture) below for the rationale and the path to enable contribution if/when desired.

- **Read** (dashboard + extension popup comparison card): hardcoded `SUPABASE_URL` + `SUPABASE_ANON_KEY` in `docs/shared/data.js` and `lib/constants.js` point at the upstream project (`okogtnzuuhdwogvdnitm.supabase.co`). Same public anon key the upstream deployed dashboard ships. RLS protects the data.
- **Write** (extension's anonymous-stats path → Edge Function): disabled. `lib/constants.js` keeps `SUPABASE_FUNCTION_URL` + `SUPABASE_EDGE_KEY` as placeholders; `lib/anonymous-stats.js` short-circuits with a clear error when the placeholders are detected.
- **No parallel dataset**: the dashboard fetches live from Supabase on every load (5-min sessionStorage cache). No `docs/data/snapshots.json` checked in, no CI snapshot job.

## Data architecture

The fork's value-add is the analytics surface (Pass 4-9 — competing-risks math, Mon dossier rebuild, process-overview KPIs). The underlying data pool has no value in being fragmented: more dossiers from one community = stronger statistics for everyone.

To contribute data to that pool, users should install the official extension from the Chrome Web Store ([Letranger-dev/anef-extension on CWS](https://chromewebstore.google.com/detail/anef-status-tracker/icnpklneeaiffilemaflccdejefpehek)). That extension's anonymous-stats path holds the `X-Extension-Key` shared secret that upstream's `submit-snapshot` Edge Function requires. A side-loaded fork cannot legitimately push without it.

If the project ever justifies official write access from this fork, the path is:
1. Ask Letranger-dev to share the Edge Function credentials, OR
2. Set up a parallel Supabase project + Edge Function and split the panel (defeats the "one pool" principle, only do this if upstream rejects coordination).

## Changes summary

### Extension — bug fixes (★ = PR-back candidate)

| File | Change | PR-back? |
|---|---|---|
| `manifest.json` | Renamed `anef-statut (fork)`, version `2.7.0-anefstatut.1`, upstream signing key removed, `https://*.github.io/*` added to host_permissions (for the in-popup cohort fetch) | No (fork branding) |
| `popup/popup.html` | New `.dashboard-link` row + new `.md-compare-card` inline comparison card | No |
| `popup/popup.css` | `.dashboard-link` and `.md-compare-card` styling | No |
| `popup/popup.js` | **Bug fix #1**: top-card AND stats-card "Statut depuis" both consult local history for the earliest known `date_statut` of the current status code; tooltip explains discrepancy (ping-pong bug). | **★** |
| `popup/popup.js` | **Bug fix #2**: `loadActiveHistory()` helper — primary at top-level, secondaries at `dossiers[id].history`. Four read-sites migrated. | **★** |
| `popup/popup.js` | **Bug fix #3**: `updateDashboardLink` derives `etape` via `getStatusExplanation(statut).etape`. | **★** |
| `popup/popup.js` | **Bug fix #4**: prefecture-canonicalisation regex `\s+`→`\s*` for apostrophe-suffix connectors. | **★** |
| `popup/popup.js` | **Bug fix #5**: `btnDashboard` added to `initializeElements()`. | **★** |
| `popup/popup.js` | **New**: `renderCohortComparison()` — async, fetches `${DASHBOARD_BASE_URL}/data/snapshots.json` (cached 24h in `chrome.storage.local`), computes per-(prefecture × statut) cohort, displays percentile + cohort median inline. Falls back to national cohort when local has < 10 dossiers. | No |
| `popup/popup.js` | **New**: `loadCohortIndex()` + `canonicalisePrefecture()` + `escapeHtml()` helpers for the inline comparison. **Bug fix #7**: dedup duplicate `escapeHtml` declaration (the multi-dossier tab additions also declared it; in ES modules the second declaration is a SyntaxError that breaks the entire popup). | **★** (Bug fix #7) |
| `.github/workflows/release.yml` | Rewritten for fork: trigger on tag push only (not every commit), skip Supabase secret injection (constants hardcoded), skip Chrome Web Store publish (no CWS listing). Builds ZIP + creates GitHub Release with sideload instructions. | No (fork-specific) |
| `content/dashboard-sync.js` | **NEW** content script matching `dpcprince.github.io/anef-extension/mon-dossier.html` and `letranger-dev.github.io/anef-extension/mon-dossier.html`. Reads `chrome.storage.local` for the current dossier and forwards `{ prefecture, statut, dateDepot, dateEntreeEtape }` to the page via `postMessage`. The page already had `listenForExtensionPostMessage` (Pass 5) but no part of the extension ever sent the message — this wires the dead code path. Result: opening Mon dossier with the extension installed auto-fills the form, no popup button click needed. | No (fork-specific, depends on dpcprince Pages host) |
| `docs/pages/mon-dossier.js` | **Bug fix #8**: status dropdown now updates its visible label when hydrated from URL / localStorage / postMessage. `searchable-select.js` always exposed `.setValue()` on its API but `setStatut(v)` ignored it (stale comment in the code admitted this). Now `initInputs()` captures `state._statutSelect = ANEF.ui.createStatusSelect(...)` and `setStatut(v)` calls `state._statutSelect.setValue(v)`. | **★** (Bug fix #8) |
| `lib/constants.js` | `DASHBOARD_BASE_URL` + `DASHBOARD_MON_DOSSIER_PATH` constants. | No |
| `options/options.html` | Replaces info-only banner with real `<input type="checkbox">` toggle. | **★** |
| `options/options.js` | **Bug fix #6**: `settingAnonymousStats` added to `initializeElements()`; wired to load/save. | **★** |

### Dashboard — additive + KPI replacements (`docs/`)

| File | Change | PR-back? |
|---|---|---|
| `docs/shared/utils.js` | Added `daysDiffSigned()`. | **★** |
| `docs/shared/stats-math.js` | Added `aalenJohansenCompetingRisks()` (competing-risks CIF — replaces the upstream `survivalCurve` for the headline KPI) and `conditionalOutcomes()` (per-(étape × age) cohort outcome probabilities, drives Mon dossier and the stuck-flag). | **★** |
| `docs/shared/data.js` | `_isStaticSite` matches `localhost`/`127.0.0.1`/`file:`. | Maybe |
| `docs/shared/data.js` | New `computeBackwardTransitions()` helper. | **★** |
| `docs/shared/data.js` | New `computePingPongStats()` helper. | **★** |
| `docs/shared/common.css` | Appended "Mon dossier" section with theme-aware styles + `.kpi-value--mono`. | No |
| `docs/shared/i18n/{fr,en,es,ar,zh}.js` | New keys across all 5 locales: `mondossier.*` (42 keys per locale), `delais.cycle_*`, `delais.cr_*`, `delais.backward_*`, `delais.pingpong_*`, `kpi.cycle_*`, `kpi.cr_sub_48mo`. Full parity. | Partial — PR-back the delais.* if upstream wants the new KPIs |
| `docs/shared/i18n/pages/prefectures.js` | Relabelled `prefectures.col_avg` / `col_median` to "Âge moyen" / "Âge médian" across all 5 locales. Added `col_avg_tip` + `col_median_tip` acknowledging the cohort bias and pointing at the competing-risks analysis on Délais. | **★** |
| `docs/index.html` | **Headline KPI replacement**: cycle-median on closed-favorable dossiers + competing-risks subtitle ("À 4 ans : X % décret, Y % refus, Z % en attente"). Replaces the lead-time-biased mean-of-pending. | **★** |
| `docs/pages/accueil.js` | `renderKPIs` now takes `grouped` and computes the cycle median on closed-favorable + the 4-year competing-risks split via `M.aalenJohansenCompetingRisks(summaries, grouped)`. Imports `M = ANEF.math`. | **★** (paired with HTML) |
| `docs/delais.html` | New "Issues observées" competing-risks table (5 horizons) above the cycle/ping-pong KPI tiles. New "Transitions arrière observées" section below the percentile table. | **★** |
| `docs/pages/delais.js` | `renderKMCompletion()` populates the cycle-median tile + the competing-risks horizons table + the ping-pong tile. `renderBackwardTransitions()` renders the backward-table on every filter change. | **★** |
| `docs/prefectures.html` | Column headers updated to "Âge moyen" / "Âge médian" with `title` attributes pointing at the cohort-bias caveat. | **★** (paired with i18n strings) |
| `docs/mon-dossier.html` | **NEW PAGE**, uses upstream `.kpi-card` pattern, `<link hreflang>` tags added, empty state uses upstream `.no-data` class. | No |
| `docs/pages/mon-dossier.js` | IIFE module. Cohorts keyed by étape integer. All user-facing strings i18n'd. Chart colors read CSS vars at render. Statut tile shows human-readable `explication` with raw code in `title`. | No |
| `docs/{index,dossiers,prefectures,delais,guide,feedback}.html` | Mon dossier nav link added to desktop + mobile navs. | No |
| `docs/data/snapshots.json` | Local data cache for testing. | N/A (gitignore in publish) |

## Pass 4 — Competing-risks rebuild (replaces the over-optimistic KM)

User feedback: KM=49mo felt too high. Verification on the data: of dossiers deposited ≥3 years ago, 43.2 % are still pending. Of the 2022 cohort (now 4 years old), 70.8 % are still pending and only 24 % have a decree. KM forces a single-event view where many "censored" observations will never reach favorable.

### What changed

| File | Change |
|---|---|
| `docs/shared/stats-math.js` | New `aalenJohansenCompetingRisks(summaries, grouped)` — proper Aalen-Johansen CIF for favorable / negative / pending, sampled at 1/2/3/4/5-year horizons. New `conditionalOutcomes(grouped, etape, daysAtDepot, prefCanon, tol)` for per-(étape × age) cohort outcome probabilities, used by Mon dossier. |
| `docs/index.html` + `docs/pages/accueil.js` | Headline KPI reverted to cycle median on closed-favorable (28 mo — relatable), with the 4-year competing-risks split in the sub-line: *"À 4 ans : 41 % décret, 11 % refus, 48 % en attente"*. |
| `docs/delais.html` + `docs/pages/delais.js` | KM tile demoted; new "Issues observées" section above it shows the full competing-risks table at 5 horizons (1y, 2y, 3y, 4y, 5y) with `% décret / % refus / % en attente` columns. Footnote cites the 4-year split as the headline reading. |
| `docs/mon-dossier.html` + `docs/pages/mon-dossier.js` | Removed both percentile blocks (Metric B + Metric D). Replaced with a single **"Que vont devenir les dossiers comme le mien ?"** section: 3-row table at +6/+12/+24 mo horizons showing P(décret) / P(refus) / P(encore en attente). Plus a **"Statistiquement bloqué"** warning chip that fires when 12-mo cumulative outcome probability < 20 % or when > 40 % of the cohort never closed. |
| `docs/shared/i18n/{fr,en,es,ar,zh}.js` | ~25 new keys per locale for the outcomes table, footnotes, stuck-flag message, and horizon labels. Full coverage on all 5 locales (FR/EN/ES/AR/ZH at parity). |
| `linkedin-post.md` | Body rewrite around the competing-risks framing. The KM=49mo claim is gone, replaced with the 4-year split: *"Sur les dossiers déjà clos par un décret, le cycle médian est de 28 mois. Mais à 4 ans après dépôt, seulement 41 % ont un décret, 11 % un refus, et 48 % sont encore en attente. La longue traîne n'est pas l'exception : c'est presque la moitié du panier."* |

## Pass 5 — Cleanup (post-Pass-4 dead-code sweep)

After Pass 4 replaced the percentile/KM blocks with the competing-risks outcomes table, a follow-up cleanup pass removed leftover code and i18n keys that no longer had any caller. The goal is to ship the fork with no orphan code and full i18n parity, so the upstream PR-back diff is tight.

### What was removed

| File | Removed |
|---|---|
| `docs/pages/mon-dossier.js` | `renderPercentile()`, `renderHistogram()`, `percentileNarrative()`, `percentileRank()` — all dead after Pass 4 swapped the percentile blocks for the outcomes table. Also `state.chartStatut` / `state.chartEtape` fields and the Chart.js script tag in `mon-dossier.html` (the page no longer renders charts). |
| `docs/shared/stats-math.js` | `kmTimeToCompletion()` (superseded by `aalenJohansenCompetingRisks` which models the competing-risks properly — KM treats "pending" as "future favorable" and biases upward). |
| `docs/shared/i18n/{fr,en,es,ar,zh}.js` | 22 orphan keys per locale: `mondossier.metric_b`, `metric_d`, `pct_value`, `pct_etape_title/subtitle`, `pct_statut_title/subtitle`, `no_etape_date`, `cohort_too_small`, `stats_line`, `scope_pref`, `narrative_loc_pref/national`, `narrative_top10/25/50`, `narrative_bot50/25/10`, `hist_label_days`, `hist_range`, `hist_count`. Plus the 4 dead `kpi.km_*` keys. |
| `docs/shared/i18n/{fr,en,es,ar,zh}.js` | Renamed `delais.km_label` / `delais.km_note_empty` → `delais.cycle_label` / `delais.cycle_note_empty` (the tile renders cycle median, not KM). |

### What was added

| File | Added |
|---|---|
| `docs/shared/i18n/{es,ar,zh}.js` | 14 mondossier outcomes-table keys (`outcomes_title/subtitle/subtitle_n/col_*/horizon_*/no_data/cohort_small/footnote`, `stuck_message`) — full ES/AR/ZH translations brought to parity with FR/EN. |
| `docs/shared/i18n/pages/prefectures.js` | `prefectures.col_avg_tip` for FR/EN (was only on ES/AR/ZH). All 5 locale tooltips now point at "competing-risks analysis on Délais" rather than the obsolete "Kaplan-Meier on Délais". |
| `docs/prefectures.html` | `data-i18n-attr="title:prefectures.col_avg_tip"` wired on the Âge-moyen column (was missing); updated col_median fallback title. |
| `docs/mon-dossier.html` + i18n `meta.mondossier.desc` | Updated stale meta description that still mentioned "Percentile, temps à l'étape, projection médiane" — now matches the v2 outcomes-table reality. |

### Parity check post-cleanup

```
fr.js mondossier.*: 42      delais.cr_*: 10     delais.backward_*: 6   delais.pingpong_*: 2
en.js mondossier.*: 42      delais.cr_*: 10     delais.backward_*: 6   delais.pingpong_*: 2
es.js mondossier.*: 42      delais.cr_*: 10     delais.backward_*: 6   delais.pingpong_*: 2
ar.js mondossier.*: 42      delais.cr_*: 10     delais.backward_*: 6   delais.pingpong_*: 2
zh.js mondossier.*: 42      delais.cr_*: 10     delais.backward_*: 6   delais.pingpong_*: 2
```

All 5 locales at parity. No defined-but-unused mondossier key. Every i18n key referenced in JS/HTML is defined in all 5 locales.

## Pass 7 — Math fix + string audit (post-Pass-6)

Two real issues surfaced when exercising Pass 6 against actual data, both fixed here.

### Bug 1 — daysDiff floor-clamp polluted the landmark cohort

`ANEF.utils.daysDiff` returns `Math.max(0, ...)`. When a historical dossier's computed landmark date fell AFTER its `lastObs` (because the dossier was still at the étape at our last observation and we extrapolated), the negative offset got silently coerced to 0, slipping the member into the cohort with `tOffset=0`. Result: many members "censored at t=0" dominated the at-risk pool, the Aalen-Johansen math gave nonsensical 100%-pending at every horizon.

Fix: every distance calculation in `_buildLandmarkCohort` and `_buildEntryAgeCohort` now uses `daysDiffSigned`, and a strict `forward = daysDiffSigned(landmarkDate, lastObs)` guard drops members whose landmark falls past our observation window.

### Bug 2 — AJ inflates per-event weights under heavy near-landmark censoring

Even with bug 1 fixed, the at-risk pool still drops sharply right at t=0 because many cohort members exit étape E moments before our `lastObs` (we're sampling the present). AJ then weights each subsequent event by `1/atRisk`, which is correctly tiny denominator and correctly large per-event impact — but the resulting CIF jumps to 75-90% in plausible test cases that intuitively should sit at 15-25%. Statistically defensible under independent-censoring assumptions; user-hostile in practice.

Fix: replaced `_aalenJohansen` with `_conditionalHorizons` for Mon dossier. For each horizon T, the denominator is "cohort members who either had an event at t ≤ T (we know what happened) OR were observed for at least T days post-landmark (we observed long enough)". Members with `forward < T` and no event are EXCLUDED from horizon T — we genuinely can't say what they did. This gives smaller, honest, per-horizon denominators with `nByHorizon` surfaced in the UI for transparency.

The Accueil/Délais headline still uses `aalenJohansenCompetingRisks` unchanged — there the cohort is the full population (n≈6300) and the censoring isn't concentrated, so AJ works fine.

### Sample numbers on real data (n=6300 dossiers, 11360 snapshots, 88 prefectures)

| Test | Cohort | Result |
|---|---|---|
| HDS étape 9, 100d at step | n_local=165, n_nat=2095 | 57% décret / 0% refus / 43% en attente at +6mo (n_obs=441); 99.5% / 0.2% / 0.3% at +12mo (n_obs=324) |
| Lozère étape 9, 200d at step (no local cohort → national) | n_nat=951 | 87% / 0% / 13% at +6mo; 99% / 1% / 0% at +12mo |
| HDS étape 8, 365d at step (slow / unusual) | n_local=1, n_nat=38 | 0% / 33% / 67% at +6mo (n_obs=6); +12mo and +24mo have too-few observable members and the UI surfaces "Trop peu de dossiers comparables observés assez longtemps" |
| HDS étape 8, 1100d at step (3 years stuck — vanishingly rare) | n_nat=0 even at ±365d | "Cohorte trop petite — moins de 10 dossiers similaires" |
| HDS étape 11, 90d at step (almost-decreed) | n_local=48, n_nat=648 | 100% / 0% / 0% at +6/+12/+24mo |

Numbers track intuition: étape 11 is essentially deterministic, étape 9 progresses fast, étape 8 hangs longer with a higher refus share, and rare-cohort cases honestly say "not enough data".

### String audit — simplifying everything we added

User feedback: "some are too complex, need to be more user-friendly, not too technical but still precise or with good footnotes." Done across all 5 locales:

| Before | After |
|---|---|
| "Analyse de risques concurrents (Aalen-Johansen)" | "À différents horizons depuis le dépôt, quelle part des dossiers a obtenu un décret, a été refusée, ou est encore en attente ?" |
| "longue traîne que la médiane simple masquait" | "beaucoup de dossiers restent ouverts longtemps, ce que la simple médiane masque" |
| "{nLocal} dossiers à {pref} (mélangés bayésien avec {nNat} au national)" | "{nLocal} dossiers à {pref}, complétés par {nNat} au national" |
| "temps à l'étape ±90j" / "âge à l'entrée ±90j" | "environ 12 mois à l'étape (à 3 mois près)" / "environ 26 mois d'ancienneté à l'entrée de l'étape (à 3 mois près)" |
| "(tolérance élargie à ±180j pour atteindre la taille minimale)" | "Fenêtre de comparaison élargie : peu de dossiers exactement comparables dans le panel." |
| "Médiane temps-à-une-issue : ~14 mois" | "Délai typique avant une issue (décret ou refus) : environ 14 mois" |
| "12% de la cohorte n'ont jamais été observés clos pendant la fenêtre d'observation" | "12% des dossiers comparables n'ont toujours pas d'issue connue (ni décret, ni refus)" |
| "Ton dossier est statistiquement dans la longue traîne" | "Ton dossier connaît des délais inhabituellement longs" |

Two structural UX changes:

1. **`nByHorizon` shown in the table** — each row of the Mon dossier outcomes table now displays `(n=X)` next to the horizon label, so the user can see the cohort size that produced each row. When `n < 5`, the row is replaced by "Trop peu de dossiers comparables observés assez longtemps pour cet horizon (n=Y)".
2. **Durations rendered via `formatDuration`** — pivot values shown as "environ 12 mois" not "365 jours" or "12mo". Uses the existing dashboard duration formatter.

### What changed

| File | Change |
|---|---|
| `docs/shared/stats-math.js` | New `_conditionalHorizons(obs, opts)` helper. `_buildLandmarkCohort` and `_buildEntryAgeCohort` switched to `daysDiffSigned`, added strict `forward ≥ 0` guard, every cohort member now carries a `forward` field. `_shrinkHorizons` now reads per-horizon n from `local.nByHorizon`. `conditionalOutcomes` uses `_conditionalHorizons` instead of `_aalenJohansen`, returns `nByHorizon`. |
| `docs/pages/mon-dossier.js` | Subtitle assembled via `U.formatDuration` for human-readable durations. Table rows now show `(n=X)` per horizon and the "too few observable" fallback when `horizons[m]` is null. |
| `docs/shared/i18n/{fr,en,es,ar,zh}.js` | +1 key per locale (`horizon_too_few` = 54 total mondossier keys). 11 keys per locale rewritten for clarity. Renamed `subtitle_pivot_landmark/entry` → `pivot_landmark/entry`. Rewrote `delais.outcomes_subtitle` (dropped "Aalen-Johansen" label) and `delais.cr_footnote` (dropped "longue traîne" jargon). |

## Pass 6 — Landmark analysis for Mon dossier (better "what happens next?")

User observation that drove this: a dossier stuck 18 months at étape 8 and a dossier that just arrived at étape 11 are obviously in different situations, but Pass 4's `conditionalOutcomes` matched them into the same cohort because it only looked at `(étape, age-at-depot)` and ignored time-at-current-step.

### The new model

**Landmark analysis.** Cohort = historical dossiers whose spell at étape E reached at least `daysAtEtape − tolerance`. For each, observe what happened from THEIR landmark moment forward. This directly answers "people who were ALSO stuck this long at this étape — what happened next?"

### Small-cohort handling (the harder problem)

We can't assume the prefecture always has a statistically significant number of comparable dossiers. Three layers stacked, in order of effect:

1. **Empirical-Bayes shrinkage** — always blend the prefecture estimate toward the national prior with weight `k=30`. A prefecture cohort of 5 contributes `5/(5+30) = 14%` of the final estimate; a cohort of 60 contributes `67%`. No cliff at any threshold, no "insufficient data" until truly insufficient.
2. **Tolerance widening** — if the national cohort is < 20 at ±90d, retry at ±180d, then ±365d. The UI surfaces which tolerance was used.
3. **Hard floor** — if even ±365d gives < 10 nationally, refuse to predict and show "Cohorte trop petite — moins de 10 dossiers similaires."

### Falling back gracefully when `dateEntreeEtape` is missing

The `dateEntreeEtape` input was optional from Pass 4. It's still optional here. When filled → landmark mode (the new accurate analysis). When blank → entry-age mode (the v1 behavior, kept as fallback) with a banner suggesting the precise input.

### New stuck-flag heuristic

Pass 4 fired on "12-month outcome rate < 20% OR > 40% never closed". Pass 6 uses landmark-cohort-aware signals:
- **median time to any outcome > 24 months** in the cohort, OR
- **pending fraction at +12 months > 70%**

Both signals are calibrated to dossiers in similar situations to the user's, so the warning is anchored to relevant history rather than an arbitrary ratio.

### What changed

| File | Change |
|---|---|
| `docs/shared/stats-math.js` | Extracted `_aalenJohansen(obs)` helper (shared CIF math). New private helpers `_buildLandmarkCohort` / `_buildEntryAgeCohort` / `_shrinkHorizons` / `_addDays`. Rewrote `conditionalOutcomes(grouped, etape, prefCanon, opts)` with a new signature: `opts.daysAtEtape` for landmark mode, `opts.daysAtDepot` for fallback, plus `priorK`, `minN`, `hardFloor`, `tolerance`. Returns `{horizons, nLocal, nNational, tolerance, mode, scope, shrinkageWeight, medianDaysToEvent, pendingAt12mo, …}`. |
| `docs/pages/mon-dossier.js` | `renderOutcomes(etape, daysDepot, daysEtape, prefCanon, prefLabel)` — passes the new opts shape; reads `co.scope`/`co.nLocal`/`co.nNational`/`co.tolerance`/`co.medianDaysToEvent`; renders mode banner; new subtitle assembled from `pivot × scope × widened` parts; new footnote shows median time-to-outcome. New landmark-aware stuck-flag. |
| `docs/mon-dossier.html` | New `#md-mode-banner` element (shown only in entry-age fallback mode). |
| `docs/shared/i18n/{fr,en,es,ar,zh}.js` | +11 keys per locale (53 total): `outcomes_subtitle_v2`, `subtitle_pivot_landmark/entry`, `subtitle_widened`, `scope_blended`, `scope_national_only`, `mode_banner_entry_age`, `footnote_median(_none)`, `footnote_never`, `gt5yrs`, `stuck_message_v2`. Rewrote `outcomes_cohort_small` for the new hard-floor wording. Full parity. |

### Tradeoffs accepted

- **No confidence intervals.** The shrinkage already shrinks unreliable estimates toward the population mean, so point estimates are conservative. CIs would clutter the table; can revisit if users ask.
- **No regional level.** Only `prefecture → national` tiers. A region-level intermediate (e.g. "Île-de-France") would be feasible but requires a prefecture→region map we don't currently maintain.
- **Old `outcomes_subtitle_n` key retained** for backward compatibility — not referenced anymore but harmless dead string. Will sweep in a future pass if upstream PR-back is accepted.

### Why competing-risks beats KM here

KM treats "still pending" as "future favorable" — biased upward when many won't reach favorable. Aalen-Johansen jointly estimates the three outcomes' cumulative incidence at each time, so the curves sum to 1 minus the survival function. The 4-year competing-risks split is empirically anchored (we observe the 2022 cohort).

The Mon dossier `conditionalOutcomes` is a per-(étape × age) cohort: among similar dossiers, what % moved to favorable/negative/pending in the months that followed? Used to drive the stuck-flag — when historical outcome rates are very low for similar dossiers, the user's case is in the long tail.

## Pass 8 — Conditional CIF redesign (kills the bucketing)

User feedback: the `±3 months` matching in `conditionalOutcomes` was "lazy" — bucketing forces a tradeoff between sample size and similarity, and the tolerance value is exposed in the UI as confusing internal jargon. Rewritten to use **conditional cumulative incidence** on the full cohort with no matching parameters.

### What the math now does

For each étape, `conditionalOutcomes(grouped, etape, prefCanon, {daysAtEtape, daysAtDepot})` runs:

1. Build the **full spell array** (all dossiers that ever visited the étape, no bucketing).
2. Run Aalen-Johansen on the full cohort once.
3. Compute `S(T_user)` = survival probability at the user's elapsed time (from spell entry).
4. For each horizon `K ∈ {6, 12, 24}` months: return `(CIF(T+K) − CIF(T)) / S(T)` for fav/neg, `S(T+K) / S(T)` for pending.

No tolerance, no bucketing, no "give or take 3 months". The numbers are the proper conditional probabilities for someone in the user's exact position on the timeline.

### What changed

| File | Change |
|---|---|
| `docs/shared/stats-math.js` | Rewrote `conditionalOutcomes` to drop bucketing entirely. New private `_conditionalCIFAtUser(spells, T_user, horizons)`. Returns `{local, national, pendingAt12mo, medianDaysToEvent, pctStillPendingAtUser}` — `local` and `national` each have `{horizons, n, nAtRisk, SAtUser, extrapolation}`. |
| `docs/pages/mon-dossier.js` | `renderOutcomes` rebuilt: two stacked tables (prefecture + national), each with its own `n` / `nAtRisk` exposed. Removed all "tolerance" / "widened" UI. New subtitle pivots on rounded-to-month `daysEtape`. Stuck-flag now reads `co.pendingAt12mo` + `co.medianDaysToEvent` from the national signal. |
| `docs/mon-dossier.html` | Removed the obsolete `#md-mode-banner` text (kept the element for fallback messaging). |
| `docs/shared/i18n/{fr,en,es,ar,zh}.js` | Updated `outcomes_subtitle_v2`, added `pivot_landmark`, `pivot_entry`, `position_hint`, `section_local`, `section_national`, `cohort_size_hint`, `no_local_cohort`, `extrapolation_msg`, `footnote_conditional`, `footnote_slow_tail`, `stuck_message_v2`. Removed bucketing-related strings. Full parity. |

### Sample numbers verified on real data

- HDS, étape 9, dépôt 2023-09-01, entrée 2024-09-01: prefecture 52 cases / 41 still at-risk, national 1923 / 1437 at-risk. 12mo conditional fav = 41% (pref) / 53% (national).
- Headline KPI horizons[48] shift after FAV-wins rule: 41/11/48 → 42/6.5/51 (RAPO no longer counted as terminal NEG).

## Pass 9 — Process-overview KPIs + Mon dossier rebuild

User feedback: the current dashboard answers "how long?" but not "is my prefecture lenient/strict?", "what happens at each step?", "what flows where?", or "what should I expect next given my position?". Pass 9 adds five features across three pages.

### Feature A — Approval rate column on Préfectures

| File | Change |
|---|---|
| `docs/shared/data.js` | `computePrefectureStats(summaries, grouped)` now accepts `grouped`. Adds `approved`, `rejected`, `n_decided`, `approval_pct` per pref via `M.classifyTerminal`. |
| `docs/prefectures.html` | New `<th data-col="approval_pct">` column with tip. Existing `favorable_pct` relabelled to "% au statut favorable" + tip. New `<section>` for "Classement par taux d'approbation" with toolbar + horizontal bar. |
| `docs/pages/prefectures.js` | New `renderApprovalChart()` (top-N horizontal bar, color = approval band, greyed when N<10). Cell render adds approval column (greyed + asterisk when n_decided < 10). Tie-break sort by `n_decided desc`. |
| `docs/shared/i18n/pages/prefectures.js` | +14 keys per locale (col_approval/_tip, col_favorable_tip, appr_*, approval_*, sort_approval_*, sort_decided_desc). |

Verified on real data: top Côte-d'Or 94.4%, Paris Police 87.1%, HDS 82.5%, bottom Hérault 44.4%.

### Feature B — Per-étape outcomes on Délais

| File | Change |
|---|---|
| `docs/shared/stats-math.js` | New `perEtapeOutcomes(grouped, prefCanon)` — for each étape 1-12, builds entry-to-terminal spells and runs `_aalenJohansen` to produce per-horizon fav/neg/pending. |
| `docs/delais.html` | New `<section id="per-etape-section">` with `+6 mois / +1 an / +2 ans` toggle + inline-stacked-bar rows. |
| `docs/pages/delais.js` | New `initHorizonToggle()` + `renderPerEtapeOutcomes()`. Greys rows with `n_reached < 20`. |
| `docs/shared/common.css` | `.per-etape-row`, `.per-etape-bar`, `.per-etape-seg-*`, `.is-low-sample`, `.horizon-toggle` styles. |

Verified at +12mo: étape 9 = 53% fav (matches Pass 8), étape 11 = 100% fav, étape 12 = 55/31/13 fav/neg/pend.

### Feature C — Pipeline funnel on Délais

| File | Change |
|---|---|
| `docs/shared/stats-math.js` | New `pipelineFunnel(grouped, prefCanon)` — for each étape, classifies dossiers by max-étape rule (progressed if max>E, terminal-negative via `_classifyTerminal`, stuck otherwise). Computes `median_days_to_next` on forward-strict E→E+1 transitions. |
| `docs/delais.html` | New `<section id="funnel-section">` with legend + 12 funnel rows. |
| `docs/pages/delais.js` | `renderFunnel()` — narrowing bars (width = `n_reached / max`), internally segmented progressed/stuck/neg with hover-tip n's, arrow annotation with `median_days_to_next` between rows. |
| `docs/shared/common.css` | `.funnel-row`, `.funnel-bar`, `.funnel-bar-segment-*`, `.funnel-label`, `.funnel-arrow`, `.funnel-legend` styles. |

Verified on real data (national): E9 reached=2443 progressed=524 stuck=1919, E11 reached=650 progressed=650 stuck=0, E12 reached=578 negative=243.

### Feature D — Sankey flow diagram on Délais

| File | Change |
|---|---|
| `docs/shared/stats-math.js` | New `transitionFlows(grouped, prefCanon, {minFlow})` — counts pairwise étape→étape transitions (forward + backward) + adds virtual `Favorable`/`Refus` terminal nodes. Filters out flows below `minFlow` (default 5); returns `{flows, hiddenFlows, totalFlows}`. |
| `docs/delais.html` | `chartjs-chart-sankey@0.12.1` CDN added. New `<section id="sankey-section">` with canvas + footnote. |
| `docs/pages/delais.js` | `renderSankey()` builds Chart.js sankey dataset with step-color `colorFrom`/`colorTo`. Graceful degradation when plugin script fails to load. |

Verified national: 26 flows shown, 66 hidden. Top: Étape 11 → Favorable 647, Étape 9 → Étape 10 472, Étape 10 → Étape 11 427.

### Feature E — Mon dossier complete rebuild

Reorganises Mon dossier into 9 sections with deeper context, next-step probabilities, prefecture profiling, recent decrees, and a methodology modal.

| File | Change |
|---|---|
| `docs/shared/stats-math.js` | New helpers: `recentDecrees(grouped, prefCanon, limit, windowDays)`, `cohortPositionPercentile(summaries, depotDate, currentStep, prefCanon, monthsWindow)`, `nextStepDistribution(grouped, fromEtape, prefCanon)`. |
| `docs/shared/data.js` | New `computeVolumeWindow(summaries, grouped, prefCanon, windowDays)` for "decrees / filings in last 90d". |
| `docs/mon-dossier.html` | Section "Ton dossier" tiles: 4 → 6 (added Position dans le parcours, Depuis le dernier changement). New `<section id="next-step-section">` "Et après cette étape ?". Pref profile: 4 → 7 tiles (added approval rate, speed rank, volume window). New `<section id="recent-decrees-section">`. New methodology modal `<dialog>` triggered by "ⓘ Comment ces statistiques sont calculées". |
| `docs/pages/mon-dossier.js` | New `buildSpeedRank()` pre-compute (cycle medians, sorted). New renderers: `renderPositionTile`, `renderSinceChangeTile`, `renderNextStep` (local-then-national fallback), `renderPrefExtras` (approval + speed rank + volume), `renderRecentDecrees`. New `initMethodologyModal()`. `M = ANEF.math` import added. |
| `docs/shared/common.css` | `.method-modal*`, `.method-link`, `.recent-decret-*` styles. |
| `docs/shared/i18n/{fr,en,es,ar,zh}.js` | +43 keys per locale (215 total): tile_position/since_change, position_*, since_change_*, next_*, pref_approval/speed_rank/volume*, appr_*, speed_rank_*, volume_*, recent_decrees_*, recent_cycle, method_link/title/intro, method_cohort_*, method_cond_*, method_pref_*, method_limits_*. Full parity. |

Verified on real data (HDS, étape 8, dépôt 2023-09-01): cohort position 100% (local) / 28.4% (national); next-step distribution 87.5% → étape 9 (median 15d), 9.4% → Refus; recent decrees 10 found (e.g. #170 published 2026-06-22 with 1351-day cycle); approval rate 82.5% (52/63); volume 4 dep / 45 dec in 90d.

### Math classification rules (FAV-wins / RAPO-recoverable)

Pass 9 cleaned up the FAV/NEG sets per user spec:
- **FAV set** (5 codes): `decret_naturalisation_publie`, `decret_naturalisation_publie_jo`, `decret_publie`, `inseree_dans_decret`, `demande_traitee`.
- **NEG set** (6 codes): the existing 4 + `irrecevabilite_manifeste_en_delais_recours` + `css_en_delais_recours`. **`demande_en_cours_rapo` is NOT in NEG** (it's transient — can recover to FAV).
- `_classifyTerminal(snaps)` returns `'fav' | 'neg' | 'open'`:
  - Any FAV in history → `fav` ("RAPO recovered to décret" rule)
  - Current `demande_en_cours_rapo` → `neg` (treated as terminal when last seen)
  - Any NEG in history → `neg`
  - Else → `open` (excluded from approval rate denominator)

Same-date events at étape entry are now counted (`< anchorDate` instead of `<=`) — this fixed étape 12 going from misleading 5.3% fav to a correct 55.5% fav / 31.5% neg / 13% pend.

### Section ordering on Délais (post-Pass 9)

1. Filters (unchanged)
2. **Pipeline funnel** (NEW)
3. **Sankey flow** (NEW)
4. "Issues observées" national CR table (existing)
5. **Per-étape outcomes** (NEW)
6. Cycle médian + ping-pong KPIs (existing)
7. Estimator widget (existing)
8. Duration bar chart, collapsible (existing)
9. Percentile table (existing)
10. Backward transitions (existing)

### Total Pass 9 footprint

- ~480 lines new math (perEtapeOutcomes, pipelineFunnel, transitionFlows, recentDecrees, cohortPositionPercentile, nextStepDistribution, classifyTerminal)
- ~80 lines data layer (extended computePrefectureStats + new computeVolumeWindow)
- ~340 lines page logic (prefectures + delais + mon-dossier renderers)
- ~300 lines new CSS
- ~480 i18n strings (96 per locale × 5)
- Total ~1700 lines + 480 strings

## Audit findings — coverage table

| # | Issue | Status |
|---|---|---|
| 1 | Popup "Statut depuis" trusts ANEF's reset-on-re-entry `date_statut` | **★ Fixed** (both card sites + multi-dossier-aware) |
| 2 | `groupByDossier` dedupes `(étape, statut)` repeats keeping earliest | **Mitigated** — Mon dossier bypasses by working off raw snapshots; `computePingPongStats` surfaces the affected dossier rate on délais |
| 3 | `daysDiff` floor-clamps at 0, hides backward transitions | **★ Capability + viz**: `daysDiffSigned` helper + `computeBackwardTransitions` + new panel on délais |
| 4 | "Durée moyenne" KPIs lead-time biased | **★ Fixed on Accueil** (KM replacement); **Honest labels on Préfectures** (with KM pointer) |
| 5 | `survivalCurve` unused | Superseded by `aalenJohansenCompetingRisks` (proper competing-risks math). `survivalCurve` still exists in upstream but is correctly bypassed because naive KM is mis-specified here. |
| 6 | Promise of opt-out toggle in settings not honored in UI | **★ Fixed** — proper toggle in options |
| 7 | Multi-dossier popup read primary's history for secondaries | **★ Fixed** via `loadActiveHistory()` helper |
| 8 | Top-card and stats-card "Statut depuis" disagreed | **★ Fixed** — both go through the same history walk |
| 9 | `canonPref` regex missed apostrophe-suffix connectors | **★ Fixed** in 3 files |
| 10–14 | mon-dossier.js wiring bugs (`setText`, prefecture dropdown, `isPositive`, phase keying, cohort canonicalisation) | **★ Fixed** |
| 15–18 | mon-dossier.html/.js style/i18n issues (`.stat-tile`, inline `<style>`, hardcoded colors, hardcoded French strings) | **★ Fixed** |
| 19 | Popup dashboard URL hardcoded | **★ Fixed** via `lib/constants.js` |
| 20 | manifest.json branding lost during clone refresh | **★ Re-applied** |
| 21 | mon-dossier.html missing `<link hreflang>` tags | **★ Fixed** |
| 22 | Mon dossier statut tile showed raw lowercase code | **★ Fixed** — shows `explication`, raw code in `title` |
| 23 | Backwards transitions invisible everywhere | **★ Fixed** — panel on délais |
| 24 | No in-popup live comparison | **★ Fixed** — inline `.md-compare-card` with 24h-cached cohort fetch |
| 25 | Lead-time bias on Préfectures rankings | **Mitigated** — honest column labels + tooltip pointing at KM (full per-prefecture KM column = future work) |
| 26 | Ping-pong stats invisible to the population | **★ Fixed** — `computePingPongStats` + KPI tile on délais |

## PR-back plan (priority order)

### PR #1 — Honor the "désactivable à tout moment" promise

`options/options.html`, `options/options.js` (~10 lines). Zero risk; default stays `true`.

### PR #2 — Popup "Statut depuis" + multi-dossier history

`popup/popup.js` (~80 lines: helper + 2 display sites + 2 migrated callers). Low risk.

### PR #3 — `daysDiffSigned` helper + competing-risks panel + backward-transition panel + ping-pong KPI on délais

`shared/utils.js`, `shared/stats-math.js`, `shared/data.js`, `pages/delais.js`, `delais.html`, `shared/i18n/{fr,en,es,ar,zh}.js` (~250 lines incl. i18n). Adds `aalenJohansenCompetingRisks` + the 5-horizon "Issues observées" table.

### PR #4 — Accueil KPI honesty (mean-of-pending → cycle-median + 4y competing-risks subtitle)

`pages/accueil.js`, `index.html`, `shared/i18n/{fr,en,es,ar,zh}.js` (~30 lines). Headline = cycle median on closed-favorable; subtitle = competing-risks split at 4 years.

### PR #5 — Préfectures column relabelling + bias tooltips

`prefectures.html`, `shared/i18n/pages/prefectures.js` (~25 lines, no math change).

## Local testing

```
cd extension-fork/docs
python -m http.server 8765
# http://localhost:8765/   — Accueil with KM headline
# http://localhost:8765/delais.html — KM + ping-pong KPIs, backward-transitions table
# http://localhost:8765/prefectures.html — relabelled columns + tooltips
# http://localhost:8765/mon-dossier.html — full Mon dossier page
```

The `_isStaticSite` patch makes the dashboard load `./data/snapshots.json` locally.

## Loading the extension fork

```
chrome://extensions → Mode développeur → Charger une extension non empaquetée
→ choisir d:/sejour/anef-article/extension-fork
```

## What's still TBD (out of scope)

- **`groupByDossierPreserveSpells` helper** — not needed; `computePingPongStats` works on raw snapshots
- **Per-prefecture KM column** in the Préfectures table — would replace the lead-time-biased `avg_days` value. Bigger change touching the sort logic + table render.
- **Backwards-transition Sankey** — table form is in; visual Sankey deferred (existing dashboard doesn't use Sankey anywhere)
- **Migration of `daysDiff` callers to `daysDiffSigned`** — the helper is exported but no upstream caller is migrated. Backward-friendly to migrate piecewise.

## Publishing checklist

1. Fork `Letranger-dev/anef-extension` on user's GitHub account
2. Push `extension-fork/` content to the new repo
3. Enable GitHub Pages on the new repo, source: `docs/` folder
4. Update `DASHBOARD_BASE_URL` in `lib/constants.js` if the host differs
5. Set up `config.local.json` with Supabase creds (or rely on static-data fallback)
6. Submit the five PRs upstream with proper attribution

## Upstream attribution

All credit for the underlying extension architecture, ANEF reverse-engineering, content-script injection mechanism, AES-256-GCM credentials encryption, the Supabase aggregation pipeline, the dashboard UI design, the i18n system, and the ~9 500 lines of working code goes to the Letranger-dev maintainers. This fork modifies only the surfaces listed above.
