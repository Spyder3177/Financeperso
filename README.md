# Finance Perso

Application de gestion des finances personnelles — PWA installable sur iPhone et Android.

---

## Version actuelle : 1.0.0 (04/05/2026)

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
- Installation sur l'écran d'accueil iPhone 14 / Android
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
│   │   ├── BottomNav.jsx          # Navigation bas de page
│   │   ├── Dashboard.jsx          # Tableau de bord
│   │   ├── Header.jsx             # En-tête (affiche la version)
│   │   ├── TransactionForm.jsx    # Formulaire d'ajout
│   │   └── TransactionList.jsx    # Historique par mois
│   ├── App.jsx                    # Composant racine + état global
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
- Les données sont stockées dans le `localStorage` du navigateur sous la clé `financeperso_v1`. Elles ne sont pas synchronisées entre appareils.
