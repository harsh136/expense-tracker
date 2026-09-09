import { motion } from 'framer-motion'
import { Repeat, AlertTriangle } from 'lucide-react'
import { formatCurrency, categoryMeta } from '../utils/helpers'

export function ProjectedBanner({ projected, budgetLimit }) {
  if (!(budgetLimit > 0) || !(projected > budgetLimit)) return null
  const over = projected - budgetLimit
  const pct = ((projected / budgetLimit) * 100).toFixed(0)
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 bg-amber-50 border border-amber-200 rounded-3xl px-5 py-4 flex items-start gap-3"
    >
      <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
      <div className="text-sm">
        <p className="font-bold text-amber-900">
          On track to spend {formatCurrency(projected)}
        </p>
        <p className="text-amber-700 mt-0.5">
          That&apos;s {formatCurrency(over)} over your limit ({pct}% of budget pace).
          Consider slowing down.
        </p>
      </div>
    </motion.div>
  )
}

export function RecurringCard({ items, onRepeat }) {
  if (!items || items.length === 0) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 bg-white p-6 rounded-3xl shadow-sm border border-gray-100"
    >
      <h3 className="text-sm font-medium text-gray-500 mb-1">Possible recurring</h3>
      <p className="text-xs text-gray-400 mb-4">
        Same note + category seen across {items[0]?.months}+ months.
      </p>
      <div className="space-y-2">
        {items.map((r) => {
          const meta = categoryMeta(r.category)
          return (
            <div
              key={r.key}
              className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0">
                  {meta.icon}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold truncate text-sm">{r.note}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Repeat size={12} /> {r.months} months • avg {formatCurrency(r.avgAmount)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onRepeat?.(r)}
                className="text-xs font-bold bg-gray-900 text-white px-3 py-2 rounded-full hover:bg-gray-700 transition-colors shrink-0"
              >
                Add again
              </button>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
