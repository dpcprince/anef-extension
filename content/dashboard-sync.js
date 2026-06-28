/**
 * content/dashboard-sync.js — anef-statut fork
 *
 * Bridges chrome.storage (extension) → mon-dossier.html (dashboard page).
 *
 * When the user visits the fork's Mon dossier page with the extension
 * installed, this content script reads the current dossier from
 * chrome.storage.local and forwards it to the page via postMessage.
 * mon-dossier.js already listens for `{ source: 'anef-statut-extension', dossier: {...} }`
 * and pre-fills the form, so no page-side change is needed.
 *
 * Without this script, the user has to either:
 *   - Open the popup, click "Comparer mon dossier" (URL deep-link path), OR
 *   - Type the prefecture / status / depot date manually
 *
 * With this script, simply navigating to dpcprince.github.io/anef-extension/mon-dossier.html
 * (any way: bookmark, nav menu, direct URL) auto-fills the form with
 * the user's current data.
 *
 * Resilient to the order content scripts vs page scripts run in:
 * waits for DOMContentLoaded before posting; mon-dossier.js attaches its
 * listener early enough that we don't need a retry.
 */
(function () {
  'use strict';

  // Only act on the Mon dossier page — the dashboard host_permission is
  // broad (`*.github.io`) so we narrow here to avoid noise on Accueil etc.
  if (!/\/mon-dossier\.html(\?|#|$)/.test(window.location.pathname + window.location.search + window.location.hash)) {
    return;
  }

  function getEtape(statut) {
    // We can't import status-parser here (content scripts don't use ES
    // modules unless configured to). The page already knows how to map
    // statut → étape via its own copy of constants.STATUTS, so we just
    // forward the raw statut code.
    return null;
  }

  async function loadDossier() {
    try {
      var data = await chrome.storage.local.get([
        'lastStatus', 'lastCheck', 'apiData',
        'dossiers', 'primaryDossierId'
      ]);
      // Prefer the primary dossier (matches what the popup shows by default).
      var lastStatus = data.lastStatus;
      var apiData = data.apiData;
      if (data.primaryDossierId && data.dossiers && data.dossiers[data.primaryDossierId]) {
        var d = data.dossiers[data.primaryDossierId];
        lastStatus = d.lastStatus || lastStatus;
        apiData = d.apiData || apiData;
      }
      if (!lastStatus || !apiData) return null;
      // Canonicalise prefecture (lowercased, hyphenated, "Préfecture de"
      // prefix stripped) — same shape mon-dossier.js's prefecture select
      // uses for matching.
      var pref = apiData.prefecture || '';
      var prefCanon = pref
        .replace(/^Pr[ée]fecture\s+(de\s+la|du|des|de\s+l['’]|de|d['’])\s*/i, '')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[’]/g, "'");

      var dateDepot = apiData.dateDepot || (apiData.rawTaxePayee && apiData.rawTaxePayee.date_consommation) || null;
      var dateEntreeEtape = apiData.dateEntretien || (apiData.rawEntretien && apiData.rawEntretien.date_rdv) || null;

      return {
        prefecture: prefCanon || null,
        statut: lastStatus.statut ? String(lastStatus.statut).toLowerCase() : null,
        dateDepot: dateDepot ? String(dateDepot).slice(0, 10) : null,
        // mon-dossier.js only uses dateEntreeEtape for étape-8 (entretien
        // d'assimilation). Pass it through unconditionally — the page
        // logic decides whether to apply it.
        dateEntreeEtape: dateEntreeEtape ? String(dateEntreeEtape).slice(0, 10) : null
      };
    } catch (err) {
      console.warn('[anef-statut dashboard-sync] failed to read storage:', err);
      return null;
    }
  }

  async function postToPage() {
    var dossier = await loadDossier();
    if (!dossier) return;
    // Posting to `window` (not parent / iframes) because mon-dossier.js
    // checks `ev.source === window`.
    window.postMessage({
      source: 'anef-statut-extension',
      dossier: dossier
    }, window.location.origin);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', postToPage);
  } else {
    // Page already loaded — post immediately.
    postToPage();
  }
})();
