'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import type { Message } from '@/types';

interface ChatBubbleProps {
  message: Message;
  index: number;
}

export default function ChatBubble({ message, index }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const time = mounted
    ? new Date(message.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
      className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar icon for AI messages */}
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-accent to-neon-blue flex items-center justify-center mt-1 shadow-[0_0_10px_rgba(124,58,237,0.3)]">
          <span className="text-[10px] font-bold text-white">A</span>
        </div>
      )}

      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
          isUser
            ? 'bg-accent/20 border border-accent/30 rounded-br-md'
            : 'bg-white/[0.05] border border-white/[0.08] rounded-bl-md'
        }`}
      >
        <div className="text-[13px] leading-relaxed text-text-main prose prose-invert prose-sm max-w-none prose-pre:bg-white/[0.05] prose-pre:border prose-pre:border-white/[0.08] prose-pre:rounded-lg prose-code:text-neon-blue prose-code:text-xs prose-headings:text-text-main prose-strong:text-text-main prose-a:text-accent2">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        </div>
        <div className={`flex items-center gap-2 mt-1.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
          {mounted && <span className="text-[9px] text-text-dim">{time}</span>}
          {message.emotion && (
            <span className="text-[9px] text-text-dim bg-white/[0.05] px-1.5 py-0.5 rounded-full">
              {message.emotion}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
