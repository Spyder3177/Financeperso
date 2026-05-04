export default function BottomNav({ activeTab, onTabChange, budgetAlertCount = 0 }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div
        className="mx-4 mb-3 glass-strong rounded-3xl flex items-center px-1 py-1.5 shadow-2xl"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.06)' }}
      >
        <NavBtn id="dashboard" active={activeTab === 'dashboard'} onClick={onTabChange} label="Accueil">
          <IconHome active={activeTab === 'dashboard'} />
        </NavBtn>

        <NavBtn id="charts" active={activeTab === 'charts'} onClick={onTabChange} label="Graphiques">
          <IconCharts active={activeTab === 'charts'} />
        </NavBtn>

        {/* Bouton Ajouter central */}
        <div className="flex-1 flex justify-center items-center">
          <button
            onClick={() => onTabChange('add')}
            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-95"
            style={{
              background: activeTab === 'add'
                ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
                : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: activeTab === 'add'
                ? '0 4px 20px rgba(79,70,229,0.6), inset 0 1px 0 rgba(255,255,255,0.2)'
                : '0 4px 20px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <NavBtn id="budget" active={activeTab === 'budget'} onClick={onTabChange} label="Budget">
          <div className="relative">
            <IconBudget active={activeTab === 'budget'} />
            {budgetAlertCount > 0 && (
              <span
                className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-0.5 rounded-full text-white flex items-center justify-center"
                style={{ fontSize: 9, fontWeight: 700, background: '#f43f5e' }}
              >
                {budgetAlertCount > 9 ? '9+' : budgetAlertCount}
              </span>
            )}
          </div>
        </NavBtn>

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
      className="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-2xl transition-all active:scale-95"
      style={{ color: active ? '#818cf8' : 'rgba(255,255,255,0.35)' }}
    >
      {children}
      <span
        className="font-semibold transition-all"
        style={{ fontSize: 10, color: active ? '#818cf8' : 'rgba(255,255,255,0.28)' }}
      >
        {label}
      </span>
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

function IconCharts({ active }) {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
        fill={active ? 'currentColor' : 'none'} />
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
        fill={active ? 'currentColor' : 'none'} />
    </svg>
  )
}

function IconBudget({ active }) {
  return (
    <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
