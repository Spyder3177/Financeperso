import { useState, useEffect } from 'react'
import { getIconForCat } from '../categories'

const RECURRING_KEY = 'financeperso_recurring_v1'

const fmt = (amount) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)

const todayStr = () => new Date().toISOString().split('T')[0]

const loadTemplates = () => {
  try {
    const stored = localStorage.getItem(RECURRING_KEY)
    return stored ? JSON.parse(stored) : []
  } catch { return [] }
}

const saveTemplates = (list) => {
  localStorage.setItem(RECURRING_KEY, JSON.stringify(list))
}

export default function TransactionForm({ onAdd, accounts, expenseCats, incomeCats, customExpenseCats = [] }) {
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(todayStr())
  const [account, setAccount] = useState(accounts?.[0]?.id || '')
  const [saveAsRecurring, setSaveAsRecurring] = useState(false)
  const [templates, setTemplates] = useState(loadTemplates)
  const [justSaved, setJustSaved] = useState(false)

  const categories = type === 'income' ? incomeCats : expenseCats
  const visibleTemplates = templates.filter(t => t.type === type)

  const handleTypeChange = (t) => {
    setType(t)
    setCategory('')
  }

  const applyTemplate = (tpl) => {
    setAmount(String(tpl.amount))
    setCategory(tpl.category)
    setDescription(tpl.description)
  }

  const deleteTemplate = (id) => {
    const updated = templates.filter(t => t.id !== id)
    setTemplates(updated)
    saveTemplates(updated)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!amount || !category || parseFloat(amount) <= 0) return

    const tx = { type, amount: parseFloat(amount), category, description: description.trim(), date, account }
    onAdd(tx)

    if (saveAsRecurring) {
      const exists = templates.some(
        t => t.type === tx.type && t.category === tx.category && t.description === tx.description && t.amount === tx.amount
      )
      if (!exists) {
        const updated = [...templates, { id: Date.now().toString(), type: tx.type, amount: tx.amount, category: tx.category, description: tx.description }]
        setTemplates(updated)
        saveTemplates(updated)
      }
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2000)
    }

    setAmount('')
    setCategory('')
    setDescription('')
    setDate(todayStr())
    setSaveAsRecurring(false)
  }

  const isIncome = type === 'income'

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold text-slate-800 mb-4">Nouvelle transaction</h2>

      {/* Sélecteur compte */}
      {accounts?.length > 1 && (
        <div className="flex bg-slate-100 rounded-xl p-1 mb-4">
          {accounts.map(a => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAccount(a.id)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                account === a.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
              }`}
            >{a.name}</button>
          ))}
        </div>
      )}

      {/* Sélecteur type */}
      <div className="flex bg-slate-100 rounded-xl p-1 mb-4">
        <button
          type="button"
          onClick={() => handleTypeChange('expense')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            !isIncome ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'
          }`}
        >Dépense</button>
        <button
          type="button"
          onClick={() => handleTypeChange('income')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            isIncome ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'
          }`}
        >Revenu</button>
      </div>

      {/* Modèles récurrents */}
      {visibleTemplates.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Modèles</p>
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="flex gap-2 pb-1 w-max">
              {visibleTemplates.map(tpl => (
                <div key={tpl.id} className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shrink-0">
                  <button
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    className="flex items-center gap-2 px-3 py-2 active:bg-slate-50"
                  >
                    <span className="text-lg">{getIconForCat(tpl.category, customExpenseCats)}</span>
                    <div className="text-left">
                      <p className="text-xs font-semibold text-slate-700 max-w-[80px] truncate">
                        {tpl.description || tpl.category}
                      </p>
                      <p className={`text-xs font-bold ${tpl.type === 'income' ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {fmt(tpl.amount)}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTemplate(tpl.id)}
                    className="px-2 py-2 text-slate-300 hover:text-rose-400 transition-colors border-l border-slate-100"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Montant (€)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0,00"
            required
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Catégorie</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            required
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Sélectionner…</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">
            Description <span className="text-slate-400 font-normal">(optionnel)</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Ex : Courses Carrefour"
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Sauvegarder comme modèle */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div
            onClick={() => setSaveAsRecurring(v => !v)}
            className={`w-10 h-6 rounded-full transition-colors shrink-0 ${saveAsRecurring ? 'bg-blue-500' : 'bg-slate-200'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow mt-0.5 transition-transform ${saveAsRecurring ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-sm text-slate-600">
            {justSaved ? '✓ Modèle sauvegardé' : 'Sauvegarder comme modèle récurrent'}
          </span>
        </label>

        <button
          type="submit"
          className={`w-full py-4 rounded-xl text-white font-semibold text-base mt-2 transition-opacity active:opacity-80
            ${isIncome ? 'bg-emerald-500' : 'bg-rose-500'}`}
        >
          Ajouter {isIncome ? 'le revenu' : 'la dépense'}
        </button>
      </form>
    </div>
  )
}
