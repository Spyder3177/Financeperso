import { useState, useMemo } from 'react'
import { EXPENSE_CATS, ICONS, getIconForCat } from '../categories'
import SavingsGoals from './SavingsGoals'

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

const CAT_ICONS_INPUT = ['🏷️', '🎨', '🛠️', '🌱', '🐶', '🍕', '⚽', '🎬', '📚', '💊', '🎵', '🏊', '🧘', '🤝', '🖥️']

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

function AlertBanner({ alerts }) {
  if (alerts.length === 0) return null
  const hasOver = alerts.some(a => a.pct > 100)
  return (
    <div className={`rounded-2xl p-4 border ${hasOver ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{hasOver ? '🔴' : '🟡'}</span>
        <p className={`text-sm font-semibold ${hasOver ? 'text-rose-700' : 'text-amber-700'}`}>
          {hasOver ? 'Budget dépassé sur ' : 'Budget bientôt atteint — '}
          {alerts.filter(a => a.pct > 100).length || alerts.length} catégorie{alerts.length > 1 ? 's' : ''}
        </p>
      </div>
      <div className="space-y-1.5">
        {alerts.map(a => (
          <div key={a.cat} className="flex items-center justify-between">
            <span className={`text-xs font-medium flex items-center gap-1 ${a.pct > 100 ? 'text-rose-600' : 'text-amber-600'}`}>
              {getIconForCat(a.cat)} {a.cat}
            </span>
            <span className={`text-xs font-bold ${a.pct > 100 ? 'text-rose-600' : 'text-amber-600'}`}>
              {Math.round(a.pct)}%
              {a.pct > 100
                ? ` (+${fmt(a.spent - a.budget)})`
                : ` (reste ${fmt(a.budget - a.spent)})`}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BudgetView({ transactions, budgets, onBudgetsChange, expenseCats, customExpenseCats }) {
  const [editing, setEditing] = useState(null)
  const [editValue, setEditValue] = useState('')
  const ym = currentYearMonth()

  const spending = useMemo(() => {
    const result = {}
    transactions
      .filter(t => t.date.startsWith(ym) && t.type === 'expense')
      .forEach(t => { result[t.category] = (result[t.category] || 0) + t.amount })
    return result
  }, [transactions, ym])

  const alerts = useMemo(() => {
    return expenseCats
      .map(cat => {
        const budget = budgets[cat] || 0
        const spent = spending[cat] || 0
        const pct = budget > 0 ? (spent / budget) * 100 : 0
        return { cat, spent, budget, pct }
      })
      .filter(a => a.budget > 0 && a.pct >= 80)
      .sort((a, b) => b.pct - a.pct)
  }, [expenseCats, budgets, spending])

  const startEdit = (cat) => {
    setEditing(cat)
    setEditValue(budgets[cat] ? String(budgets[cat]) : '')
  }

  const confirmEdit = (cat) => {
    const val = parseFloat(editValue)
    if (!isNaN(val) && val > 0) {
      onBudgetsChange(prev => ({ ...prev, [cat]: val }))
    } else if (editValue === '' || editValue === '0') {
      onBudgetsChange(prev => {
        const next = { ...prev }
        delete next[cat]
        return next
      })
    }
    setEditing(null)
    setEditValue('')
  }

  const totalBudget = Object.values(budgets).reduce((s, v) => s + v, 0)
  const totalSpent = expenseCats.reduce((s, cat) => s + (spending[cat] || 0), 0)
  const globalPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  return (
    <div className="space-y-4">
      {/* Alertes */}
      <AlertBanner alerts={alerts} />

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

      <p className="text-xs text-slate-400 px-1">
        Touchez <span className="font-semibold text-blue-500">+ budget</span> pour fixer une enveloppe
      </p>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50">
        {expenseCats.map(cat => {
          const spent = spending[cat] || 0
          const budget = budgets[cat] || 0
          const pct = budget > 0 ? (spent / budget) * 100 : 0
          const overBudget = budget > 0 && spent > budget
          const nearBudget = budget > 0 && pct >= 80 && !overBudget

          return (
            <div key={cat} className="px-4 py-3.5">
              <div className="flex items-center gap-3">
                <span className="text-xl shrink-0">{getIconForCat(cat, customExpenseCats)}</span>
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

function CategoriesView({ customExpenseCats, onCustomCatsChange }) {
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('🏷️')
  const [showIcons, setShowIcons] = useState(false)

  const addCat = () => {
    const name = newName.trim()
    if (!name || EXPENSE_CATS.includes(name) || customExpenseCats.some(c => c.name === name)) return
    onCustomCatsChange(prev => [...prev, { name, icon: newIcon }])
    setNewName('')
    setNewIcon('🏷️')
    setShowIcons(false)
  }

  const deleteCat = (name) => {
    onCustomCatsChange(prev => prev.filter(c => c.name !== name))
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Catégories par défaut</p>
        <div className="flex flex-wrap gap-2">
          {EXPENSE_CATS.map(cat => (
            <span key={cat} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-full text-xs text-slate-600 border border-slate-100">
              {ICONS[cat]} {cat}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Catégories personnalisées</p>

        {customExpenseCats.length === 0 ? (
          <p className="text-xs text-slate-400 mb-3">Aucune catégorie personnalisée</p>
        ) : (
          <div className="space-y-2 mb-4">
            {customExpenseCats.map(cat => (
              <div key={cat.name} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="text-xl">{cat.icon}</span>
                  {cat.name}
                </span>
                <button
                  onClick={() => deleteCat(cat.name)}
                  className="text-slate-300 hover:text-rose-400 transition-colors p-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new category */}
        <p className="text-xs font-semibold text-slate-500 mb-2">Ajouter une catégorie</p>
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => setShowIcons(v => !v)}
            className="text-2xl p-2 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors"
          >
            {newIcon}
          </button>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addCat() }}
            placeholder="Nom de la catégorie…"
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addCat}
            disabled={!newName.trim()}
            className="px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 active:opacity-80"
          >
            +
          </button>
        </div>

        {showIcons && (
          <div className="flex flex-wrap gap-2 mb-2">
            {CAT_ICONS_INPUT.map(e => (
              <button
                key={e}
                onClick={() => { setNewIcon(e); setShowIcons(false) }}
                className={`text-xl p-1.5 rounded-lg transition-colors ${e === newIcon ? 'bg-blue-100' : 'hover:bg-slate-100'}`}
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Budget({
  transactions,
  budgets,
  onBudgetsChange,
  expenseCats,
  customExpenseCats,
  onCustomCatsChange,
  goals,
  onGoalsChange,
}) {
  const [subTab, setSubTab] = useState('budget')
  const ym = currentYearMonth()

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Budget</h2>
        <span className="text-xs text-slate-400">{monthLabel(ym)}</span>
      </div>

      {/* Sub-navigation */}
      <div className="flex bg-slate-100 rounded-xl p-1 text-xs">
        {[
          { id: 'budget', label: 'Enveloppes' },
          { id: 'goals', label: 'Épargne' },
          { id: 'categories', label: 'Catégories' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
              subTab === tab.id ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {subTab === 'budget' && (
        <BudgetView
          transactions={transactions}
          budgets={budgets}
          onBudgetsChange={onBudgetsChange}
          expenseCats={expenseCats}
          customExpenseCats={customExpenseCats}
        />
      )}

      {subTab === 'goals' && (
        <SavingsGoals goals={goals} onGoalsChange={onGoalsChange} />
      )}

      {subTab === 'categories' && (
        <CategoriesView
          customExpenseCats={customExpenseCats}
          onCustomCatsChange={onCustomCatsChange}
        />
      )}
    </div>
  )
}
