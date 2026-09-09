import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { formatCurrency, formatDate } from '../utils/helpers'

export default function ExpenseList({ expenses, onDelete }) {
  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] text-gray-400">
        <p>No expenses for this period.</p>
      </div>
    )
  }

  return (
    <div
      className="overflow-y-auto max-h-[320px] px-2 py-4"
      style={{
        maskImage:
          'linear-gradient(to bottom, transparent 0px, black 24px, black calc(100% - 24px), transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(to bottom, transparent 0px, black 24px, black calc(100% - 24px), transparent 100%)',
      }}
    >
      <div className="divide-y divide-gray-50">
        <AnimatePresence initial={false}>
          {expenses.map((exp) => (
            <motion.div
              key={exp.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex justify-between items-center p-4 hover:bg-gray-50 rounded-2xl transition-colors group"
            >
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">{exp.note}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(exp.date)}</p>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <span className="font-bold text-gray-900">{formatCurrency(exp.amount)}</span>
                <button
                  onClick={() => onDelete(exp.id)}
                  className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                  aria-label="Delete expense"
                >
                  <X size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
