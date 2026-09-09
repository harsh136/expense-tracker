import { useMemo, useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate, groupExpensesByDay, categoryMeta, normalizeCategory } from '../utils/helpers'

const MENU_WIDTH = 160
const MENU_HEIGHT = 100
const MENU_GAP = 4

export default function ExpenseList({ expenses, onDelete, onEdit }) {
  const groups = useMemo(() => groupExpensesByDay(expenses), [expenses])
  // { id, expense, top, left } — rendered in a portal so it escapes the
  // scrollable list box (no clipping) and taps anywhere dismiss it.
  const [openMenu, setOpenMenu] = useState(null)

  const closeMenu = useCallback(() => setOpenMenu(null), [])

  useEffect(() => {
    if (!openMenu) return
    const handleKey = (e) => {
      if (e.key === 'Escape') closeMenu()
    }
    // Close on any scroll (the anchor row may move) or resize.
    window.addEventListener('keydown', handleKey)
    window.addEventListener('scroll', closeMenu, true)
    window.addEventListener('resize', closeMenu)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('scroll', closeMenu, true)
      window.removeEventListener('resize', closeMenu)
    }
  }, [openMenu, closeMenu])

  const toggleMenu = useCallback(
    (exp, e) => {
      if (openMenu?.id === exp.id) {
        closeMenu()
        return
      }
      const rect = e.currentTarget.getBoundingClientRect()
      // Flip upward when there isn't room below (e.g. last row in the box).
      const openUp = rect.bottom + MENU_GAP + MENU_HEIGHT > window.innerHeight
      const top = openUp
        ? Math.max(8, rect.top - MENU_GAP - MENU_HEIGHT)
        : rect.bottom + MENU_GAP
      const left = Math.min(
        Math.max(8, rect.right - MENU_WIDTH),
        window.innerWidth - MENU_WIDTH - 8
      )
      setOpenMenu({ id: exp.id, expense: exp, top, left })
    },
    [openMenu, closeMenu]
  )

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
                    className="flex justify-between items-center p-4 hover:bg-gray-50 rounded-2xl transition-colors"
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
                    <div className="flex items-center flex-shrink-0">
                      <span className="font-bold text-gray-900 mr-1">
                        {formatCurrency(exp.amount)}
                      </span>
                      <button
                        onClick={(e) => toggleMenu(exp, e)}
                        className="text-gray-400 hover:text-gray-900 transition-colors p-2"
                        aria-label="Expense options"
                        aria-expanded={openMenu?.id === exp.id}
                      >
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      ))}

      {createPortal(
        <AnimatePresence>
          {openMenu && (
            <div key="menu-root">
              {/* Full-viewport catcher: any tap outside closes the popup. */}
              <div className="fixed inset-0 z-40" onClick={closeMenu} />
              <motion.div
                key="menu"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.12 }}
                style={{ top: openMenu.top, left: openMenu.left, width: MENU_WIDTH }}
                className="fixed z-50 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-gray-100 py-1.5 overflow-hidden"
              >
                <button
                  onClick={() => {
                    const { expense } = openMenu
                    closeMenu()
                    onEdit?.(expense)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Pencil size={16} /> Edit
                </button>
                <button
                  onClick={() => {
                    const { id } = openMenu
                    closeMenu()
                    onDelete(id)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
