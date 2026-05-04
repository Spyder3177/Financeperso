import { useState, useMemo } from 'react'
import { INCOME_CATS, EXPENSE_CATS, getIconForCat } from '../categories'

const fmt = (amount) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)

const fmtDate = (dateStr) =>
  new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

const monthLabel = (ym) => {
  const [y, m] = ym.split('-')
  return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

const currentYearMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function EditRow({ transaction, accounts, expenseCats, incomeCats, onSave, onCancel }) {
  const [type, setType] = useState(transaction.type)
  const [amount, setAmount] = useState(String(transaction.amount))
  const [category, setCategory] = useState(transaction.category)
  const [description, setDescription] = useState(transaction.description || '')
  const [date, setDate] = useState(transaction.date)
  const [account, setAccount] = useState(transaction.account || accounts[0]?.id || '')

  const cats = type === 'income' ? incomeCats : expenseCats

  const handleTypeChange = (t) => {
    setType(t)
    const newCats = t === 'income' ? incomeCats : expenseCats
    if (!newCats.includes(category)) setCategory(newCats[0])
  }

  const handleSave = () => {
    const parsed = parseFloat(amount)
    if (!parsed || parsed <= 0 || !category || !date) return
    onSave({ type, amount: parsed, category, description: description.trim(), date, account })
  }

  const inputClass = 'glass-input rounded-xl px-3 py-2.5 w-full text-sm'

  return (
    <div
      className="px-4 py-4 space-y-3"
      style={{ background: 'rgba(99,102,241,0.08)', borderTop: '1px solid rgba(99,102,241,0.15)', borderBottom: '1px solid rgba(99,102,241,0.15)' }}
    >
      {/* Type */}
      <div
        className="flex rounded-xl p-1"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <button type="button" onClick={() => handleTypeChange('expense')}
          className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
          style={type === 'expense'
            ? { background: 'linear-gradient(135deg,#e11d48,#f43f5e)', color: 'white' }
            : { color: 'rgba(255,255,255,0.4)' }
          }
        >Dépense</button>
        <button type="button" onClick={() => handleTypeChange('income')}
          className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
          style={type === 'income'
            ? { background: 'linear-gradient(135deg,#059669,#10b981)', color: 'white' }
            : { color: 'rgba(255,255,255,0.4)' }
          }
        >Revenu</button>
      </div>

      <div className="flex gap-2">
        <input type="number" inputMode="decimal" step="0.01" min="0.01" value={amount}
          onChange={e => setAmount(e.target.value)} placeholder="0,00"
          className={`${inputClass} flex-1 font-semibold`}
        />
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className={`${inputClass} flex-1`}
        />
      </div>

      <select value={category} onChange={e => setCategory(e.target.value)} className={inputClass}>
        {cats.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      <input type="text" value={description} onChange={e => setDescription(e.target.value)}
        placeholder="Description (optionnel)"
        className={inputClass}
      />

      {accounts.length > 1 && (
        <div
          className="flex rounded-xl p-1"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          {accounts.map(a => (
            <button key={a.id} type="button" onClick={() => setAccount(a.id)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
              style={account === a.id
                ? { background: 'rgba(255,255,255,0.15)', color: 'white' }
                : { color: 'rgba(255,255,255,0.4)' }
              }
            >{a.name}</button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:opacity-70"
          style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.05)' }}
        >Annuler</button>
        <button onClick={handleSave}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:opacity-80 btn-primary"
        >Enregistrer</button>
      </div>
    </div>
  )
}

function exportToCSV(transactions, selectedMonth) {
  const headers = ['Date', 'Type', 'Montant', 'Catégorie', 'Description', 'Compte']
  const rows = transactions.map(t => [
    t.date,
    t.type === 'income' ? 'Revenu' : 'Dépense',
    t.amount.toFixed(2).replace('.', ','),
    t.category,
    t.description || '',
    t.account || 'moi',
  ])
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    .join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `transactions-${selectedMonth}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function TransactionList({
  transactions, accounts, expenseCats, incomeCats,
  customExpenseCats = [], onDelete, onUpdate, onImport,
}) {
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
        return (t.description || '').toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
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

  const handleSaveEdit = (id, updates) => { onUpdate(id, updates); setEditingId(null) }
  const handleEdit = (id) => { setEditingId(id); setPendingDelete(null) }

  return (
    <div className="px-4 space-y-4 pb-4">
      {/* Header + actions */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-2xl font-bold tracking-tight text-white">Historique</h2>
        <div className="flex gap-2">
          {filtered.length > 0 && (
            <button
              onClick={() => exportToCSV(filtered, selectedMonth)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl active:opacity-70 transition-all"
              style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Export
            </button>
          )}
          <button
            onClick={onImport}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl active:opacity-70 transition-all"
            style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Importer
          </button>
        </div>
      </div>

      {/* Filtre compte */}
      <div className="flex gap-2">
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

      {/* Recherche */}
      <div className="relative">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: 'rgba(255,255,255,0.25)' }}
          fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher…"
          className="glass-input w-full rounded-2xl pl-10 pr-4 py-3"
        />
      </div>

      {/* Sélecteur de mois */}
      {availableMonths.length > 0 ? (
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-2 pb-1 w-max">
            {availableMonths.map(m => (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                className="px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all active:scale-95"
                style={selectedMonth === m
                  ? { background: 'rgba(99,102,241,0.3)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.45)' }
                  : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }
                }
              >
                {monthLabel(m)}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-14">
          <p className="text-3xl mb-3">📋</p>
          <p style={{ color: 'rgba(255,255,255,0.4)' }}>Aucune transaction enregistrée</p>
        </div>
      )}

      {/* Totaux du mois */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-2xl p-3.5">
            <p className="text-xs font-medium mb-1" style={{ color: '#34d399' }}>↑ Revenus</p>
            <p className="font-bold text-base" style={{ color: '#34d399' }}>{fmt(totals.income)}</p>
          </div>
          <div className="glass rounded-2xl p-3.5">
            <p className="text-xs font-medium mb-1" style={{ color: '#f87171' }}>↓ Dépenses</p>
            <p className="font-bold text-base" style={{ color: '#f87171' }}>{fmt(totals.expense)}</p>
          </div>
        </div>
      )}

      {filtered.length === 0 && availableMonths.length > 0 && (
        <div className="text-center py-8">
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Aucune transaction ce mois-ci</p>
        </div>
      )}

      {/* Liste transactions */}
      {filtered.length > 0 && (
        <div className="glass rounded-3xl overflow-hidden">
          {filtered.map((t, i) => (
            <div key={t.id} style={i > 0 ? { borderTop: '1px solid rgba(255,255,255,0.05)' } : {}}>
              {editingId === t.id ? (
                <EditRow
                  transaction={t}
                  accounts={accounts}
                  expenseCats={expenseCats}
                  incomeCats={incomeCats}
                  customExpenseCats={customExpenseCats}
                  onSave={(updates) => handleSaveEdit(t.id, updates)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="flex items-center gap-3 px-4 py-3.5 active:bg-white/5 transition-colors">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: t.type === 'income' ? 'rgba(52,211,153,0.14)' : 'rgba(248,113,113,0.14)' }}
                  >
                    {getIconForCat(t.category, customExpenseCats)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>
                      {t.description || t.category}
                    </p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.32)' }}>
                      {fmtDate(t.date)} · {t.category}
                      {t.account && accounts.length > 1 && (
                        <span style={{ color: 'rgba(255,255,255,0.2)' }}> · {accounts.find(a => a.id === t.account)?.name ?? ''}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <p
                      className="font-semibold text-sm mr-1"
                      style={{ color: t.type === 'income' ? '#34d399' : '#f87171' }}
                    >
                      {t.type === 'income' ? '+' : '−'}{fmt(t.amount)}
                    </p>
                    <button
                      onClick={() => handleEdit(t.id)}
                      className="p-1.5 rounded-xl transition-all active:scale-90"
                      style={{ color: 'rgba(255,255,255,0.2)' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="px-2 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-90"
                      style={pendingDelete === t.id
                        ? { background: '#f43f5e', color: 'white' }
                        : { color: 'rgba(255,255,255,0.2)' }
                      }
                    >
                      {pendingDelete === t.id ? 'Suppr.' : '✕'}
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
