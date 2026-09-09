import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Pencil } from 'lucide-react'
import { formatCurrency, formatDate, groupExpensesByDay, categoryMeta, normalizeCategory } from '../utils/helpers'

export default function ExpenseList({ expenses, onDelete, onEdit }) {
  const groups = useMemo(() => groupExpensesByDay(expenses), [expenses])

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] text-gray-400">
        <p>No expenses for this period.</p>
      </div>
    )
  }

  return (
    <div
      className="overflow-y-auto max-h-[420px] px-2 py-4"
      style={{
        maskImage:
          'linear-gradient(to bottom, transparent 0px, black 24px, black calc(100% - 24px), transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(to bottom, transparent 0px, black 24px, black calc(100% - 24px), transparent 100%)',
      }}
    >
      {groups.map((group) => (
        <div key={group.key} className="mb-2">
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-4 py-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
              {group.label}
            </span>
            <span className="text-xs font-bold text-gray-900">
              {formatCurrency(group.total)}
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            <AnimatePresence initial={false}>
              {group.items.map((exp) => {
                const cat = normalizeCategory(exp)
                const meta = categoryMeta(cat)
                return (
                  <motion.div
                    key={exp.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex justify-between items-center p-4 hover:bg-gray-50 rounded-2xl transition-colors group"
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      <span
                        className="w-9 h-9 rounded-2xl flex items-center justify-center text-base shrink-0 bg-gray-100"
                        title={meta.label}
                      >
                        {meta.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{exp.note}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {meta.label} • {formatDate(exp.date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="font-bold text-gray-900 mr-1">
                        {formatCurrency(exp.amount)}
                      </span>
                      <button
                        onClick={() => onEdit?.(exp)}
                        className="text-gray-300 hover:text-gray-700 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-2"
                        aria-label="Edit expense"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => onDelete(exp.id)}
                        className="text-red-300 hover:text-red-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-2"
                        aria-label="Delete expense"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      ))}
    </div>
  )
}
