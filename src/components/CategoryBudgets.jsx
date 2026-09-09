import { motion } from 'framer-motion'
import { formatCurrency, categoryMeta } from '../utils/helpers'

export default function CategoryBudgets({ monthTotals, limits = {} }) {
  const entries = Object.keys({ ...monthTotals, ...limits })
    .map((cat) => ({
      category: cat,
      spent: monthTotals[cat] || 0,
      limit: Number(limits[cat]) || 0,
    }))
    .filter((e) => e.limit > 0 || e.spent > 0)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 8)

  if (entries.length === 0) return null
  const hasAnyLimit = entries.some((e) => e.limit > 0)
  if (!hasAnyLimit) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 bg-white p-6 rounded-3xl shadow-sm border border-gray-100"
    >
      <h3 className="text-sm font-medium text-gray-500 mb-4">Category budgets</h3>
      <div className="space-y-4">
        {entries
          .filter((e) => e.limit > 0)
          .map((e) => {
            const meta = categoryMeta(e.category)
            const pct = e.limit > 0 ? (e.spent / e.limit) * 100 : 0
            const over = pct > 100
            const barColor = pct > 90 ? 'bg-red-500' : pct > 75 ? 'bg-orange-500' : 'bg-gray-900'
            return (
              <div key={e.category}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="flex items-center gap-2 font-medium">
                    <span>{meta.icon}</span> {meta.label}
                  </span>
                  <span className={`font-bold ${over ? 'text-red-500' : ''}`}>
                    {formatCurrency(e.spent)}
                    <span className="text-gray-400 font-normal">
                      {' '}
                      / {formatCurrency(e.limit)}
                    </span>
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${barColor}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
      </div>
    </motion.div>
  )
}
