'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AppStatus } from '@/types';

interface StatusPillProps {
  status: AppStatus;
}

const statusConfig: Record<AppStatus, { label: string; color: string; dotColor: string; animate: boolean }> = {
  ready: { label: 'Ready', color: 'text-neon-green', dotColor: 'bg-neon-green', animate: false },
  listening: { label: 'Listening...', color: 'text-neon-blue', dotColor: 'bg-neon-blue', animate: true },
  thinking: { label: 'Thinking...', color: 'text-neon-amber', dotColor: 'bg-neon-amber', animate: true },
  speaking: { label: 'Speaking', color: 'text-neon-green', dotColor: 'bg-neon-green', animate: true },
  error: { label: 'Error', color: 'text-red-400', dotColor: 'bg-red-400', animate: false },
};

export default function StatusPill({ status }: StatusPillProps) {
  const config = statusConfig[status];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm"
      >
        <span className="relative flex h-2.5 w-2.5">
          {config.animate && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.dotColor} opacity-75`} />
          )}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.dotColor}`} />
        </span>
        <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
      </motion.div>
    </AnimatePresence>
  );
}
