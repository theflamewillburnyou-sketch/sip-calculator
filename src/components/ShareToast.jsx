import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

export default function ShareToast({ message, visible }) {
  return (
    <AnimatePresence>
      {visible && message && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-semibold shadow-lg max-w-[min(90vw,320px)]"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <CheckCircle2 size={16} className="text-neon-green shrink-0" />
          <span className="truncate">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
