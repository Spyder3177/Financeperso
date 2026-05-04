import { useState, useRef, useMemo } from 'react'

const INCOME_CATS  = ['Salaire', 'Freelance', 'Investissements', 'Autres revenus']
const EXPENSE_CATS = ['Alimentation', 'Transport', 'Logement', 'Santé', 'Loisirs', 'Shopping', 'Abonnements', 'Sorties', 'Autres']
const ALL_CATS     = [...INCOME_CATS, ...EXPENSE_CATS]

const RULES = [
  { p: /SALAIRE|PAIE\b|TRAITEMENT|APPOINTEMENT/i,                                      type: 'income',  cat: 'Salaire' },
  { p: /CAF\b|APL\b|RSA\b|PRIME.ACTIVITE|AIDE.LOGEMENT/i,                             type: 'income',  cat: 'Autres revenus' },
  { p: /CARREFOUR|LECLERC|LIDL|ALDI|INTERMARCHE|SUPER.?U|CASINO|MONOPRIX|FRANPRIX|AUCHAN|PICARD|BIOCOOP|CORA\b|NETTO\b/i, type: 'expense', cat: 'Alimentation' },
  { p: /BOULANGERIE|PATISSERIE|EPICERIE|FRUITS.LEG|PRIMEUR/i,                          type: 'expense', cat: 'Alimentation' },
  { p: /SNCF|RATP|TRANSILIEN|KEOLIS|NAVIGO|VELIB|TIER\b|FLIXBUS|OUIBUS/i,             type: 'expense', cat: 'Transport' },
  { p: /TOTAL\b|BP\b|ESSO|SHELL|LECLERC.CARB|STATION|AUTOROUTE|VINCI/i,               type: 'expense', cat: 'Transport' },
  { p: /UBER\b|LYFT|TAXI|BLABLACAR/i,                                                  type: 'expense', cat: 'Transport' },
  { p: /EDF\b|ENEDIS|GDF\b|SUEZ\b|VEOLIA|GAZ\b|ELECTRICITE|FIOUL/i,                  type: 'expense', cat: 'Logement' },
  { p: /LOYER|BAIL|CHARGES.COPRO|SYNDIC|CREDIT.IMMO|PRET.IMMO/i,                      type: 'expense', cat: 'Logement' },
  { p: /MAIF\b|MATMUT|AXA\b|ALLIANZ|MMA\b|MACIF|GROUPAMA|ASSURANCE/i,                type: 'expense', cat: 'Logement' },
  { p: /PHARMACIE|PHARMA|MEDECIN|DOCTEUR|HOPITAL|CLINIQUE|CPAM|MUTUELLE|DENTISTE|OPTICIEN|KIN[EÉ]/i, type: 'expense', cat: 'Santé' },
  { p: /NETFLIX|SPOTIFY|DEEZER|DISNEY|CANAL\+|AMAZON.PRIME|APPLE|YOUTUBE/i,           type: 'expense', cat: 'Abonnements' },
  { p: /SFR\b|ORANGE\b|FREE\b|BOUYGUES|SOSH\b|B&YOU|NRJ.MOBILE|NUMERICABLE/i,        type: 'expense', cat: 'Abonnements' },
  { p: /AMAZON|FNAC\b|DARTY|H&M\b|ZARA\b|PRIMARK|ZALANDO|SHEIN|ASOS\b|CDISCOUNT/i,  type: 'expense', cat: 'Shopping' },
  { p: /CINEMA|THEATRE|CONCERT|SALLE.SPORT|PISCINE|MUSEE|BOWLING/i,                   type: 'expense', cat: 'Loisirs' },
  { p: /RESTAURANT|BISTROT|BRASSERIE|PIZZERIA|MCDO|MCDONALD|KFC\b|BURGER|STARBUCKS|PAUL\b|SUSHI/i, type: 'expense', cat: 'Sorties' },
]

function autoCategory(libelle, type) {
  for (const r of RULES) {
    if (r.type === type && r.p.test(libelle)) return r.cat
  }
  return type === 'income' ? 'Autres revenus' : 'Autres'
}

function parseAmount(str) {
  if (!str?.trim()) return 0
  // Supprime espaces, séparateurs de milliers, puis remplace virgule par point
  return parseFloat(str.replace(/\s/g, '').replace(/ /g, '').replace(',', '.')) || 0
}

function parseDate(str) {
  const m = str?.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return null
  return `${m[3]}-${m[2]}-${m[1]}`
}

// Tokeniseur CSV complet : gère les champs quotés avec retours à la ligne internes
function tokenizeCSV(text, sep) {
  const rows = []
  let row = []
  let field = ''
  let inQuote = false
  const n = text.length

  for (let i = 0; i < n; i++) {
    const c = text[i]
    if (c === '"') {
      if (inQuote && text[i + 1] === '"') { field += '"'; i++ } // "" = guillemet échappé
      else inQuote = !inQuote
    } else if (c === sep && !inQuote) {
      row.push(field.trim()); field = ''
    } else if ((c === '\n' || c === '\r') && !inQuote) {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field.trim())
      if (row.some(Boolean)) rows.push(row)
      row = []; field = ''
    } else {
      field += c
    }
  }
  if (field || row.length) { row.push(field.trim()); if (row.some(Boolean)) rows.push(row) }
  return rows
}

function parseCSV(text) {
  // Supprime le BOM UTF-8 si présent
  const clean = text.replace(/^﻿/, '')

  // Détecte le séparateur sur les 20 premières lignes
  const sample = clean.slice(0, 2000)
  const sep = (sample.match(/;/g) || []).length >= (sample.match(/,/g) || []).length ? ';' : ','

  const allRows = tokenizeCSV(clean, sep)

  // Trouve la ligne d'en-tête (contient "Date" en col 0 et "Libellé" quelque part)
  let headerRowIdx = -1
  for (let i = 0; i < allRows.length; i++) {
    const r = allRows[i]
    if (/^date$/i.test(r[0] || '') && r.some(h => /libell/i.test(h))) {
      headerRowIdx = i; break
    }
  }
  if (headerRowIdx === -1) throw new Error("En-tête introuvable. Vérifie que c'est bien un export Crédit Agricole.")

  const headers = allRows[headerRowIdx]
  const dateIdx    = headers.findIndex(h => /^date$/i.test(h))
  const libIdx     = headers.findIndex(h => /libell/i.test(h))
  // Regex volontairement larges pour résister aux encodages et variantes de libellés
  const debitIdx   = headers.findIndex(h => /d.?bit/i.test(h))
  const creditIdx  = headers.findIndex(h => /cr.?dit/i.test(h))
  const montantIdx = headers.findIndex(h => /montant/i.test(h))

  if (dateIdx === -1 || libIdx === -1) throw new Error('Colonnes Date ou Libellé introuvables.')

  const txs = []
  for (let i = headerRowIdx + 1; i < allRows.length; i++) {
    const cols = allRows[i]
    const date    = parseDate(cols[dateIdx] || '')
    const libelle = (cols[libIdx] || '').replace(/\n/g, ' ').trim()
    if (!date || !libelle) continue

    let amount = 0, type = null

    if (montantIdx >= 0 && creditIdx < 0) {
      // Format avec colonne Montant unique (valeur négative = dépense)
      const v = parseAmount(cols[montantIdx] || '')
      if (v > 0)  { amount = v;  type = 'income' }
      if (v < 0)  { amount = -v; type = 'expense' }
    } else {
      const debit  = debitIdx  >= 0 ? parseAmount(cols[debitIdx]  || '') : 0
      // Si pas de colonne crédit détectée, tente la 4e colonne (index 3) par défaut
      const cIdx   = creditIdx >= 0 ? creditIdx : 3
      const credit = cIdx < cols.length ? parseAmount(cols[cIdx] || '') : 0
      if (debit  > 0) { amount = debit;  type = 'expense' }
      if (credit > 0) { amount = credit; type = 'income' }
    }

    if (type && amount > 0) {
      txs.push({ date, description: libelle, amount, type, category: autoCategory(libelle, type) })
    }
  }
  if (txs.length === 0) throw new Error('Aucune transaction trouvée. Le fichier est peut-être vide ou dans un format inattendu.')
  return txs
}

const fmt = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

const CAT_ICONS = {
  'Salaire':'💼','Freelance':'💻','Investissements':'📈','Autres revenus':'💰',
  'Alimentation':'🛒','Transport':'🚗','Logement':'🏠','Santé':'🏥',
  'Loisirs':'🎮','Shopping':'🛍️','Abonnements':'📱','Sorties':'🍽️','Autres':'📦',
}

export default function ImportCSV({ onImport, onClose }) {
  const [step, setStep]       = useState('upload')
  const [rows, setRows]       = useState([])
  const [remap, setRemap]     = useState({})  // { 'originalCat': 'newCat' }
  const [error, setError]     = useState('')
  const [importedCount, setImportedCount] = useState(0)
  const fileRef = useRef()

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setError('')
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const txs = parseCSV(ev.target.result)
        setRows(txs)
        setRemap({})
        setStep('preview')
      } catch (err) {
        setError(err.message)
      }
    }
    reader.readAsText(file, 'latin1')
  }

  // Résumé groupé par catégorie (applique les remappings)
  const summary = useMemo(() => {
    const map = {}
    for (const r of rows) {
      const cat = remap[r.category] ?? r.category
      const key = `${r.type}|${cat}`
      if (!map[key]) map[key] = { type: r.type, category: cat, originalCat: r.category, count: 0, total: 0 }
      map[key].count++
      map[key].total += r.amount
    }
    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [rows, remap])

  const dateRange = useMemo(() => {
    if (!rows.length) return ''
    const dates = rows.map(r => r.date).sort()
    const fmt2 = d => new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
    const first = fmt2(dates[0])
    const last  = fmt2(dates[dates.length - 1])
    return first === last ? first : `${first} → ${last}`
  }, [rows])

  const totalIncome  = useMemo(() => rows.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0), [rows])
  const totalExpense = useMemo(() => rows.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0), [rows])

  const handleRemap = (originalCat, newCat) => {
    setRemap(prev => ({ ...prev, [originalCat]: newCat }))
  }

  const handleImport = () => {
    const toImport = rows.map(r => ({
      ...r,
      category: remap[r.category] ?? r.category,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`
    }))
    setImportedCount(toImport.length)
    onImport(toImport)
    setStep('done')
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
        <button onClick={onClose} className="text-slate-400 p-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="font-bold text-slate-800">Importer CSV</h2>
        <div className="w-8" />
      </div>

      {/* ── UPLOAD ── */}
      {step === 'upload' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-5">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-800 mb-1">Sélectionner ton fichier CSV</p>
            <p className="text-slate-400 text-sm">Export Crédit Agricole · Format .csv</p>
          </div>
          {error && <p className="text-rose-600 text-sm text-center bg-rose-50 px-4 py-3 rounded-xl">{error}</p>}
          <button
            onClick={() => fileRef.current.click()}
            className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-semibold active:opacity-80"
          >
            Choisir le fichier
          </button>
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
          <p className="text-slate-400 text-xs text-center leading-relaxed">
            Dans l'appli Crédit Agricole :<br />
            Comptes → Relevé → Télécharger → CSV
          </p>
        </div>
      )}

      {/* ── PREVIEW ── */}
      {step === 'preview' && (
        <>
          {/* Résumé global */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-slate-800">{rows.length} transactions</p>
              <p className="text-slate-400 text-sm">{dateRange}</p>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 bg-emerald-50 rounded-xl px-3 py-2">
                <p className="text-xs text-emerald-600 mb-0.5">Revenus</p>
                <p className="font-bold text-emerald-700 text-sm">{fmt(totalIncome)}</p>
              </div>
              <div className="flex-1 bg-rose-50 rounded-xl px-3 py-2">
                <p className="text-xs text-rose-600 mb-0.5">Dépenses</p>
                <p className="font-bold text-rose-700 text-sm">{fmt(totalExpense)}</p>
              </div>
            </div>
          </div>

          <p className="px-4 pt-3 pb-1 text-xs text-slate-400 shrink-0">
            Tu peux ajuster les catégories avant d'importer
          </p>

          {/* Liste groupée par catégorie */}
          <div className="flex-1 overflow-y-auto">
            {summary.map(g => {
              const cats = g.type === 'income' ? INCOME_CATS : EXPENSE_CATS
              return (
                <div key={`${g.type}|${g.category}`} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50">
                  <span className="text-2xl shrink-0">{CAT_ICONS[g.category] ?? '💳'}</span>
                  <div className="flex-1 min-w-0">
                    <select
                      value={g.category}
                      onChange={e => {
                        // trouve la catégorie originale pour ce groupe
                        const origCat = Object.keys(remap).find(k => (remap[k] ?? k) === g.category) ?? g.category
                        handleRemap(origCat, e.target.value)
                      }}
                      className="text-sm font-medium text-slate-800 bg-transparent border-0 focus:outline-none focus:ring-0 p-0 w-full"
                    >
                      {ALL_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <p className="text-xs text-slate-400">{g.count} transaction{g.count > 1 ? 's' : ''}</p>
                  </div>
                  <p className={`text-sm font-semibold shrink-0 ${g.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {g.type === 'income' ? '+' : '−'}{fmt(g.total)}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="p-4 border-t border-slate-100 shrink-0" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
            <button
              onClick={handleImport}
              className="w-full py-4 rounded-xl text-white font-semibold bg-blue-600 active:opacity-80"
            >
              Importer {rows.length} transactions
            </button>
          </div>
        </>
      )}

      {/* ── DONE ── */}
      {step === 'done' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="font-bold text-slate-800 text-lg">Import réussi !</p>
          <p className="text-slate-500 text-sm">{importedCount} transaction{importedCount > 1 ? 's' : ''} ajoutée{importedCount > 1 ? 's' : ''}</p>
          <button onClick={onClose} className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-semibold mt-2 active:opacity-80">
            Voir mes transactions
          </button>
        </div>
      )}
    </div>
  )
}
