import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  customHeader?: React.ReactNode;
}

export function Sheet({ isOpen, onClose, title, description, children, className = '', customHeader }: SheetProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-end z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className={`bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl w-full max-w-2xl h-full overflow-y-auto border-l border-white/20 dark:border-gray-700/20 ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-white/20 dark:border-gray-700/20 px-6 py-4 flex items-center justify-between z-10">
            {customHeader || (
              <>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
                  {description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/60 dark:hover:bg-gray-800/60 rounded-lg transition-all duration-200 border border-white/20 dark:border-gray-700/20"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
