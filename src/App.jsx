import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Settings, X, Search, ArrowRight, Undo2 } from 'lucide-react'

import { useLocalStorage } from './hooks/useLocalStorage'
import {
  formatCurrency,
  generateId,
  filterExpensesByTimeframe,
  filterExpensesBySearch,
  getMonthlyTotal,
  getPaceStats,
  getCategoryMonthTotals,
  detectRecurring,
  normalizeCategory,
  CATEGORIES,
  QUICK_AMOUNTS,
  toCSV,
  downloadFile,
  parseBackup,
} from './utils/helpers'

import SpendingHeatmap from './components/SpendingHeatmap'
import SpendingChart from './components/SpendingChart'
import CategoryBudgets from './components/CategoryBudgets'
import { ProjectedBanner, RecurringCard } from './components/BudgetInsights'
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

function Dashboard({ onNavigate, onDeleteExpense, onEditExpense }) {
  const [expenses, setExpenses] = useLocalStorage('syncSpend_expenses', [])
  const [settings] = useLocalStorage('syncSpend_settings', { budget: 0 })
  const [timeframe, setTimeframe] = useState('month')
  const [search, setSearch] = useState('')

  const categoryLimits = settings.categoryLimits || {}

  const filteredExpenses = useMemo(
    () => filterExpensesByTimeframe(expenses, timeframe),
    [expenses, timeframe]
  )

  const searchedExpenses = useMemo(
    () => filterExpensesBySearch(filteredExpenses, search),
    [filteredExpenses, search]
  )

  const totalSpent = useMemo(
    () => searchedExpenses.reduce((sum, exp) => sum + exp.amount, 0),
    [searchedExpenses]
  )

  const monthlyTotal = useMemo(() => getMonthlyTotal(expenses), [expenses])
  const pace = useMemo(() => getPaceStats(expenses), [expenses])
  const monthTotals = useMemo(() => getCategoryMonthTotals(expenses), [expenses])
  const recurring = useMemo(() => detectRecurring(expenses), [expenses])

  const budgetLimit = settings.budget || 0
  const budgetPercent =
    budgetLimit > 0 ? (monthlyTotal / budgetLimit) * 100 : 0

  let budgetWarningColor = 'text-gray-500'
  if (budgetPercent > 90) budgetWarningColor = 'text-red-500'
  else if (budgetPercent > 75) budgetWarningColor = 'text-orange-500'

  const remaining = budgetLimit - monthlyTotal
  const isOverBudget = remaining < 0
  const today = new Date()
  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  ).getDate()
  const daysLeft = Math.max(daysInMonth - today.getDate() + 1, 1)
  const dailySafe = remaining > 0 ? remaining / daysLeft : 0

  const remainingDotColor =
    budgetPercent > 90
      ? 'bg-red-500'
      : budgetPercent > 75
      ? 'bg-orange-500'
      : 'bg-green-500'

  const handleRepeat = useCallback(
    (item) => {
      setExpenses((prev) => [
        {
          id: generateId(),
          amount: Math.round(item.avgAmount * 100) / 100,
          note: item.note,
          category: item.category,
          date: new Date().toISOString(),
        },
        ...prev,
      ])
    },
    [setExpenses]
  )

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

        {budgetLimit > 0 ? (
          <div className="px-6 mt-3">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="bg-white rounded-full border border-gray-100 shadow-sm px-4 py-2.5 flex items-center justify-between text-sm"
            >
              <span className="flex items-center gap-2 font-medium text-gray-900">
                <span
                  className={`w-2 h-2 rounded-full inline-block ${remainingDotColor}`}
                />
                {isOverBudget
                  ? `${formatCurrency(Math.abs(remaining))} over budget`
                  : `${formatCurrency(remaining)} left`}
              </span>
              <span className="text-gray-400 text-xs">
                {isOverBudget
                  ? `${budgetPercent.toFixed(0)}% used`
                  : `~${formatCurrency(dailySafe)} / day`}
              </span>
            </motion.div>
          </div>
        ) : (
          <div className="px-6 mt-3">
            <button
              onClick={() => onNavigate('setup')}
              className="w-full bg-white rounded-full border border-dashed border-gray-200 px-4 py-2.5 flex items-center justify-between text-sm hover:border-gray-400 transition-colors"
            >
              <span className="font-medium text-gray-500">
                Set a monthly limit to track what&apos;s left
              </span>
              <ArrowRight size={16} className="text-gray-400" />
            </button>
          </div>
        )}

        {budgetLimit > 0 && (
          <div className="px-6">
            <ProjectedBanner
              projected={pace.projected}
              budgetLimit={budgetLimit}
             
            />
          </div>
        )}

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
          <div className="flex items-center justify-between mb-4">
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

          <div className="relative mb-6">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search note, category, amount…"
              className="w-full bg-white border border-gray-100 rounded-2xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gray-200 placeholder-gray-400"
            />
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 min-h-[200px] overflow-hidden">
            <ExpenseList
              expenses={searchedExpenses}
             
              onDelete={onDeleteExpense}
              onEdit={onEditExpense}
            />
          </div>

          <SpendingChart expenses={filteredExpenses} />
          <CategoryBudgets
            monthTotals={monthTotals}
            limits={categoryLimits}
          />
          <RecurringCard items={recurring} onRepeat={handleRepeat} />
          <SpendingHeatmap expenses={expenses} />
        </div>
      </div>
    </div>
  )
}

function ExpenseForm({ onNavigate, initialExpense = null, onSubmitExpense }) {
  const [amount, setAmount] = useState(
    initialExpense ? String(initialExpense.amount) : ''
  )
  const [category, setCategory] = useState(
    initialExpense ? normalizeCategory(initialExpense) : 'Other'
  )

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault()
      const formData = new FormData(e.target)
      const parsed = parseFloat(amount || formData.get('amount'))
      const note = formData.get('note')?.trim() || 'General'

      if (parsed && !isNaN(parsed) && parsed > 0) {
        onSubmitExpense({ amount: parsed, note, category })
        onNavigate('dashboard')
      }
    },
    [onNavigate, onSubmitExpense, amount, category]
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
          {initialExpense ? 'Edit Expense' : 'Add Expense'}
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
                autoFocus={!initialExpense}
                required
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-6xl font-bold bg-transparent border-none outline-none w-full text-center placeholder-gray-200 text-gray-900"
                placeholder="0.00"
              />
            </div>
            <div className="flex justify-center gap-2 mt-4">
              {QUICK_AMOUNTS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmount(String(q))}
                  className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors ${
                    String(q) === String(amount)
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-gray-50 text-gray-700 border-gray-100 hover:border-gray-300'
                  }`}
                >
                  {formatCurrency(q)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-3 text-center">
              Category
            </label>
            <div className="flex flex-wrap justify-center gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={`px-3 py-2 rounded-full text-sm font-medium border transition-colors ${
                    category === c.value
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-gray-50 text-gray-700 border-gray-100 hover:border-gray-300'
                  }`}
                >
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2 text-center">
              What was this for?
            </label>
            <input
              type="text"
              name="note"
              defaultValue={initialExpense?.note || ''}
              className="w-full text-center text-xl bg-gray-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-gray-200 text-gray-900 transition-shadow"
              placeholder="e.g. Chai, Lunch, Rent"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-gray-900 text-white font-bold text-lg py-4 rounded-2xl shadow-lg mt-8 hover:bg-gray-800 transition-colors"
          >
            {initialExpense ? 'Save Changes' : 'Save Expense'}
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
  const [expenses, setExpenses] = useLocalStorage('syncSpend_expenses', [])
  const [, , removeExpenses] = useLocalStorage('syncSpend_expenses', [])
  const [, , removeSettings] = useLocalStorage('syncSpend_settings', {})
  const [showConfirmClear, setShowConfirmClear] = useState(false)
  const [restoreError, setRestoreError] = useState('')
  const fileRef = useRef(null)

  const categoryLimits = settings.categoryLimits || {}

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault()
      const formData = new FormData(e.target)
      const budget = parseFloat(formData.get('budget')) || 0
      const limits = {}
      CATEGORIES.forEach((c) => {
        const v = parseFloat(formData.get(`limit_${c.value}`))
        if (v && !isNaN(v) && v > 0) limits[c.value] = v
      })
      setSettings((prev) => ({ ...prev, budget, categoryLimits: limits }))
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

  const handleExportCSV = useCallback(() => {
    downloadFile(`expenses-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(expenses), 'text/csv')
  }, [expenses])

  const handleBackup = useCallback(() => {
    downloadFile(
      `expense-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify({ expenses, settings, exportedAt: new Date().toISOString() }, null, 2)
    )
  }, [expenses, settings])

  const handleRestoreFile = useCallback(
    (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      setRestoreError('')
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const { expenses: clean, settings: parsed } = parseBackup(String(reader.result))
          setExpenses(clean)
          setSettings((prev) => ({ ...prev, ...parsed }))
          onNavigate('dashboard')
        } catch (err) {
          setRestoreError(err.message || 'Could not read backup file.')
        }
      }
      reader.readAsText(file)
      e.target.value = ''
    },
    [onNavigate, setExpenses, setSettings]
  )

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
              We&apos;ll warn you when you approach this.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Category limits <span className="text-gray-400">(optional)</span>
            </label>
            <p className="text-xs text-gray-400 mb-4">
              Get per-category bars on the dashboard.
            </p>
            <div className="space-y-3">
              {CATEGORIES.filter((c) => c.value !== 'Other').map((c) => (
                <div key={c.value} className="flex items-center gap-3">
                  <span className="w-28 text-sm font-medium shrink-0">
                    {c.icon} {c.label}
                  </span>
                  <input
                    type="number"
                    name={`limit_${c.value}`}
                    min="0"
                    defaultValue={categoryLimits[c.value] || ''}
                    placeholder="No limit"
                    className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-500 mb-4">
              Your data <span className="text-gray-400">({expenses.length} expenses)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="bg-gray-50 font-bold py-3 rounded-2xl text-sm hover:bg-gray-100 transition-colors border border-gray-100"
              >
                ⬇ CSV
              </button>
              <button
                type="button"
                onClick={handleBackup}
                className="bg-gray-50 font-bold py-3 rounded-2xl text-sm hover:bg-gray-100 transition-colors border border-gray-100"
              >
                ⤓ Backup
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="bg-gray-50 font-bold py-3 rounded-2xl text-sm hover:bg-gray-100 transition-colors border border-gray-100"
              >
                ⤒ Restore
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleRestoreFile}
            />
            {restoreError && (
              <p className="text-xs text-red-500 mt-2">{restoreError}</p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Back up regularly — expenses live only in this browser.
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
  const [expenses, setExpenses] = useLocalStorage('syncSpend_expenses', [])
  const [editingId, setEditingId] = useState(null)
  const [lastDeleted, setLastDeleted] = useState(null)
  const undoTimer = useRef(null)

  const handleNavigate = useCallback((targetView) => {
    const viewOrder = ['dashboard', 'add', 'edit', 'setup']
    setView((current) => {
      const currentIndex = viewOrder.indexOf(current)
      const targetIndex = viewOrder.indexOf(targetView)
      setDirection(targetIndex > currentIndex ? 1 : -1)
      if (targetView !== 'edit') setEditingId(null)
      return targetView
    })
  }, [])

  const handleDeleteExpense = useCallback((id) => {
    setExpenses((prev) => {
      const found = prev.find((e) => e.id === id)
      if (found) {
        if (undoTimer.current) clearTimeout(undoTimer.current)
        setLastDeleted({ expense: found })
        undoTimer.current = setTimeout(() => setLastDeleted(null), 5000)
      }
      return prev.filter((e) => e.id !== id)
    })
  }, [setExpenses])

  const handleUndoDelete = useCallback(() => {
    if (undoTimer.current) clearTimeout(undoTimer.current)
    setLastDeleted((deleted) => {
      if (deleted?.expense) {
        setExpenses((prev) => {
          if (prev.some((e) => e.id === deleted.expense.id)) return prev
          return [deleted.expense, ...prev]
        })
      }
      return null
    })
  }, [setExpenses])

  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current)
    }
  }, [])

  const handleEditExpense = useCallback((expense) => {
    setEditingId(expense.id)
    setView((current) => {
      const viewOrder = ['dashboard', 'add', 'edit', 'setup']
      setDirection(viewOrder.indexOf('edit') > viewOrder.indexOf(current) ? 1 : -1)
      return 'edit'
    })
  }, [])

  const handleAddSubmit = useCallback((data) => {
    setExpenses((prev) => [
      {
        id: generateId(),
        amount: data.amount,
        note: data.note,
        category: data.category || 'Other',
        date: new Date().toISOString(),
      },
      ...prev,
    ])
  }, [setExpenses])

  const handleEditSubmit = useCallback((data) => {
    setExpenses((prev) =>
      prev.map((e) =>
        e.id === editingId
          ? { ...e, amount: data.amount, note: data.note, category: data.category || 'Other' }
          : e
      )
    )
    setEditingId(null)
  }, [setExpenses, editingId])

  const editingExpense = editingId ? expenses.find((e) => e.id === editingId) : null

  return (
    <>
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
            <Dashboard
              onNavigate={handleNavigate}
              onDeleteExpense={handleDeleteExpense}
              onEditExpense={handleEditExpense}
            />
          )}
          {view === 'add' && (
            <ExpenseForm onNavigate={handleNavigate} onSubmitExpense={handleAddSubmit} />
          )}
          {view === 'edit' && editingExpense && (
            <ExpenseForm
              onNavigate={handleNavigate}
              initialExpense={editingExpense}
              onSubmitExpense={handleEditSubmit}
            />
          )}
          {view === 'setup' && <Setup onNavigate={handleNavigate} />}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {lastDeleted && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white rounded-full pl-5 pr-2 py-2 flex items-center gap-4 shadow-2xl text-sm"
          >
            <span className="whitespace-nowrap">
              Deleted {formatCurrency(lastDeleted.expense.amount)} • {lastDeleted.expense.note}
            </span>
            <button
              onClick={handleUndoDelete}
              className="flex items-center gap-1 bg-white text-gray-900 font-bold px-4 py-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Undo2 size={14} /> Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
