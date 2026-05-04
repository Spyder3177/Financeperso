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
    if (days < 0) return { text: 'Échéance dépassée', color: '#f87171' }
    if (days === 0) return { text: "Échéance aujourd'hui", color: '#fbbf24' }
    if (days <= 30) return { text: `${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''}`, color: '#fbbf24' }
    return { text: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }), color: 'rgba(255,255,255,0.35)' }
  }

  const dl = deadlineLabel()
  const progressColor = done ? '#34d399' : pct >= 80 ? '#fbbf24' : '#818cf8'

  return (
    <div
      className="glass rounded-3xl p-5"
      style={done ? { border: '1px solid rgba(52,211,153,0.25)', background: 'rgba(52,211,153,0.07)' } : {}}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{goal.emoji}</span>
          <div>
            <p className="text-sm font-semibold text-white">{goal.name}</p>
            {dl && <p className="text-xs mt-0.5" style={{ color: dl.color }}>{dl.text}</p>}
          </div>
        </div>
        <button
          onClick={() => onDelete(goal.id)}
          className="p-1.5 rounded-xl transition-all active:scale-90"
          style={{ color: 'rgba(255,255,255,0.2)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress */}
      <div className="progress-track h-2.5 mb-3 rounded-full" style={{ position: 'relative' }}>
        <div
          className="h-2.5 rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: done
              ? 'linear-gradient(90deg,#059669,#34d399)'
              : pct >= 80
                ? 'linear-gradient(90deg,#d97706,#fbbf24)'
                : 'linear-gradient(90deg,#4f46e5,#818cf8)',
            boxShadow: `0 0 10px ${progressColor}40`,
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm">
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
              className="glass-input w-24 rounded-xl px-2.5 py-1 text-sm"
            />
          ) : (
            <button
              onClick={() => { setEditing(true); setSavedValue(String(goal.saved)) }}
              className="font-bold transition-all"
              style={{ color: '#818cf8' }}
            >
              {fmt(goal.saved)}
            </button>
          )}
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>/ {fmt(goal.target)}</span>
        </div>
        <div className="text-right">
          {done ? (
            <span className="text-xs font-bold" style={{ color: '#34d399' }}>✓ Objectif atteint !</span>
          ) : (
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Reste {fmt(remaining)}</span>
          )}
        </div>
      </div>

      <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
        {Math.round(pct)}% accompli · touchez le montant pour modifier
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
    onAdd({ id: Date.now().toString(), name: name.trim(), target: targetVal, saved: parseFloat(saved) || 0, deadline: deadline || null, emoji })
  }

  const inputClass = 'glass-input w-full rounded-2xl px-4 py-3'

  return (
    <form
      onSubmit={handleSubmit}
      className="glass rounded-3xl p-5 space-y-3"
      style={{ border: '1px solid rgba(99,102,241,0.2)' }}
    >
      <h3 className="text-base font-bold text-white mb-1">Nouvel objectif</h3>

      {/* Emoji picker */}
      <div>
        <button
          type="button"
          onClick={() => setShowEmojis(v => !v)}
          className="text-3xl p-2 rounded-2xl transition-all"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          {emoji}
        </button>
        {showEmojis && (
          <div className="flex flex-wrap gap-2 mt-3">
            {EMOJIS.map(e => (
              <button
                key={e}
                type="button"
                onClick={() => { setEmoji(e); setShowEmojis(false) }}
                className="text-xl p-2 rounded-xl transition-all"
                style={e === emoji
                  ? { background: 'rgba(99,102,241,0.3)', border: '1px solid rgba(99,102,241,0.4)' }
                  : { background: 'rgba(255,255,255,0.06)' }
                }
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
        className={inputClass}
      />

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Objectif (€)</label>
          <input type="number" inputMode="decimal" min="1" step="1"
            value={target} onChange={e => setTarget(e.target.value)}
            placeholder="Ex : 3000" required
            className="glass-input w-full rounded-2xl px-3 py-3 text-sm"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Déjà épargné (€)</label>
          <input type="number" inputMode="decimal" min="0" step="1"
            value={saved} onChange={e => setSaved(e.target.value)}
            placeholder="0"
            className="glass-input w-full rounded-2xl px-3 py-3 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Échéance (optionnel)</label>
        <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
          className="glass-input w-full rounded-2xl px-4 py-3"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all active:opacity-70"
          style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.05)' }}
        >Annuler</button>
        <button type="submit"
          className="flex-1 py-3 rounded-2xl text-sm font-bold btn-primary"
        >Créer</button>
      </div>
    </form>
  )
}

export default function SavingsGoals({ goals, onGoalsChange }) {
  const [showForm, setShowForm] = useState(false)

  const addGoal = (goal) => { onGoalsChange(prev => [...prev, goal]); setShowForm(false) }
  const updateGoal = (id, updates) => { onGoalsChange(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g)) }
  const deleteGoal = (id) => { onGoalsChange(prev => prev.filter(g => g.id !== id)) }

  const totalTarget = goals.reduce((s, g) => s + g.target, 0)
  const totalSaved = goals.reduce((s, g) => s + g.saved, 0)

  return (
    <div className="space-y-4">
      {/* Récapitulatif */}
      {goals.length > 1 && (
        <div className="glass rounded-3xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Récapitulatif
          </p>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>Total épargné</span>
            <span className="font-bold text-white text-sm">
              {fmt(totalSaved)} <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>/ {fmt(totalTarget)}</span>
            </span>
          </div>
          <div className="progress-track h-2">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${Math.min(100, totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0)}%`,
                background: 'linear-gradient(90deg,#4f46e5,#818cf8)',
              }}
            />
          </div>
        </div>
      )}

      {goals.map(g => (
        <GoalCard key={g.id} goal={g} onUpdate={updateGoal} onDelete={deleteGoal} />
      ))}

      {showForm ? (
        <AddGoalForm onAdd={addGoal} onCancel={() => setShowForm(false)} />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-4 rounded-3xl text-sm font-semibold transition-all active:scale-98"
          style={{
            border: '2px dashed rgba(99,102,241,0.3)',
            color: '#818cf8',
            background: 'rgba(99,102,241,0.05)',
          }}
        >
          + Nouvel objectif d'épargne
        </button>
      )}

      {goals.length === 0 && !showForm && (
        <div className="text-center py-8">
          <p className="text-4xl mb-2">🎯</p>
          <p className="font-medium text-white" style={{ opacity: 0.55 }}>Aucun objectif pour l'instant</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Définissez un but d'épargne et suivez votre progression</p>
        </div>
      )}
    </div>
  )
}
