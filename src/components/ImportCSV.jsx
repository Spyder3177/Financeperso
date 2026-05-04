import { useState, useRef } from 'react'

const INCOME_CATS = ['Salaire', 'Freelance', 'Investissements', 'Autres revenus']
const EXPENSE_CATS = ['Alimentation', 'Transport', 'Logement', 'Santé', 'Loisirs', 'Shopping', 'Abonnements', 'Sorties', 'Autres']

const RULES = [
  { p: /SALAIRE|PAIE\b|TRAITEMENT|APPOINTEMENT/i,               type: 'income',  cat: 'Salaire' },
  { p: /CAF\b|APL\b|RSA\b|PRIME.ACTIVITE|AIDE.LOGEMENT/i,      type: 'income',  cat: 'Autres revenus' },
  { p: /CARREFOUR|LECLERC|LIDL|ALDI|INTERMARCHE|SUPER.?U|CASINO|MONOPRIX|FRANPRIX|AUCHAN|PICARD|BIOCOOP|CORA\b|NETTO\b/i, type: 'expense', cat: 'Alimentation' },
  { p: /BOULANGERIE|BOULANG|PATISSERIE|EPICERIE|FRUITS.LEG/i,   type: 'expense', cat: 'Alimentation' },
  { p: /SNCF|RATP|TRANSILIEN|KEOLIS|TISSÉO|NAVIGO|VELIB|TIER\b/i, type: 'expense', cat: 'Transport' },
  { p: /TOTAL\b|BP\b|ESSO|SHELL|LECLERC.CARB|STATION|AUTOROUTE|VINCI.AUTOROUTE/i, type: 'expense', cat: 'Transport' },
  { p: /UBER\b|LYFT|TAXI|BLABLACAR|FLIXBUS|OUIBUS/i,           type: 'expense', cat: 'Transport' },
  { p: /EDF\b|ENEDIS|GDF\b|SUEZ\b|VEOLIA|GAZ\b|ELECTRICITE|FIOUL/i, type: 'expense', cat: 'Logement' },
  { p: /LOYER|BAIL|CHARGES.COPRO|SYNDIC|CREDIT.IMMO|PRET.IMMO/i, type: 'expense', cat: 'Logement' },
  { p: /MAIF\b|MATMUT|AXA\b|ALLIANZ|MMA\b|MACIF|GROUPAMA|ASSURANCE/i, type: 'expense', cat: 'Logement' },
  { p: /PHARMACIE|PHARMA|MEDECIN|DOCTEUR|HOPITAL|CLINIQUE|CPAM|MUTUELLE|DENTISTE|OPTICIEN|KINÉ|KINE\b/i, type: 'expense', cat: 'Santé' },
  { p: /NETFLIX|SPOTIFY|DEEZER|DISNEY\+|CANAL\+|AMAZON.PRIME|APPLE.ONE|YOUTUBE.PREMIUM/i, type: 'expense', cat: 'Abonnements' },
  { p: /SFR\b|ORANGE\b|FREE\b|BOUYGUES|SOSH\b|B&YOU|NRJ.MOBILE|NUMERICABLE/i, type: 'expense', cat: 'Abonnements' },
  { p: /AMAZON|FNAC\b|DARTY|H&M\b|ZARA\b|PRIMARK|ZALANDO|SHEIN|ASOS\b|CDISCOUNT/i, type: 'expense', cat: 'Shopping' },
  { p: /CINEMA|THEATRE|CONCERT|SALLE.SPORT|PISCINE|MUSEE|BOWLING|KARTING/i, type: 'expense', cat: 'Loisirs' },
  { p: /RESTAURANT|BISTROT|BRASSERIE|PIZZERIA|MCDO|MCDONALD|KFC\b|BURGER|STARBUCKS|PAUL\b|SUSHI/i, type: 'expense', cat: 'Sorties' },
]

function autoCategory(libelle, type) {
  for (const r of RULES) {
    if (r.type === type && r.p.test(libelle)) return r.cat
  }
  return type === 'income' ? 'Autres revenus' : 'Autres'
}

function parseAmount(str) {
  if (!str || !str.trim()) return 0
  return parseFloat(str.replace(/\s/g, '').replace(',', '.')) || 0
}

function parseDate(str) {
  const m = str.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return null
  return `${m[3]}-${m[2]}-${m[1]}`
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/)
  let headerIdx = -1
  let sep = ';'

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    if (/date/i.test(l) && /libell/i.test(l)) {
      headerIdx = i
      sep = l.includes(';') ? ';' : ','
      break
    }
  }
  if (headerIdx === -1) throw new Error('En-tête introuvable — vérifie que c\'est bien un export Crédit Agricole.')

  const headers = lines[headerIdx].split(sep).map(h => h.replace(/"/g, '').trim())
  const dateIdx    = headers.findIndex(h => /^date$/i.test(h))
  const libIdx     = headers.findIndex(h => /libell/i.test(h))
  const debitIdx   = headers.findIndex(h => /d[eé]bit/i.test(h))
  const creditIdx  = headers.findIndex(h => /cr[eé]dit/i.test(h))

  if (dateIdx === -1 || libIdx === -1) throw new Error('Colonnes Date ou Libellé introuvables.')

  const txs = []
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const cols = line.split(sep).map(c => c.replace(/"/g, '').trim())

    const date = parseDate(cols[dateIdx] || '')
    const libelle = cols[libIdx] || ''
    if (!date || !libelle) continue

    const debit  = debitIdx  >= 0 ? parseAmount(cols[debitIdx])  : 0
    const credit = creditIdx >= 0 ? parseAmount(cols[creditIdx]) : 0

    if (debit > 0) {
      txs.push({ date, description: libelle, amount: debit,  type: 'expense', category: autoCategory(libelle, 'expense') })
    } else if (credit > 0) {
      txs.push({ date, description: libelle, amount: credit, type: 'income',  category: autoCategory(libelle, 'income') })
    }
  }
  if (txs.length === 0) throw new Error('Aucune transaction trouvée dans ce fichier.')
  return txs
}

const fmt = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
const fmtDate = (s) => new Date(s + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' })

export default function ImportCSV({ onImport, onClose }) {
  const [step, setStep]       = useState('upload')
  const [rows, setRows]       = useState([])
  const [checked, setChecked] = useState(new Set())
  const [error, setError]     = useState('')
  const fileRef = useRef()

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setError('')
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const txs = parseCSV(ev.target.result)
        const withIds = txs.map((t, i) => ({ ...t, _id: String(i) }))
        setRows(withIds)
        setChecked(new Set(withIds.map(t => t._id)))
        setStep('preview')
      } catch (err) {
        setError(err.message)
      }
    }
    reader.readAsText(file, 'latin1')
  }

  const toggle = (id) => setChecked(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const toggleAll = () => {
    checked.size === rows.length ? setChecked(new Set()) : setChecked(new Set(rows.map(r => r._id)))
  }

  const updateCategory = (id, cat) => {
    setRows(prev => prev.map(r => r._id === id ? { ...r, category: cat } : r))
  }

  const handleImport = () => {
    const toImport = rows
      .filter(r => checked.has(r._id))
      .map(({ _id, ...t }) => ({ ...t, id: `${Date.now()}-${_id}` }))
    onImport(toImport)
    setStep('done')
  }

  const selectedCount = checked.size

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <button onClick={onClose} className="text-slate-400 p-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="font-bold text-slate-800">Importer CSV</h2>
        <div className="w-8" />
      </div>

      {/* Step : upload */}
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
          {error && <p className="text-rose-600 text-sm text-center bg-rose-50 px-4 py-2 rounded-xl">{error}</p>}
          <button
            onClick={() => fileRef.current.click()}
            className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-semibold active:opacity-80"
          >
            Choisir le fichier
          </button>
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
          <p className="text-slate-400 text-xs text-center">
            Dans l'app Crédit Agricole :<br />Comptes → Relevé → Télécharger → CSV
          </p>
        </div>
      )}

      {/* Step : preview */}
      {step === 'preview' && (
        <>
          <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100">
            <button onClick={toggleAll} className="text-blue-600 text-sm font-medium">
              {checked.size === rows.length ? 'Tout décocher' : 'Tout cocher'}
            </button>
            <p className="text-slate-500 text-sm">{selectedCount} / {rows.length} transaction{rows.length > 1 ? 's' : ''}</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {rows.map(r => {
              const cats = r.type === 'income' ? INCOME_CATS : EXPENSE_CATS
              return (
                <div
                  key={r._id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 transition-opacity ${!checked.has(r._id) ? 'opacity-40' : ''}`}
                >
                  <button onClick={() => toggle(r._id)} className="mt-1 shrink-0">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      checked.has(r._id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                    }`}>
                      {checked.has(r._id) && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-slate-800 text-sm font-medium truncate">{r.description}</p>
                      <p className={`text-sm font-semibold shrink-0 ${r.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {r.type === 'income' ? '+' : '−'}{fmt(r.amount)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-slate-400 text-xs shrink-0">{fmtDate(r.date)}</p>
                      <select
                        value={r.category}
                        onChange={e => updateCategory(r._id, e.target.value)}
                        className="text-xs text-slate-500 bg-slate-100 rounded-lg px-2 py-0.5 border-0 focus:outline-none focus:ring-1 focus:ring-blue-400"
                      >
                        {cats.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="p-4 border-t border-slate-100" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
            <button
              onClick={handleImport}
              disabled={selectedCount === 0}
              className="w-full py-4 rounded-xl text-white font-semibold bg-blue-600 disabled:opacity-40 active:opacity-80"
            >
              Importer {selectedCount} transaction{selectedCount > 1 ? 's' : ''}
            </button>
          </div>
        </>
      )}

      {/* Step : done */}
      {step === 'done' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="font-bold text-slate-800 text-lg">Import réussi !</p>
          <p className="text-slate-500 text-sm">{selectedCount} transaction{selectedCount > 1 ? 's' : ''} ajoutée{selectedCount > 1 ? 's' : ''}</p>
          <button onClick={onClose} className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-semibold mt-2 active:opacity-80">
            Voir mes transactions
          </button>
        </div>
      )}
    </div>
  )
}
