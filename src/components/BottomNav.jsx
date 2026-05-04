export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-100"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex h-16">
        <NavBtn id="dashboard" active={activeTab === 'dashboard'} onClick={onTabChange} label="Accueil">
          <IconHome active={activeTab === 'dashboard'} />
        </NavBtn>

        {/* Bouton central Ajouter */}
        <div className="flex-1 flex flex-col items-center justify-start pt-1">
          <button
            onClick={() => onTabChange('add')}
            className={`-mt-5 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors
              ${activeTab === 'add' ? 'bg-blue-700' : 'bg-blue-600'}`}
          >
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <span className={`text-xs font-medium mt-0.5 ${activeTab === 'add' ? 'text-blue-600' : 'text-slate-400'}`}>
            Ajouter
          </span>
        </div>

        <NavBtn id="history" active={activeTab === 'history'} onClick={onTabChange} label="Historique">
          <IconHistory active={activeTab === 'history'} />
        </NavBtn>
      </div>
    </nav>
  )
}

function NavBtn({ id, active, onClick, label, children }) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors
        ${active ? 'text-blue-600' : 'text-slate-400'}`}
    >
      {children}
      <span className="text-xs font-medium">{label}</span>
    </button>
  )
}

function IconHome({ active }) {
  return (
    <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function IconHistory({ active }) {
  return (
    <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )
}
