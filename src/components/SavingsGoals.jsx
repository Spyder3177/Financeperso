import { useState } from 'react'
import { GOALS_KEY } from '../categories'

const fmt = (amount) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)

const EMOJIS = ['🎯', '🏠', '🚗', '✈️', '💍', '🎓', '🏖️', '💻', '🏋️', '🎸', '🌍', '👶', '🐾', '🎁', '💡']

function GoalCard({ goal, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [savedValue, setSavedValue] = useState(String(goal.saved))

  const pct = goal.target > 0 ? Math.min(100, (goal.saved / goal.target) * 100) : 0
  const remaining = Math.max(0, goal.target - goal.saved)
  const done = goal.saved >= goal.target

  const confirmSaved = () => {
    const val = parseFloat(savedValue)
    if (!isNaN(val) && val >= 0) onUpdate(goal.id, { saved: val })
    setEditing(false)
  }

  const deadlineLabel = () => {
    if (!goal.deadline) return null
    const d = new Date(goal.deadline + 'T12:00:00')
    const today = new Date()
    const days = Math.ceil((d - today) / 86400000)
    if (days < 0) return { text: 'Échéance dépassée', color: 'text-rose-500' }
    if (days === 0) return { text: "Échéance aujourd'hui", color: 'text-amber-500' }
    if (days <= 30) return { text: `${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''}`, color: 'text-amber-500' }
    return { text: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }), color: 'text-slate-400' }
  }

  const dl = deadlineLabel()

  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border ${done ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{goal.emoji}</span>
          <div>
            <p className="text-sm font-semibold text-slate-800">{goal.name}</p>
            {dl && <p className={`text-xs ${dl.color}`}>{dl.text}</p>}
          </div>
        </div>
        <button
          onClick={() => onDelete(goal.id)}
          className="text-slate-300 hover:text-rose-400 transition-colors p-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2">
        <div
          className={`h-2.5 rounded-full transition-all ${done ? 'bg-emerald-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm">
          {editing ? (
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              value={savedValue}
              onChange={e => setSavedValue(e.target.value)}
              onBlur={confirmSaved}
              onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
              autoFocus
              className="w-24 border border-blue-400 rounded-lg px-2 py-0.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          ) : (
            <button
              onClick={() => { setEditing(true); setSavedValue(String(goal.saved)) }}
              className="font-bold text-blue-600 hover:underline"
            >
              {fmt(goal.saved)}
            </button>
          )}
          <span className="text-slate-400">/ {fmt(goal.target)}</span>
        </div>
        <div className="text-right">
          {done ? (
            <span className="text-xs font-bold text-emerald-600">✓ Objectif atteint !</span>
          ) : (
            <span className="text-xs text-slate-400">Reste {fmt(remaining)}</span>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-1">
        {Math.round(pct)}% accompli — touchez le montant pour modifier
      </p>
    </div>
  )
}

function AddGoalForm({ onAdd, onCancel }) {
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [saved, setSaved] = useState('0')
  const [deadline, setDeadline] = useState('')
  const [emoji, setEmoji] = useState('🎯')
  const [showEmojis, setShowEmojis] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    const targetVal = parseFloat(target)
    if (!name.trim() || isNaN(targetVal) || targetVal <= 0) return
    onAdd({
      id: Date.now().toString(),
      name: name.trim(),
      target: targetVal,
      saved: parseFloat(saved) || 0,
      deadline: deadline || null,
      emoji,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 shadow-sm border border-blue-100 space-y-3">
      <h3 className="text-sm font-semibold text-slate-700">Nouvel objectif</h3>

      {/* Emoji picker */}
      <div>
        <button
          type="button"
          onClick={() => setShowEmojis(v => !v)}
          className="text-3xl p-1 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors"
        >
          {emoji}
        </button>
        {showEmojis && (
          <div className="flex flex-wrap gap-2 mt-2">
            {EMOJIS.map(e => (
              <button
                key={e}
                type="button"
                onClick={() => { setEmoji(e); setShowEmojis(false) }}
                className={`text-xl p-1 rounded-lg transition-colors ${e === emoji ? 'bg-blue-100' : 'hover:bg-slate-100'}`}
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>

      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Nom de l'objectif (ex : Vacances)"
        required
        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-xs text-slate-400 mb-1">Objectif (€)</label>
          <input
            type="number"
            inputMode="decimal"
            min="1"
            step="1"
            value={target}
            onChange={e => setTarget(e.target.value)}
            placeholder="Ex : 3000"
            required
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-slate-400 mb-1">Déjà épargné (€)</label>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="1"
            value={saved}
            onChange={e => setSaved(e.target.value)}
            placeholder="0"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1">Échéance (optionnel)</label>
        <input
          type="date"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold active:opacity-80"
        >
          Créer
        </button>
      </div>
    </form>
  )
}

export default function SavingsGoals({ goals, onGoalsChange }) {
  const [showForm, setShowForm] = useState(false)

  const addGoal = (goal) => {
    onGoalsChange(prev => [...prev, goal])
    setShowForm(false)
  }

  const updateGoal = (id, updates) => {
    onGoalsChange(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g))
  }

  const deleteGoal = (id) => {
    onGoalsChange(prev => prev.filter(g => g.id !== id))
  }

  const totalTarget = goals.reduce((s, g) => s + g.target, 0)
  const totalSaved = goals.reduce((s, g) => s + g.saved, 0)

  return (
    <div className="space-y-4">
      {/* Summary */}
      {goals.length > 1 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">Récapitulatif</p>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-500">Total épargné</span>
            <span className="font-bold text-slate-800">{fmt(totalSaved)} <span className="font-normal text-slate-400">/ {fmt(totalTarget)}</span></span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-blue-500 transition-all"
              style={{ width: `${Math.min(100, totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0)}%` }}
            />
          </div>
        </div>
      )}

      {/* Goal cards */}
      {goals.map(g => (
        <GoalCard key={g.id} goal={g} onUpdate={updateGoal} onDelete={deleteGoal} />
      ))}

      {/* Add goal form or button */}
      {showForm ? (
        <AddGoalForm onAdd={addGoal} onCancel={() => setShowForm(false)} />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-blue-200 text-blue-500 text-sm font-semibold hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          + Nouvel objectif d'épargne
        </button>
      )}

      {goals.length === 0 && !showForm && (
        <div className="text-center py-6">
          <p className="text-4xl mb-2">🎯</p>
          <p className="text-slate-500 text-sm font-medium">Aucun objectif pour l'instant</p>
          <p className="text-slate-400 text-xs mt-1">Définissez un but d'épargne et suivez votre progression</p>
        </div>
      )}
    </div>
  )
}
