import { motion, AnimatePresence } from 'framer-motion'

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, description, confirmText = 'Confirm', confirmColor = 'red' }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white p-8 rounded-[2rem] max-w-sm w-full text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
            <p className="text-gray-500 mb-8 text-sm leading-relaxed">{description}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-900 font-bold py-3.5 rounded-2xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`flex-1 text-white font-bold py-3.5 rounded-2xl transition-colors ${
                  confirmColor === 'red'
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-gray-900 hover:bg-gray-800'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
