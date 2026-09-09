import { format, parseISO, startOfWeek, startOfMonth, startOfYear, subMonths, isSameDay, isAfter, isToday, isYesterday } from 'date-fns'

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const CATEGORIES = [
  { value: 'Food', label: 'Food', icon: '🍜', color: '#111827' },
  { value: 'Travel', label: 'Travel', icon: '🚕', color: '#374151' },
  { value: 'Rent', label: 'Rent', icon: '🏠', color: '#6b7280' },
  { value: 'Groceries', label: 'Groceries', icon: '🛒', color: '#9ca3af' },
  { value: 'Shopping', label: 'Shopping', icon: '🛍️', color: '#d1d5db' },
  { value: 'Bills', label: 'Bills', icon: '🧾', color: '#f59e0b' },
  { value: 'Health', label: 'Health', icon: '💊', color: '#10b981' },
  { value: 'Entertainment', label: 'Entertainment', icon: '🎬', color: '#8b5cf6' },
  { value: 'Other', label: 'Other', icon: '•', color: '#e5e7eb' },
]

export const normalizeCategory = (exp) => {
  if (exp?.category && CATEGORIES.some((c) => c.value === exp.category)) {
    return exp.category
  }
  // Migrate old data: if the free-text note exactly matches a category, adopt it
  const noteMatch = CATEGORIES.find(
    (c) => c.value.toLowerCase() === String(exp?.note || '').trim().toLowerCase()
  )
  return noteMatch ? noteMatch.value : 'Other'
}

export const categoryMeta = (value) => {
  return CATEGORIES.find((c) => c.value === value) || CATEGORIES[CATEGORIES.length - 1]
}

export const QUICK_AMOUNTS = [50, 100, 200, 500]

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

export const filterExpensesBySearch = (expenses, query) => {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return expenses
  return expenses.filter((exp) => {
    const note = String(exp.note || '').toLowerCase()
    const cat = String(exp.category || normalizeCategory(exp)).toLowerCase()
    const amount = String(exp.amount || '')
    return note.includes(q) || cat.includes(q) || amount.includes(q)
  })
}

const sumInMonth = (expenses, refDate) => {
  const start = startOfMonth(refDate)
  const end = startOfMonth(new Date(refDate.getFullYear(), refDate.getMonth() + 1, 1))
  return expenses
    .filter((exp) => {
      const expDate = parseISO(exp.date)
      return (isAfter(expDate, start) || isSameDay(expDate, start)) && expDate < end
    })
    .reduce((sum, exp) => sum + exp.amount, 0)
}

export const getMonthlyTotal = (expenses, refDate = new Date()) => {
  return sumInMonth(expenses, refDate)
}

export const getPreviousMonthTotal = (expenses, refDate = new Date()) => {
  return sumInMonth(expenses, subMonths(refDate, 1))
}

export const getMonthComparison = (expenses, refDate = new Date()) => {
  const current = sumInMonth(expenses, refDate)
  const previous = sumInMonth(expenses, subMonths(refDate, 1))
  const diff = current - previous
  const pctChange = previous > 0 ? (diff / previous) * 100 : current > 0 ? 100 : 0
  return { current, previous, diff, pctChange }
}

export const getPaceStats = (expenses, refDate = new Date()) => {
  const daysInMonth = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0).getDate()
  const daysElapsed = Math.max(Math.min(refDate.getDate(), daysInMonth), 1)
  const daysLeft = Math.max(daysInMonth - refDate.getDate() + 1, 1)
  const monthlyTotal = sumInMonth(expenses, refDate)
  const avgDaily = daysElapsed > 0 ? monthlyTotal / daysElapsed : 0
  const projected = avgDaily * daysInMonth

  // Best / worst day this month
  const perDay = new Map()
  const start = startOfMonth(refDate)
  expenses.forEach((exp) => {
    const d = parseISO(exp.date)
    if (d.getMonth() === start.getMonth() && d.getFullYear() === start.getFullYear()) {
      const key = format(d, 'yyyy-MM-dd')
      perDay.set(key, (perDay.get(key) || 0) + exp.amount)
    }
  })
  let maxDay = null
  perDay.forEach((amount, date) => {
    if (!maxDay || amount > maxDay.amount) maxDay = { date, amount }
  })
  return { monthlyTotal, daysElapsed, daysLeft, daysInMonth, avgDaily, projected, maxDay }
}

export const groupExpensesByDay = (expenses) => {
  const groups = new Map()
  expenses.forEach((exp) => {
    let d
    try {
      d = parseISO(exp.date)
    } catch {
      return
    }
    const key = format(d, 'yyyy-MM-dd')
    if (!groups.has(key)) groups.set(key, { key, date: d, total: 0, items: [] })
    const g = groups.get(key)
    g.total += exp.amount
    g.items.push(exp)
  })
  const sorted = [...groups.values()].sort((a, b) => b.date - a.date)
  return sorted.map((g) => {
    let label
    if (isToday(g.date)) label = 'Today'
    else if (isYesterday(g.date)) label = 'Yesterday'
    else label = format(g.date, 'EEE, MMM d')
    return { ...g, label }
  })
}

export const detectRecurring = (expenses, minMonths = 2, limit = 5) => {
  const byKey = new Map()
  expenses.forEach((exp) => {
    const note = String(exp.note || 'General').trim().toLowerCase() || 'general'
    const category = normalizeCategory(exp)
    const key = `${category}|${note}`
    if (!byKey.has(key)) {
      byKey.set(key, {
        key,
        note: exp.note || 'General',
        category,
        months: new Set(),
        total: 0,
        count: 0,
        lastDate: exp.date,
      })
    }
    const entry = byKey.get(key)
    try {
      const d = parseISO(exp.date)
      entry.months.add(format(d, 'yyyy-MM'))
      if (new Date(exp.date) > new Date(entry.lastDate)) entry.lastDate = exp.date
    } catch {
      // ignore bad dates
    }
    entry.total += exp.amount
    entry.count += 1
  })
  return [...byKey.values()]
    .filter((e) => e.months.size >= minMonths && e.count >= minMonths)
    .map((e) => ({
      key: e.key,
      note: e.note,
      category: e.category,
      months: e.months.size,
      count: e.count,
      avgAmount: e.total / e.count,
      lastDate: e.lastDate,
    }))
    .sort((a, b) => b.months - a.months || b.count - a.count)
    .slice(0, limit)
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
    const cat = normalizeCategory(exp)
    categories[cat] = (categories[cat] || 0) + exp.amount
  })

  return Object.entries(categories)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
}

export const getCategoryMonthTotals = (expenses, refDate = new Date()) => {
  const start = startOfMonth(refDate)
  const end = startOfMonth(new Date(refDate.getFullYear(), refDate.getMonth() + 1, 1))
  const totals = {}
  expenses.forEach((exp) => {
    const d = parseISO(exp.date)
    if ((isAfter(d, start) || isSameDay(d, start)) && d < end) {
      const cat = normalizeCategory(exp)
      totals[cat] = (totals[cat] || 0) + exp.amount
    }
  })
  return totals
}

export const toCSV = (expenses) => {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const rows = [['id', 'date', 'amount', 'category', 'note']]
  expenses.forEach((exp) => {
    rows.push([exp.id, exp.date, exp.amount, normalizeCategory(exp), exp.note || ''])
  })
  return rows.map((r) => r.map(esc).join(',')).join('\n')
}

export const downloadFile = (filename, content, mime = 'application/json') => {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const parseBackup = (text) => {
  const data = JSON.parse(text)
  const expenses = data.expenses || data || []
  if (!Array.isArray(expenses)) throw new Error('Invalid backup: expenses missing')
  const settings = data.settings || { budget: 0 }
  const clean = expenses
    .filter((e) => e && typeof e.amount === 'number' && e.amount > 0)
    .map((e) => ({
      id: e.id || generateId(),
      amount: e.amount,
      note: e.note || 'General',
      category: normalizeCategory(e),
      date: e.date || new Date().toISOString(),
    }))
  return { expenses: clean, settings }
}

export const COLORS = ['#111827', '#374151', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb']
