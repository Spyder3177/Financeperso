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

// ─── Donut Chart ─────────────────────────────────────────────────────────────

function DonutChart({ segments }) {
  const r = 40
  const circumference = 2 * Math.PI * r

  if (segments.length === 0) {
    return (
      <svg viewBox="0 0 100 100" className="w-40 h-40">
        <circle cx={50} cy={50} r={r} fill="none" stroke="#e2e8f0" strokeWidth="12" />
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
  const H = 110
  const PAD = { top: 12, right: 12, bottom: 22, left: 48 }
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
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 110 }}>
      <line x1={PAD.left} y1={zeroY} x2={W - PAD.right} y2={zeroY}
        stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3,3" />
      {data.map((d, i) => {
        if (i === data.length - 1) return null
        const x1 = xOf(i), x2 = xOf(i + 1)
        const y1 = yOf(d.net), y2 = yOf(data[i + 1].net)
        const positive = d.net >= 0 && data[i + 1].net >= 0
        const negative = d.net < 0 && data[i + 1].net < 0
        return (
          <polygon key={i}
            points={`${x1},${zeroY} ${x1},${y1} ${x2},${y2} ${x2},${zeroY}`}
            fill={positive ? '#d1fae5' : negative ? '#fee2e2' : '#f1f5f9'} opacity="0.7" />
        )
      })}
      <polyline points={pts} fill="none" stroke="#3b82f6"
        strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <circle key={i} cx={xOf(i)} cy={yOf(d.net)} r="3"
          fill={d.net >= 0 ? '#10b981' : '#ef4444'} stroke="white" strokeWidth="1.5" />
      ))}
      {data.map((d, i) => (
        <text key={i} x={xOf(i)} y={H - 4} textAnchor="middle" fill="#94a3b8" fontSize="7.5">
          {monthShort(d.ym)}
        </text>
      ))}
      <text x={PAD.left - 4} y={PAD.top + 4} textAnchor="end" fill="#94a3b8" fontSize="7">
        {fmtAxis(maxVal)}€
      </text>
      {minVal < 0 && (
        <text x={PAD.left - 4} y={PAD.top + cH + 4} textAnchor="end" fill="#94a3b8" fontSize="7">
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
    return <p className="text-slate-400 text-sm text-center py-4">Aucune dépense sur ces mois</p>
  }

  const maxVal = Math.max(...data.flatMap(d => [d.a, d.b]), 1)
  const labelA = monthShort(monthA)
  const labelB = monthShort(monthB)

  return (
    <div className="space-y-3">
      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-500" />
          <span className="text-slate-500">{monthLabel(monthA)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-violet-400" />
          <span className="text-slate-500">{monthLabel(monthB)}</span>
        </div>
      </div>

      {data.map(row => {
        const pctA = (row.a / maxVal) * 100
        const pctB = (row.b / maxVal) * 100
        const diff = row.b - row.a
        return (
          <div key={row.cat}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base shrink-0">{getIconForCat(row.cat, customExpenseCats)}</span>
              <span className="text-xs text-slate-600 flex-1 font-medium">{row.cat}</span>
              {row.a > 0 && row.b > 0 && (
                <span className={`text-xs font-semibold shrink-0 ${diff > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                  {diff > 0 ? '+' : ''}{fmt(diff)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-6 text-right text-xs text-slate-400 shrink-0">{labelA}</div>
              <div className="flex-1 bg-slate-100 rounded-full h-2">
                <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${pctA}%` }} />
              </div>
              <div className="w-16 text-xs text-slate-600 shrink-0 text-right">{row.a > 0 ? fmt(row.a) : '—'}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 text-right text-xs text-slate-400 shrink-0">{labelB}</div>
              <div className="flex-1 bg-slate-100 rounded-full h-2">
                <div className="h-2 rounded-full bg-violet-400 transition-all" style={{ width: `${pctB}%` }} />
              </div>
              <div className="w-16 text-xs text-slate-600 shrink-0 text-right">{row.b > 0 ? fmt(row.b) : '—'}</div>
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

    // Monthly totals
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

    // Best and worst months
    const bestMonth = months.reduce((best, m) => {
      const net = monthlyIncome[m] - monthlyExpense[m]
      return net > (monthlyIncome[best] - monthlyExpense[best]) ? m : best
    }, months[0])

    const worstMonth = months.reduce((worst, m) => {
      const net = monthlyIncome[m] - monthlyExpense[m]
      return net < (monthlyIncome[worst] - monthlyExpense[worst]) ? m : worst
    }, months[0])

    // Category averages
    const catTotals = {}
    const catMonths = {}
    transactions.filter(t => t.type === 'expense').forEach(t => {
      catTotals[t.category] = (catTotals[t.category] || 0) + t.amount
      if (!catMonths[t.category]) catMonths[t.category] = new Set()
      catMonths[t.category].add(t.date.substring(0, 7))
    })

    const catAvgs = Object.entries(catTotals)
      .map(([cat, total], i) => ({
        cat,
        avg: total / months.length,
        color: getColorForCat(cat, customExpenseCats, i),
      }))
      .sort((a, b) => b.avg - a.avg)

    // Current month vs 3-month avg
    const ym = currentYearMonth()
    const last3 = months.filter(m => m < ym).slice(-3)
    const currentExpense = monthlyExpense[ym] || 0
    const avg3 = last3.length > 0
      ? last3.reduce((s, m) => s + monthlyExpense[m], 0) / last3.length
      : null

    return {
      months, avgIncome, avgExpense, avgNet,
      bestMonth, worstMonth, bestNet: monthlyIncome[bestMonth] - monthlyExpense[bestMonth],
      worstNet: monthlyIncome[worstMonth] - monthlyExpense[worstMonth],
      catAvgs, currentExpense, avg3, ym,
    }
  }, [transactions, customExpenseCats])

  if (!data || data.months.length === 0) {
    return <p className="text-slate-400 text-sm text-center py-6">Pas assez de données</p>
  }

  const maxAvg = Math.max(...data.catAvgs.map(c => c.avg), 1)

  return (
    <div className="space-y-4">
      {/* Global averages */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Moyennes mensuelles ({data.months.length} mois)
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 flex items-center gap-1"><span className="text-emerald-500">↑</span> Revenus</span>
            <span className="font-bold text-emerald-600">{fmt(data.avgIncome)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 flex items-center gap-1"><span className="text-rose-500">↓</span> Dépenses</span>
            <span className="font-bold text-rose-600">{fmt(data.avgExpense)}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-slate-50 pt-2">
            <span className="text-slate-500">Bilan net</span>
            <span className={`font-bold ${data.avgNet >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {data.avgNet >= 0 ? '+' : ''}{fmt(data.avgNet)}
            </span>
          </div>
        </div>
      </div>

      {/* Current vs 3-month avg */}
      {data.avg3 !== null && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Ce mois vs moyenne 3 derniers mois
          </h3>
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-xs text-slate-400">Ce mois</p>
              <p className="text-xl font-bold text-slate-800">{fmt(data.currentExpense)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Moyenne 3 mois</p>
              <p className="text-base font-semibold text-slate-600">{fmt(data.avg3)}</p>
            </div>
          </div>
          {data.avg3 > 0 && (
            <div className="flex items-center gap-2 text-xs">
              {(() => {
                const diff = data.currentExpense - data.avg3
                const pct = Math.round(Math.abs(diff / data.avg3) * 100)
                return (
                  <span className={`font-semibold ${diff > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                    {diff > 0 ? '▲' : '▼'} {pct}% {diff > 0 ? 'au-dessus' : 'en-dessous'} de la moyenne
                  </span>
                )
              })()}
            </div>
          )}
        </div>
      )}

      {/* Best/worst months */}
      {data.months.length >= 2 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
            <p className="text-xs text-emerald-600 font-semibold mb-1">Meilleur mois</p>
            <p className="text-sm font-bold text-emerald-700">{monthShort(data.bestMonth)}</p>
            <p className="text-xs text-emerald-600 mt-1">{fmt(data.bestNet)}</p>
          </div>
          <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100">
            <p className="text-xs text-rose-600 font-semibold mb-1">Mois le plus chargé</p>
            <p className="text-sm font-bold text-rose-700">{monthShort(data.worstMonth)}</p>
            <p className="text-xs text-rose-600 mt-1">{fmt(data.worstNet)}</p>
          </div>
        </div>
      )}

      {/* Category averages */}
      {data.catAvgs.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Dépense moyenne par catégorie / mois
          </h3>
          <div className="space-y-2.5">
            {data.catAvgs.map(row => (
              <div key={row.cat}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base shrink-0">{getIconForCat(row.cat, customExpenseCats)}</span>
                  <span className="text-xs text-slate-600 flex-1">{row.cat}</span>
                  <span className="text-xs font-bold text-slate-700">{fmt(row.avg)}</span>
                </div>
                <div className="flex-1 bg-slate-100 rounded-full h-1.5">
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
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              value === m
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
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
  const [mode, setMode] = useState('single') // 'single' | 'compare' | 'stats'
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
      <div className="p-4 text-center py-16">
        <p className="text-4xl mb-3">📊</p>
        <p className="text-slate-500 font-medium">Aucune donnée à afficher</p>
        <p className="text-slate-400 text-sm mt-1">Ajoutez des transactions pour voir les graphiques</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header + toggle mode */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Graphiques</h2>
      </div>

      <div className="flex bg-slate-100 rounded-xl p-1 text-xs">
        <button
          onClick={() => setMode('single')}
          className={`flex-1 px-2 py-2 rounded-lg font-semibold transition-all ${mode === 'single' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400'}`}
        >
          Mois
        </button>
        {availableMonths.length >= 2 && (
          <button
            onClick={() => setMode('compare')}
            className={`flex-1 px-2 py-2 rounded-lg font-semibold transition-all ${mode === 'compare' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400'}`}
          >
            Comparer
          </button>
        )}
        <button
          onClick={() => setMode('stats')}
          className={`flex-1 px-2 py-2 rounded-lg font-semibold transition-all ${mode === 'stats' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400'}`}
        >
          Statistiques
        </button>
      </div>

      {/* ── Vue mois unique ── */}
      {mode === 'single' && (
        <>
          <MonthSelector months={availableMonths} value={selectedMonth} onChange={setSelectedMonth} />

          {expenseByCategory.length > 0 ? (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                Dépenses par catégorie
              </h3>
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <DonutChart segments={expenseByCategory} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-xs text-slate-400">Total</p>
                      <p className="text-sm font-bold text-slate-700">{fmt(totalExpense)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 space-y-2 min-w-0">
                  {expenseByCategory.map(d => (
                    <div key={d.cat} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-xs text-slate-600 truncate flex-1">
                        {getIconForCat(d.cat, customExpenseCats)} {d.cat}
                      </span>
                      <span className="text-xs font-semibold text-slate-700 shrink-0">
                        {Math.round(d.pct)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
              <p className="text-slate-400 text-sm">Aucune dépense ce mois-ci</p>
            </div>
          )}

          {availableMonths.length >= 2 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Bilan mensuel — 6 derniers mois
              </h3>
              <BalanceLineChart transactions={transactions} months={availableMonths} />
            </div>
          )}
        </>
      )}

      {/* ── Vue comparaison ── */}
      {mode === 'compare' && effectiveCompareMonth && (
        <>
          <div className="space-y-2">
            <div>
              <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-1.5 px-1">Mois A</p>
              <MonthSelector
                months={availableMonths}
                value={selectedMonth}
                onChange={(m) => { setSelectedMonth(m); if (m === effectiveCompareMonth) setCompareMonth(availableMonths.find(x => x !== m) || null) }}
                exclude={effectiveCompareMonth}
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-violet-500 uppercase tracking-wider mb-1.5 px-1">Mois B</p>
              <MonthSelector
                months={availableMonths}
                value={effectiveCompareMonth}
                onChange={setCompareMonth}
                exclude={selectedMonth}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Dépenses par catégorie
            </h3>
            <ComparisonChart
              transactions={transactions}
              monthA={selectedMonth}
              monthB={effectiveCompareMonth}
              customExpenseCats={customExpenseCats}
            />
          </div>
        </>
      )}

      {/* ── Vue statistiques avancées ── */}
      {mode === 'stats' && (
        <AdvancedStats transactions={transactions} customExpenseCats={customExpenseCats} />
      )}
    </div>
  )
}
