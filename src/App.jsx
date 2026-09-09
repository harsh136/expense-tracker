import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Settings, X } from 'lucide-react'

import { useLocalStorage } from './hooks/useLocalStorage'
import {
  formatCurrency,
  generateId,
  filterExpensesByTimeframe,
  getMonthlyTotal,
} from './utils/helpers'

import SpendingHeatmap from './components/SpendingHeatmap'
import SpendingChart from './components/SpendingChart'
import ConfirmModal from './components/ConfirmModal'
import Dropdown from './components/Dropdown'
import ExpenseList from './components/ExpenseList'

const TIME_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
]

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
}

function Dashboard({ onNavigate, onDeleteExpense }) {
  const [expenses] = useLocalStorage('syncSpend_expenses', [])
  const [settings] = useLocalStorage('syncSpend_settings', { budget: 0 })
  const [timeframe, setTimeframe] = useState('month')

  const filteredExpenses = useMemo(
    () => filterExpensesByTimeframe(expenses, timeframe),
    [expenses, timeframe]
  )

  const totalSpent = useMemo(
    () => filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0),
    [filteredExpenses]
  )

  const monthlyTotal = useMemo(() => getMonthlyTotal(expenses), [expenses])

  const budgetLimit = settings.budget || 0
  const budgetPercent =
    budgetLimit > 0 ? (monthlyTotal / budgetLimit) * 100 : 0

  let budgetWarningColor = 'text-gray-500'
  if (budgetPercent > 90) budgetWarningColor = 'text-red-500'
  else if (budgetPercent > 75) budgetWarningColor = 'text-orange-500'

  return (
    <div className="min-h-screen flex justify-center font-sans text-gray-900">
      <div className="w-full max-w-md relative pb-24">
        <div className="absolute top-6 right-6 z-20">
          <button
            onClick={() => onNavigate('setup')}
            className="p-2 text-gray-400 hover:text-gray-700 bg-white/50 backdrop-blur rounded-full transition-colors"
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>
        </div>

        <div className="p-6 pt-24">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-[2.5rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center relative overflow-hidden border border-gray-50"
          >
            <p className="text-sm text-gray-400 font-medium tracking-wide uppercase mb-3">
              Spent This Month
            </p>
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-4">
              {formatCurrency(monthlyTotal)}
            </h1>

            {budgetLimit > 0 && (
              <div className="mt-4 flex flex-col items-center">
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2 max-w-[200px]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(budgetPercent, 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className={`h-1.5 rounded-full ${
                      budgetPercent > 90
                        ? 'bg-red-500'
                        : budgetPercent > 75
                        ? 'bg-orange-500'
                        : 'bg-gray-900'
                    }`}
                  />
                </div>
                <span className={`text-xs font-medium ${budgetWarningColor}`}>
                  {budgetPercent.toFixed(0)}% of {formatCurrency(budgetLimit)} limit
                </span>
              </div>
            )}
          </motion.div>
        </div>

        <div className="px-6 flex justify-center mt-6 relative z-10">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate('add')}
            className="bg-gray-900 text-white rounded-full py-4 px-8 flex items-center gap-2 shadow-[0_10px_40px_rgba(0,0,0,0.2)] transition-colors hover:bg-gray-800"
          >
            <Plus size={20} /> <span className="font-bold text-lg">Add Expense</span>
          </motion.button>
        </div>

        <div className="px-6 mt-12">
          <div className="flex items-center justify-between mb-6">
            <Dropdown
              options={TIME_OPTIONS}
              value={timeframe}
              onChange={setTimeframe}
            />
            <div className="text-right">
              <span className="text-sm text-gray-500 block">Total</span>
              <span className="font-bold text-gray-900">
                {formatCurrency(totalSpent)}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 min-h-[200px] overflow-hidden">
            <ExpenseList expenses={filteredExpenses} onDelete={onDeleteExpense} />
          </div>

          <SpendingChart expenses={filteredExpenses} />
          <SpendingHeatmap expenses={expenses} />
        </div>
      </div>
    </div>
  )
}

function AddExpense({ onNavigate }) {
  const [, setExpenses] = useLocalStorage('syncSpend_expenses', [])

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault()
      const formData = new FormData(e.target)
      const amount = parseFloat(formData.get('amount'))
      const note = formData.get('note')?.trim() || 'General'

      if (amount && !isNaN(amount) && amount > 0) {
        setExpenses((prev) => [
          {
            id: generateId(),
            amount,
            note,
            date: new Date().toISOString(),
          },
          ...prev,
        ])
        onNavigate('dashboard')
      }
    },
    [onNavigate, setExpenses]
  )

  return (
    <div className="min-h-screen bg-white flex flex-col p-6 max-w-md mx-auto relative">
      <button
        onClick={() => onNavigate('dashboard')}
        className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors"
        aria-label="Close"
      >
        <X size={24} />
      </button>

      <div className="flex-1 flex flex-col justify-center">
        <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">
          Add Expense
        </h2>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2 text-center">
              Amount
            </label>
            <div className="relative flex justify-center items-center">
              <span className="text-4xl text-gray-400 mr-2">₹</span>
              <input
                type="number"
                name="amount"
                autoFocus
                required
                step="0.01"
                min="0.01"
                className="text-6xl font-bold bg-transparent border-none outline-none w-full text-center placeholder-gray-200 text-gray-900"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2 text-center">
              What was this for?
            </label>
            <input
              type="text"
              name="note"
              className="w-full text-center text-xl bg-gray-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-gray-200 text-gray-900 transition-shadow"
              placeholder="e.g. Chai, Lunch, Rent"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-gray-900 text-white font-bold text-lg py-4 rounded-2xl shadow-lg mt-8 hover:bg-gray-800 transition-colors"
          >
            Save Expense
          </motion.button>
        </form>
      </div>
    </div>
  )
}

function Setup({ onNavigate }) {
  const [settings, setSettings] = useLocalStorage('syncSpend_settings', {
    budget: 0,
  })
  const [, , removeExpenses] = useLocalStorage('syncSpend_expenses', [])
  const [, , removeSettings] = useLocalStorage('syncSpend_settings', {})
  const [showConfirmClear, setShowConfirmClear] = useState(false)

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault()
      const formData = new FormData(e.target)
      const budget = parseFloat(formData.get('budget')) || 0
      setSettings((prev) => ({ ...prev, budget }))
      onNavigate('dashboard')
    },
    [onNavigate, setSettings]
  )

  const handleClearData = useCallback(() => {
    removeExpenses()
    removeSettings()
    setShowConfirmClear(false)
    onNavigate('dashboard')
  }, [removeExpenses, removeSettings, onNavigate])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-6 max-w-md mx-auto relative">
      <ConfirmModal
        isOpen={showConfirmClear}
        onClose={() => setShowConfirmClear(false)}
        onConfirm={handleClearData}
        title="Clear All Data?"
        description="This will permanently delete all your expenses and settings. This action cannot be undone."
        confirmText="Yes, Clear"
        confirmColor="red"
      />

      <button
        onClick={() => onNavigate('dashboard')}
        className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors"
        aria-label="Close"
      >
        <X size={24} />
      </button>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-2 text-gray-900">
          Setup & Budget
        </h2>
        <p className="text-gray-500 mb-8">
          Set limits to get warnings when you overspend.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Monthly Budget Limit
            </label>
            <div className="flex items-center text-xl">
              <span className="text-gray-400 mr-2">₹</span>
              <input
                type="number"
                name="budget"
                min="0"
                defaultValue={settings.budget || ''}
                className="w-full outline-none font-medium text-gray-900"
                placeholder="e.g. 15000"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              We'll warn you when you approach this.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowConfirmClear(true)}
            className="w-full bg-red-50 text-red-500 font-bold py-4 rounded-2xl shadow-sm hover:bg-red-100 transition-colors border border-red-100"
          >
            Clear All Data
          </button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl shadow-sm hover:bg-gray-800 transition-colors"
          >
            Save Settings
          </motion.button>
        </form>
      </div>
    </div>
  )
}

export default function App() {
  const [view, setView] = useState('dashboard')
  const [direction, setDirection] = useState(0)
  const [, setExpenses] = useLocalStorage('syncSpend_expenses', [])

  const handleNavigate = useCallback((targetView) => {
    const viewOrder = ['dashboard', 'add', 'setup']
    const currentIndex = viewOrder.indexOf(view)
    const targetIndex = viewOrder.indexOf(targetView)
    setDirection(targetIndex > currentIndex ? 1 : -1)
    setView(targetView)
  }, [view])

  const handleDeleteExpense = useCallback((id) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }, [setExpenses])

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={view}
        custom={direction}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {view === 'dashboard' && (
          <Dashboard onNavigate={handleNavigate} onDeleteExpense={handleDeleteExpense} />
        )}
        {view === 'add' && <AddExpense onNavigate={handleNavigate} />}
        {view === 'setup' && <Setup onNavigate={handleNavigate} />}
      </motion.div>
    </AnimatePresence>
  )
}