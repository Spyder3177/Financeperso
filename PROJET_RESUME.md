# Résumé du projet Finance Perso

## Ce qui existe
PWA de gestion des finances personnelles, installable sur iPhone via Safari.
- URL live : https://spyder3177.github.io/Financeperso/
- Repo : github.com/Spyder3177/Financeperso
- Branche de dev : créer une nouvelle branche `claude/<feature>-<id>` à chaque session
- Déploiement : automatique via GitHub Actions sur chaque push sur `main`

## Stack technique
- React 18 + Vite 5 + Tailwind CSS 3
- vite-plugin-pwa (service worker, offline, icônes)
- Pas de backend — données en localStorage
- Version affichée dans l'app → fichier unique à modifier : `src/version.js`

## Clés localStorage
| Clé | Contenu |
|-----|---------|
| `financeperso_v1` | Tableau de toutes les transactions |
| `financeperso_budgets_v1` | Objet `{ catégorie: montantMax }` |
| `financeperso_recurring_v1` | Tableau de modèles récurrents `{ id, type, amount, category, description }` |

## Versions livrées

### v1.0.0
Tableau de bord (solde total, stats du mois), ajout manuel de transactions (dépenses/revenus), historique par mois avec suppression, PWA iPhone.

### v1.1.0
Import CSV Crédit Agricole : parseur complet gérant les champs quotés multi-lignes, catégorisation automatique (30+ règles), aperçu groupé par catégorie avant import, déduplication.

### v1.2.0
- **Graphiques** : camembert SVG des dépenses par catégorie + courbe SVG du bilan mensuel (6 derniers mois)
- **Budget** : enveloppes par catégorie avec montants éditables, barres de progression (vert/orange/rouge), résumé global
- **Navigation** : bottom nav passée à 5 onglets — Accueil · Graphiques · ⊕ · Budget · Historique

### v1.3.0
- **Recherche** : barre de filtre en temps réel dans l'historique (description ou catégorie)
- **Modèles récurrents** : chips pré-remplissant le formulaire, toggle "sauvegarder comme modèle", suppression individuelle
- **Comparaison mois/mois** : toggle Mois / Comparer dans Graphiques, barres côte à côte par catégorie avec delta coloré

## Structure des fichiers clés
```
src/
├── version.js                ← numéro de version (à incrémenter)
├── App.jsx                   ← état global + routing onglets
├── index.css
├── main.jsx
└── components/
    ├── Header.jsx            ← affiche la version
    ├── BottomNav.jsx         ← 5 onglets : dashboard / charts / add / budget / history
    ├── Dashboard.jsx         ← solde total, stats mois, transactions récentes
    ├── TransactionForm.jsx   ← ajout manuel + modèles récurrents
    ├── TransactionList.jsx   ← historique par mois + recherche + import CSV
    ├── ImportCSV.jsx         ← parseur CSV Crédit Agricole (tokeniseur, 30+ règles)
    ├── Charts.jsx            ← camembert SVG + courbe bilan + comparaison mois
    └── Budget.jsx            ← enveloppes par catégorie, barres de progression
```

## Catégories
```js
const INCOME_CATS = ['Salaire', 'Freelance', 'Investissements', 'Autres revenus']
const EXPENSE_CATS = ['Alimentation', 'Transport', 'Logement', 'Santé', 'Loisirs', 'Shopping', 'Abonnements', 'Sorties', 'Autres']
```

## Règle de versioning
À chaque mise à jour :
1. Modifier `src/version.js` (ex : 1.3.0 → 1.4.0)
2. Développer sur une branche `claude/<feature>-<id>`
3. Merger sur `main` → déploiement automatique

## Prochaines fonctionnalités possibles
- Objectifs d'épargne (savings goals avec jauge de progression)
- Export CSV des transactions
- Catégories personnalisables par l'utilisateur
- Statistiques avancées (moyenne mensuelle par catégorie, tendances)
- Notifications budget (alerte quand proche de la limite)
