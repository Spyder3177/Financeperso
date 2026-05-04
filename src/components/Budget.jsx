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
  const bg = overBudget
    ? 'linear-gradient(90deg,#e11d48,#f43f5e)'
    : nearBudget
      ? 'linear-gradient(90deg,#d97706,#fbbf24)'
      : 'linear-gradient(90deg,#059669,#34d399)'
  const glow = overBudget ? 'rgba(244,63,94,0.3)' : nearBudget ? 'rgba(251,191,36,0.3)' : 'rgba(52,211,153,0.3)'

  return (
    <div className="progress-track h-1.5 mt-2.5">
      <div
        className="h-1.5 rounded-full transition-all"
        style={{ width: `${Math.min(100, pct)}%`, background: bg, boxShadow: `0 0 6px ${glow}` }}
      />
    </div>
  )
}

function AlertBanner({ alerts }) {
  if (alerts.length === 0) return null
  const hasOver = alerts.some(a => a.pct > 100)
  return (
    <div
      className="rounded-3xl p-4"
      style={{
        background: hasOver ? 'rgba(244,63,94,0.1)' : 'rgba(251,191,36,0.08)',
        border: `1px solid ${hasOver ? 'rgba(244,63,94,0.25)' : 'rgba(251,191,36,0.2)'}`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">{hasOver ? '🔴' : '🟡'}</span>
        <p className="text-sm font-semibold" style={{ color: hasOver ? '#f87171' : '#fbbf24' }}>
          {hasOver ? 'Budget dépassé sur ' : 'Budget bientôt atteint — '}
          {alerts.filter(a => a.pct > 100).length || alerts.length} catégorie{alerts.length > 1 ? 's' : ''}
        </p>
      </div>
      <div className="space-y-1.5">
        {alerts.map(a => (
          <div key={a.cat} className="flex items-center justify-between">
            <span className="text-xs font-medium flex items-center gap-1"
              style={{ color: a.pct > 100 ? '#f87171' : '#fbbf24' }}>
              {getIconForCat(a.cat)} {a.cat}
            </span>
            <span className="text-xs font-bold" style={{ color: a.pct > 100 ? '#f87171' : '#fbbf24' }}>
              {Math.round(a.pct)}%
              {a.pct > 100 ? ` (+${fmt(a.spent - a.budget)})` : ` (reste ${fmt(a.budget - a.spent)})`}
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

  const startEdit = (cat) => { setEditing(cat); setEditValue(budgets[cat] ? String(budgets[cat]) : '') }

  const confirmEdit = (cat) => {
    const val = parseFloat(editValue)
    if (!isNaN(val) && val > 0) {
      onBudgetsChange(prev => ({ ...prev, [cat]: val }))
    } else if (editValue === '' || editValue === '0') {
      onBudgetsChange(prev => { const next = { ...prev }; delete next[cat]; return next })
    }
    setEditing(null)
    setEditValue('')
  }

  const totalBudget = Object.values(budgets).reduce((s, v) => s + v, 0)
  const totalSpent = expenseCats.reduce((s, cat) => s + (spending[cat] || 0), 0)
  const globalPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  return (
    <div className="space-y-4">
      <AlertBanner alerts={alerts} />

      {totalBudget > 0 && (
        <div className="glass rounded-3xl p-5">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>Dépensé ce mois</span>
            <span className="font-bold text-sm" style={{ color: totalSpent > totalBudget ? '#f87171' : 'white' }}>
              {fmt(totalSpent)} <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>/ {fmt(totalBudget)}</span>
            </span>
          </div>
          <ProgressBar pct={globalPct} overBudget={globalPct > 100} nearBudget={globalPct >= 80} />
          <p className="text-xs mt-2.5" style={{ color: totalSpent > totalBudget ? '#f87171' : '#34d399' }}>
            {totalSpent > totalBudget
              ? `Dépassement de ${fmt(totalSpent - totalBudget)}`
              : `Reste ${fmt(totalBudget - totalSpent)}`}
          </p>
        </div>
      )}

      <p className="text-xs px-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
        Touchez <span style={{ color: '#818cf8', fontWeight: 600 }}>+ budget</span> pour fixer une enveloppe
      </p>

      <div className="glass rounded-3xl overflow-hidden">
        {expenseCats.map((cat, i) => {
          const spent = spending[cat] || 0
          const budget = budgets[cat] || 0
          const pct = budget > 0 ? (spent / budget) * 100 : 0
          const overBudget = budget > 0 && spent > budget
          const nearBudget = budget > 0 && pct >= 80 && !overBudget

          return (
            <div
              key={cat}
              className="px-4 py-4"
              style={i > 0 ? { borderTop: '1px solid rgba(255,255,255,0.05)' } : {}}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl shrink-0">{getIconForCat(cat, customExpenseCats)}</span>
                <span className="flex-1 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>{cat}</span>

                <div className="flex items-center gap-1 shrink-0 text-sm">
                  <span className="font-semibold" style={{ color: overBudget ? '#f87171' : 'rgba(255,255,255,0.85)' }}>
                    {fmt(spent)}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
                  {editing === cat ? (
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="1"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onBlur={() => confirmEdit(cat)}
                      onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
                      autoFocus
                      placeholder="0"
                      className="glass-input w-20 text-sm rounded-xl px-2 py-0.5"
                    />
                  ) : (
                    <button
                      onClick={() => startEdit(cat)}
                      className="text-sm transition-all"
                      style={{ color: budget > 0 ? 'rgba(255,255,255,0.5)' : '#818cf8', fontWeight: budget > 0 ? 400 : 600 }}
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

  const deleteCat = (name) => { onCustomCatsChange(prev => prev.filter(c => c.name !== name)) }

  return (
    <div className="space-y-4">
      {/* Catégories par défaut */}
      <div className="glass rounded-3xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Catégories par défaut
        </p>
        <div className="flex flex-wrap gap-2">
          {EXPENSE_CATS.map(cat => (
            <span
              key={cat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.09)',
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              {ICONS[cat]} {cat}
            </span>
          ))}
        </div>
      </div>

      {/* Catégories personnalisées */}
      <div className="glass rounded-3xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Catégories personnalisées
        </p>

        {customExpenseCats.length === 0 ? (
          <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>Aucune catégorie personnalisée</p>
        ) : (
          <div className="space-y-2 mb-4">
            {customExpenseCats.map(cat => (
              <div
                key={cat.name}
                className="flex items-center justify-between py-2.5"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                <span className="flex items-center gap-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  <span className="text-xl">{cat.icon}</span>
                  {cat.name}
                </span>
                <button
                  onClick={() => deleteCat(cat.name)}
                  className="p-1.5 rounded-xl transition-all active:scale-90"
                  style={{ color: 'rgba(255,255,255,0.2)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs font-semibold mb-2.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Ajouter une catégorie</p>
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => setShowIcons(v => !v)}
            className="text-2xl p-2 rounded-xl transition-all"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            {newIcon}
          </button>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addCat() }}
            placeholder="Nom de la catégorie…"
            className="glass-input flex-1 rounded-xl px-3 py-2"
          />
          <button
            onClick={addCat}
            disabled={!newName.trim()}
            className="px-3 py-2 rounded-xl text-sm font-bold btn-primary disabled:opacity-40 transition-all"
          >
            +
          </button>
        </div>

        {showIcons && (
          <div className="flex flex-wrap gap-2 mt-2">
            {CAT_ICONS_INPUT.map(e => (
              <button
                key={e}
                onClick={() => { setNewIcon(e); setShowIcons(false) }}
                className="text-xl p-1.5 rounded-xl transition-all"
                style={e === newIcon
                  ? { background: 'rgba(99,102,241,0.3)', border: '1px solid rgba(99,102,241,0.4)' }
                  : { background: 'rgba(255,255,255,0.07)' }
                }
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
  transactions, budgets, onBudgetsChange, expenseCats,
  customExpenseCats, onCustomCatsChange, goals, onGoalsChange,
}) {
  const [subTab, setSubTab] = useState('budget')
  const ym = currentYearMonth()

  const tabs = [
    { id: 'budget', label: 'Enveloppes' },
    { id: 'goals', label: 'Épargne' },
    { id: 'categories', label: 'Catégories' },
  ]

  return (
    <div className="px-4 space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-white">Budget</h2>
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {monthLabel(ym).charAt(0).toUpperCase() + monthLabel(ym).slice(1)}
        </span>
      </div>

      {/* Sub-nav */}
      <div className="glass rounded-2xl p-1 flex">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
            style={subTab === tab.id
              ? { background: 'rgba(255,255,255,0.12)', color: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }
              : { color: 'rgba(255,255,255,0.38)' }
            }
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
        <CategoriesView customExpenseCats={customExpenseCats} onCustomCatsChange={onCustomCatsChange} />
      )}
    </div>
  )
}
