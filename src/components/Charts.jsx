import { useState, useMemo } from 'react'
import { CATEGORY_COLORS, getColorForCat, getIconForCat } from '../categories'

const fmt = (amount) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)

const monthLabel = (ym) => {
  const [y, m] = ym.split('-')
  return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

const monthShort = (ym) => {
  const [y, m] = ym.split('-')
  return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'short' })
}

const currentYearMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────

function DonutChart({ segments }) {
  const r = 40
  const circumference = 2 * Math.PI * r

  if (segments.length === 0) {
    return (
      <svg viewBox="0 0 100 100" className="w-40 h-40">
        <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
      </svg>
    )
  }

  let startLen = 0
  const rendered = segments.map(seg => {
    const len = (seg.pct / 100) * circumference
    const result = { ...seg, len, startLen }
    startLen += len
    return result
  })

  return (
    <svg viewBox="0 0 100 100" className="w-40 h-40 -rotate-90">
      <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
      {rendered.map((seg, i) => (
        <circle
          key={i}
          cx={50} cy={50} r={r}
          fill="none"
          stroke={seg.color}
          strokeWidth="12"
          strokeDasharray={`${seg.len} ${circumference - seg.len}`}
          strokeDashoffset={-seg.startLen}
          strokeLinecap="butt"
          opacity="0.9"
        />
      ))}
    </svg>
  )
}

// ─── Balance Line Chart ───────────────────────────────────────────────────────

function BalanceLineChart({ transactions, months }) {
  const data = useMemo(() => {
    return months.slice(0, 6).reverse().map(ym => {
      const monthTx = transactions.filter(t => t.date.startsWith(ym))
      const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      return { ym, net: income - expense }
    })
  }, [transactions, months])

  if (data.length < 2) return null

  const W = 280
  const H = 120
  const PAD = { top: 14, right: 14, bottom: 26, left: 52 }
  const cW = W - PAD.left - PAD.right
  const cH = H - PAD.top - PAD.bottom

  const values = data.map(d => d.net)
  const minVal = Math.min(...values, 0)
  const maxVal = Math.max(...values, 0)
  const range = maxVal - minVal || 1

  const xOf = (i) => PAD.left + (i / (data.length - 1)) * cW
  const yOf = (v) => PAD.top + cH - ((v - minVal) / range) * cH
  const zeroY = yOf(0)
  const pts = data.map((d, i) => `${xOf(i)},${yOf(d.net)}`).join(' ')

  const fmtAxis = (v) => Math.abs(v) >= 1000
    ? `${Math.round(v / 100) / 10}k`
    : String(Math.round(v))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 120 }}>
      {/* Zero line */}
      <line x1={PAD.left} y1={zeroY} x2={W - PAD.right} y2={zeroY}
        stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="3,3" />

      {/* Area fills */}
      {data.map((d, i) => {
        if (i === data.length - 1) return null
        const x1 = xOf(i), x2 = xOf(i + 1)
        const y1 = yOf(d.net), y2 = yOf(data[i + 1].net)
        const positive = d.net >= 0 && data[i + 1].net >= 0
        const negative = d.net < 0 && data[i + 1].net < 0
        return (
          <polygon key={i}
            points={`${x1},${zeroY} ${x1},${y1} ${x2},${y2} ${x2},${zeroY}`}
            fill={positive ? 'rgba(52,211,153,0.12)' : negative ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.04)'}
          />
        )
      })}

      {/* Line */}
      <polyline points={pts} fill="none" stroke="#818cf8"
        strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {/* Points */}
      {data.map((d, i) => (
        <circle key={i} cx={xOf(i)} cy={yOf(d.net)} r="4"
          fill={d.net >= 0 ? '#34d399' : '#f87171'}
          stroke="rgba(11,11,30,0.8)" strokeWidth="2" />
      ))}

      {/* Labels X */}
      {data.map((d, i) => (
        <text key={i} x={xOf(i)} y={H - 4} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="8">
          {monthShort(d.ym)}
        </text>
      ))}

      {/* Labels Y */}
      <text x={PAD.left - 6} y={PAD.top + 4} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="7">
        {fmtAxis(maxVal)}€
      </text>
      {minVal < 0 && (
        <text x={PAD.left - 6} y={PAD.top + cH + 4} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="7">
          {fmtAxis(minVal)}€
        </text>
      )}
    </svg>
  )
}

// ─── Comparison Chart ─────────────────────────────────────────────────────────

function ComparisonChart({ transactions, monthA, monthB, customExpenseCats }) {
  const data = useMemo(() => {
    const spendOf = (ym) => {
      const result = {}
      transactions
        .filter(t => t.date.startsWith(ym) && t.type === 'expense')
        .forEach(t => { result[t.category] = (result[t.category] || 0) + t.amount })
      return result
    }
    const a = spendOf(monthA)
    const b = spendOf(monthB)
    const cats = [...new Set([...Object.keys(a), ...Object.keys(b)])]
    return cats
      .map(cat => ({ cat, a: a[cat] || 0, b: b[cat] || 0 }))
      .filter(row => row.a > 0 || row.b > 0)
      .sort((x, y) => (y.a + y.b) - (x.a + x.b))
  }, [transactions, monthA, monthB])

  if (data.length === 0) {
    return <p className="text-sm text-center py-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Aucune dépense sur ces mois</p>
  }

  const maxVal = Math.max(...data.flatMap(d => [d.a, d.b]), 1)
  const labelA = monthShort(monthA)
  const labelB = monthShort(monthB)

  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: '#818cf8' }} />
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>{monthLabel(monthA)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: '#c084fc' }} />
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>{monthLabel(monthB)}</span>
        </div>
      </div>

      {data.map(row => {
        const pctA = (row.a / maxVal) * 100
        const pctB = (row.b / maxVal) * 100
        const diff = row.b - row.a
        return (
          <div key={row.cat}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base shrink-0">{getIconForCat(row.cat, customExpenseCats)}</span>
              <span className="text-xs flex-1 font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{row.cat}</span>
              {row.a > 0 && row.b > 0 && (
                <span className="text-xs font-bold shrink-0" style={{ color: diff > 0 ? '#f87171' : '#34d399' }}>
                  {diff > 0 ? '+' : ''}{fmt(diff)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 text-right text-xs shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }}>{labelA}</div>
              <div className="flex-1 progress-track h-2">
                <div className="h-2 rounded-full transition-all" style={{ width: `${pctA}%`, background: '#818cf8' }} />
              </div>
              <div className="w-16 text-xs shrink-0 text-right" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {row.a > 0 ? fmt(row.a) : '—'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 text-right text-xs shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }}>{labelB}</div>
              <div className="flex-1 progress-track h-2">
                <div className="h-2 rounded-full transition-all" style={{ width: `${pctB}%`, background: '#c084fc' }} />
              </div>
              <div className="w-16 text-xs shrink-0 text-right" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {row.b > 0 ? fmt(row.b) : '—'}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Advanced Stats ───────────────────────────────────────────────────────────

function AdvancedStats({ transactions, customExpenseCats }) {
  const data = useMemo(() => {
    const months = [...new Set(transactions.map(t => t.date.substring(0, 7)))].sort()
    if (months.length === 0) return null

    const monthlyIncome = {}
    const monthlyExpense = {}
    months.forEach(ym => {
      const tx = transactions.filter(t => t.date.startsWith(ym))
      monthlyIncome[ym] = tx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      monthlyExpense[ym] = tx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    })

    const incomeValues = Object.values(monthlyIncome)
    const expenseValues = Object.values(monthlyExpense)
    const netValues = months.map(m => monthlyIncome[m] - monthlyExpense[m])

    const avgIncome = incomeValues.reduce((s, v) => s + v, 0) / months.length
    const avgExpense = expenseValues.reduce((s, v) => s + v, 0) / months.length
    const avgNet = netValues.reduce((s, v) => s + v, 0) / months.length

    const bestMonth = months.reduce((best, m) =>
      (monthlyIncome[m] - monthlyExpense[m]) > (monthlyIncome[best] - monthlyExpense[best]) ? m : best, months[0])
    const worstMonth = months.reduce((worst, m) =>
      (monthlyIncome[m] - monthlyExpense[m]) < (monthlyIncome[worst] - monthlyExpense[worst]) ? m : worst, months[0])

    const catTotals = {}
    transactions.filter(t => t.type === 'expense').forEach(t => {
      catTotals[t.category] = (catTotals[t.category] || 0) + t.amount
    })

    const catAvgs = Object.entries(catTotals)
      .map(([cat, total], i) => ({ cat, avg: total / months.length, color: getColorForCat(cat, customExpenseCats, i) }))
      .sort((a, b) => b.avg - a.avg)

    const ym = currentYearMonth()
    const last3 = months.filter(m => m < ym).slice(-3)
    const currentExpense = monthlyExpense[ym] || 0
    const avg3 = last3.length > 0 ? last3.reduce((s, m) => s + monthlyExpense[m], 0) / last3.length : null

    return {
      months, avgIncome, avgExpense, avgNet,
      bestMonth, worstMonth,
      bestNet: monthlyIncome[bestMonth] - monthlyExpense[bestMonth],
      worstNet: monthlyIncome[worstMonth] - monthlyExpense[worstMonth],
      catAvgs, currentExpense, avg3, ym,
    }
  }, [transactions, customExpenseCats])

  if (!data || data.months.length === 0) {
    return <p className="text-sm text-center py-6" style={{ color: 'rgba(255,255,255,0.35)' }}>Pas assez de données</p>
  }

  const maxAvg = Math.max(...data.catAvgs.map(c => c.avg), 1)

  return (
    <div className="space-y-4">
      {/* Moyennes */}
      <div className="glass rounded-3xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Moyennes mensuelles ({data.months.length} mois)
        </p>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <span style={{ color: '#34d399' }}>↑</span> Revenus
            </span>
            <span className="font-bold text-sm" style={{ color: '#34d399' }}>{fmt(data.avgIncome)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <span style={{ color: '#f87171' }}>↓</span> Dépenses
            </span>
            <span className="font-bold text-sm" style={{ color: '#f87171' }}>{fmt(data.avgExpense)}</span>
          </div>
          <div
            className="flex justify-between items-center pt-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
          >
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>Bilan net</span>
            <span className="font-bold text-sm" style={{ color: data.avgNet >= 0 ? '#34d399' : '#f87171' }}>
              {data.avgNet >= 0 ? '+' : ''}{fmt(data.avgNet)}
            </span>
          </div>
        </div>
      </div>

      {/* Ce mois vs 3 mois */}
      {data.avg3 !== null && (
        <div className="glass rounded-3xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Ce mois vs moyenne 3 derniers mois
          </p>
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Ce mois</p>
              <p className="text-2xl font-bold text-white">{fmt(data.currentExpense)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Moyenne 3 mois</p>
              <p className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>{fmt(data.avg3)}</p>
            </div>
          </div>
          {data.avg3 > 0 && (() => {
            const diff = data.currentExpense - data.avg3
            const pct = Math.round(Math.abs(diff / data.avg3) * 100)
            return (
              <div
                className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl"
                style={{ background: diff > 0 ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)' }}
              >
                <span className="font-bold" style={{ color: diff > 0 ? '#f87171' : '#34d399' }}>
                  {diff > 0 ? '▲' : '▼'} {pct}% {diff > 0 ? 'au-dessus' : 'en-dessous'} de la moyenne
                </span>
              </div>
            )
          })()}
        </div>
      )}

      {/* Meilleur / pire mois */}
      {data.months.length >= 2 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl p-4" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: '#34d399' }}>Meilleur mois</p>
            <p className="text-base font-bold text-white">{monthShort(data.bestMonth)}</p>
            <p className="text-xs mt-1" style={{ color: '#34d399' }}>{fmt(data.bestNet)}</p>
          </div>
          <div className="rounded-3xl p-4" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: '#f87171' }}>Mois le plus chargé</p>
            <p className="text-base font-bold text-white">{monthShort(data.worstMonth)}</p>
            <p className="text-xs mt-1" style={{ color: '#f87171' }}>{fmt(data.worstNet)}</p>
          </div>
        </div>
      )}

      {/* Moyennes par catégorie */}
      {data.catAvgs.length > 0 && (
        <div className="glass rounded-3xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Dépense moyenne / mois par catégorie
          </p>
          <div className="space-y-3">
            {data.catAvgs.map(row => (
              <div key={row.cat}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-base shrink-0">{getIconForCat(row.cat, customExpenseCats)}</span>
                  <span className="text-xs flex-1" style={{ color: 'rgba(255,255,255,0.65)' }}>{row.cat}</span>
                  <span className="text-xs font-bold text-white">{fmt(row.avg)}</span>
                </div>
                <div className="progress-track h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: `${(row.avg / maxAvg) * 100}%`, backgroundColor: row.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Month Selector ───────────────────────────────────────────────────────────

function MonthSelector({ months, value, onChange, exclude }) {
  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <div className="flex gap-2 pb-1 w-max">
        {months.filter(m => m !== exclude).map(m => (
          <button
            key={m}
            onClick={() => onChange(m)}
            className="px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all active:scale-95"
            style={value === m
              ? { background: 'rgba(99,102,241,0.3)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.45)' }
              : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }
            }
          >
            {monthLabel(m)}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Charts({ transactions, customExpenseCats = [] }) {
  const [mode, setMode] = useState('single')
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth())
  const [compareMonth, setCompareMonth] = useState(null)

  const availableMonths = useMemo(() => {
    const months = [...new Set(transactions.map(t => t.date.substring(0, 7)))]
    return months.sort().reverse()
  }, [transactions])

  const effectiveCompareMonth = compareMonth ?? (availableMonths.find(m => m !== selectedMonth) || null)

  const expenseByCategory = useMemo(() => {
    const monthTx = transactions.filter(t => t.date.startsWith(selectedMonth) && t.type === 'expense')
    const total = monthTx.reduce((s, t) => s + t.amount, 0)
    const byCategory = {}
    monthTx.forEach(t => { byCategory[t.category] = (byCategory[t.category] || 0) + t.amount })
    return Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amount], i) => ({
        cat, amount,
        pct: total > 0 ? (amount / total) * 100 : 0,
        color: getColorForCat(cat, customExpenseCats, i),
      }))
  }, [transactions, selectedMonth, customExpenseCats])

  const totalExpense = expenseByCategory.reduce((s, d) => s + d.amount, 0)

  if (availableMonths.length === 0) {
    return (
      <div className="px-4 text-center py-20">
        <p className="text-5xl mb-4">📊</p>
        <p className="font-semibold text-white" style={{ opacity: 0.6 }}>Aucune donnée à afficher</p>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Ajoutez des transactions pour voir les graphiques</p>
      </div>
    )
  }

  const modeBtn = (id, label) => (
    <button
      key={id}
      onClick={() => setMode(id)}
      className="flex-1 px-2 py-2.5 rounded-xl text-xs font-bold transition-all"
      style={mode === id
        ? { background: 'rgba(255,255,255,0.12)', color: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }
        : { color: 'rgba(255,255,255,0.38)' }
      }
    >
      {label}
    </button>
  )

  return (
    <div className="px-4 space-y-4 pb-4">
      <h2 className="text-2xl font-bold tracking-tight text-white">Graphiques</h2>

      {/* Toggle mode */}
      <div className="glass rounded-2xl p-1 flex">
        {modeBtn('single', 'Mois')}
        {availableMonths.length >= 2 && modeBtn('compare', 'Comparer')}
        {modeBtn('stats', 'Statistiques')}
      </div>

      {/* ── Vue mois unique ── */}
      {mode === 'single' && (
        <>
          <MonthSelector months={availableMonths} value={selectedMonth} onChange={setSelectedMonth} />

          {expenseByCategory.length > 0 ? (
            <div className="glass rounded-3xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Dépenses par catégorie
              </p>
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <DonutChart segments={expenseByCategory} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Total</p>
                      <p className="text-sm font-bold text-white">{fmt(totalExpense)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 space-y-2 min-w-0">
                  {expenseByCategory.map(d => (
                    <div key={d.cat} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-xs truncate flex-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
                        {getIconForCat(d.cat, customExpenseCats)} {d.cat}
                      </span>
                      <span className="text-xs font-bold text-white shrink-0">
                        {Math.round(d.pct)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass rounded-3xl p-8 text-center">
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Aucune dépense ce mois-ci</p>
            </div>
          )}

          {availableMonths.length >= 2 && (
            <div className="glass rounded-3xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Bilan mensuel — 6 derniers mois
              </p>
              <BalanceLineChart transactions={transactions} months={availableMonths} />
            </div>
          )}
        </>
      )}

      {/* ── Vue comparaison ── */}
      {mode === 'compare' && effectiveCompareMonth && (
        <>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: '#818cf8' }}>Mois A</p>
              <MonthSelector
                months={availableMonths}
                value={selectedMonth}
                onChange={(m) => {
                  setSelectedMonth(m)
                  if (m === effectiveCompareMonth) setCompareMonth(availableMonths.find(x => x !== m) || null)
                }}
                exclude={effectiveCompareMonth}
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: '#c084fc' }}>Mois B</p>
              <MonthSelector
                months={availableMonths}
                value={effectiveCompareMonth}
                onChange={setCompareMonth}
                exclude={selectedMonth}
              />
            </div>
          </div>

          <div className="glass rounded-3xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Dépenses par catégorie
            </p>
            <ComparisonChart
              transactions={transactions}
              monthA={selectedMonth}
              monthB={effectiveCompareMonth}
              customExpenseCats={customExpenseCats}
            />
          </div>
        </>
      )}

      {/* ── Vue statistiques ── */}
      {mode === 'stats' && (
        <AdvancedStats transactions={transactions} customExpenseCats={customExpenseCats} />
      )}
    </div>
  )
}
