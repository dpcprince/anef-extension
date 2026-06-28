# anef-statut (fork de ANEF Status Tracker)

> ⚠️ **Ceci est un fork** de [Letranger-dev/anef-extension](https://github.com/Letranger-dev/anef-extension) — l'extension officielle ANEF Status Tracker.
>
> **Pour l'usage quotidien, installez l'extension officielle depuis le Chrome Web Store** ([badge ci-dessous](#installation--recommandation)). Ce fork n'est destiné qu'aux utilisateurs qui veulent essayer en avant-première les améliorations analytiques (page « Mon dossier », nouveaux KPIs, entonnoir, Sankey, etc.) avant qu'elles ne soient — éventuellement — fusionnées en amont.

## Ce que ce fork apporte

Le fork modifie uniquement la **surface analytique** (tableau de bord `docs/`) et corrige quelques bugs de l'extension. Il ne fragmente pas la base de données : il **lit en direct le panel communautaire** géré par Letranger-dev (~11 000 dossiers) — voir [Architecture des données](#architecture-des-données).

### Côté tableau de bord (nouveau)

Déployé sur [**dpcprince.github.io/anef-extension**](https://dpcprince.github.io/anef-extension/) :

- **Page « Mon dossier »** ([mon-dossier.html](https://dpcprince.github.io/anef-extension/mon-dossier.html)) : 9 sections personnalisées — position dans la file, prochaines transitions probables, profil de ta préfecture (taux d'approbation, rang vitesse national, derniers décrets), méthodologie transparente. Données pré-remplies automatiquement depuis l'extension via le bouton « 📊 Comparer mon dossier » dans le popup.
- **Mathématiques de risques concurrents** (Aalen-Johansen) qui remplacent le KPI Kaplan-Meier surestimé en haut d'accueil. À 4 ans après dépôt : 42 % décret / 6,5 % refus / 51 % en attente — la longue traîne devient visible.
- **Page Préfectures** : nouvelle colonne « Taux d'approbation (sur décidés) » et un classement par approbation à côté du classement par durée.
- **Page Délais** : entonnoir du parcours (12 barres décroissantes), diagramme de Sankey des flux entre étapes, et une analyse « Que devient un dossier à chaque étape ? » à choix d'horizon (+6 mois / +1 an / +2 ans).
- **Transitions arrière + KPI ping-pong** : les retours d'étape (invisibles dans l'upstream à cause d'un `daysDiff` qui tronque les intervalles négatifs) sont surfacés.
- **5 langues à parité** : fr / en / es / ar / zh.

Voir [`FORK_CHANGES.md`](FORK_CHANGES.md) pour la liste complète, les chiffres vérifiés sur données réelles et la priorité PR-back vers l'upstream.

### Côté extension (corrections de bugs, ★ = candidat PR-back)

- ★ **Bug « Statut depuis »** : le popup interrogeait directement `date_statut` de l'API ANEF, qui se réinitialise quand un dossier revient au même statut (ping-pong inter-sous-statuts). Le fork consulte désormais l'historique local pour la première date connue du code statut courant. Cohérent entre la card du haut et la card stats.
- ★ **Bug multi-dossiers** : pour les dossiers secondaires, le popup lisait l'historique du dossier primaire. Helper `loadActiveHistory()` qui prend le bon historique selon `dossiers[id].history`.
- ★ **Bug canonicalisation préfectures** : la regex ratait les connecteurs apostrophe-suffixe (« Préfecture de l'Eure »). Correction `\s+`→`\s*` dans trois fichiers.
- ★ **Bouton dashboard** : `btnDashboard` n'était pas câblé dans `initializeElements()`.
- ★ **Toggle opt-out** : `options.html` avait une bannière d'info au lieu d'un vrai `<input type="checkbox">`. Le toggle annoncé dans le RGPD est maintenant fonctionnel.
- **Nouvelle card comparaison inline** : le popup montre directement ton percentile + la médiane de la cohorte (préfecture × statut, fallback national), avec cache 24h via `chrome.storage.local`. Pas besoin d'ouvrir le tableau de bord.

Détails complets, fichier par fichier, dans [`FORK_CHANGES.md`](FORK_CHANGES.md).

## Architecture des données

```
                      ┌─────────────────────────────────────┐
                      │  Supabase upstream (Letranger-dev)  │
                      │  okogtnzuuhdwogvdnitm.supabase.co   │
                      │  ~11 000 snapshots anonymisés       │
                      └──────────────┬──────────────────────┘
                                     │ READ (anon key, RLS)
                ┌────────────────────┼────────────────────┐
                │                    │                    │
                ▼                    ▼                    ▼
    Extension officielle    Extension fork        Dashboards
    (Chrome Web Store)      (ce repo, dev)        ──────────
    │                       │                     • upstream :
    │ WRITE (Edge Fn        │ WRITE désactivé       letranger-dev.github.io
    │  + X-Extension-Key)   │ (pas la clé)        • fork :
    ▼                       └─ pas de write         dpcprince.github.io
   Supabase
```

**Principe** : le fork n'ouvre pas une base parallèle. Le tableau de bord lit en direct le panel commun. L'extension du fork **ne contribue pas** au panel (l'Edge Function `submit-snapshot` exige une clé partagée qui n'existe que dans la build officielle du Chrome Web Store). Pour contribuer des données, installez l'extension officielle ci-dessous — elle peut cohabiter avec ce fork.

## Installation — recommandation

### Extension officielle (recommandée pour l'usage quotidien)

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/icnpklneeaiffilemaflccdejefpehek?label=Chrome%20Web%20Store&logo=googlechrome&logoColor=white&color=4285F4)](https://chromewebstore.google.com/detail/anef-status-tracker/icnpklneeaiffilemaflccdejefpehek)

Installation en un clic, mises à jour automatiques, **votre dossier alimente la cohorte communautaire**. C'est le chemin attendu pour 99 % des utilisateurs.

### Ce fork (dev / preview des nouvelles features dashboard)

Le tableau de bord enrichi est utilisable **sans** installer le fork de l'extension — il suffit d'ouvrir :

👉 **[dpcprince.github.io/anef-extension](https://dpcprince.github.io/anef-extension/)**

L'extension officielle gère déjà l'authentification ANEF et la contribution de données. Le tableau de bord du fork lit la même base.

Si vous voulez quand même charger le fork de l'extension localement (par exemple pour tester la nouvelle card comparaison inline du popup ou le bouton « Mon dossier » pré-rempli) :

```bash
git clone https://github.com/dpcprince/anef-extension.git
```

Puis dans Chrome ou Brave :

1. `chrome://extensions` (ou `brave://extensions`)
2. Activer le **Mode développeur**
3. **Charger l'extension non empaquetée**
4. Sélectionner le dossier cloné

⚠️ Cohabite proprement avec l'extension officielle — désactiver l'une avant d'utiliser l'autre est plus propre (deux icônes dans la barre = deux écoutes simultanées du même onglet ANEF).

## Codes statut

L'extension traduit les codes cryptés en informations compréhensibles :

| Étape | Phase | Description |
|-------|-------|-------------|
| 1-2 | Dépôt | Dossier en préparation ou déposé |
| 3-4 | Vérification | Contrôle de complétude par la préfecture |
| 5 | Récépissé | Dossier complet, récépissé envoyé |
| 6 | Entretien | Convocation et passage de l'entretien |
| 7 | Décision préfecture | Avis de la préfecture |
| 8 | Contrôle SDANF | Vérification par le service central |
| 9-10 | Décret | Préparation et signature du décret |
| 11 | Publication | Envoi à la préfecture et notification |
| 12 | Finalisé | Décret publié au Journal Officiel |

## Structure du projet (modifications du fork)

```
anef-extension/
├── manifest.json           # version "2.7.0.1" + version_name "2.7.0-anefstatut.1"
├── lib/
│   ├── constants.js        # SUPABASE_URL/ANON_KEY hardcodés → upstream
│   └── anonymous-stats.js  # write path désactivé proprement
├── popup/
│   ├── popup.html          # nouvelle .md-compare-card + bouton dashboard
│   └── popup.js            # 5 bug fixes + cohort comparison inline
├── options/                # toggle opt-out fonctionnel (PR-back)
├── docs/                   # tableau de bord (déployé sur Pages)
│   ├── index.html          # KPI de tête = competing-risks à 4 ans
│   ├── prefectures.html    # + colonne approval rate, + leaderboard
│   ├── delais.html         # + funnel, Sankey, per-étape outcomes
│   ├── mon-dossier.html    # NOUVELLE PAGE — 9 sections, modal méthodo
│   ├── shared/
│   │   ├── stats-math.js   # +1000 lignes : Aalen-Johansen, helpers Pass 9
│   │   ├── data.js         # _SB_URL/_SB_KEY hardcodés → upstream
│   │   └── i18n/           # +96 clés mondossier.* × 5 locales (parité)
│   └── _test_shim.js       # smoke tests Node sans navigateur
└── FORK_CHANGES.md         # walkthrough Pass 1-9 + plan PR-back
```

## Avertissement

Cette extension est un outil personnel de suivi. Elle n'est pas affiliée au Ministère de l'Intérieur ni à aucun service officiel. Utilisez-la à vos propres risques.

## Remerciements

Tout le crédit revient à l'équipe [Letranger-dev](https://github.com/Letranger-dev/anef-extension) pour l'architecture de l'extension, le reverse-engineering ANEF, le pipeline Supabase, le design du tableau de bord et la base i18n. Ce fork ne fait qu'ajouter une couche analytique au-dessus de leur travail.

L'extension upstream s'inspire elle-même de [status_naturalisation](https://github.com/divisi0n/status_naturalisation).

## Licence

MIT License — voir [LICENSE](LICENSE).
