import { format, parseISO, startOfWeek, startOfMonth, startOfYear, isSameDay, isAfter, isBefore } from 'date-fns'

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const formatDate = (dateString) => {
  const date = parseISO(dateString)
  return format(date, "MMM d, h:mm a")
}

export const formatShortDate = (dateString) => {
  const date = parseISO(dateString)
  return format(date, "MMM d")
}

export const getStartOfPeriod = (timeframe) => {
  const now = new Date()
  switch (timeframe) {
    case 'today':
      return new Date(now.setHours(0, 0, 0, 0))
    case 'week':
      return startOfWeek(now, { weekStartsOn: 0 })
    case 'month':
      return startOfMonth(now)
    case 'year':
      return startOfYear(now)
    default:
      return new Date(0)
  }
}

export const filterExpensesByTimeframe = (expenses, timeframe) => {
  const start = getStartOfPeriod(timeframe)
  return expenses
    .filter((exp) => {
      const expDate = parseISO(exp.date)
      return isAfter(expDate, start) || isSameDay(expDate, start)
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

export const getMonthlyTotal = (expenses) => {
  const now = new Date()
  const start = startOfMonth(now)
  return expenses
    .filter((exp) => {
      const expDate = parseISO(exp.date)
      return isAfter(expDate, start) || isSameDay(expDate, start)
    })
    .reduce((sum, exp) => sum + exp.amount, 0)
}

export const getDailySpendingData = (expenses, days = 30) => {
  const data = []
  const today = new Date()
  const map = new Map()

  // Initialize last N days with 0
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const dateStr = format(d, 'yyyy-MM-dd')
    map.set(dateStr, 0)
  }

  // Sum expenses per day
  expenses.forEach((exp) => {
    const dateStr = format(parseISO(exp.date), 'yyyy-MM-dd')
    if (map.has(dateStr)) {
      map.set(dateStr, map.get(dateStr) + exp.amount)
    }
  })

  // Determine max spending to calculate intensity
  let maxSpend = 0
  map.forEach((val) => {
    if (val > maxSpend) maxSpend = val
  })

  const getLevel = (amount) => {
    if (amount === 0) return 0
    if (maxSpend === 0) return 1
    const ratio = amount / maxSpend
    if (ratio < 0.25) return 1
    if (ratio < 0.5) return 2
    if (ratio < 0.75) return 3
    return 4
  }

  map.forEach((amount, date) => {
    data.push({
      date,
      amount,
      level: getLevel(amount),
      formattedAmount: formatCurrency(amount),
    })
  })

  return data
}

export const getCategoryData = (expenses) => {
  const categories = {}
  expenses.forEach((exp) => {
    const note = exp.note || 'General'
    categories[note] = (categories[note] || 0) + exp.amount
  })

  return Object.entries(categories)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
}

export const COLORS = ['#111827', '#374151', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb']
