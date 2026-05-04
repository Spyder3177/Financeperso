import { VERSION } from '../version'

export default function Header() {
  const now = new Date()
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const hour = now.getHours()
  const greeting = hour < 5 ? 'Bonne nuit' : hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 max-w-md mx-auto glass-strong"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium capitalize" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {greeting} · {dateStr}
          </p>
          <h1 className="text-xl font-bold tracking-tight text-white mt-0.5">Finance Perso</h1>
        </div>
        <div className="flex items-center gap-2.5">
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded-full"
            style={{
              color: 'rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            v{VERSION}
          </span>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
            }}
          >
            <span className="text-white text-sm font-bold">FP</span>
          </div>
        </div>
      </div>
    </header>
  )
}
