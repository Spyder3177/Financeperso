import { useMemo, useState } from 'react'

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

const ICONS = {
  'Salaire': '💼', 'Freelance': '💻', 'Investissements': '📈', 'Autres revenus': '💰',
  'Alimentation': '🛒', 'Transport': '🚗', 'Logement': '🏠', 'Santé': '🏥',
  'Loisirs': '🎮', 'Shopping': '🛍️', 'Abonnements': '📱', 'Sorties': '🍽️', 'Autres': '📦',
}

export default function Dashboard({ transactions, accounts, onAddClick }) {
  const ym = currentYearMonth()
  const [activeAccount, setActiveAccount] = useState('all')

  // Transactions filtrées par compte (sans account → premier compte par défaut)
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
                  {ICONS[t.category] ?? '💳'}
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
