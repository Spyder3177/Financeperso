# Finance Perso

Application de gestion des finances personnelles — PWA installable sur iPhone et Android.

---

## Version actuelle : 1.5.0 (04/05/2026)

---

## Installation et lancement

### Prérequis
- Node.js 18+
- npm

### Développement
```bash
npm install
npm run dev
```

### Production
```bash
npm run build
npm run preview
```

### Installer sur iPhone (Safari uniquement)
1. Ouvrez l'URL de l'application dans **Safari**
2. Appuyez sur l'icône **Partager** (carré avec une flèche vers le haut)
3. Faites défiler et sélectionnez **"Sur l'écran d'accueil"**
4. Appuyez sur **"Ajouter"**

> ⚠️ Chrome iOS ne supporte pas l'installation PWA. Utilisez Safari.

---

## Historique des versions

### Version 1.5.0 — 04/05/2026 — Export, épargne, prévisions, statistiques, alertes, catégories custom

**Export CSV (`Historique`)**
- Bouton "Export" pour télécharger les transactions du mois sélectionné au format CSV (UTF-8 avec BOM, compatible Excel et Numbers)

**Objectifs d'épargne (`Budget → Épargne`)**
- Créez des objectifs avec nom, emoji, montant cible, montant déjà épargné et échéance optionnelle
- Jauge de progression colorée (bleue / amber / verte selon l'avancement)
- Alerte sur l'échéance (rouge / amber selon le délai restant)
- Récapitulatif global si plusieurs objectifs

**Prévisions de fin de mois (`Accueil`)**
- Carte affichant les dépenses projetées basées sur la moyenne journalière du mois en cours
- Delta coloré vs le mois précédent (rouge si tendance à la hausse, vert sinon)
- Nombre de jours restants et montant déjà dépensé

**Statistiques avancées (`Graphiques → Statistiques`)**
- Moyennes mensuelles revenus / dépenses / bilan net (sur toute la période)
- Ce mois vs moyenne des 3 mois précédents avec écart en pourcentage
- Meilleur mois (bilan le plus élevé) et mois le plus chargé
- Dépense moyenne par catégorie avec barres proportionnelles colorées

**Notifications budget (`Accueil` + `Budget`)**
- Bannière amber quand une catégorie atteint ≥ 80 % de son enveloppe
- Bannière rouge en cas de dépassement, avec le montant excédentaire
- Badge numérique rouge sur l'onglet Budget dans la barre de navigation

**Catégories personnalisables (`Budget → Catégories`)**
- Ajoutez des catégories de dépenses custom avec un nom et un emoji (picker intégré)
- Supprimez vos catégories personnalisées à tout moment
- Les catégories custom apparaissent partout : formulaire d'ajout, édition inline, budgets, graphiques

---

### Version 1.4.0 — 04/05/2026 — Édition, comptes séparés, catégories par transaction

**Édition inline des transactions (`Historique`)**
- Icône crayon sur chaque ligne pour ouvrir un formulaire inline
- Modification de tous les champs : type, montant, date, catégorie, description, compte
- Boutons Annuler / Enregistrer

**Comptes séparés Moi / Conjointe**
- Sélecteur de compte à l'ajout manuel d'une transaction
- Sélecteur de compte à l'import CSV (choix avant et pendant la preview)
- Filtre "Tous / Moi / Conjointe" dans le Dashboard et l'Historique
- Le solde et les stats du mois s'adaptent au compte sélectionné
- Les transactions existantes sans compte sont rattachées à "Moi" par défaut

**Catégorisation manuelle à l'import CSV**
- La catégorisation automatique (30+ règles) s'applique à l'import
- Deux modes dans la preview : **Groupé** (changer toute une catégorie d'un coup) et **Détail** (changer la catégorie de chaque transaction individuellement)

---

### Version 1.3.0 — 04/05/2026 — Recherche, modèles récurrents, comparaison mois

**Recherche (`Historique`)**
- Barre de filtre en temps réel sur la description ou la catégorie

**Modèles récurrents (`Ajouter`)**
- Chips cliquables qui pré-remplissent le formulaire
- Toggle pour sauvegarder une saisie comme modèle
- Suppression individuelle des modèles

**Comparaison mois/mois (`Graphiques`)**
- Toggle Mois / Comparer
- Barres côte à côte par catégorie avec delta coloré (vert/rouge)

---

### Version 1.2.0 — 04/05/2026 — Graphiques et budgets

**Graphiques (`Graphiques`)**
- Camembert SVG des dépenses par catégorie
- Courbe SVG du bilan mensuel sur les 6 derniers mois

**Budget (`Budget`)**
- Enveloppes par catégorie avec montants éditables
- Barres de progression colorées (vert / orange / rouge)
- Résumé global du budget

**Navigation**
- Bottom nav passée à 5 onglets : Accueil · Graphiques · ⊕ · Budget · Historique

---

### Version 1.1.0 — 04/05/2026 — Import CSV Crédit Agricole

**Import CSV (`Historique → Importer CSV`)**
- Chargement d'un fichier export CSV Crédit Agricole
- Détection automatique de l'en-tête et du séparateur
- Lecture des colonnes Date, Libellé, Débit, Crédit
- Conversion du format français (virgule décimale, date JJ/MM/AAAA)
- Catégorisation automatique selon le libellé (30+ règles)
- Aperçu groupé par catégorie avant import
- Déduplication : les transactions déjà présentes ne sont pas importées en double

---

### Version 1.0.0 — 04/05/2026 — Version initiale

**Tableau de bord (`Accueil`)**
- Solde total toutes périodes confondues
- Revenus, dépenses et bilan du mois en cours
- Liste des 5 dernières transactions

**Ajout de transactions (`Ajouter`)**
- Choix du type : Dépense ou Revenu
- Saisie du montant, de la catégorie, d'une description (optionnelle) et de la date
- Catégories de dépenses : Alimentation, Transport, Logement, Santé, Loisirs, Shopping, Abonnements, Sorties, Autres
- Catégories de revenus : Salaire, Freelance, Investissements, Autres revenus

**Historique (`Historique`)**
- Navigation par mois (sélecteur horizontal défilable)
- Totaux revenus / dépenses par mois
- Suppression d'une transaction (double confirmation)

**PWA**
- Installation sur l'écran d'accueil iPhone / Android
- Mode hors ligne (service worker avec mise en cache Workbox)
- Icône personnalisée et écran de lancement
- Gestion de la zone sécurisée iPhone (Dynamic Island / encoche)

**Technique**
- Numéro de version affiché dans l'en-tête de l'application
- Données stockées localement via `localStorage` (aucun serveur requis)
- Stack : React 18 + Vite 5 + Tailwind CSS 3 + vite-plugin-pwa

---

## Structure du projet

```
financeperso/
├── public/
│   └── icons/
│       ├── icon.svg               # Icône source
│       ├── icon-192.png           # Icône PWA Android
│       ├── icon-512.png           # Icône PWA maskable
│       └── apple-touch-icon.png   # Icône iOS (180×180)
├── src/
│   ├── components/
│   │   ├── BottomNav.jsx          # Navigation bas de page (5 onglets + badge alerte)
│   │   ├── Budget.jsx             # Sous-onglets : Enveloppes / Épargne / Catégories
│   │   ├── Charts.jsx             # Graphiques SVG + comparaison + statistiques avancées
│   │   ├── Dashboard.jsx          # Tableau de bord + prévision fin de mois + alertes
│   │   ├── Header.jsx             # En-tête (affiche la version)
│   │   ├── ImportCSV.jsx          # Parseur CSV Crédit Agricole
│   │   ├── SavingsGoals.jsx       # Objectifs d'épargne avec jauges
│   │   ├── TransactionForm.jsx    # Formulaire d'ajout + catégories custom
│   │   └── TransactionList.jsx    # Historique + édition inline + export CSV
│   ├── App.jsx                    # Composant racine + état global (transactions, budgets, goals, cats)
│   ├── categories.js              # Constantes partagées : catégories, icônes, couleurs
│   ├── index.css                  # Styles globaux (Tailwind)
│   ├── main.jsx                   # Point d'entrée React
│   └── version.js                 # Numéro de version (source unique)
├── index.html
├── package.json
├── vite.config.js                 # Config Vite + PWA
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

---

## Notes

- Le fichier `src/version.js` est la **source unique** du numéro de version. Modifier uniquement ce fichier lors d'une mise à jour.
- Le fichier `src/categories.js` est la **source unique** des catégories, icônes et couleurs. Toute modification des catégories par défaut se fait ici.
- Les données sont stockées dans le `localStorage`. Clés : `financeperso_v1` (transactions), `financeperso_budgets_v1` (budgets), `financeperso_goals_v1` (objectifs), `financeperso_cats_v1` (catégories custom), `financeperso_recurring_v1` (modèles). Elles ne sont pas synchronisées entre appareils.
- Les comptes (Moi / Conjointe) sont définis dans `src/App.jsx` → `DEFAULT_ACCOUNTS`.
