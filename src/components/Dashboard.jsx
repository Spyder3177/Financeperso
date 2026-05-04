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
  if (today.getFullYear() === y && today.getMonth() + 1 === m) return today.getDate()
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
    const [y2, m2] = ym.split('-').map(Number)
    const prevMonth = m2 === 1 ? `${y2 - 1}-12` : `${y2}-${String(m2 - 1).padStart(2, '0')}`
    const prevExpense = transactions
      .filter(t => t.date.startsWith(prevMonth) && t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0)
    return { totalExpense, projected, dailyAvg, remaining, prevExpense }
  }, [transactions, ym])

  if (!data) return null
  const delta = data.projected - data.prevExpense
  const isOver = delta > 0

  return (
    <div className="glass rounded-3xl p-5">
      <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
        Prévision fin de mois
      </p>
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-3xl font-bold text-white tracking-tight">{fmt(data.projected)}</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>dépenses projetées</p>
        </div>
        <div className="text-right">
          <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Moy. journalière</p>
          <p className="text-sm font-semibold text-white">{fmt(data.dailyAvg)}/j</p>
        </div>
      </div>
      <div
        className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-2xl"
        style={{ background: isOver ? 'rgba(248,113,113,0.12)' : 'rgba(52,211,153,0.12)' }}
      >
        <span className={`font-bold ${isOver ? 'text-rose-400' : 'text-emerald-400'}`}>
          {isOver ? '▲' : '▼'} {fmt(Math.abs(delta))} vs mois dernier
        </span>
        {data.prevExpense > 0 && (
          <span style={{ color: 'rgba(255,255,255,0.35)' }}>({fmt(data.prevExpense)})</span>
        )}
      </div>
      {data.remaining > 0 && (
        <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
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
    <div
      className="rounded-3xl p-4"
      style={{
        background: hasOver ? 'rgba(244,63,94,0.12)' : 'rgba(251,191,36,0.10)',
        border: `1px solid ${hasOver ? 'rgba(244,63,94,0.25)' : 'rgba(251,191,36,0.2)'}`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{hasOver ? '🔴' : '🟡'}</span>
        <p className={`text-sm font-semibold ${hasOver ? 'text-rose-400' : 'text-amber-400'}`}>
          {hasOver ? 'Budget dépassé' : 'Budget presque atteint'}
        </p>
      </div>
      <div className="space-y-1">
        {alerts.map(a => (
          <div key={a.cat} className="flex items-center justify-between text-xs">
            <span className={`font-medium ${a.pct > 100 ? 'text-rose-400' : 'text-amber-400'}`}>
              {ICONS[a.cat] ?? '💳'} {a.cat}
            </span>
            <span className={`font-bold ${a.pct > 100 ? 'text-rose-400' : 'text-amber-400'}`}>
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
    const totalBalance = filtered.reduce((s, t) => t.type === 'income' ? s + t.amount : s - t.amount, 0)
    const monthIncome = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const monthExpense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    return { totalBalance, monthIncome, monthExpense, monthNet: monthIncome - monthExpense }
  }, [filtered, ym])

  const recent = filtered.slice(0, 5)
  const hasBudgets = Object.keys(budgets).length > 0

  return (
    <div className="px-4 space-y-4 pb-4">
      {/* Filtre compte */}
      <div className="flex gap-2 flex-wrap">
        {[{ id: 'all', name: 'Tous' }, ...accounts].map(a => (
          <button
            key={a.id}
            onClick={() => setActiveAccount(a.id)}
            className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all active:scale-95"
            style={activeAccount === a.id
              ? { background: 'rgba(99,102,241,0.25)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.4)' }
              : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }
            }
          >
            {a.name}
          </button>
        ))}
      </div>

      {/* Hero — Solde total */}
      <div className="glass rounded-3xl p-6 relative overflow-hidden">
        {/* Decorative glow */}
        <div
          className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)' }}
        />
        <p className="text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {activeAccount === 'all' ? 'Solde total' : `Solde — ${accounts.find(a => a.id === activeAccount)?.name}`}
        </p>
        <p
          className="text-5xl font-bold tracking-tight"
          style={{ color: stats.totalBalance >= 0 ? 'white' : '#f87171' }}
        >
          {fmt(stats.totalBalance)}
        </p>

        {/* Mini stats mois */}
        <div
          className="flex gap-4 mt-5 pt-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-2 flex-1">
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0"
              style={{ background: 'rgba(52,211,153,0.15)' }}
            >
              <span style={{ color: '#34d399' }}>↑</span>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>Revenus</p>
              <p className="text-sm font-bold" style={{ color: '#34d399' }}>{fmt(stats.monthIncome)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-1">
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0"
              style={{ background: 'rgba(248,113,113,0.15)' }}
            >
              <span style={{ color: '#f87171' }}>↓</span>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>Dépenses</p>
              <p className="text-sm font-bold" style={{ color: '#f87171' }}>{fmt(stats.monthExpense)}</p>
            </div>
          </div>
          <div className="text-right ml-auto">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
              {monthLabel(ym).charAt(0).toUpperCase() + monthLabel(ym).slice(1).split(' ')[0]}
            </p>
            <p
              className="text-sm font-bold"
              style={{ color: stats.monthNet >= 0 ? 'white' : '#f87171' }}
            >
              {stats.monthNet >= 0 ? '+' : ''}{fmt(stats.monthNet)}
            </p>
          </div>
        </div>
      </div>

      {/* Alertes budget */}
      {hasBudgets && (
        <BudgetAlertBanner transactions={filtered} budgets={budgets} ym={ym} />
      )}

      {/* Prévision fin de mois */}
      {stats.monthExpense > 0 && (
        <ProjectionCard transactions={filtered} ym={ym} />
      )}

      {/* Transactions récentes */}
      {recent.length > 0 ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3 px-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Transactions récentes
          </p>
          <div className="glass rounded-3xl overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            {recent.map((t, i) => (
              <div
                key={t.id}
                className="flex items-center gap-3 px-4 py-3.5 active:bg-white/5 transition-colors"
                style={i > 0 ? { borderTop: '1px solid rgba(255,255,255,0.05)' } : {}}
              >
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0"
                  style={{ background: t.type === 'income' ? 'rgba(52,211,153,0.14)' : 'rgba(248,113,113,0.14)' }}
                >
                  {getIconForCat(t.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    {t.description || t.category}
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.32)' }}>
                    {fmtDate(t.date)} · {t.category}
                  </p>
                </div>
                <p
                  className="font-semibold text-sm shrink-0"
                  style={{ color: t.type === 'income' ? '#34d399' : '#f87171' }}
                >
                  {t.type === 'income' ? '+' : '−'}{fmt(t.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-14">
          <p className="text-5xl mb-3">💰</p>
          <p className="font-medium text-white" style={{ opacity: 0.6 }}>Aucune transaction</p>
          <p className="text-sm mt-1 mb-6" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Commencez par en ajouter une
          </p>
          <button
            onClick={onAddClick}
            className="btn-primary px-6 py-3 rounded-2xl text-sm"
          >
            Ajouter une transaction
          </button>
        </div>
      )}
    </div>
  )
}
