# Instructions pour Claude Code — Finance Perso

## Workflow de développement obligatoire

À chaque session de développement, suivre ces étapes dans l'ordre :

### 1. Développer sur la branche assignée
- Travailler sur la branche `claude/<feature>-<id>` fournie en début de session
- Commiter régulièrement avec des messages clairs

### 2. Pousser la branche
```bash
git push -u origin <branche>
```

### 3. Créer une PR GitHub et la merger immédiatement
Après avoir poussé, **toujours** créer une PR via l'outil `mcp__github__create_pull_request` puis la merger via `mcp__github__merge_pull_request` **sans attendre** que l'utilisateur le demande.

```
mcp__github__create_pull_request(
  owner="spyder3177",
  repo="financeperso",
  title="...",
  head="<branche>",
  base="main",
  body="..."
)
→ récupérer le numéro de PR

mcp__github__merge_pull_request(
  owner="spyder3177",
  repo="financeperso",
  pullNumber=<numéro>,
  merge_method="merge"
)
```

### 4. Mettre à jour la branche locale main
```bash
git fetch origin main && git checkout main && git pull origin main
```

> ⚠️ Ne pas merger localement avec `git merge` puis pousser — passer toujours par une PR GitHub pour que l'historique soit propre et les branches correctement fermées.

---

## Références projet

- URL live : https://spyder3177.github.io/Financeperso/
- Repo : github.com/Spyder3177/Financeperso
- Stack : React 18 + Vite 5 + Tailwind CSS 3 + vite-plugin-pwa
- Déploiement : automatique via GitHub Actions sur push sur `main`
- Version : modifier uniquement `src/version.js`
- Catégories : modifier uniquement `src/categories.js`
