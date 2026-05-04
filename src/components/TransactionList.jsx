import { useState, useMemo } from 'react'

const fmt = (amount) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)

const fmtDate = (dateStr) =>
  new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

const monthLabel = (ym) => {
  const [y, m] = ym.split('-')
  return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

const currentYearMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const ICONS = {
  'Salaire': '💼', 'Freelance': '💻', 'Investissements': '📈', 'Autres revenus': '💰',
  'Alimentation': '🛒', 'Transport': '🚗', 'Logement': '🏠', 'Santé': '🏥',
  'Loisirs': '🎮', 'Shopping': '🛍️', 'Abonnements': '📱', 'Sorties': '🍽️', 'Autres': '📦',
}

export default function TransactionList({ transactions, onDelete, onImport }) {
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth())
  const [pendingDelete, setPendingDelete] = useState(null)
  const [search, setSearch] = useState('')

  const availableMonths = useMemo(() => {
    const months = [...new Set(transactions.map(t => t.date.substring(0, 7)))]
    return months.sort().reverse()
  }, [transactions])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return transactions
      .filter(t => t.date.startsWith(selectedMonth))
      .filter(t => {
        if (!q) return true
        return (
          (t.description || '').toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [transactions, selectedMonth, search])

  const totals = useMemo(() => ({
    income: filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    expense: filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
  }), [filtered])

  const handleDelete = (id) => {
    if (pendingDelete === id) {
      onDelete(id)
      setPendingDelete(null)
    } else {
      setPendingDelete(id)
      setTimeout(() => setPendingDelete(null), 3000)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Historique</h2>
        <button
          onClick={onImport}
          className="flex items-center gap-1.5 text-blue-600 text-sm font-semibold bg-blue-50 px-3 py-1.5 rounded-xl active:opacity-70"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          Importer CSV
        </button>
      </div>

      {/* Sélecteur de mois */}
      {availableMonths.length > 0 ? (
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-2 pb-1 w-max">
            {availableMonths.map(m => (
              <button
                key={m}
                onClick={() => { setSelectedMonth(m); setSearch('') }}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedMonth === m
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {monthLabel(m)}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-slate-400">Aucune transaction enregistrée</p>
        </div>
      )}

      {/* Barre de recherche */}
      {availableMonths.length > 0 && (
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une transaction…"
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-9 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Totaux du mois */}
      {filtered.length > 0 && (
        <div className="flex gap-3">
          <div className="flex-1 bg-emerald-50 rounded-xl p-3 border border-emerald-100">
            <p className="text-emerald-600 text-xs font-medium mb-0.5">Revenus</p>
            <p className="text-emerald-700 font-bold">{fmt(totals.income)}</p>
          </div>
          <div className="flex-1 bg-rose-50 rounded-xl p-3 border border-rose-100">
            <p className="text-rose-600 text-xs font-medium mb-0.5">Dépenses</p>
            <p className="text-rose-700 font-bold">{fmt(totals.expense)}</p>
          </div>
        </div>
      )}

      {/* Résultat vide */}
      {filtered.length === 0 && availableMonths.length > 0 && (
        <div className="text-center py-8">
          <p className="text-slate-400 text-sm">
            {search ? `Aucun résultat pour "${search}"` : 'Aucune transaction ce mois-ci'}
          </p>
        </div>
      )}

      {/* Liste */}
      {filtered.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50">
          {filtered.map(t => (
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
              <div className="flex items-center gap-2 shrink-0">
                <p className={`font-semibold text-sm ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {t.type === 'income' ? '+' : '−'}{fmt(t.amount)}
                </p>
                <button
                  onClick={() => handleDelete(t.id)}
                  className={`text-xs px-2 py-1 rounded-lg font-medium transition-all ${
                    pendingDelete === t.id
                      ? 'bg-rose-500 text-white'
                      : 'text-slate-300 hover:text-slate-400'
                  }`}
                >
                  {pendingDelete === t.id ? 'Confirm.' : '✕'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
