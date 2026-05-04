import { useMemo, useState } from 'react'
import { ICONS, getIconForCat } from '../categories'

const fmt = (amount) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)

const fmtDate = (dateStr) =>
  new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

const currentYearMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const monthLabel = (ym) => {
  const [y, m] = ym.split('-')
  return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

function daysInMonth(ym) {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

function daysElapsed(ym) {
  const today = new Date()
  const [y, m] = ym.split('-').map(Number)
  if (today.getFullYear() === y && today.getMonth() + 1 === m) {
    return today.getDate()
  }
  return daysInMonth(ym)
}

function ProjectionCard({ transactions, ym }) {
  const data = useMemo(() => {
    const monthTx = transactions.filter(t => t.date.startsWith(ym) && t.type === 'expense')
    const totalExpense = monthTx.reduce((s, t) => s + t.amount, 0)
    const elapsed = daysElapsed(ym)
    const total = daysInMonth(ym)
    if (elapsed === 0) return null

    const dailyAvg = totalExpense / elapsed
    const projected = dailyAvg * total
    const remaining = total - elapsed

    const [y, m] = ym.split('-').map(Number)
    const prevMonth = m === 1
      ? `${y - 1}-12`
      : `${y}-${String(m - 1).padStart(2, '0')}`
    const prevExpense = transactions
      .filter(t => t.date.startsWith(prevMonth) && t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0)

    return { totalExpense, projected, dailyAvg, remaining, prevExpense }
  }, [transactions, ym])

  if (!data || data.elapsed === 0) return null
  const delta = data.projected - data.prevExpense
  const isOver = delta > 0

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Prévision fin de mois
      </h3>
      <div className="flex items-end justify-between mb-2">
        <div>
          <p className="text-2xl font-bold text-slate-800">{fmt(data.projected)}</p>
          <p className="text-xs text-slate-400 mt-0.5">dépenses projetées</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Moy. journalière</p>
          <p className="text-sm font-semibold text-slate-600">{fmt(data.dailyAvg)}/j</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs">
        <span className={`font-semibold ${isOver ? 'text-rose-500' : 'text-emerald-600'}`}>
          {isOver ? '▲' : '▼'} {fmt(Math.abs(delta))} vs mois dernier
        </span>
        {data.prevExpense > 0 && (
          <span className="text-slate-400">({fmt(data.prevExpense)})</span>
        )}
      </div>

      {data.remaining > 0 && (
        <p className="text-xs text-slate-400 mt-1">
          {data.remaining} jour{data.remaining > 1 ? 's' : ''} restant{data.remaining > 1 ? 's' : ''}
          · actuellement {fmt(data.totalExpense)} dépensés
        </p>
      )}
    </div>
  )
}

function BudgetAlertBanner({ transactions, budgets, ym }) {
  const alerts = useMemo(() => {
    const spending = {}
    transactions
      .filter(t => t.date.startsWith(ym) && t.type === 'expense')
      .forEach(t => { spending[t.category] = (spending[t.category] || 0) + t.amount })

    return Object.entries(budgets)
      .filter(([, budget]) => budget > 0)
      .map(([cat, budget]) => {
        const spent = spending[cat] || 0
        const pct = (spent / budget) * 100
        return { cat, spent, budget, pct }
      })
      .filter(a => a.pct >= 80)
      .sort((a, b) => b.pct - a.pct)
  }, [transactions, budgets, ym])

  if (alerts.length === 0) return null

  const hasOver = alerts.some(a => a.pct > 100)

  return (
    <div className={`rounded-2xl p-4 border ${hasOver ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{hasOver ? '🔴' : '🟡'}</span>
        <p className={`text-sm font-semibold ${hasOver ? 'text-rose-700' : 'text-amber-700'}`}>
          {hasOver ? 'Budget dépassé' : 'Budget presque atteint'}
        </p>
      </div>
      <div className="space-y-1">
        {alerts.map(a => (
          <div key={a.cat} className="flex items-center justify-between text-xs">
            <span className={`font-medium ${a.pct > 100 ? 'text-rose-600' : 'text-amber-600'}`}>
              {ICONS[a.cat] ?? '💳'} {a.cat}
            </span>
            <span className={`font-bold ${a.pct > 100 ? 'text-rose-600' : 'text-amber-600'}`}>
              {Math.round(a.pct)}% ({fmt(a.spent)} / {fmt(a.budget)})
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard({ transactions, accounts, budgets = {}, onAddClick }) {
  const ym = currentYearMonth()
  const [activeAccount, setActiveAccount] = useState('all')

  const filtered = useMemo(() => {
    if (activeAccount === 'all') return transactions
    return transactions.filter(t =>
      t.account === activeAccount || (!t.account && activeAccount === accounts[0]?.id)
    )
  }, [transactions, activeAccount, accounts])

  const stats = useMemo(() => {
    const monthTx = filtered.filter(t => t.date.startsWith(ym))
    const totalBalance = filtered.reduce(
      (s, t) => t.type === 'income' ? s + t.amount : s - t.amount, 0
    )
    const monthIncome  = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const monthExpense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    return { totalBalance, monthIncome, monthExpense, monthNet: monthIncome - monthExpense }
  }, [filtered, ym])

  const recent = filtered.slice(0, 5)
  const hasBudgets = Object.keys(budgets).length > 0

  return (
    <div className="p-4 space-y-4">
      {/* Filtre par compte */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveAccount('all')}
          className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
            activeAccount === 'all' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >Tous</button>
        {accounts.map(a => (
          <button
            key={a.id}
            onClick={() => setActiveAccount(a.id)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeAccount === a.id ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >{a.name}</button>
        ))}
      </div>

      {/* Alerte budget */}
      {hasBudgets && (
        <BudgetAlertBanner transactions={filtered} budgets={budgets} ym={ym} />
      )}

      {/* Solde total */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <p className="text-slate-400 text-sm mb-1">
          {activeAccount === 'all' ? 'Solde total' : `Solde — ${accounts.find(a => a.id === activeAccount)?.name}`}
        </p>
        <p className={`text-4xl font-bold tracking-tight ${stats.totalBalance >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
          {fmt(stats.totalBalance)}
        </p>
      </div>

      {/* Stats du mois */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
          {monthLabel(ym)}
        </h2>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
              <span className="text-emerald-500">↑</span> Revenus
            </p>
            <p className="text-emerald-600 font-bold text-lg">{fmt(stats.monthIncome)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
              <span className="text-rose-500">↓</span> Dépenses
            </p>
            <p className="text-rose-600 font-bold text-lg">{fmt(stats.monthExpense)}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
          <p className="text-slate-500 text-sm">Bilan du mois</p>
          <p className={`font-bold text-lg ${stats.monthNet >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {stats.monthNet >= 0 ? '+' : ''}{fmt(stats.monthNet)}
          </p>
        </div>
      </div>

      {/* Prévision fin de mois */}
      {stats.monthExpense > 0 && (
        <ProjectionCard transactions={filtered} ym={ym} />
      )}

      {/* Transactions récentes */}
      {recent.length > 0 ? (
        <div>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
            Transactions récentes
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50">
            {recent.map(t => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0
                  ${t.type === 'income' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                  {getIconForCat(t.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 text-sm font-medium truncate">
                    {t.description || t.category}
                  </p>
                  <p className="text-slate-400 text-xs">{fmtDate(t.date)} · {t.category}</p>
                </div>
                <p className={`font-semibold text-sm shrink-0 ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {t.type === 'income' ? '+' : '−'}{fmt(t.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-5xl mb-3">💰</p>
          <p className="text-slate-500 font-medium">Aucune transaction</p>
          <p className="text-slate-400 text-sm mt-1 mb-4">Commencez par en ajouter une</p>
          <button
            onClick={onAddClick}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold active:opacity-80"
          >
            Ajouter une transaction
          </button>
        </div>
      )}
    </div>
  )
}
