export const INCOME_CATS = ['Salaire', 'Freelance', 'Investissements', 'Autres revenus']
export const EXPENSE_CATS = [
  'Alimentation', 'Transport', 'Logement', 'Santé',
  'Loisirs', 'Shopping', 'Abonnements', 'Sorties', 'Autres',
]

export const ICONS = {
  'Salaire': '💼', 'Freelance': '💻', 'Investissements': '📈', 'Autres revenus': '💰',
  'Alimentation': '🛒', 'Transport': '🚗', 'Logement': '🏠', 'Santé': '🏥',
  'Loisirs': '🎮', 'Shopping': '🛍️', 'Abonnements': '📱', 'Sorties': '🍽️', 'Autres': '📦',
}

export const CATEGORY_COLORS = {
  'Alimentation': '#f59e0b',
  'Transport': '#3b82f6',
  'Logement': '#8b5cf6',
  'Santé': '#10b981',
  'Loisirs': '#f43f5e',
  'Shopping': '#ec4899',
  'Abonnements': '#6366f1',
  'Sorties': '#ef4444',
  'Autres': '#94a3b8',
}

export const CUSTOM_CATS_KEY = 'financeperso_cats_v1'
export const BUDGETS_KEY = 'financeperso_budgets_v1'
export const GOALS_KEY = 'financeperso_goals_v1'

export const DEFAULT_CUSTOM_ICON = '🏷️'
export const DEFAULT_CUSTOM_COLOR = '#64748b'

const EXTRA_COLORS = [
  '#0ea5e9', '#14b8a6', '#f97316', '#a855f7', '#84cc16',
  '#06b6d4', '#d946ef', '#fb7185', '#34d399', '#fbbf24',
]

export function getIconForCat(cat, customCats) {
  if (ICONS[cat]) return ICONS[cat]
  const custom = customCats?.find(c => c.name === cat)
  return custom?.icon ?? DEFAULT_CUSTOM_ICON
}

export function getColorForCat(cat, customCats, index = 0) {
  if (CATEGORY_COLORS[cat]) return CATEGORY_COLORS[cat]
  const custom = customCats?.find(c => c.name === cat)
  if (custom?.color) return custom.color
  return EXTRA_COLORS[index % EXTRA_COLORS.length]
}
