import { useMemo } from 'react'
import { getDailySpendingData } from '../utils/helpers'
import { motion } from 'framer-motion'

const LEVEL_COLORS = [
  'bg-ghGreen-0',
  'bg-ghGreen-1',
  'bg-ghGreen-2',
  'bg-ghGreen-3',
  'bg-ghGreen-4',
]

export default function SpendingHeatmap({ expenses }) {
  const data = useMemo(() => getDailySpendingData(expenses, 30), [expenses])

  const getColorClass = (level) => LEVEL_COLORS[level] || LEVEL_COLORS[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mt-8 bg-white p-6 rounded-3xl shadow-sm border border-gray-100"
    >
      <h3 className="text-sm font-medium text-gray-500 mb-4">
        Spending Activity (Last 30 days)
      </h3>
      <div className="flex flex-wrap gap-1">
        {data.map((day, i) => (
          <motion.div
            key={day.date}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.01 }}
            className={`w-4 h-4 rounded-sm ${getColorClass(day.level)} cursor-pointer hover:ring-2 hover:ring-gray-300 transition-all`}
            title={`${day.date}: ${day.formattedAmount}`}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
        <span>Less</span>
        {LEVEL_COLORS.map((color, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${color}`} />
        ))}
        <span>More</span>
      </div>
    </motion.div>
  )
}
