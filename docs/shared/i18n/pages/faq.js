/**
 * shared/i18n/pages/faq.js — i18n catalog for the FAQ page.
 *
 * Each FAQ entry has two keys: `.q` (question, shown collapsed) and
 * `.a` (answer, shown expanded — supports {token} interpolation from
 * the computer values in pages/faq.js).
 *
 * Sections:
 *   A1-A5 — Le refus
 *   B1-B5 — Le RAPO (B1/B2/B5 are pure procedural, no tokens)
 *   C1/C3-C6 — Per-étape
 *   D1-D4 — Faut-il s'inquiéter ?
 */
(function() {
  'use strict';
  if (!window.ANEF || !ANEF.i18n) return;

  // ═══════════════════════════════════════════════════════════ FR
  ANEF.i18n.register('fr', {
    'faq.loading': 'Chargement des réponses...',
    'faq.no_data': 'Aucune donnée disponible — réponses indisponibles.',
    'faq.intro_title': 'Ce que disent vraiment les données',
    'faq.intro_sub': 'Toutes les réponses ci-dessous sont calculées en direct à partir du panel communautaire (<span id="faq-dossier-count">—</span> dossiers anonymisés). Clique sur une question pour voir la réponse et les chiffres correspondants.',

    'faq.cat_rejection': 'A. Le refus — à quoi ça ressemble vraiment',
    'faq.cat_rejection_sub': 'Les chiffres bruts sur les dossiers refusés : combien, quand, sous quelle forme, et avec quelle préfecture.',
    'faq.cat_rapo': 'B. Le RAPO — comprendre et déposer un recours',
    'faq.cat_rapo_sub': 'Si tu reçois un refus, le <strong>Recours Administratif Préalable Obligatoire</strong> est la première (et obligatoire) étape avant tout recours juridictionnel. Ce qui suit combine les chiffres observés et les éléments de procédure.',
    'faq.cat_steps': 'C. « Je suis bloqué à l\'étape X » — ce que ça veut vraiment dire',
    'faq.cat_steps_sub': 'Pour la définition de chaque étape, voir le <a href="guide.html" class="text-primary-light hover:underline">Guide</a>. Ici, on regarde combien de temps les autres y restent et ce qui se passe ensuite.',
    'faq.cat_worries': 'D. Faut-il s\'inquiéter ?',
    'faq.cat_worries_sub': 'Les signaux que les gens prennent pour des mauvaises nouvelles — vérifiés sur données.',

    'faq.method_title': 'Méthodologie & limites',
    'faq.method_body': 'Les chiffres sont recalculés sur chaque visite à partir du panel communautaire (~6 300 dossiers). Le panel n\'est pas exhaustif et peut être biaisé en faveur des utilisateurs d\'extension. Les estimations basées sur de petits échantillons (RAPO, refus tardifs) sont marquées comme telles. Pour le détail mathématique, voir la <a href="delais.html" class="text-primary-light hover:underline">page Délais</a> et la modale méthodologie sur <a href="mon-dossier.html" class="text-primary-light hover:underline">Mon dossier</a>.',

    'faq.link_delais': 'Voir l\'analyse complète des délais',
    'faq.link_mondossier': 'Voir mon dossier en détail',
    'faq.link_prefs': 'Voir le classement des préfectures',
    'faq.link_guide': 'Voir le guide des étapes',

    // ─── A. Le refus ───────────────────────────────
    'faq.A1_how_many_rejected.q': 'Combien de dossiers sont effectivement rejetés ?',
    'faq.A1_how_many_rejected.a':
      '<p>Sur <strong>{total}</strong> dossiers suivis dans le panel :</p>' +
      '<ul style="margin:0.5rem 0 0.5rem 1.5rem;list-style:disc">' +
      '<li><strong style="color:#10b981">{n_fav} ({pct_fav_all}%)</strong> ont obtenu un décret de naturalisation</li>' +
      '<li><strong style="color:#ef4444">{n_neg} ({pct_neg_all}%)</strong> ont essuyé un refus définitif</li>' +
      '<li><strong style="color:#f59e0b">{n_rapo} ({pct_rapo_all}%)</strong> sont actuellement en RAPO</li>' +
      '<li>Les autres ({decided} restants) sont encore en cours d\'instruction</li>' +
      '</ul>' +
      '<p style="margin-top:0.5rem">Le chiffre qui compte vraiment : <strong>parmi les dossiers ayant abouti à une décision (FAV ou refus définitif), {pct_neg_decided}% sont refusés et {pct_fav_decided}% sont acceptés</strong>. Soit environ 6 acceptations pour 1 refus.</p>' +
      '<p style="margin-top:0.5rem;font-size:0.85rem;color:var(--text-dim)">Note : la plupart des RAPO en cours finissent en refus (voir B3), donc en lecture pessimiste le taux de refus monte à {pct_neg_pessimistic}% — c\'est probablement plus proche du vrai taux à long terme.</p>',

    'faq.A2_when_rejection.q': 'À quel moment du parcours arrive le refus ?',
    'faq.A2_when_rejection.a':
      '<p>Quasiment jamais avant l\'entretien d\'assimilation. Deux moments dominants :</p>' +
      '<ul style="margin:0.5rem 0 0.5rem 1.5rem;list-style:disc">' +
      '<li><strong>Étape 8 — Décision préfecture (le plus fréquent)</strong> : {pct_from_et8}% des refus « classiques » ({n_classic} dossiers) viennent directement de cette étape, donc <em>après</em> l\'entretien. Délai médian depuis le dépôt : {med_classic_fmt}.</li>' +
      '<li><strong>Étape 10 — Préparation décret (pattern douloureux)</strong> : {n_sdanf} dossiers ont atteint étape 10 (la préfecture avait donné son feu vert, la SDANF préparait le décret) et ont quand même été refusés par le ministère. Délai médian : {med_sdanf_fmt}. Total des refus arrivant <strong>après l\'étape 10</strong> : {n_late}.</li>' +
      '</ul>' +
      '<p style="margin-top:0.5rem">Lecture : la grande majorité des refus surviennent à l\'étape 8 (décision préfecture), mais il existe un risque résiduel jusqu\'à l\'étape 11 (insertion au décret), où le ministère peut encore bloquer.</p>',

    'faq.A3_rejection_types.q': 'Quels sont les différents types de refus ?',
    'faq.A3_rejection_types.a':
      '<p>Le portail ANEF distingue plusieurs statuts terminaux négatifs. Dans le panel :</p>' +
      '<ul style="margin:0.5rem 0 0.5rem 1.5rem;list-style:disc">' +
      '<li><strong>decision_negative_en_delais_recours</strong> ({n_classic} dossiers) — refus de la préfecture, dans le délai de recours de 2 mois. C\'est le refus « classique ».</li>' +
      '<li><strong>controle_demande_notifiee</strong> ({n_sdanf} dossiers) — refus notifié par la SDANF/ministère, typiquement après que la préfecture avait approuvé.</li>' +
      '<li><strong>css_notifie</strong> ({n_css} dossiers) — refus pour irrégularité d\'état civil (vérification par le SCEC de Nantes).</li>' +
      '<li><strong>decision_notifiee</strong> ({n_post_rapo} dossiers) — notification finale, presque toujours après un RAPO. C\'est la décision « après recours ».</li>' +
      '</ul>' +
      '<p style="margin-top:0.5rem">Chaque type implique des motifs et des suites différentes. Si tu reçois un de ces statuts, la notification papier détaille le motif et indique le délai de recours.</p>',

    'faq.A4_long_wait_means_neg.q': 'Un long délai veut-il dire que je vais être refusé ?',
    'faq.A4_long_wait_means_neg.a':
      '<p><strong>Pas le délai total — mais une longue attente <em>après l\'entretien</em> peut être un signal faible.</strong></p>' +
      '<p style="margin-top:0.5rem">En agrégé, les délais dépôt → décision finale sont quasi-identiques pour les dossiers acceptés et refusés (médiane <strong>{fav_fmt}</strong> contre <strong>{neg_fmt}</strong>, n={n_fav} vs {n_neg}). Donc « ça prend longtemps » globalement n\'est pas un signal.</p>' +
      '<p style="margin-top:0.5rem">En revanche, le refus survient quasi-exclusivement <strong>après l\'entretien</strong>, et il existe une dérive du taux de refus quand l\'attente post-entretien s\'allonge :</p>' +
      '<table style="margin:0.5rem 0;border-collapse:collapse;font-size:0.85rem"><thead><tr>' +
      '<th style="text-align:left;padding:0.25rem 0.7rem;border-bottom:1px solid var(--border)">Temps depuis l\'entretien</th>' +
      '<th style="text-align:right;padding:0.25rem 0.7rem;border-bottom:1px solid var(--border)">Taux de refus</th>' +
      '<th style="text-align:right;padding:0.25rem 0.7rem;border-bottom:1px solid var(--border)">n</th>' +
      '</tr></thead><tbody>' +
      '<tr><td style="padding:0.2rem 0.7rem">0–3 mois</td><td style="text-align:right;padding:0.2rem 0.7rem"><strong>{eb_0_3_pct}%</strong></td><td style="text-align:right;padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_0_3_n}</td></tr>' +
      '<tr><td style="padding:0.2rem 0.7rem">3–6 mois</td><td style="text-align:right;padding:0.2rem 0.7rem"><strong>{eb_3_6_pct}%</strong></td><td style="text-align:right;padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_3_6_n}</td></tr>' +
      '<tr><td style="padding:0.2rem 0.7rem">6–12 mois</td><td style="text-align:right;padding:0.2rem 0.7rem"><strong>{eb_6_12_pct}%</strong></td><td style="text-align:right;padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_6_12_n}</td></tr>' +
      '<tr><td style="padding:0.2rem 0.7rem"><strong>12–24 mois</strong></td><td style="text-align:right;padding:0.2rem 0.7rem;color:#ef4444"><strong>{eb_12_24_pct}%</strong></td><td style="text-align:right;padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_12_24_n}</td></tr>' +
      '</tbody></table>' +
      '<p style="margin-top:0.5rem">Lecture pratique : si tu approches d\'un an post-entretien sans décision, le risque relatif augmente — mais reste minoritaire. La majorité des dossiers dans cette tranche progressent quand même. <strong>Signal faible</strong>, à pondérer avec l\'absence d\'autre signe explicite (refus, mise en demeure, CSS).</p>' +
      '<p style="margin-top:0.4rem;font-size:0.8rem;color:var(--text-dim)">Cohorte : {eb_n} dossiers avec une date d\'entretien capturée et un événement post-entretien observé. Les effectifs au-delà de 12 mois sont faibles ({eb_12_24_n}) — chiffre indicatif, pas statistiquement significatif.</p>',

    'faq.A5_prefecture_matters.q': 'Ma préfecture a-t-elle un taux de refus particulièrement élevé ?',
    'faq.A5_prefecture_matters.a':
      '<p>Variation observable, mais à relativiser. Sur les <strong>{n_pref}</strong> préfectures du panel ayant au moins 20 dossiers décidés :</p>' +
      '<ul style="margin:0.5rem 0 0.5rem 1.5rem;list-style:disc">' +
      '<li>La plus stricte : <strong>{strictest}</strong> — {strictest_pct}% de refus ({strictest_n} décidés)</li>' +
      '<li>La plus lénient : <strong>{most_lenient}</strong> — {most_lenient_pct}% de refus ({most_lenient_n} décidés)</li>' +
      '</ul>' +
      '<p style="margin-top:0.5rem">Soit un écart d\'environ 5×. C\'est un vrai signal, mais ton dossier individuel pèse plus que la moyenne de ta préfecture. Pour le classement complet, voir la page Préfectures.</p>',

    // ─── B. Le RAPO ───────────────────────────────
    'faq.B1_what_is_rapo.q': 'Qu\'est-ce qu\'un RAPO et pourquoi est-il obligatoire ?',
    'faq.B1_what_is_rapo.a':
      '<p>Le <strong>Recours Administratif Préalable Obligatoire</strong> (RAPO) est, comme son nom l\'indique, <strong>obligatoire</strong> avant tout recours juridictionnel pour les décisions de rejet en matière de naturalisation. Tu ne peux pas saisir directement le Tribunal Administratif sans avoir d\'abord déposé un RAPO.</p>' +
      '<p style="margin-top:0.5rem"><strong>Base légale</strong> : article 27-1 du Code civil ; décret n° 93-1362 du 30 décembre 1993 ; article R. 421-1 du Code de justice administrative.</p>' +
      '<p style="margin-top:0.5rem">Il s\'agit de demander au ministre de l\'Intérieur de réexaminer la décision. Si le ministre confirme le refus (explicitement ou par silence pendant 4 mois), tu peux alors saisir le juge administratif.</p>',

    'faq.B2_how_to_file.q': 'Comment et où déposer un RAPO ?',
    'faq.B2_how_to_file.a':
      '<p><strong>Délai impératif : 2 mois à compter de la notification du refus.</strong> Au-delà, le recours est irrecevable.</p>' +
      '<p style="margin-top:0.5rem"><strong>Destinataire</strong> : Ministre de l\'Intérieur — Sous-direction de l\'accès à la nationalité française (SDANF). L\'adresse précise figure sur la notification du refus.</p>' +
      '<p style="margin-top:0.5rem"><strong>Format recommandé</strong> : courrier envoyé en <strong>lettre recommandée avec accusé de réception</strong> (LRAR). Le tampon de la poste fait foi pour le délai de 2 mois.</p>' +
      '<p style="margin-top:0.5rem"><strong>Contenu minimal</strong> :</p>' +
      '<ul style="margin:0.3rem 0 0.5rem 1.5rem;list-style:disc">' +
      '<li>Identité complète (nom, prénoms, date et lieu de naissance, nationalité)</li>' +
      '<li>Référence du dossier (numéro figurant sur la notification)</li>' +
      '<li>Copie intégrale de la décision contestée</li>' +
      '<li>Motifs détaillés du recours (en quoi la décision est mal fondée — en droit, en fait, sur la motivation)</li>' +
      '<li>Pièces justificatives complémentaires utiles (changements de situation, éléments nouveaux)</li>' +
      '</ul>' +
      '<p style="margin-top:0.5rem">Compte tenu des enjeux et de la technicité, <strong>l\'assistance d\'un avocat en droit des étrangers ou d\'une association (La Cimade, GISTI, ASTI) est fortement recommandée</strong>. Le RAPO est ta seule cartouche avant la phase juridictionnelle ; il faut soigner l\'argumentation.</p>',

    'faq.B3_success_rate.q': 'Quel est le taux de succès d\'un RAPO ?',
    'faq.B3_success_rate.a':
      '<p>Sur le panel : <strong>{n_total}</strong> dossiers ont déposé un RAPO observable. État au moment de l\'analyse :</p>' +
      '<ul style="margin:0.5rem 0 0.5rem 1.5rem;list-style:disc">' +
      '<li><strong>{n_active}</strong> sont encore en cours d\'examen (pas d\'issue connue).</li>' +
      '<li><strong>{n_recovered}</strong> ont récupéré un décret favorable (annulation du refus).</li>' +
      '<li><strong>{n_confirmed_neg}</strong> ont vu le refus confirmé.</li>' +
      '</ul>' +
      '<p style="margin-top:0.5rem">Parmi les <strong>{n_resolved}</strong> RAPO résolus, le taux de succès observé est de <strong>{success_pct}%</strong>. C\'est un échantillon très réduit — à prendre comme un ordre de grandeur, pas une estimation précise.</p>' +
      '<p style="margin-top:0.5rem;font-size:0.85rem;color:var(--text-dim)">Avertissement : beaucoup de dossiers sont entrés dans le panel <em>déjà</em> en RAPO (ce qui suggère que la base sous-estime le nombre total de RAPO déposés). Le taux réel pourrait être différent.</p>',

    'faq.B4_how_long.q': 'Combien de temps prend un RAPO ?',
    'faq.B4_how_long.a':
      '<p>Quand le RAPO aboutit à un refus confirmé, la décision arrive en moyenne en <strong>{median_confirm_fmt}</strong> (médiane sur le panel). Pour les cas favorables, c\'est plus variable : médiane <strong>{median_recovery_fmt}</strong> mais l\'échantillon est très petit.</p>' +
      '<p style="margin-top:0.5rem"><strong>Délai légal côté administration</strong> : 4 mois à compter de la réception du RAPO. Au-delà, le silence vaut <strong>rejet implicite</strong> — tu peux saisir le Tribunal Administratif dans les 2 mois qui suivent.</p>' +
      '<p style="margin-top:0.5rem">État actuel des RAPO en cours dans le panel ({n_active} dossiers) : âge médian <strong>{active_median_fmt}</strong>, maximum <strong>{active_max_fmt}</strong>.</p>',

    'faq.B5_after_rapo_denied.q': 'Mon RAPO a été rejeté — que faire ensuite ?',
    'faq.B5_after_rapo_denied.a':
      '<p>Si le RAPO est rejeté (explicitement ou par silence de 4 mois), la voie suivante est le <strong>recours pour excès de pouvoir</strong> devant le Tribunal Administratif.</p>' +
      '<p style="margin-top:0.5rem"><strong>Délai</strong> : 2 mois à compter de la notification du rejet explicite — ou à compter de l\'expiration du délai de 4 mois si le ministre n\'a pas répondu.</p>' +
      '<p style="margin-top:0.5rem"><strong>Compétence territoriale</strong> : généralement le TA de Nantes (compétence nationale pour les décisions de la SDANF), mais à vérifier sur la notification.</p>' +
      '<p style="margin-top:0.5rem"><strong>Recommandation</strong> : un avocat spécialisé en droit des étrangers / contentieux administratif est ici quasi-indispensable. La requête doit articuler des moyens juridiques précis (légalité externe, légalité interne, erreur d\'appréciation, etc.). Bénéfice de l\'aide juridictionnelle envisageable selon ressources.</p>' +
      '<p style="margin-top:0.5rem">En parallèle, un <strong>référé suspension</strong> (article L. 521-1 du Code de justice administrative) est possible si l\'urgence est caractérisée — c\'est rare en matière de naturalisation mais pas inenvisageable.</p>',

    // ─── C. Per-étape ───────────────────────────────
    'faq.C1_etape3_med.q': 'J\'ai reçu une « mise en demeure » à l\'étape 3 — est-ce que c\'est un refus ?',
    'faq.C1_etape3_med.a':
      '<p><strong>Non.</strong> La mise en demeure (statut <code>verification_formelle_mise_en_demeure</code>) est une demande administrative de compléter ton dossier, pas un refus.</p>' +
      '<p style="margin-top:0.5rem">Sur le panel, <strong>{n_med}</strong> dossiers ont reçu une mise en demeure à cette étape :</p>' +
      '<ul style="margin:0.5rem 0 0.5rem 1.5rem;list-style:disc">' +
      '<li><strong>{n_recovered}</strong> sont revenus à un statut normal après régularisation.</li>' +
      '<li><strong>{n_stuck}</strong> sont encore en mise en demeure (en attente de réponse de l\'usager).</li>' +
      '<li><strong>{n_neg}</strong> ont fini en refus terminal.</li>' +
      '<li><strong>{n_fav}</strong> ont atteint un décret favorable.</li>' +
      '</ul>' +
      '<p style="margin-top:0.5rem">Conclusion pratique : fournis les pièces demandées dans le délai indiqué (généralement 1 mois) et ton dossier reprend son cours normal.</p>',

    'faq.C3_etape8_decision.q': 'Je suis à l\'étape 8 (Décision préfecture) — combien de temps avant de savoir ?',
    'faq.C3_etape8_decision.a':
      '<p>Ça dépend essentiellement du <strong>temps écoulé depuis ton entretien</strong> (pas du temps « affiché » à l\'étape 8, qui dépend du sous-statut courant).</p>' +
      '<p style="margin-top:0.5rem">Sur {eb_n} dossiers du panel avec une date d\'entretien capturée et un événement post-entretien observé :</p>' +
      '<table style="margin:0.5rem 0;border-collapse:collapse;font-size:0.85rem"><thead><tr>' +
      '<th style="text-align:left;padding:0.25rem 0.7rem;border-bottom:1px solid var(--border)">Temps depuis entretien</th>' +
      '<th style="text-align:right;padding:0.25rem 0.7rem;border-bottom:1px solid var(--border)">Taux de refus</th>' +
      '<th style="text-align:right;padding:0.25rem 0.7rem;border-bottom:1px solid var(--border)">Cohorte</th>' +
      '</tr></thead><tbody>' +
      '<tr><td style="padding:0.2rem 0.7rem">0–3 mois</td><td style="text-align:right;padding:0.2rem 0.7rem">{eb_0_3_pct}%</td><td style="text-align:right;padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_0_3_n}</td></tr>' +
      '<tr><td style="padding:0.2rem 0.7rem">3–6 mois</td><td style="text-align:right;padding:0.2rem 0.7rem">{eb_3_6_pct}%</td><td style="text-align:right;padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_3_6_n}</td></tr>' +
      '<tr><td style="padding:0.2rem 0.7rem">6–12 mois</td><td style="text-align:right;padding:0.2rem 0.7rem">{eb_6_12_pct}%</td><td style="text-align:right;padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_6_12_n}</td></tr>' +
      '<tr><td style="padding:0.2rem 0.7rem"><strong>12–24 mois</strong></td><td style="text-align:right;padding:0.2rem 0.7rem;color:#ef4444"><strong>{eb_12_24_pct}%</strong></td><td style="text-align:right;padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_12_24_n}</td></tr>' +
      '</tbody></table>' +
      '<p style="margin-top:0.5rem">La grande majorité des dossiers reçoivent leur décision dans les 6 mois post-entretien. Au-delà de 12 mois, le risque de refus monte (signal faible mais réel — voir A4 pour la lecture détaillée).</p>' +
      '<p style="margin-top:0.5rem;font-size:0.8rem;color:var(--text-dim)">Note méthodologique : le temps « depuis le statut » affiché par ANEF se remet à zéro à chaque sous-statut (PROP_DECISION_PREF_A_EFFECTUER, PROP_DECISION_PREF_PROP_A_EDITER, etc.). C\'est pourquoi on ancre sur la date d\'entretien — c\'est l\'événement qui ne bouge pas.</p>',

    'faq.C4_etape9_sdanf.q': 'Je suis à l\'étape 9 (Contrôle SDANF) — combien de temps ça dure ?',
    'faq.C4_etape9_sdanf.a':
      '<p>L\'étape 9 est <strong>la plus longue du parcours</strong>. Le contrôle par la SDANF (et selon le profil, par le SCEC à Nantes pour l\'état civil) prend du temps : médiane <strong>{median_fmt}</strong> avant de progresser à l\'étape 10 (n={n} transitions observées).</p>' +
      '<p style="margin-top:0.5rem">Patience nécessaire. C\'est aussi à ce stade que les éventuelles vérifications complémentaires (état civil, fiscal, judiciaire, sécuritaire) sont menées.</p>',

    'faq.C5_etape10_decret_prep.q': 'Je suis à l\'étape 10 (Préparation décret) — suis-je définitivement accepté·e ?',
    'faq.C5_etape10_decret_prep.a':
      '<p><strong>Presque, mais pas tout à fait.</strong> La progression vers l\'étape 11 est typiquement rapide : médiane <strong>{median_fmt}</strong> (n={n}).</p>' +
      '<p style="margin-top:0.5rem">Toutefois, <strong>{n_late} dossiers</strong> du panel ont atteint l\'étape 10 et ont quand même été refusés ensuite par le ministère (statut <code>controle_demande_notifiee</code>). C\'est rare mais ça existe — le ministre peut encore bloquer pour des motifs de sécurité ou d\'ordre public jusqu\'à la signature du décret.</p>' +
      '<p style="margin-top:0.5rem">Le « point de non-retour » réel est l\'étape 11 (insertion au décret), pas l\'étape 10.</p>',

    'faq.C6_etape11_publication.q': 'Je suis à l\'étape 11 (insertion décret) — quand est-ce que mon décret sort au JO ?',
    'faq.C6_etape11_publication.a':
      '<p>Médiane <strong>{median_fmt}</strong> entre l\'insertion au décret et la publication finale au Journal Officiel (n={n} transitions observées).</p>' +
      '<p style="margin-top:0.5rem">À ce stade ton dossier est <strong>committed</strong> au décret en préparation. Sauf cas exceptionnel (information sécuritaire nouvelle, erreur matérielle), c\'est gagné. Reste à attendre la prochaine fournée de décrets.</p>',

    // ─── D. Faut-il s'inquiéter ? ───────────────────────────────
    'faq.D1_long_wait.q': 'Mon dossier prend très longtemps — est-ce que c\'est mauvais signe ?',
    'faq.D1_long_wait.a':
      '<p><strong>Non.</strong> Les délais des dossiers acceptés et des dossiers refusés sont quasiment identiques :</p>' +
      '<ul style="margin:0.5rem 0 0.5rem 1.5rem;list-style:disc">' +
      '<li>Dépôt → décret favorable : médiane <strong>{fav_fmt}</strong> (n={n_fav})</li>' +
      '<li>Dépôt → refus définitif : médiane <strong>{neg_fmt}</strong></li>' +
      '</ul>' +
      '<p style="margin-top:0.5rem">L\'attente n\'est pas un prédicteur d\'issue. Le signal qui compte, c\'est le <em>statut</em>, pas la durée.</p>',

    'faq.D2_complement.q': 'On m\'a demandé un complément de pièces — est-ce mauvais ?',
    'faq.D2_complement.a':
      '<p><strong>Non, c\'est la norme.</strong> <strong>{pct_with_compl}%</strong> des dossiers du panel (<strong>{n_with_compl}</strong> dossiers) ont reçu une demande de complément à un moment donné. Les issues parmi ces dossiers reflètent la population générale.</p>' +
      '<p style="margin-top:0.5rem">Réponds dans le délai indiqué, fournis ce qui est demandé, et le dossier continue. C\'est un point d\'attention administratif, pas un signal négatif.</p>',

    'faq.D3_pingpong.q': 'Mon dossier rebondit entre sous-statuts (« ping-pong ») — est-ce mauvais ?',
    'faq.D3_pingpong.a':
      '<p><strong>Non.</strong> Le ping-pong (re-passages par un même statut) est même légèrement plus fréquent chez les dossiers favorables :</p>' +
      '<ul style="margin:0.5rem 0 0.5rem 1.5rem;list-style:disc">' +
      '<li>Dossiers favorables : <strong>{fav_pct}%</strong> connaissent du ping-pong (n={fav_n})</li>' +
      '<li>Dossiers refusés : <strong>{neg_pct}%</strong> connaissent du ping-pong (n={neg_n})</li>' +
      '</ul>' +
      '<p style="margin-top:0.5rem">C\'est juste un effet du processus interne d\'instruction. Pas de panique.</p>',

    'faq.D4_backward.q': 'Mon dossier est revenu à une étape antérieure — qu\'est-ce qui se passe ?',
    'faq.D4_backward.a':
      '<p>Sur le panel, <strong>{n_backward}</strong> dossiers ({pct_backward}%) ont connu au moins un retour en arrière dans le parcours d\'étapes. Ça arrive régulièrement.</p>' +
      '<p style="margin-top:0.5rem">Causes habituelles : la SDANF demande des compléments d\'enquête (retour à étape 9 depuis étape 10/11), ou un problème d\'état civil découvert tardivement renvoie le dossier à la complétude. Ce n\'est pas un signal négatif en soi — voir la section « Transitions arrière » de la page Délais pour le détail.</p>'
  });

  // ═══════════════════════════════════════════════════════════ EN
  ANEF.i18n.register('en', {
    'faq.loading': 'Loading answers...',
    'faq.no_data': 'No data available — answers unavailable.',
    'faq.intro_title': 'What the data actually says',
    'faq.intro_sub': 'All answers below are computed live from the community panel (<span id="faq-dossier-count">—</span> anonymised cases). Click a question to see the answer and the underlying numbers.',

    'faq.cat_rejection': 'A. Refusal — what it really looks like',
    'faq.cat_rejection_sub': 'Raw numbers on refused cases: how many, when, in what form, and which prefecture.',
    'faq.cat_rapo': 'B. The RAPO — understanding and filing an administrative appeal',
    'faq.cat_rapo_sub': 'If you receive a refusal, the <strong>Mandatory Prior Administrative Appeal</strong> (RAPO) is the first (and mandatory) step before any judicial appeal. Below combines observed numbers with procedural facts.',
    'faq.cat_steps': 'C. "I\'m stuck at step X" — what it actually means',
    'faq.cat_steps_sub': 'For the definition of each step, see the <a href="guide.html" class="text-primary-light hover:underline">Guide</a>. Here we look at how long others stay and what happens next.',
    'faq.cat_worries': 'D. Should I worry?',
    'faq.cat_worries_sub': 'Signals people read as bad news — fact-checked against the data.',

    'faq.method_title': 'Methodology & limits',
    'faq.method_body': 'Numbers are recomputed on every visit from the community panel (~6,300 cases). The panel is not exhaustive and may be biased toward extension users. Estimates based on small samples (RAPO, late refusals) are flagged as such. For mathematical detail, see the <a href="delais.html" class="text-primary-light hover:underline">Délais page</a> and the methodology modal on <a href="mon-dossier.html" class="text-primary-light hover:underline">Mon dossier</a>.',

    'faq.link_delais': 'See the full delay analysis',
    'faq.link_mondossier': 'See my case in detail',
    'faq.link_prefs': 'See the prefecture ranking',
    'faq.link_guide': 'See the step-by-step guide',

    'faq.A1_how_many_rejected.q': 'How many cases actually get rejected?',
    'faq.A1_how_many_rejected.a':
      '<p>Out of <strong>{total}</strong> cases tracked in the panel:</p>' +
      '<ul style="margin:0.5rem 0 0.5rem 1.5rem;list-style:disc">' +
      '<li><strong style="color:#10b981">{n_fav} ({pct_fav_all}%)</strong> obtained a naturalisation decree</li>' +
      '<li><strong style="color:#ef4444">{n_neg} ({pct_neg_all}%)</strong> faced a definitive refusal</li>' +
      '<li><strong style="color:#f59e0b">{n_rapo} ({pct_rapo_all}%)</strong> are currently in RAPO (administrative appeal)</li>' +
      '<li>The rest are still being processed</li>' +
      '</ul>' +
      '<p style="margin-top:0.5rem">The number that matters: <strong>among cases that reached a decision (FAV or final refusal), {pct_neg_decided}% are refused and {pct_fav_decided}% are accepted</strong>. Roughly 6 acceptances for every refusal.</p>' +
      '<p style="margin-top:0.5rem;font-size:0.85rem;color:var(--text-dim)">Caveat: most active RAPOs end in refusal (see B3), so the pessimistic refusal rate is {pct_neg_pessimistic}% — probably closer to the true long-term rate.</p>',

    'faq.A2_when_rejection.q': 'When in the journey does refusal happen?',
    'faq.A2_when_rejection.a':
      '<p>Almost never before the assimilation interview. Two dominant moments:</p>' +
      '<ul style="margin:0.5rem 0 0.5rem 1.5rem;list-style:disc">' +
      '<li><strong>Step 8 — Prefecture decision (most common)</strong>: {pct_from_et8}% of classic refusals ({n_classic} cases) come directly from this step, i.e. <em>after</em> the interview. Median delay from filing: {med_classic_fmt}.</li>' +
      '<li><strong>Step 10 — Decree preparation (painful pattern)</strong>: {n_sdanf} cases reached step 10 (the prefecture had approved, the SDANF was preparing the decree) and were still refused by the ministry. Median: {med_sdanf_fmt}. Total refusals occurring <strong>after step 10</strong>: {n_late}.</li>' +
      '</ul>' +
      '<p style="margin-top:0.5rem">Reading: the vast majority of refusals occur at step 8 (prefecture decision), but a residual risk exists up to step 11 (insertion in decree), where the ministry can still block.</p>',

    'faq.A3_rejection_types.q': 'What are the different types of refusal?',
    'faq.A3_rejection_types.a':
      '<p>The ANEF portal distinguishes several negative terminal statuses. In the panel:</p>' +
      '<ul style="margin:0.5rem 0 0.5rem 1.5rem;list-style:disc">' +
      '<li><strong>decision_negative_en_delais_recours</strong> ({n_classic} cases) — prefecture refusal, within the 2-month appeal window. The "classic" refusal.</li>' +
      '<li><strong>controle_demande_notifiee</strong> ({n_sdanf} cases) — refusal notified by SDANF/ministry, typically after the prefecture had approved.</li>' +
      '<li><strong>css_notifie</strong> ({n_css} cases) — refusal for civil-status irregularity (verification by the SCEC in Nantes).</li>' +
      '<li><strong>decision_notifiee</strong> ({n_post_rapo} cases) — final notification, almost always after a RAPO. The "post-appeal" decision.</li>' +
      '</ul>' +
      '<p style="margin-top:0.5rem">Each type implies different grounds and next steps. If you receive one of these statuses, the paper notification details the grounds and indicates the appeal deadline.</p>',

    'faq.A4_long_wait_means_neg.q': 'Does a long wait mean I\'ll be refused?',
    'faq.A4_long_wait_means_neg.a':
      '<p><strong>Not the total wait — but a long wait <em>after the interview</em> can be a weak signal.</strong></p>' +
      '<p style="margin-top:0.5rem">Globally, total filing → decision times are nearly identical for accepted and refused cases (median <strong>{fav_fmt}</strong> vs <strong>{neg_fmt}</strong>, n={n_fav} vs {n_neg}). So "it\'s taking long" overall is not a signal.</p>' +
      '<p style="margin-top:0.5rem">However, refusal almost always happens <strong>after the interview</strong>, and the refusal rate drifts up with longer post-interview waits:</p>' +
      '<table style="margin:0.5rem 0;border-collapse:collapse;font-size:0.85rem"><thead><tr>' +
      '<th style="text-align:left;padding:0.25rem 0.7rem;border-bottom:1px solid var(--border)">Time since interview</th>' +
      '<th style="text-align:right;padding:0.25rem 0.7rem;border-bottom:1px solid var(--border)">Refusal rate</th>' +
      '<th style="text-align:right;padding:0.25rem 0.7rem;border-bottom:1px solid var(--border)">n</th>' +
      '</tr></thead><tbody>' +
      '<tr><td style="padding:0.2rem 0.7rem">0–3 months</td><td style="text-align:right;padding:0.2rem 0.7rem"><strong>{eb_0_3_pct}%</strong></td><td style="text-align:right;padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_0_3_n}</td></tr>' +
      '<tr><td style="padding:0.2rem 0.7rem">3–6 months</td><td style="text-align:right;padding:0.2rem 0.7rem"><strong>{eb_3_6_pct}%</strong></td><td style="text-align:right;padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_3_6_n}</td></tr>' +
      '<tr><td style="padding:0.2rem 0.7rem">6–12 months</td><td style="text-align:right;padding:0.2rem 0.7rem"><strong>{eb_6_12_pct}%</strong></td><td style="text-align:right;padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_6_12_n}</td></tr>' +
      '<tr><td style="padding:0.2rem 0.7rem"><strong>12–24 months</strong></td><td style="text-align:right;padding:0.2rem 0.7rem;color:#ef4444"><strong>{eb_12_24_pct}%</strong></td><td style="text-align:right;padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_12_24_n}</td></tr>' +
      '</tbody></table>' +
      '<p style="margin-top:0.5rem">Practical reading: if you\'re approaching one year post-interview without a decision, the relative risk rises — but it remains minority. The majority in this bracket still progress favourably. <strong>Weak signal</strong>, to weight against the absence of any explicit negative sign.</p>' +
      '<p style="margin-top:0.4rem;font-size:0.8rem;color:var(--text-dim)">Cohort: {eb_n} cases with captured interview date and an observed post-interview event. Sample beyond 12 months is small ({eb_12_24_n}) — indicative figure, not statistically significant.</p>',

    'faq.A5_prefecture_matters.q': 'Does my prefecture have an unusually high refusal rate?',
    'faq.A5_prefecture_matters.a':
      '<p>There is observable variation, but in moderation. Among the <strong>{n_pref}</strong> panel prefectures with at least 20 decided cases:</p>' +
      '<ul style="margin:0.5rem 0 0.5rem 1.5rem;list-style:disc">' +
      '<li>Strictest: <strong>{strictest}</strong> — {strictest_pct}% refusal ({strictest_n} decided)</li>' +
      '<li>Most lenient: <strong>{most_lenient}</strong> — {most_lenient_pct}% refusal ({most_lenient_n} decided)</li>' +
      '</ul>' +
      '<p style="margin-top:0.5rem">That\'s roughly a 5× spread. It\'s a real signal, but your individual case matters more than your prefecture\'s average. See the Prefectures page for the full ranking.</p>',

    'faq.B1_what_is_rapo.q': 'What is a RAPO and why is it mandatory?',
    'faq.B1_what_is_rapo.a':
      '<p>The <strong>Mandatory Prior Administrative Appeal</strong> (RAPO) is, as the name says, <strong>mandatory</strong> before any judicial appeal for naturalisation refusals. You cannot petition the administrative court directly without first filing a RAPO.</p>' +
      '<p style="margin-top:0.5rem"><strong>Legal basis</strong>: article 27-1 of the French Civil Code; decree no. 93-1362 of 30 December 1993; article R. 421-1 of the Code of Administrative Justice.</p>' +
      '<p style="margin-top:0.5rem">It consists of asking the Minister of the Interior to reconsider the decision. If the minister confirms the refusal (explicitly or by silence for 4 months), you can then seise the administrative court.</p>',

    'faq.B2_how_to_file.q': 'How and where to file a RAPO?',
    'faq.B2_how_to_file.a':
      '<p><strong>Strict deadline: 2 months from notification of the refusal.</strong> Past this point, the appeal is inadmissible.</p>' +
      '<p style="margin-top:0.5rem"><strong>Recipient</strong>: Minister of the Interior — Sub-Directorate for Access to French Nationality (SDANF). The exact address is on the refusal notification.</p>' +
      '<p style="margin-top:0.5rem"><strong>Recommended format</strong>: <strong>registered letter with acknowledgement of receipt</strong> (LRAR). The postmark proves the date for the 2-month deadline.</p>' +
      '<p style="margin-top:0.5rem"><strong>Minimum content</strong>:</p>' +
      '<ul style="margin:0.3rem 0 0.5rem 1.5rem;list-style:disc">' +
      '<li>Full identity (last name, first names, date and place of birth, nationality)</li>' +
      '<li>Case reference (number on the notification)</li>' +
      '<li>Complete copy of the contested decision</li>' +
      '<li>Detailed grounds for appeal (how the decision is wrong — in law, in fact, in motivation)</li>' +
      '<li>Useful supporting documents (changes in situation, new elements)</li>' +
      '</ul>' +
      '<p style="margin-top:0.5rem">Given the stakes and technicality, <strong>assistance from a lawyer specialised in immigration law, or from an association (La Cimade, GISTI, ASTI), is strongly recommended</strong>. The RAPO is your only round before the judicial phase; the argumentation must be carefully prepared.</p>',

    'faq.B3_success_rate.q': 'What is the success rate of a RAPO?',
    'faq.B3_success_rate.a':
      '<p>In the panel: <strong>{n_total}</strong> cases filed an observable RAPO. Status at analysis time:</p>' +
      '<ul style="margin:0.5rem 0 0.5rem 1.5rem;list-style:disc">' +
      '<li><strong>{n_active}</strong> are still being examined (no outcome known).</li>' +
      '<li><strong>{n_recovered}</strong> recovered a favourable decree (refusal overturned).</li>' +
      '<li><strong>{n_confirmed_neg}</strong> had the refusal confirmed.</li>' +
      '</ul>' +
      '<p style="margin-top:0.5rem">Among the <strong>{n_resolved}</strong> resolved RAPOs, the observed success rate is <strong>{success_pct}%</strong>. This is a very small sample — read it as an order of magnitude, not a precise estimate.</p>' +
      '<p style="margin-top:0.5rem;font-size:0.85rem;color:var(--text-dim)">Warning: many cases entered the panel <em>already</em> in RAPO (suggesting the base under-counts total RAPOs filed). The true rate may differ.</p>',

    'faq.B4_how_long.q': 'How long does a RAPO take?',
    'faq.B4_how_long.a':
      '<p>When the RAPO ends in confirmed refusal, the decision arrives in median <strong>{median_confirm_fmt}</strong>. For favourable cases, more variable: median <strong>{median_recovery_fmt}</strong> on a very small sample.</p>' +
      '<p style="margin-top:0.5rem"><strong>Legal deadline for the administration</strong>: 4 months from receipt of the RAPO. Beyond that, silence equals <strong>implicit rejection</strong> — you can seise the Administrative Court within the following 2 months.</p>' +
      '<p style="margin-top:0.5rem">Current state of active RAPOs in the panel ({n_active} cases): median age <strong>{active_median_fmt}</strong>, maximum <strong>{active_max_fmt}</strong>.</p>',

    'faq.B5_after_rapo_denied.q': 'My RAPO was rejected — what next?',
    'faq.B5_after_rapo_denied.a':
      '<p>If the RAPO is rejected (explicitly or by 4-month silence), the next path is an <strong>appeal for excess of power</strong> before the Administrative Court.</p>' +
      '<p style="margin-top:0.5rem"><strong>Deadline</strong>: 2 months from notification of the explicit rejection — or 2 months after the 4-month silent period expires.</p>' +
      '<p style="margin-top:0.5rem"><strong>Territorial jurisdiction</strong>: usually the TA of Nantes (national jurisdiction for SDANF decisions), but check the notification.</p>' +
      '<p style="margin-top:0.5rem"><strong>Recommendation</strong>: a lawyer specialised in immigration law / administrative litigation is here near-indispensable. The petition must articulate precise legal grounds (external legality, internal legality, manifest error of assessment, etc.). Legal aid (aide juridictionnelle) is potentially available subject to income conditions.</p>' +
      '<p style="margin-top:0.5rem">In parallel, a <strong>référé suspension</strong> (article L. 521-1 of the Code of Administrative Justice) is possible if urgency is established — rare in naturalisation cases but not impossible.</p>',

    'faq.C1_etape3_med.q': 'I received a "mise en demeure" at step 3 — is that a refusal?',
    'faq.C1_etape3_med.a':
      '<p><strong>No.</strong> The mise en demeure (status <code>verification_formelle_mise_en_demeure</code>) is an administrative request to complete your file, not a refusal.</p>' +
      '<p style="margin-top:0.5rem">In the panel, <strong>{n_med}</strong> cases received a mise en demeure at this step:</p>' +
      '<ul style="margin:0.5rem 0 0.5rem 1.5rem;list-style:disc">' +
      '<li><strong>{n_recovered}</strong> returned to a normal status after regularisation.</li>' +
      '<li><strong>{n_stuck}</strong> are still in mise en demeure (awaiting user response).</li>' +
      '<li><strong>{n_neg}</strong> ended in terminal refusal.</li>' +
      '<li><strong>{n_fav}</strong> reached a favourable decree.</li>' +
      '</ul>' +
      '<p style="margin-top:0.5rem">Practical conclusion: provide the requested documents within the deadline (usually 1 month) and your file resumes normal processing.</p>',

    'faq.C3_etape8_decision.q': 'I\'m at step 8 (Prefecture decision) — how long until I know?',
    'faq.C3_etape8_decision.a':
      '<p>It depends primarily on the <strong>time since your interview</strong> (not the "since-status" date shown by ANEF, which resets on each sub-status).</p>' +
      '<p style="margin-top:0.5rem">On {eb_n} panel cases with a captured interview date and an observed post-interview event:</p>' +
      '<table style="margin:0.5rem 0;border-collapse:collapse;font-size:0.85rem"><thead><tr>' +
      '<th style="text-align:left;padding:0.25rem 0.7rem;border-bottom:1px solid var(--border)">Time since interview</th>' +
      '<th style="text-align:right;padding:0.25rem 0.7rem;border-bottom:1px solid var(--border)">Refusal rate</th>' +
      '<th style="text-align:right;padding:0.25rem 0.7rem;border-bottom:1px solid var(--border)">Cohort</th>' +
      '</tr></thead><tbody>' +
      '<tr><td style="padding:0.2rem 0.7rem">0–3 months</td><td style="text-align:right;padding:0.2rem 0.7rem">{eb_0_3_pct}%</td><td style="text-align:right;padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_0_3_n}</td></tr>' +
      '<tr><td style="padding:0.2rem 0.7rem">3–6 months</td><td style="text-align:right;padding:0.2rem 0.7rem">{eb_3_6_pct}%</td><td style="text-align:right;padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_3_6_n}</td></tr>' +
      '<tr><td style="padding:0.2rem 0.7rem">6–12 months</td><td style="text-align:right;padding:0.2rem 0.7rem">{eb_6_12_pct}%</td><td style="text-align:right;padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_6_12_n}</td></tr>' +
      '<tr><td style="padding:0.2rem 0.7rem"><strong>12–24 months</strong></td><td style="text-align:right;padding:0.2rem 0.7rem;color:#ef4444"><strong>{eb_12_24_pct}%</strong></td><td style="text-align:right;padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_12_24_n}</td></tr>' +
      '</tbody></table>' +
      '<p style="margin-top:0.5rem">Most cases get a decision within 6 months post-interview. Beyond 12 months, refusal risk rises (weak but real signal — see A4 for the detailed reading).</p>' +
      '<p style="margin-top:0.5rem;font-size:0.8rem;color:var(--text-dim)">Methodology note: the "since status" counter shown by ANEF resets at each sub-status (PROP_DECISION_PREF_A_EFFECTUER, PROP_DECISION_PREF_PROP_A_EDITER, etc.). That\'s why we anchor on the interview date — it\'s the event that doesn\'t move.</p>',

    'faq.C4_etape9_sdanf.q': 'I\'m at step 9 (SDANF control) — how long does this last?',
    'faq.C4_etape9_sdanf.a':
      '<p>Step 9 is <strong>the longest in the journey</strong>. SDANF review (and depending on profile, SCEC in Nantes for civil status) takes time: median <strong>{median_fmt}</strong> before progressing to step 10 (n={n} observed transitions).</p>' +
      '<p style="margin-top:0.5rem">Patience needed. This is also the stage where supplementary checks (civil status, tax, judicial, security) are conducted.</p>',

    'faq.C5_etape10_decret_prep.q': 'I\'m at step 10 (Decree preparation) — am I definitively accepted?',
    'faq.C5_etape10_decret_prep.a':
      '<p><strong>Almost, but not quite.</strong> Progression to step 11 is typically fast: median <strong>{median_fmt}</strong> (n={n}).</p>' +
      '<p style="margin-top:0.5rem">However, <strong>{n_late} panel cases</strong> reached step 10 and were still refused afterward by the ministry (status <code>controle_demande_notifiee</code>). Rare but it happens — the minister can still block on security or public-order grounds up to decree signature.</p>' +
      '<p style="margin-top:0.5rem">The real "point of no return" is step 11 (insertion in decree), not step 10.</p>',

    'faq.C6_etape11_publication.q': 'I\'m at step 11 (decree insertion) — when will my decree be published in the JO?',
    'faq.C6_etape11_publication.a':
      '<p>Median <strong>{median_fmt}</strong> between insertion in the decree and final publication in the Journal Officiel (n={n} observed transitions).</p>' +
      '<p style="margin-top:0.5rem">At this stage your file is <strong>committed</strong> to the decree in preparation. Barring exceptional circumstances (new security information, material error), it\'s done. Just waiting for the next batch of decrees.</p>',

    'faq.D1_long_wait.q': 'My file is taking very long — is that a bad sign?',
    'faq.D1_long_wait.a':
      '<p><strong>No.</strong> Cycle times for accepted and refused cases are nearly identical:</p>' +
      '<ul style="margin:0.5rem 0 0.5rem 1.5rem;list-style:disc">' +
      '<li>Filing → favourable decree: median <strong>{fav_fmt}</strong> (n={n_fav})</li>' +
      '<li>Filing → definitive refusal: median <strong>{neg_fmt}</strong></li>' +
      '</ul>' +
      '<p style="margin-top:0.5rem">Wait length is not a predictor of outcome. The signal that matters is the <em>status</em>, not the duration.</p>',

    'faq.D2_complement.q': 'I was asked for additional documents — is that bad?',
    'faq.D2_complement.a':
      '<p><strong>No, it\'s the norm.</strong> <strong>{pct_with_compl}%</strong> of panel cases (<strong>{n_with_compl}</strong> cases) received a document request at some point. Outcomes among these cases mirror the general population.</p>' +
      '<p style="margin-top:0.5rem">Respond within the deadline, provide what\'s asked, and the file continues. It\'s an administrative checkpoint, not a negative signal.</p>',

    'faq.D3_pingpong.q': 'My file bounces between sub-statuses ("ping-pong") — is that bad?',
    'faq.D3_pingpong.a':
      '<p><strong>No.</strong> Ping-pong (re-entering the same status) is actually slightly more common among favourable cases:</p>' +
      '<ul style="margin:0.5rem 0 0.5rem 1.5rem;list-style:disc">' +
      '<li>Favourable cases: <strong>{fav_pct}%</strong> show ping-pong (n={fav_n})</li>' +
      '<li>Refused cases: <strong>{neg_pct}%</strong> show ping-pong (n={neg_n})</li>' +
      '</ul>' +
      '<p style="margin-top:0.5rem">It\'s just an effect of the internal review process. Don\'t panic.</p>',

    'faq.D4_backward.q': 'My file went back to an earlier step — what\'s happening?',
    'faq.D4_backward.a':
      '<p>In the panel, <strong>{n_backward}</strong> cases ({pct_backward}%) experienced at least one backward transition. It happens regularly.</p>' +
      '<p style="margin-top:0.5rem">Usual causes: SDANF requests supplementary investigation (return to step 9 from step 10/11), or a civil-status issue discovered late sends the file back to completeness. Not a negative signal in itself — see the "Backward transitions" section of the Délais page for the details.</p>'
  });

  // ═══════════════════════════════════════════════════════════ ES — short version
  // ES/AR/ZH at parity but slightly more compact; same keys.
  ANEF.i18n.register('es', {
    'faq.loading': 'Cargando respuestas...',
    'faq.no_data': 'No hay datos disponibles — respuestas no disponibles.',
    'faq.intro_title': 'Lo que realmente dicen los datos',
    'faq.intro_sub': 'Todas las respuestas se calculan en directo desde el panel comunitario (<span id="faq-dossier-count">—</span> expedientes anonimizados). Haz clic en una pregunta para ver la respuesta y los datos correspondientes.',
    'faq.cat_rejection': 'A. La denegación — cómo es realmente',
    'faq.cat_rejection_sub': 'Cifras brutas sobre los expedientes denegados: cuántos, cuándo, de qué forma y en qué prefectura.',
    'faq.cat_rapo': 'B. El RAPO — entender y presentar un recurso',
    'faq.cat_rapo_sub': 'Si recibes una denegación, el <strong>Recurso Administrativo Previo Obligatorio</strong> (RAPO) es el primer paso obligatorio antes de cualquier recurso judicial. Lo siguiente combina cifras observadas y elementos procedimentales.',
    'faq.cat_steps': 'C. «Estoy bloqueado en la etapa X» — qué significa realmente',
    'faq.cat_steps_sub': 'Para la definición de cada etapa, ver la <a href="guide.html" class="text-primary-light hover:underline">Guía</a>. Aquí miramos cuánto se quedan los demás y qué pasa después.',
    'faq.cat_worries': 'D. ¿Debo preocuparme?',
    'faq.cat_worries_sub': 'Señales que la gente toma por malas noticias — verificadas con datos.',
    'faq.method_title': 'Metodología y límites',
    'faq.method_body': 'Las cifras se recalculan en cada visita desde el panel comunitario (~6 300 expedientes). El panel no es exhaustivo y puede estar sesgado hacia los usuarios de la extensión. Las estimaciones basadas en muestras pequeñas (RAPO, denegaciones tardías) están marcadas como tales.',
    'faq.link_delais': 'Ver el análisis completo de plazos',
    'faq.link_mondossier': 'Ver mi expediente en detalle',
    'faq.link_prefs': 'Ver el ranking de prefecturas',
    'faq.link_guide': 'Ver la guía paso a paso',
    'faq.A1_how_many_rejected.q': '¿Cuántos expedientes son realmente denegados?',
    'faq.A1_how_many_rejected.a':
      '<p>Sobre <strong>{total}</strong> expedientes del panel: <strong style="color:#10b981">{n_fav} ({pct_fav_all}%)</strong> obtuvieron decreto, <strong style="color:#ef4444">{n_neg} ({pct_neg_all}%)</strong> fueron denegados definitivamente, <strong style="color:#f59e0b">{n_rapo} ({pct_rapo_all}%)</strong> están en RAPO. El resto sigue en curso.</p>' +
      '<p style="margin-top:0.5rem"><strong>Entre los expedientes decididos, {pct_neg_decided}% denegados, {pct_fav_decided}% aceptados</strong>. Lectura pesimista (RAPO=denegación): {pct_neg_pessimistic}%.</p>',
    'faq.A2_when_rejection.q': '¿En qué momento del recorrido ocurre la denegación?',
    'faq.A2_when_rejection.a':
      '<p>Casi nunca antes de la entrevista. Dos momentos dominantes:</p>' +
      '<ul style="margin:0.5rem 0 0.5rem 1.5rem;list-style:disc"><li><strong>Etapa 8 (Decisión prefectura)</strong>: {pct_from_et8}% de las denegaciones clásicas ({n_classic} expedientes) vienen directamente de esta etapa. Mediana desde depósito: {med_classic_fmt}.</li><li><strong>Etapa 10 (Preparación decreto)</strong>: {n_sdanf} expedientes denegados por el ministerio después que la prefectura había aprobado. Mediana: {med_sdanf_fmt}. Total denegaciones <strong>después de etapa 10</strong>: {n_late}.</li></ul>',
    'faq.A3_rejection_types.q': '¿Cuáles son los diferentes tipos de denegación?',
    'faq.A3_rejection_types.a':
      '<p>En el panel: <strong>decision_negative_en_delais_recours</strong> ({n_classic}) — denegación prefectura; <strong>controle_demande_notifiee</strong> ({n_sdanf}) — denegación SDANF/ministerio; <strong>css_notifie</strong> ({n_css}) — irregularidad de estado civil; <strong>decision_notifiee</strong> ({n_post_rapo}) — notificación tras RAPO.</p>',
    'faq.A4_long_wait_means_neg.q': '¿Un plazo largo significa que voy a ser denegado?',
    'faq.A4_long_wait_means_neg.a':
      '<p><strong>No el plazo total — pero una larga espera <em>después de la entrevista</em> puede ser una señal débil.</strong></p>' +
      '<p style="margin-top:0.5rem">En agregado, mediana depósito → decreto <strong>{fav_fmt}</strong> vs denegación <strong>{neg_fmt}</strong> (casi idénticos). Pero la denegación ocurre casi siempre <strong>después de la entrevista</strong>, con deriva creciente:</p>' +
      '<table style="margin:0.5rem 0;border-collapse:collapse;font-size:0.85rem"><thead><tr><th style="text-align:left;padding:0.25rem 0.7rem;border-bottom:1px solid var(--border)">Tiempo post-entrevista</th><th style="text-align:right;padding:0.25rem 0.7rem;border-bottom:1px solid var(--border)">Tasa denegación</th><th style="text-align:right;padding:0.25rem 0.7rem;border-bottom:1px solid var(--border)">n</th></tr></thead><tbody>' +
      '<tr><td style="padding:0.2rem 0.7rem">0–3 meses</td><td style="text-align:right;padding:0.2rem 0.7rem"><strong>{eb_0_3_pct}%</strong></td><td style="text-align:right;padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_0_3_n}</td></tr>' +
      '<tr><td style="padding:0.2rem 0.7rem">3–6 meses</td><td style="text-align:right;padding:0.2rem 0.7rem"><strong>{eb_3_6_pct}%</strong></td><td style="text-align:right;padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_3_6_n}</td></tr>' +
      '<tr><td style="padding:0.2rem 0.7rem">6–12 meses</td><td style="text-align:right;padding:0.2rem 0.7rem"><strong>{eb_6_12_pct}%</strong></td><td style="text-align:right;padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_6_12_n}</td></tr>' +
      '<tr><td style="padding:0.2rem 0.7rem"><strong>12–24 meses</strong></td><td style="text-align:right;padding:0.2rem 0.7rem;color:#ef4444"><strong>{eb_12_24_pct}%</strong></td><td style="text-align:right;padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_12_24_n}</td></tr>' +
      '</tbody></table>' +
      '<p style="margin-top:0.5rem">Más allá de 12 meses post-entrevista, el riesgo relativo aumenta pero sigue siendo minoritario. <strong>Señal débil</strong>. Cohorte: {eb_n} casos.</p>',
    'faq.A5_prefecture_matters.q': '¿Mi prefectura tiene una tasa de denegación particularmente alta?',
    'faq.A5_prefecture_matters.a':
      '<p>Entre las <strong>{n_pref}</strong> prefecturas con ≥20 decididos: más estricta <strong>{strictest}</strong> ({strictest_pct}%, n={strictest_n}). Más leniente <strong>{most_lenient}</strong> ({most_lenient_pct}%, n={most_lenient_n}). Diferencia ~5×.</p>',
    'faq.B1_what_is_rapo.q': '¿Qué es un RAPO y por qué es obligatorio?',
    'faq.B1_what_is_rapo.a':
      '<p>El <strong>Recurso Administrativo Previo Obligatorio</strong> es, como dice su nombre, <strong>obligatorio</strong> antes de cualquier recurso judicial para las decisiones de denegación en materia de nacionalización.</p>' +
      '<p style="margin-top:0.5rem"><strong>Base legal</strong>: artículo 27-1 del Código civil francés; decreto n° 93-1362 del 30/12/1993; artículo R. 421-1 del CJA.</p>',
    'faq.B2_how_to_file.q': '¿Cómo y dónde presentar un RAPO?',
    'faq.B2_how_to_file.a':
      '<p><strong>Plazo imperativo: 2 meses desde la notificación.</strong> Más allá, el recurso es inadmisible.</p>' +
      '<p style="margin-top:0.5rem"><strong>Destinatario</strong>: Ministro del Interior — SDANF (Subdirección acceso a la nacionalidad francesa). Dirección exacta en la notificación.</p>' +
      '<p style="margin-top:0.5rem"><strong>Formato</strong>: carta certificada con acuse de recibo (LRAR). El matasellos cuenta para el plazo de 2 meses.</p>' +
      '<p style="margin-top:0.5rem">La asistencia de un abogado o de una asociación (La Cimade, GISTI) es muy recomendable.</p>',
    'faq.B3_success_rate.q': '¿Cuál es la tasa de éxito de un RAPO?',
    'faq.B3_success_rate.a':
      '<p>En el panel: <strong>{n_total}</strong> RAPO observables. <strong>{n_active}</strong> activos, <strong>{n_recovered}</strong> recuperados a favorable, <strong>{n_confirmed_neg}</strong> denegación confirmada. Tasa de éxito sobre los {n_resolved} resueltos: <strong>{success_pct}%</strong>. Muestra pequeña.</p>',
    'faq.B4_how_long.q': '¿Cuánto tarda un RAPO?',
    'faq.B4_how_long.a':
      '<p>Confirmación de denegación: mediana <strong>{median_confirm_fmt}</strong>. Recuperación favorable: <strong>{median_recovery_fmt}</strong>. <strong>Plazo legal</strong>: 4 meses, después silencio = rechazo implícito.</p>' +
      '<p style="margin-top:0.5rem">RAPO activos en el panel ({n_active}): mediana <strong>{active_median_fmt}</strong>, máximo <strong>{active_max_fmt}</strong>.</p>',
    'faq.B5_after_rapo_denied.q': 'Mi RAPO fue denegado — ¿qué hacer después?',
    'faq.B5_after_rapo_denied.a':
      '<p>Siguiente vía: <strong>recurso por exceso de poder</strong> ante el Tribunal Administrativo. Plazo: 2 meses desde la notificación. Competencia: usualmente TA de Nantes. Abogado especializado prácticamente indispensable. La asistencia jurídica gratuita está disponible según ingresos.</p>',
    'faq.C1_etape3_med.q': 'Recibí una «mise en demeure» en la etapa 3 — ¿es una denegación?',
    'faq.C1_etape3_med.a':
      '<p><strong>No.</strong> Es una solicitud administrativa para completar tu expediente. En el panel, <strong>{n_med}</strong> expedientes recibieron MED: {n_recovered} volvieron a estado normal, {n_stuck} aún en MED, {n_neg} denegados, {n_fav} a decreto.</p>',
    'faq.C3_etape8_decision.q': 'Estoy en etapa 8 (Decisión prefectura) — ¿cuánto tiempo antes de saber?',
    'faq.C3_etape8_decision.a':
      '<p>Depende del <strong>tiempo desde tu entrevista</strong> (no del «desde el estado» de ANEF, que se reinicia con cada subestatus). Sobre {eb_n} casos con fecha de entrevista capturada:</p>' +
      '<table style="margin:0.5rem 0;border-collapse:collapse;font-size:0.85rem"><thead><tr><th style="text-align:left;padding:0.25rem 0.7rem;border-bottom:1px solid var(--border)">Tiempo desde entrevista</th><th style="text-align:right;padding:0.25rem 0.7rem;border-bottom:1px solid var(--border)">Tasa denegación</th><th style="text-align:right;padding:0.25rem 0.7rem;border-bottom:1px solid var(--border)">n</th></tr></thead><tbody>' +
      '<tr><td style="padding:0.2rem 0.7rem">0–3 meses</td><td style="text-align:right;padding:0.2rem 0.7rem">{eb_0_3_pct}%</td><td style="text-align:right;padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_0_3_n}</td></tr>' +
      '<tr><td style="padding:0.2rem 0.7rem">3–6 meses</td><td style="text-align:right;padding:0.2rem 0.7rem">{eb_3_6_pct}%</td><td style="text-align:right;padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_3_6_n}</td></tr>' +
      '<tr><td style="padding:0.2rem 0.7rem">6–12 meses</td><td style="text-align:right;padding:0.2rem 0.7rem">{eb_6_12_pct}%</td><td style="text-align:right;padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_6_12_n}</td></tr>' +
      '<tr><td style="padding:0.2rem 0.7rem"><strong>12–24 meses</strong></td><td style="text-align:right;padding:0.2rem 0.7rem;color:#ef4444"><strong>{eb_12_24_pct}%</strong></td><td style="text-align:right;padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_12_24_n}</td></tr>' +
      '</tbody></table>' +
      '<p style="margin-top:0.5rem">La mayoría reciben decisión en los 6 meses post-entrevista. Más allá de 12 meses, el riesgo sube (señal débil pero real — ver A4).</p>',
    'faq.C4_etape9_sdanf.q': 'Estoy en etapa 9 (Control SDANF) — ¿cuánto dura?',
    'faq.C4_etape9_sdanf.a':
      '<p>La etapa más larga del recorrido. Mediana <strong>{median_fmt}</strong> antes de progresar a etapa 10 (n={n}).</p>',
    'faq.C5_etape10_decret_prep.q': 'Estoy en etapa 10 (Preparación decreto) — ¿estoy definitivamente aceptado?',
    'faq.C5_etape10_decret_prep.a':
      '<p>Casi. Mediana <strong>{median_fmt}</strong> hacia etapa 11 (n={n}). Pero <strong>{n_late} expedientes</strong> alcanzaron etapa 10 y aún fueron denegados por el ministerio. El verdadero punto de no retorno es la etapa 11.</p>',
    'faq.C6_etape11_publication.q': 'Estoy en etapa 11 — ¿cuándo se publicará mi decreto?',
    'faq.C6_etape11_publication.a':
      '<p>Mediana <strong>{median_fmt}</strong> hasta la publicación en el JO (n={n}). Salvo casos excepcionales, está hecho.</p>',
    'faq.D1_long_wait.q': 'Mi expediente tarda mucho — ¿es mala señal?',
    'faq.D1_long_wait.a':
      '<p><strong>No.</strong> Mediana favorable <strong>{fav_fmt}</strong> (n={n_fav}) vs denegación <strong>{neg_fmt}</strong>. Casi idéntico. El plazo no predice el resultado.</p>',
    'faq.D2_complement.q': 'Me pidieron documentos complementarios — ¿es malo?',
    'faq.D2_complement.a':
      '<p><strong>No, es la norma.</strong> <strong>{pct_with_compl}%</strong> de los expedientes del panel ({n_with_compl}) recibieron una solicitud de complemento. Resultados similares a la población general.</p>',
    'faq.D3_pingpong.q': 'Mi expediente rebota entre subestatus — ¿es malo?',
    'faq.D3_pingpong.a':
      '<p><strong>No.</strong> Expedientes favorables: <strong>{fav_pct}%</strong> de ping-pong. Denegados: <strong>{neg_pct}%</strong>. Es ligeramente más frecuente en los favorables.</p>',
    'faq.D4_backward.q': 'Mi expediente volvió a una etapa anterior — ¿qué pasa?',
    'faq.D4_backward.a':
      '<p>En el panel, <strong>{n_backward}</strong> expedientes ({pct_backward}%) experimentaron al menos un retroceso. Causa habitual: SDANF pide investigación complementaria. No es señal negativa en sí.</p>'
  });

  // ═══════════════════════════════════════════════════════════ AR
  ANEF.i18n.register('ar', {
    'faq.loading': 'جارٍ تحميل الأجوبة...',
    'faq.no_data': 'لا توجد بيانات متاحة — الأجوبة غير متاحة.',
    'faq.intro_title': 'ما تقوله البيانات حقًا',
    'faq.intro_sub': 'تُحسب جميع الأجوبة أدناه مباشرة من اللوحة المجتمعية (<span id="faq-dossier-count">—</span> ملفًا مجهول الهوية). انقر على سؤال لرؤية الإجابة والأرقام المقابلة.',
    'faq.cat_rejection': 'أ. الرفض — كيف يبدو فعلًا',
    'faq.cat_rejection_sub': 'الأرقام الخام عن الملفات المرفوضة: كم عددها، متى، بأي شكل، ومع أي محافظة.',
    'faq.cat_rapo': 'ب. RAPO — فهم وتقديم الطعن الإداري',
    'faq.cat_rapo_sub': 'إذا تلقيت رفضًا، فإن <strong>الطعن الإداري المسبق الإلزامي</strong> (RAPO) هو الخطوة الأولى الإلزامية قبل أي طعن قضائي.',
    'faq.cat_steps': 'ج. «أنا عالق في المرحلة X» — ماذا يعني ذلك حقًا',
    'faq.cat_steps_sub': 'لتعريف كل مرحلة، انظر <a href="guide.html" class="text-primary-light hover:underline">الدليل</a>. هنا نرى كم يبقى الآخرون وما يحدث بعد ذلك.',
    'faq.cat_worries': 'د. هل يجب أن أقلق؟',
    'faq.cat_worries_sub': 'الإشارات التي يأخذها الناس على أنها أخبار سيئة — مدعومة بالبيانات.',
    'faq.method_title': 'المنهجية والحدود',
    'faq.method_body': 'تُعاد حساب الأرقام في كل زيارة من اللوحة المجتمعية (~6 300 ملف). اللوحة ليست شاملة وقد تكون متحيزة لصالح مستخدمي الإضافة.',
    'faq.link_delais': 'عرض التحليل الكامل للمهل',
    'faq.link_mondossier': 'عرض ملفي بالتفصيل',
    'faq.link_prefs': 'عرض ترتيب المحافظات',
    'faq.link_guide': 'عرض دليل المراحل',
    'faq.A1_how_many_rejected.q': 'كم عدد الملفات المرفوضة فعلًا؟',
    'faq.A1_how_many_rejected.a':
      '<p>من بين <strong>{total}</strong> ملف: <strong style="color:#10b981">{n_fav} ({pct_fav_all}%)</strong> حصلوا على مرسوم، <strong style="color:#ef4444">{n_neg} ({pct_neg_all}%)</strong> رُفضوا نهائيًا، <strong style="color:#f59e0b">{n_rapo} ({pct_rapo_all}%)</strong> في RAPO نشط.</p>' +
      '<p style="margin-top:0.5rem">بين الملفات المحسومة: <strong>{pct_neg_decided}% رفض، {pct_fav_decided}% قبول</strong>. القراءة المتشائمة: {pct_neg_pessimistic}%.</p>',
    'faq.A2_when_rejection.q': 'في أي لحظة من المسار يحدث الرفض؟',
    'faq.A2_when_rejection.a':
      '<p>نادرًا قبل المقابلة. لحظتان مهيمنتان: <strong>المرحلة 8 (قرار المحافظة)</strong>: {pct_from_et8}% من حالات الرفض الكلاسيكية ({n_classic} ملف)، الوسيط {med_classic_fmt}. <strong>المرحلة 10 (تحضير المرسوم)</strong>: {n_sdanf} ملف رُفضوا متأخرًا، الوسيط {med_sdanf_fmt}. مجموع الرفض <strong>بعد المرحلة 10</strong>: {n_late}.</p>',
    'faq.A3_rejection_types.q': 'ما الأنواع المختلفة للرفض؟',
    'faq.A3_rejection_types.a':
      '<p>في اللوحة: <strong>decision_negative_en_delais_recours</strong> ({n_classic}) — رفض المحافظة؛ <strong>controle_demande_notifiee</strong> ({n_sdanf}) — رفض الوزارة؛ <strong>css_notifie</strong> ({n_css}) — مخالفة الحالة المدنية؛ <strong>decision_notifiee</strong> ({n_post_rapo}) — إشعار بعد RAPO.</p>',
    'faq.A4_long_wait_means_neg.q': 'هل المهلة الطويلة تعني أنني سأُرفض؟',
    'faq.A4_long_wait_means_neg.a':
      '<p><strong>ليس المهلة الإجمالية — لكن الانتظار الطويل <em>بعد المقابلة</em> قد يكون إشارة ضعيفة.</strong></p>' +
      '<p style="margin-top:0.5rem">إجمالاً، الوسيط حتى المرسوم الإيجابي <strong>{fav_fmt}</strong> مقابل الرفض <strong>{neg_fmt}</strong> (متطابقان تقريبًا). لكن الرفض يحدث دائمًا تقريبًا <strong>بعد المقابلة</strong>، مع ارتفاع تدريجي:</p>' +
      '<table style="margin:0.5rem 0;border-collapse:collapse;font-size:0.85rem"><thead><tr><th style="text-align:right;padding:0.25rem 0.7rem;border-bottom:1px solid var(--border)">الوقت بعد المقابلة</th><th style="text-align:left;padding:0.25rem 0.7rem;border-bottom:1px solid var(--border)">نسبة الرفض</th><th style="text-align:left;padding:0.25rem 0.7rem;border-bottom:1px solid var(--border)">n</th></tr></thead><tbody>' +
      '<tr><td style="padding:0.2rem 0.7rem">0–3 أشهر</td><td style="padding:0.2rem 0.7rem"><strong>{eb_0_3_pct}%</strong></td><td style="padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_0_3_n}</td></tr>' +
      '<tr><td style="padding:0.2rem 0.7rem">3–6 أشهر</td><td style="padding:0.2rem 0.7rem"><strong>{eb_3_6_pct}%</strong></td><td style="padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_3_6_n}</td></tr>' +
      '<tr><td style="padding:0.2rem 0.7rem">6–12 أشهر</td><td style="padding:0.2rem 0.7rem"><strong>{eb_6_12_pct}%</strong></td><td style="padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_6_12_n}</td></tr>' +
      '<tr><td style="padding:0.2rem 0.7rem"><strong>12–24 شهرًا</strong></td><td style="padding:0.2rem 0.7rem;color:#ef4444"><strong>{eb_12_24_pct}%</strong></td><td style="padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_12_24_n}</td></tr>' +
      '</tbody></table>' +
      '<p style="margin-top:0.5rem">بعد 12 شهرًا من المقابلة، يرتفع الخطر النسبي لكنه يبقى أقلية. <strong>إشارة ضعيفة</strong>. الفوج: {eb_n} ملف.</p>',
    'faq.A5_prefecture_matters.q': 'هل محافظتي لديها نسبة رفض مرتفعة بشكل خاص؟',
    'faq.A5_prefecture_matters.a':
      '<p>بين <strong>{n_pref}</strong> محافظة بـ ≥20 قرار: الأكثر صرامة <strong>{strictest}</strong> ({strictest_pct}%، n={strictest_n}). الأقل صرامة <strong>{most_lenient}</strong> ({most_lenient_pct}%، n={most_lenient_n}). الفرق ~5×.</p>',
    'faq.B1_what_is_rapo.q': 'ما هو RAPO ولماذا هو إلزامي؟',
    'faq.B1_what_is_rapo.a':
      '<p>الطعن الإداري المسبق الإلزامي إلزامي قبل أي طعن قضائي لقرارات رفض التجنيس.</p>' +
      '<p style="margin-top:0.5rem"><strong>الأساس القانوني</strong>: المادة 27-1 من القانون المدني الفرنسي؛ المرسوم رقم 93-1362 الصادر في 30/12/1993؛ المادة R.421-1 من قانون العدالة الإدارية.</p>',
    'faq.B2_how_to_file.q': 'كيف وأين يتم تقديم RAPO؟',
    'faq.B2_how_to_file.a':
      '<p><strong>المهلة الحاسمة: شهران من تاريخ الإشعار.</strong> بعد ذلك، الطعن غير مقبول.</p>' +
      '<p style="margin-top:0.5rem"><strong>المرسل إليه</strong>: وزير الداخلية — SDANF. العنوان الدقيق على إشعار الرفض.</p>' +
      '<p style="margin-top:0.5rem"><strong>الشكل</strong>: رسالة مسجلة مع إشعار بالاستلام (LRAR). يُنصح بشدة بالاستعانة بمحامٍ متخصص أو جمعية (La Cimade, GISTI).</p>',
    'faq.B3_success_rate.q': 'ما معدل نجاح RAPO؟',
    'faq.B3_success_rate.a':
      '<p>في اللوحة: <strong>{n_total}</strong> RAPO مُلاحظ. <strong>{n_active}</strong> نشط، <strong>{n_recovered}</strong> تعافى إلى إيجابي، <strong>{n_confirmed_neg}</strong> رفض مؤكد. معدل النجاح على {n_resolved} المحسومة: <strong>{success_pct}%</strong>. عينة صغيرة.</p>',
    'faq.B4_how_long.q': 'كم يستغرق RAPO؟',
    'faq.B4_how_long.a':
      '<p>تأكيد الرفض: الوسيط <strong>{median_confirm_fmt}</strong>. التعافي الإيجابي: <strong>{median_recovery_fmt}</strong>. <strong>المهلة القانونية</strong>: 4 أشهر، بعد ذلك الصمت = رفض ضمني.</p>' +
      '<p style="margin-top:0.5rem">RAPO النشطة في اللوحة ({n_active}): الوسيط <strong>{active_median_fmt}</strong>، الحد الأقصى <strong>{active_max_fmt}</strong>.</p>',
    'faq.B5_after_rapo_denied.q': 'رُفض RAPO الخاص بي — ماذا أفعل بعد ذلك؟',
    'faq.B5_after_rapo_denied.a':
      '<p>المسار التالي: <strong>طعن في تجاوز السلطة</strong> أمام المحكمة الإدارية. المهلة: شهران. الاختصاص: عادةً TA دي نانت. محامٍ متخصص ضروري عمليًا. المساعدة القضائية متاحة حسب الدخل.</p>',
    'faq.C1_etape3_med.q': 'تلقيت «mise en demeure» في المرحلة 3 — هل هي رفض؟',
    'faq.C1_etape3_med.a':
      '<p><strong>لا.</strong> إنها طلب إداري لإكمال ملفك. في اللوحة، <strong>{n_med}</strong> ملف تلقى MED: {n_recovered} عادوا إلى وضع طبيعي، {n_stuck} لا يزالون في MED، {n_neg} رُفضوا، {n_fav} حصلوا على مرسوم.</p>',
    'faq.C3_etape8_decision.q': 'أنا في المرحلة 8 (قرار المحافظة) — كم من الوقت قبل المعرفة؟',
    'faq.C3_etape8_decision.a':
      '<p>الأمر يعتمد على <strong>الوقت منذ المقابلة</strong> (وليس عداد ANEF «منذ الحالة» الذي يُعاد ضبطه مع كل حالة فرعية). على {eb_n} ملف بتاريخ مقابلة مُلتقَط:</p>' +
      '<table style="margin:0.5rem 0;border-collapse:collapse;font-size:0.85rem"><thead><tr><th style="text-align:right;padding:0.25rem 0.7rem;border-bottom:1px solid var(--border)">الوقت منذ المقابلة</th><th style="padding:0.25rem 0.7rem;border-bottom:1px solid var(--border)">نسبة الرفض</th><th style="padding:0.25rem 0.7rem;border-bottom:1px solid var(--border)">n</th></tr></thead><tbody>' +
      '<tr><td style="padding:0.2rem 0.7rem">0–3 أشهر</td><td style="padding:0.2rem 0.7rem">{eb_0_3_pct}%</td><td style="padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_0_3_n}</td></tr>' +
      '<tr><td style="padding:0.2rem 0.7rem">3–6 أشهر</td><td style="padding:0.2rem 0.7rem">{eb_3_6_pct}%</td><td style="padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_3_6_n}</td></tr>' +
      '<tr><td style="padding:0.2rem 0.7rem">6–12 أشهر</td><td style="padding:0.2rem 0.7rem">{eb_6_12_pct}%</td><td style="padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_6_12_n}</td></tr>' +
      '<tr><td style="padding:0.2rem 0.7rem"><strong>12–24 شهرًا</strong></td><td style="padding:0.2rem 0.7rem;color:#ef4444"><strong>{eb_12_24_pct}%</strong></td><td style="padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_12_24_n}</td></tr>' +
      '</tbody></table>' +
      '<p style="margin-top:0.5rem">معظم الملفات تتلقى قرارًا خلال 6 أشهر من المقابلة. بعد 12 شهرًا، يرتفع خطر الرفض (إشارة ضعيفة لكنها حقيقية — انظر A4).</p>',
    'faq.C4_etape9_sdanf.q': 'أنا في المرحلة 9 (التحكم SDANF) — كم تدوم؟',
    'faq.C4_etape9_sdanf.a':
      '<p>أطول مرحلة في المسار. الوسيط <strong>{median_fmt}</strong> قبل التقدم إلى المرحلة 10 (n={n}).</p>',
    'faq.C5_etape10_decret_prep.q': 'أنا في المرحلة 10 (تحضير المرسوم) — هل أنا مقبول نهائيًا؟',
    'faq.C5_etape10_decret_prep.a':
      '<p>تقريبًا. الوسيط <strong>{median_fmt}</strong> نحو المرحلة 11 (n={n}). لكن <strong>{n_late} ملف</strong> وصلوا المرحلة 10 ورُفضوا من الوزارة. نقطة اللاعودة الفعلية هي المرحلة 11.</p>',
    'faq.C6_etape11_publication.q': 'أنا في المرحلة 11 — متى ستُنشر المرسوم؟',
    'faq.C6_etape11_publication.a':
      '<p>الوسيط <strong>{median_fmt}</strong> حتى النشر في الجريدة الرسمية (n={n}). باستثناء حالات استثنائية، الأمر منتهٍ.</p>',
    'faq.D1_long_wait.q': 'ملفي يستغرق وقتًا طويلاً — هل هذه إشارة سيئة؟',
    'faq.D1_long_wait.a':
      '<p><strong>لا.</strong> الوسيط الإيجابي <strong>{fav_fmt}</strong> (n={n_fav}) مقابل الرفض <strong>{neg_fmt}</strong>. متطابقان تقريبًا.</p>',
    'faq.D2_complement.q': 'طُلب مني مستندات إضافية — هل هذا سيء؟',
    'faq.D2_complement.a':
      '<p><strong>لا، إنها القاعدة.</strong> <strong>{pct_with_compl}%</strong> من الملفات ({n_with_compl}) تلقت طلب مستندات إضافية. النتائج مماثلة للسكان العامين.</p>',
    'faq.D3_pingpong.q': 'ملفي يتنقل بين الحالات الفرعية — هل هذا سيء؟',
    'faq.D3_pingpong.a':
      '<p><strong>لا.</strong> الإيجابيون: <strong>{fav_pct}%</strong>. المرفوضون: <strong>{neg_pct}%</strong>. أكثر شيوعًا قليلاً في الإيجابيين.</p>',
    'faq.D4_backward.q': 'عاد ملفي إلى مرحلة سابقة — ماذا يحدث؟',
    'faq.D4_backward.a':
      '<p>في اللوحة، <strong>{n_backward}</strong> ملف ({pct_backward}%) شهدوا تراجعًا واحدًا على الأقل. السبب المعتاد: SDANF تطلب تحقيقات إضافية. ليست إشارة سلبية.</p>'
  });

  // ═══════════════════════════════════════════════════════════ ZH
  ANEF.i18n.register('zh', {
    'faq.loading': '正在加载答案...',
    'faq.no_data': '无可用数据 — 答案不可用。',
    'faq.intro_title': '数据真正告诉我们什么',
    'faq.intro_sub': '以下所有答案都基于社区面板实时计算（<span id="faq-dossier-count">—</span> 件匿名案卷）。点击问题查看答案及对应数据。',
    'faq.cat_rejection': 'A. 拒绝 — 实际情况',
    'faq.cat_rejection_sub': '关于被拒案卷的原始数据：多少，何时，以何种形式，在哪个省。',
    'faq.cat_rapo': 'B. RAPO — 理解并提交行政复议',
    'faq.cat_rapo_sub': '如果你收到拒绝，<strong>强制行政前置复议</strong>（RAPO）是任何司法诉讼之前的第一步必经程序。',
    'faq.cat_steps': 'C. 「我卡在阶段 X」— 这到底意味着什么',
    'faq.cat_steps_sub': '关于每个阶段的定义，参见<a href="guide.html" class="text-primary-light hover:underline">指南</a>。这里我们看其他人停留多久及后续发生什么。',
    'faq.cat_worries': 'D. 我该担心吗？',
    'faq.cat_worries_sub': '人们当作坏消息的信号 — 用数据核实。',
    'faq.method_title': '方法论与局限',
    'faq.method_body': '数据每次访问都从社区面板（~6,300 案卷）重新计算。面板不完整，可能偏向扩展用户。',
    'faq.link_delais': '查看完整时长分析',
    'faq.link_mondossier': '查看我的案卷详情',
    'faq.link_prefs': '查看省份排名',
    'faq.link_guide': '查看分步指南',
    'faq.A1_how_many_rejected.q': '实际有多少案卷被拒？',
    'faq.A1_how_many_rejected.a':
      '<p>面板中 <strong>{total}</strong> 件案卷：<strong style="color:#10b981">{n_fav}（{pct_fav_all}%）</strong>获得法令，<strong style="color:#ef4444">{n_neg}（{pct_neg_all}%）</strong>最终被拒，<strong style="color:#f59e0b">{n_rapo}（{pct_rapo_all}%）</strong>处于活跃 RAPO。</p>' +
      '<p style="margin-top:0.5rem">已决案卷中：<strong>{pct_neg_decided}% 被拒，{pct_fav_decided}% 通过</strong>。悲观读法：{pct_neg_pessimistic}%。</p>',
    'faq.A2_when_rejection.q': '在过程中的什么时候会发生拒绝？',
    'faq.A2_when_rejection.a':
      '<p>几乎从不在面谈之前。两个主导时刻：<strong>阶段 8（省决定）</strong>：经典拒绝的 {pct_from_et8}%（{n_classic} 件）直接来自此阶段，中位 {med_classic_fmt}。<strong>阶段 10（法令准备）</strong>：{n_sdanf} 件案卷被部级延迟拒绝，中位 {med_sdanf_fmt}。<strong>阶段 10 之后</strong>的总拒绝：{n_late}。</p>',
    'faq.A3_rejection_types.q': '有哪些不同类型的拒绝？',
    'faq.A3_rejection_types.a':
      '<p>面板中：<strong>decision_negative_en_delais_recours</strong>（{n_classic}）— 省拒绝；<strong>controle_demande_notifiee</strong>（{n_sdanf}）— 部级拒绝；<strong>css_notifie</strong>（{n_css}）— 民事身份不合规；<strong>decision_notifiee</strong>（{n_post_rapo}）— RAPO 后通知。</p>',
    'faq.A4_long_wait_means_neg.q': '长时间等待意味着我会被拒绝吗？',
    'faq.A4_long_wait_means_neg.a':
      '<p><strong>不是总等待 — 但<em>面谈后</em>的长时间等待可能是一个弱信号。</strong></p>' +
      '<p style="margin-top:0.5rem">总体而言，提交→正面法令的中位 <strong>{fav_fmt}</strong> 与拒绝 <strong>{neg_fmt}</strong> 几乎相同。但拒绝几乎总是在<strong>面谈后</strong>发生，且随时间递增：</p>' +
      '<table style="margin:0.5rem 0;border-collapse:collapse;font-size:0.85rem"><thead><tr><th style="text-align:left;padding:0.25rem 0.7rem;border-bottom:1px solid var(--border)">面谈后时间</th><th style="text-align:right;padding:0.25rem 0.7rem;border-bottom:1px solid var(--border)">拒绝率</th><th style="text-align:right;padding:0.25rem 0.7rem;border-bottom:1px solid var(--border)">n</th></tr></thead><tbody>' +
      '<tr><td style="padding:0.2rem 0.7rem">0–3 个月</td><td style="text-align:right;padding:0.2rem 0.7rem"><strong>{eb_0_3_pct}%</strong></td><td style="text-align:right;padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_0_3_n}</td></tr>' +
      '<tr><td style="padding:0.2rem 0.7rem">3–6 个月</td><td style="text-align:right;padding:0.2rem 0.7rem"><strong>{eb_3_6_pct}%</strong></td><td style="text-align:right;padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_3_6_n}</td></tr>' +
      '<tr><td style="padding:0.2rem 0.7rem">6–12 个月</td><td style="text-align:right;padding:0.2rem 0.7rem"><strong>{eb_6_12_pct}%</strong></td><td style="text-align:right;padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_6_12_n}</td></tr>' +
      '<tr><td style="padding:0.2rem 0.7rem"><strong>12–24 个月</strong></td><td style="text-align:right;padding:0.2rem 0.7rem;color:#ef4444"><strong>{eb_12_24_pct}%</strong></td><td style="text-align:right;padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_12_24_n}</td></tr>' +
      '</tbody></table>' +
      '<p style="margin-top:0.5rem">面谈后超过 12 个月，相对风险上升但仍为少数。<strong>弱信号</strong>。队列：{eb_n} 件案卷。</p>',
    'faq.A5_prefecture_matters.q': '我的省份拒绝率特别高吗？',
    'faq.A5_prefecture_matters.a':
      '<p>在 <strong>{n_pref}</strong> 个有 ≥20 件已决案卷的省份中：最严格 <strong>{strictest}</strong>（{strictest_pct}%，n={strictest_n}）。最宽松 <strong>{most_lenient}</strong>（{most_lenient_pct}%，n={most_lenient_n}）。差距约 5 倍。</p>',
    'faq.B1_what_is_rapo.q': 'RAPO 是什么？为什么是强制的？',
    'faq.B1_what_is_rapo.a':
      '<p>强制行政前置复议在任何针对入籍拒绝决定的司法诉讼之前都是<strong>强制性的</strong>。</p>' +
      '<p style="margin-top:0.5rem"><strong>法律依据</strong>：法国民法典第 27-1 条；1993 年 12 月 30 日第 93-1362 号法令；行政司法法典第 R.421-1 条。</p>',
    'faq.B2_how_to_file.q': '如何及在哪里提交 RAPO？',
    'faq.B2_how_to_file.a':
      '<p><strong>严格期限：自通知之日起 2 个月。</strong>超出后，复议不予受理。</p>' +
      '<p style="margin-top:0.5rem"><strong>收件人</strong>：内政部 — SDANF。精确地址在拒绝通知上。</p>' +
      '<p style="margin-top:0.5rem"><strong>形式</strong>：挂号信带回执（LRAR）。强烈建议寻求专门律师或协会（La Cimade、GISTI）的协助。</p>',
    'faq.B3_success_rate.q': 'RAPO 的成功率是多少？',
    'faq.B3_success_rate.a':
      '<p>面板中：<strong>{n_total}</strong> 件可观察 RAPO。<strong>{n_active}</strong> 件活跃，<strong>{n_recovered}</strong> 件恢复为正面，<strong>{n_confirmed_neg}</strong> 件拒绝确认。{n_resolved} 件已解决中成功率：<strong>{success_pct}%</strong>。样本小。</p>',
    'faq.B4_how_long.q': 'RAPO 需要多长时间？',
    'faq.B4_how_long.a':
      '<p>拒绝确认：中位 <strong>{median_confirm_fmt}</strong>。正面恢复：<strong>{median_recovery_fmt}</strong>。<strong>法定期限</strong>：4 个月，之后沉默 = 默示拒绝。</p>' +
      '<p style="margin-top:0.5rem">面板中活跃 RAPO（{n_active}）：中位 <strong>{active_median_fmt}</strong>，最大 <strong>{active_max_fmt}</strong>。</p>',
    'faq.B5_after_rapo_denied.q': '我的 RAPO 被拒 — 接下来该怎么办？',
    'faq.B5_after_rapo_denied.a':
      '<p>下一步：向行政法院提起<strong>越权诉讼</strong>。期限：2 个月。管辖：通常是南特行政法院。专门律师几乎必不可少。可根据收入申请法律援助。</p>',
    'faq.C1_etape3_med.q': '我在阶段 3 收到「mise en demeure」— 是拒绝吗？',
    'faq.C1_etape3_med.a':
      '<p><strong>不。</strong>这是要求你完善文件的行政请求。面板中 <strong>{n_med}</strong> 件案卷收到 MED：{n_recovered} 件恢复正常，{n_stuck} 件仍在 MED，{n_neg} 件被拒，{n_fav} 件获法令。</p>',
    'faq.C3_etape8_decision.q': '我在阶段 8（省决定）— 多久知道结果？',
    'faq.C3_etape8_decision.a':
      '<p>取决于<strong>面谈后的时间</strong>（不是 ANEF 的「自状态」计数器，它会在每个子状态重置）。基于 {eb_n} 件捕获了面谈日期的案卷：</p>' +
      '<table style="margin:0.5rem 0;border-collapse:collapse;font-size:0.85rem"><thead><tr><th style="text-align:left;padding:0.25rem 0.7rem;border-bottom:1px solid var(--border)">面谈后时间</th><th style="text-align:right;padding:0.25rem 0.7rem;border-bottom:1px solid var(--border)">拒绝率</th><th style="text-align:right;padding:0.25rem 0.7rem;border-bottom:1px solid var(--border)">n</th></tr></thead><tbody>' +
      '<tr><td style="padding:0.2rem 0.7rem">0–3 个月</td><td style="text-align:right;padding:0.2rem 0.7rem">{eb_0_3_pct}%</td><td style="text-align:right;padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_0_3_n}</td></tr>' +
      '<tr><td style="padding:0.2rem 0.7rem">3–6 个月</td><td style="text-align:right;padding:0.2rem 0.7rem">{eb_3_6_pct}%</td><td style="text-align:right;padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_3_6_n}</td></tr>' +
      '<tr><td style="padding:0.2rem 0.7rem">6–12 个月</td><td style="text-align:right;padding:0.2rem 0.7rem">{eb_6_12_pct}%</td><td style="text-align:right;padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_6_12_n}</td></tr>' +
      '<tr><td style="padding:0.2rem 0.7rem"><strong>12–24 个月</strong></td><td style="text-align:right;padding:0.2rem 0.7rem;color:#ef4444"><strong>{eb_12_24_pct}%</strong></td><td style="text-align:right;padding:0.2rem 0.7rem;color:var(--text-dim)">{eb_12_24_n}</td></tr>' +
      '</tbody></table>' +
      '<p style="margin-top:0.5rem">大多数案卷在面谈后 6 个月内得到决定。超过 12 个月，拒绝风险上升（弱信号但真实 — 见 A4）。</p>',
    'faq.C4_etape9_sdanf.q': '我在阶段 9（SDANF 控制）— 持续多久？',
    'faq.C4_etape9_sdanf.a':
      '<p>过程中最长的阶段。中位 <strong>{median_fmt}</strong> 至前进到阶段 10（n={n}）。</p>',
    'faq.C5_etape10_decret_prep.q': '我在阶段 10（法令准备）— 已确定通过吗？',
    'faq.C5_etape10_decret_prep.a':
      '<p>几乎。中位 <strong>{median_fmt}</strong> 至阶段 11（n={n}）。但 <strong>{n_late} 件</strong>到达阶段 10 仍被部级拒绝。真正的不归路是阶段 11。</p>',
    'faq.C6_etape11_publication.q': '我在阶段 11 — 我的法令何时发布？',
    'faq.C6_etape11_publication.a':
      '<p>中位 <strong>{median_fmt}</strong> 至在 JO 发布（n={n}）。除非特殊情况，已经完成。</p>',
    'faq.D1_long_wait.q': '我的案卷耗时很长 — 是坏兆头吗？',
    'faq.D1_long_wait.a':
      '<p><strong>不。</strong>正面中位 <strong>{fav_fmt}</strong>（n={n_fav}）对拒绝 <strong>{neg_fmt}</strong>。几乎相同。</p>',
    'faq.D2_complement.q': '我被要求补充材料 — 这不好吗？',
    'faq.D2_complement.a':
      '<p><strong>不，这很正常。</strong>面板中 <strong>{pct_with_compl}%</strong> 的案卷（{n_with_compl}）收到过补充要求。结果与总体相似。</p>',
    'faq.D3_pingpong.q': '我的案卷在子状态间反复 — 不好吗？',
    'faq.D3_pingpong.a':
      '<p><strong>不。</strong>正面：<strong>{fav_pct}%</strong>。拒绝：<strong>{neg_pct}%</strong>。在正面案卷中略多。</p>',
    'faq.D4_backward.q': '我的案卷回到了更早阶段 — 发生了什么？',
    'faq.D4_backward.a':
      '<p>面板中 <strong>{n_backward}</strong> 件案卷（{pct_backward}%）至少经历一次倒退。常见原因：SDANF 要求补充调查。本身不是负面信号。</p>'
  });
})();
