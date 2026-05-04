export default function BottomNav({ activeTab, onTabChange, budgetAlertCount = 0 }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-100"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex h-16">
        <NavBtn id="dashboard" active={activeTab === 'dashboard'} onClick={onTabChange} label="Accueil">
          <IconHome active={activeTab === 'dashboard'} />
        </NavBtn>

        <NavBtn id="charts" active={activeTab === 'charts'} onClick={onTabChange} label="Graphiques">
          <IconCharts active={activeTab === 'charts'} />
        </NavBtn>

        {/* Floating Add button */}
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

        <NavBtn id="budget" active={activeTab === 'budget'} onClick={onTabChange} label="Budget">
          <div className="relative">
            <IconBudget active={activeTab === 'budget'} />
            {budgetAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
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

function IconCharts({ active }) {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" fill={active ? 'currentColor' : 'none'} />
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" fill={active ? 'currentColor' : 'none'} />
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
