import { useState, useMemo } from 'react'

const INCOME_CATS = ['Salaire', 'Freelance', 'Investissements', 'Autres revenus']
const EXPENSE_CATS = ['Alimentation', 'Transport', 'Logement', 'Santé', 'Loisirs', 'Shopping', 'Abonnements', 'Sorties', 'Autres']

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

function EditRow({ transaction, accounts, onSave, onCancel }) {
  const [type, setType] = useState(transaction.type)
  const [amount, setAmount] = useState(String(transaction.amount))
  const [category, setCategory] = useState(transaction.category)
  const [description, setDescription] = useState(transaction.description || '')
  const [date, setDate] = useState(transaction.date)
  const [account, setAccount] = useState(transaction.account || accounts[0]?.id || '')

  const cats = type === 'income' ? INCOME_CATS : EXPENSE_CATS

  const handleTypeChange = (t) => {
    setType(t)
    const newCats = t === 'income' ? INCOME_CATS : EXPENSE_CATS
    if (!newCats.includes(category)) setCategory(newCats[0])
  }

  const handleSave = () => {
    const parsed = parseFloat(amount)
    if (!parsed || parsed <= 0 || !category || !date) return
    onSave({ type, amount: parsed, category, description: description.trim(), date, account })
  }

  return (
    <div className="px-4 py-3 bg-blue-50 space-y-3">
      <div className="flex bg-white rounded-xl p-1">
        <button type="button" onClick={() => handleTypeChange('expense')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${type === 'expense' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500'}`}
        >Dépense</button>
        <button type="button" onClick={() => handleTypeChange('income')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${type === 'income' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500'}`}
        >Revenu</button>
      </div>
      <div className="flex gap-2">
        <input type="number" inputMode="decimal" step="0.01" min="0.01" value={amount}
          onChange={e => setAmount(e.target.value)} placeholder="0,00"
          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <select value={category} onChange={e => setCategory(e.target.value)}
        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {cats.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <input type="text" value={description} onChange={e => setDescription(e.target.value)}
        placeholder="Description (optionnel)"
        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {accounts.length > 1 && (
        <div className="flex bg-white rounded-xl p-1">
          {accounts.map(a => (
            <button key={a.id} type="button" onClick={() => setAccount(a.id)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${account === a.id ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500'}`}
            >{a.name}</button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold bg-white active:opacity-70"
        >Annuler</button>
        <button onClick={handleSave}
          className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold active:opacity-80"
        >Enregistrer</button>
      </div>
    </div>
  )
}

export default function TransactionList({ transactions, accounts, onDelete, onUpdate, onImport }) {
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth())
  const [pendingDelete, setPendingDelete] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [activeAccount, setActiveAccount] = useState('all')

  const accountFiltered = useMemo(() => {
    if (activeAccount === 'all') return transactions
    return transactions.filter(t =>
      t.account === activeAccount || (!t.account && activeAccount === accounts[0]?.id)
    )
  }, [transactions, activeAccount, accounts])

  const availableMonths = useMemo(() => {
    const months = [...new Set(accountFiltered.map(t => t.date.substring(0, 7)))]
    return months.sort().reverse()
  }, [accountFiltered])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return accountFiltered
      .filter(t => t.date.startsWith(selectedMonth))
      .filter(t => {
        if (!q) return true
        return (
          (t.description || '').toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [accountFiltered, selectedMonth, search])

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

  const handleSaveEdit = (id, updates) => {
    onUpdate(id, updates)
    setEditingId(null)
  }

  const handleEdit = (id) => {
    setEditingId(id)
    setPendingDelete(null)
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

      {/* Filtre par compte */}
      <div className="flex gap-2">
        <button onClick={() => setActiveAccount('all')}
          className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${activeAccount === 'all' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
        >Tous</button>
        {accounts.map(a => (
          <button key={a.id} onClick={() => setActiveAccount(a.id)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${activeAccount === a.id ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
          >{a.name}</button>
        ))}
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher…"
          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Sélecteur de mois */}
      {availableMonths.length > 0 ? (
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-2 pb-1 w-max">
            {availableMonths.map(m => (
              <button key={m} onClick={() => setSelectedMonth(m)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedMonth === m ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >{monthLabel(m)}</button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-slate-400">Aucune transaction enregistrée</p>
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

      {filtered.length === 0 && availableMonths.length > 0 && (
        <div className="text-center py-8">
          <p className="text-slate-400 text-sm">Aucune transaction ce mois-ci</p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50">
          {filtered.map(t => (
            <div key={t.id}>
              {editingId === t.id ? (
                <EditRow
                  transaction={t}
                  accounts={accounts}
                  onSave={(updates) => handleSaveEdit(t.id, updates)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${t.type === 'income' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                    {ICONS[t.category] ?? '💳'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 text-sm font-medium truncate">{t.description || t.category}</p>
                    <p className="text-slate-400 text-xs">
                      {fmtDate(t.date)} · {t.category}
                      {t.account && accounts.length > 1 && (
                        <span className="ml-1 text-slate-300">· {accounts.find(a => a.id === t.account)?.name ?? ''}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <p className={`font-semibold text-sm ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.type === 'income' ? '+' : '−'}{fmt(t.amount)}
                    </p>
                    <button onClick={() => handleEdit(t.id)}
                      className="text-slate-300 hover:text-blue-400 p-1 rounded-lg transition-all" title="Modifier"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(t.id)}
                      className={`text-xs px-2 py-1 rounded-lg font-medium transition-all ${pendingDelete === t.id ? 'bg-rose-500 text-white' : 'text-slate-300 hover:text-slate-400'}`}
                    >
                      {pendingDelete === t.id ? 'Confirm.' : '✕'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
