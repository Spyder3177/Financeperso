import { useState, useEffect, useMemo } from 'react'

const BUDGET_KEY = 'financeperso_budgets_v1'

const fmt = (amount) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)

const currentYearMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const monthLabel = (ym) => {
  const [y, m] = ym.split('-')
  return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

const EXPENSE_CATS = [
  'Alimentation', 'Transport', 'Logement', 'Santé',
  'Loisirs', 'Shopping', 'Abonnements', 'Sorties', 'Autres',
]

const ICONS = {
  'Alimentation': '🛒', 'Transport': '🚗', 'Logement': '🏠', 'Santé': '🏥',
  'Loisirs': '🎮', 'Shopping': '🛍️', 'Abonnements': '📱', 'Sorties': '🍽️', 'Autres': '📦',
}

function ProgressBar({ pct, overBudget, nearBudget }) {
  const color = overBudget ? 'bg-rose-500' : nearBudget ? 'bg-amber-500' : 'bg-emerald-500'
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
      <div
        className={`h-1.5 rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  )
}

export default function Budget({ transactions }) {
  const [budgets, setBudgets] = useState(() => {
    try {
      const stored = localStorage.getItem(BUDGET_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })
  const [editing, setEditing] = useState(null)
  const [editValue, setEditValue] = useState('')

  useEffect(() => {
    localStorage.setItem(BUDGET_KEY, JSON.stringify(budgets))
  }, [budgets])

  const ym = currentYearMonth()

  const spending = useMemo(() => {
    const result = {}
    transactions
      .filter(t => t.date.startsWith(ym) && t.type === 'expense')
      .forEach(t => { result[t.category] = (result[t.category] || 0) + t.amount })
    return result
  }, [transactions, ym])

  const startEdit = (cat) => {
    setEditing(cat)
    setEditValue(budgets[cat] ? String(budgets[cat]) : '')
  }

  const confirmEdit = (cat) => {
    const val = parseFloat(editValue)
    if (!isNaN(val) && val > 0) {
      setBudgets(prev => ({ ...prev, [cat]: val }))
    } else if (editValue === '' || editValue === '0') {
      setBudgets(prev => {
        const next = { ...prev }
        delete next[cat]
        return next
      })
    }
    setEditing(null)
    setEditValue('')
  }

  const totalBudget = Object.values(budgets).reduce((s, v) => s + v, 0)
  const totalSpent = EXPENSE_CATS.reduce((s, cat) => s + (spending[cat] || 0), 0)
  const globalPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Budget</h2>
        <span className="text-xs text-slate-400">{monthLabel(ym)}</span>
      </div>

      {/* Global summary */}
      {totalBudget > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-500">Dépensé</span>
            <span className={`font-bold ${totalSpent > totalBudget ? 'text-rose-600' : 'text-slate-800'}`}>
              {fmt(totalSpent)} <span className="font-normal text-slate-400">/ {fmt(totalBudget)}</span>
            </span>
          </div>
          <ProgressBar
            pct={globalPct}
            overBudget={globalPct > 100}
            nearBudget={globalPct >= 80}
          />
          <p className={`text-xs mt-2 font-medium ${totalSpent > totalBudget ? 'text-rose-500' : 'text-emerald-600'}`}>
            {totalSpent > totalBudget
              ? `Dépassement de ${fmt(totalSpent - totalBudget)}`
              : `Reste ${fmt(totalBudget - totalSpent)}`}
          </p>
        </div>
      )}

      {/* Per category */}
      <p className="text-xs text-slate-400 px-1">
        Touchez <span className="font-semibold text-blue-500">+ budget</span> pour fixer une enveloppe
      </p>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50">
        {EXPENSE_CATS.map(cat => {
          const spent = spending[cat] || 0
          const budget = budgets[cat] || 0
          const pct = budget > 0 ? (spent / budget) * 100 : 0
          const overBudget = budget > 0 && spent > budget
          const nearBudget = budget > 0 && pct >= 80 && !overBudget

          return (
            <div key={cat} className="px-4 py-3.5">
              <div className="flex items-center gap-3">
                <span className="text-xl shrink-0">{ICONS[cat]}</span>
                <span className="flex-1 text-sm font-medium text-slate-700">{cat}</span>

                <div className="flex items-center gap-1 shrink-0 text-sm">
                  <span className={`font-semibold ${overBudget ? 'text-rose-600' : 'text-slate-800'}`}>
                    {fmt(spent)}
                  </span>
                  <span className="text-slate-300">/</span>
                  {editing === cat ? (
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="1"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onBlur={() => confirmEdit(cat)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.target.blur() } }}
                      autoFocus
                      placeholder="0"
                      className="w-20 text-sm border border-blue-400 rounded-lg px-2 py-0.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  ) : (
                    <button
                      onClick={() => startEdit(cat)}
                      className={`text-sm transition-colors ${budget > 0 ? 'text-slate-500 hover:text-blue-600' : 'text-blue-400 font-medium'}`}
                    >
                      {budget > 0 ? fmt(budget) : '+ budget'}
                    </button>
                  )}
                </div>
              </div>

              {budget > 0 && (
                <ProgressBar pct={pct} overBudget={overBudget} nearBudget={nearBudget} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
