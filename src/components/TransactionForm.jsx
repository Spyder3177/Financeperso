import { useState } from 'react'

const INCOME_CATS = ['Salaire', 'Freelance', 'Investissements', 'Autres revenus']
const EXPENSE_CATS = ['Alimentation', 'Transport', 'Logement', 'Santé', 'Loisirs', 'Shopping', 'Abonnements', 'Sorties', 'Autres']

const todayStr = () => new Date().toISOString().split('T')[0]

export default function TransactionForm({ onAdd }) {
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(todayStr())

  const categories = type === 'income' ? INCOME_CATS : EXPENSE_CATS

  const handleTypeChange = (t) => {
    setType(t)
    setCategory('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!amount || !category || parseFloat(amount) <= 0) return
    onAdd({ type, amount: parseFloat(amount), category, description: description.trim(), date })
    setAmount('')
    setCategory('')
    setDescription('')
    setDate(todayStr())
  }

  const isIncome = type === 'income'

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold text-slate-800 mb-5">Nouvelle transaction</h2>

      {/* Sélecteur type */}
      <div className="flex bg-slate-100 rounded-xl p-1 mb-5">
        <button
          type="button"
          onClick={() => handleTypeChange('expense')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            !isIncome ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          Dépense
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange('income')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            isIncome ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          Revenu
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Montant */}
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

        {/* Catégorie */}
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

        {/* Description */}
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

        {/* Date */}
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
