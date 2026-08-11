'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  noBorder?: boolean;
}

export default function GlassCard({ children, className = '', glow = false, noBorder = false }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`
        backdrop-blur-xl bg-white/5 rounded-2xl
        ${noBorder ? '' : 'border border-white/10'}
        ${glow ? 'shadow-[0_0_30px_rgba(124,58,237,0.15)]' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
