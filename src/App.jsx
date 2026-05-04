import { useState, useEffect } from 'react'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import TransactionForm from './components/TransactionForm'
import TransactionList from './components/TransactionList'
import BottomNav from './components/BottomNav'

const STORAGE_KEY = 'financeperso_v1'

export default function App() {
  const [transactions, setTransactions] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
  }, [transactions])

  const addTransaction = (transaction) => {
    setTransactions(prev => [{ ...transaction, id: Date.now().toString() }, ...prev])
    setActiveTab('dashboard')
  }

  const deleteTransaction = (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto relative">
      <Header />
      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
        {activeTab === 'dashboard' && (
          <Dashboard transactions={transactions} onAddClick={() => setActiveTab('add')} />
        )}
        {activeTab === 'add' && (
          <TransactionForm onAdd={addTransaction} />
        )}
        {activeTab === 'history' && (
          <TransactionList transactions={transactions} onDelete={deleteTransaction} />
        )}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
