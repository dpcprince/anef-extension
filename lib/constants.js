/**
 * Constantes et utilitaires centralisés - Extension ANEF Status Tracker
 */

// ─────────────────────────────────────────────────────────────
// URLs et domaines
// ─────────────────────────────────────────────────────────────

export const ANEF_BASE_URL = 'https://administration-etrangers-en-france.interieur.gouv.fr';

// Depuis mi-2026, l'app ANEF est servie sous le segment /usagers/
// (auparavant /particuliers/). L'URL "nue" (sans segment) redirige
// encore correctement, mais cibler /usagers/ évite une double redirection.
export const ANEF_ROUTES = {
  LOGIN: '/usagers/#/espace-personnel/connexion-inscription',
  MON_COMPTE: '/usagers/#/espace-personnel/mon-compte',
  HOME: '/usagers/#/'
};

// ─────────────────────────────────────────────────────────────
// Patterns de détection d'URL
// ─────────────────────────────────────────────────────────────

export const URLPatterns = {
  isANEFLogin: (url) => url?.includes('connexion-inscription') || false,
  isMonCompte: (url) => url?.includes('mon-compte') || false,
  isSSOPage: (url) => {
    if (!url) return false;
    return (
      url.includes('authentification') ||
      url.includes('agentconnect') ||
      url.includes('/auth') ||
      url.includes('/login') ||
      url.includes('sso.')
    );
  },
  isHomepage: (url) => {
    if (!url) return false;
    return url.endsWith('/#/') || url.endsWith('/#') || /\/(particuliers|usagers)\/#\/?$/.test(url);
  },
  isLoginPage: (url) => URLPatterns.isANEFLogin(url) || URLPatterns.isSSOPage(url),
  isPasswordExpired: (url) => !!(url?.includes('required-action') && url?.includes('UPDATE_PASSWORD'))
};

// ─────────────────────────────────────────────────────────────
// Messages autorisés (whitelist sécurité)
// ─────────────────────────────────────────────────────────────

export const ALLOWED_MESSAGE_TYPES = [
  'DOSSIER_DATA',
  'DOSSIER_STEPPER',
  'API_DATA',
  'NOTIFICATIONS',
  'USER_INFO',
  'HISTORIQUE',
  'MAINTENANCE',
  'EXPIRED_SESSION',
  'LOG'
];

// ─────────────────────────────────────────────────────────────
// Configuration des logs
// ─────────────────────────────────────────────────────────────

export const LogConfig = {
  MAX_LOGS: 500,
  STORAGE_KEY: 'debug_logs'
};

// ─────────────────────────────────────────────────────────────
// Supabase (statistiques anonymes communautaires)
// ─────────────────────────────────────────────────────────────

// anef-statut fork: point at the upstream Letranger-dev Supabase project
// so this fork contributes to (and reads from) the same community data
// pool instead of fragmenting into a parallel database.
//
// The anon key is a public client credential (the same one upstream's
// deployed extension and dashboard ship). RLS protects the data.
//
// The Edge Function URL + key are required to WRITE snapshots. They are
// not in this file because upstream's Edge Function uses a shared-secret
// header (X-Extension-Key) that ships only in the official Chrome Web
// Store build. A self-loaded fork cannot push to upstream's database
// without that key — see FORK_CHANGES.md for the contribution path.
export const SUPABASE_URL = 'https://okogtnzuuhdwogvdnitm.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rb2d0bnp1dWhkd29ndmRuaXRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MTc0MjMsImV4cCI6MjA4NjM5MzQyM30.9J6U_szY5vda6yxbFBdlCNANPYDuonHVGbS8rKl7drA';
export const SUPABASE_FUNCTION_URL = '__SUPABASE_FUNCTION_URL__';
export const SUPABASE_EDGE_KEY = '__SUPABASE_EDGE_KEY__';

// ─────────────────────────────────────────────────────────────
// anef-statut fork: companion dashboard for the "Mon dossier" deep-link.
// Override at build time (CI string-replace), via config.local.json, or by
// patching this constant before shipping a fork to a different host.
// ─────────────────────────────────────────────────────────────

export const DASHBOARD_BASE_URL = 'https://dpcprince.github.io/anef-extension';
export const DASHBOARD_MON_DOSSIER_PATH = '/mon-dossier.html';
