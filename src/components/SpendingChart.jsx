import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { formatCurrency, getCategoryData, COLORS, categoryMeta } from '../utils/helpers'
import { motion } from 'framer-motion'

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white px-3 py-2 rounded-xl text-sm shadow-lg">
        <p className="font-medium">{payload[0].payload.name}</p>
        <p>{formatCurrency(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

export default function SpendingChart({ expenses }) {
  const data = useMemo(() => getCategoryData(expenses), [expenses])

  if (data.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-6 bg-white p-6 rounded-3xl shadow-sm border border-gray-100"
    >
      <h3 className="text-sm font-medium text-gray-500 mb-4">Top Categories</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              width={80}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: '#f9fafb' }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={categoryMeta(entry.name).color || COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
