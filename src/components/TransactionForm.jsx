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
  const isIncome = type === 'income'

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
        t => t.type === tx.type && t.category === tx.category &&
          t.description === tx.description && t.amount === tx.amount
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

  const inputClass = 'glass-input w-full rounded-2xl px-4 py-3.5'

  return (
    <div className="px-4 pb-4">
      <h2 className="text-2xl font-bold text-white tracking-tight mb-5">Nouvelle transaction</h2>

      {/* Sélecteur compte */}
      {accounts?.length > 1 && (
        <div className="glass rounded-2xl p-1 mb-4 flex">
          {accounts.map(a => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAccount(a.id)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={account === a.id
                ? { background: 'rgba(255,255,255,0.12)', color: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }
                : { color: 'rgba(255,255,255,0.4)' }
              }
            >
              {a.name}
            </button>
          ))}
        </div>
      )}

      {/* Sélecteur type — Dépense / Revenu */}
      <div className="glass rounded-2xl p-1 mb-4 flex">
        <button
          type="button"
          onClick={() => handleTypeChange('expense')}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
          style={!isIncome
            ? { background: 'linear-gradient(135deg,#e11d48,#f43f5e)', color: 'white', boxShadow: '0 2px 10px rgba(244,63,94,0.35)' }
            : { color: 'rgba(255,255,255,0.4)' }
          }
        >
          Dépense
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange('income')}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
          style={isIncome
            ? { background: 'linear-gradient(135deg,#059669,#10b981)', color: 'white', boxShadow: '0 2px 10px rgba(16,185,129,0.35)' }
            : { color: 'rgba(255,255,255,0.4)' }
          }
        >
          Revenu
        </button>
      </div>

      {/* Modèles récurrents */}
      {visibleTemplates.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2.5 px-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Modèles rapides
          </p>
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="flex gap-2 pb-1 w-max">
              {visibleTemplates.map(tpl => (
                <div
                  key={tpl.id}
                  className="glass rounded-2xl overflow-hidden shrink-0 flex items-center"
                >
                  <button
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    className="flex items-center gap-2 px-3 py-2.5 active:opacity-70"
                  >
                    <span className="text-lg">{getIconForCat(tpl.category, customExpenseCats)}</span>
                    <div className="text-left">
                      <p
                        className="text-xs font-semibold max-w-[80px] truncate"
                        style={{ color: 'rgba(255,255,255,0.8)' }}
                      >
                        {tpl.description || tpl.category}
                      </p>
                      <p
                        className="text-xs font-bold"
                        style={{ color: tpl.type === 'income' ? '#34d399' : '#f87171' }}
                      >
                        {fmt(tpl.amount)}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTemplate(tpl.id)}
                    className="px-2.5 py-2.5 transition-colors"
                    style={{ color: 'rgba(255,255,255,0.2)', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
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

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Montant */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Montant (€)
          </label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0,00"
            required
            className={`${inputClass} text-2xl font-bold`}
            style={{ letterSpacing: '-0.01em' }}
          />
        </div>

        {/* Catégorie */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Catégorie
          </label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            required
            className={`${inputClass} select-glass`}
          >
            <option value="">Sélectionner…</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Description <span style={{ color: 'rgba(255,255,255,0.2)', textTransform: 'none', fontWeight: 400 }}>(optionnel)</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Ex : Courses Carrefour"
            className={inputClass}
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        {/* Toggle modèle récurrent */}
        <div
          className="flex items-center justify-between px-4 py-3.5 rounded-2xl cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}
          onClick={() => setSaveAsRecurring(v => !v)}
        >
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {justSaved ? '✓ Modèle sauvegardé' : 'Sauvegarder comme modèle'}
          </span>
          <div
            className="w-11 h-6 rounded-full relative shrink-0 transition-all"
            style={{
              background: saveAsRecurring ? '#6366f1' : 'rgba(255,255,255,0.12)',
              boxShadow: saveAsRecurring ? '0 0 12px rgba(99,102,241,0.4)' : 'none',
            }}
          >
            <div
              className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
              style={{ transform: saveAsRecurring ? 'translateX(21px)' : 'translateX(2px)' }}
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className={`w-full py-4 rounded-2xl text-white font-bold text-base mt-1 transition-all active:scale-98 ${isIncome ? 'btn-income' : 'btn-expense'}`}
        >
          Ajouter {isIncome ? 'le revenu' : 'la dépense'}
        </button>
      </form>
    </div>
  )
}
