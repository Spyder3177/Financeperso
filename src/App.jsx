import { useState, useEffect, useMemo } from 'react'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import TransactionForm from './components/TransactionForm'
import TransactionList from './components/TransactionList'
import Charts from './components/Charts'
import Budget from './components/Budget'
import BottomNav from './components/BottomNav'
import ImportCSV from './components/ImportCSV'
import { EXPENSE_CATS, INCOME_CATS, BUDGETS_KEY, CUSTOM_CATS_KEY, GOALS_KEY } from './categories'

const STORAGE_KEY = 'financeperso_v1'

export const DEFAULT_ACCOUNTS = [
  { id: 'moi', name: 'Moi' },
  { id: 'conjointe', name: 'Conjointe' },
]

const currentYearMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function App() {
  const [transactions, setTransactions] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const [budgets, setBudgets] = useState(() => {
    try {
      const stored = localStorage.getItem(BUDGETS_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })

  const [goals, setGoals] = useState(() => {
    try {
      const stored = localStorage.getItem(GOALS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const [customExpenseCats, setCustomExpenseCats] = useState(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_CATS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const accounts = DEFAULT_ACCOUNTS
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showImport, setShowImport] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
  }, [transactions])

  useEffect(() => {
    localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets))
  }, [budgets])

  useEffect(() => {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals))
  }, [goals])

  useEffect(() => {
    localStorage.setItem(CUSTOM_CATS_KEY, JSON.stringify(customExpenseCats))
  }, [customExpenseCats])

  const allExpenseCats = useMemo(
    () => [...EXPENSE_CATS, ...customExpenseCats.map(c => c.name)],
    [customExpenseCats]
  )

  const budgetAlertCount = useMemo(() => {
    const ym = currentYearMonth()
    const spending = {}
    transactions
      .filter(t => t.date.startsWith(ym) && t.type === 'expense')
      .forEach(t => { spending[t.category] = (spending[t.category] || 0) + t.amount })
    return Object.entries(budgets).filter(([cat, budget]) => {
      const spent = spending[cat] || 0
      return budget > 0 && spent / budget >= 0.8
    }).length
  }, [transactions, budgets])

  const addTransaction = (transaction) => {
    setTransactions(prev => [{ ...transaction, id: Date.now().toString() }, ...prev])
    setActiveTab('dashboard')
  }

  const deleteTransaction = (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  const updateTransaction = (id, updates) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }

  const importTransactions = (txs) => {
    setTransactions(prev => {
      const existingKeys = new Set(prev.map(t => `${t.date}|${t.amount}|${t.description}`))
      const deduped = txs.filter(t => !existingKeys.has(`${t.date}|${t.amount}|${t.description}`))
      return [...deduped, ...prev].sort((a, b) => b.date.localeCompare(a.date))
    })
    setActiveTab('history')
  }

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative">
      <Header />
      <main
        className="flex-1 overflow-y-auto"
        style={{
          paddingTop: 'calc(5.5rem + env(safe-area-inset-top))',
          paddingBottom: 'calc(6.5rem + env(safe-area-inset-bottom))',
        }}
      >
        {activeTab === 'dashboard' && (
          <Dashboard
            transactions={transactions}
            accounts={accounts}
            budgets={budgets}
            onAddClick={() => setActiveTab('add')}
          />
        )}
        {activeTab === 'add' && (
          <TransactionForm
            onAdd={addTransaction}
            accounts={accounts}
            expenseCats={allExpenseCats}
            incomeCats={INCOME_CATS}
            customExpenseCats={customExpenseCats}
          />
        )}
        {activeTab === 'charts' && (
          <Charts
            transactions={transactions}
            customExpenseCats={customExpenseCats}
          />
        )}
        {activeTab === 'budget' && (
          <Budget
            transactions={transactions}
            budgets={budgets}
            onBudgetsChange={setBudgets}
            expenseCats={allExpenseCats}
            customExpenseCats={customExpenseCats}
            onCustomCatsChange={setCustomExpenseCats}
            goals={goals}
            onGoalsChange={setGoals}
          />
        )}
        {activeTab === 'history' && (
          <TransactionList
            transactions={transactions}
            accounts={accounts}
            expenseCats={allExpenseCats}
            incomeCats={INCOME_CATS}
            customExpenseCats={customExpenseCats}
            onDelete={deleteTransaction}
            onUpdate={updateTransaction}
            onImport={() => setShowImport(true)}
          />
        )}
      </main>
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        budgetAlertCount={budgetAlertCount}
      />

      {showImport && (
        <ImportCSV
          onImport={importTransactions}
          onClose={() => setShowImport(false)}
          accounts={accounts}
        />
      )}
    </div>
  )
}
