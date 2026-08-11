'use client';

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import ChatBubble from './ChatBubble';
import type { Message } from '@/types';

interface ChatPanelProps {
  messages: Message[];
  streamingText: string;
  isStreaming: boolean;
}

export default function ChatPanel({ messages, streamingText, isStreaming }: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingText]);

  return (
    <div className="flex-1 flex flex-col backdrop-blur-xl bg-black/[0.35]">
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-white/[0.06] flex-shrink-0">
        <span className="text-sm font-medium text-text-main">💬 Chat with Aleena</span>
        <span className="text-[10px] text-text-dim bg-white/[0.05] px-2 py-0.5 rounded-full">
          {messages.length} messages
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <ChatBubble key={msg.id} message={msg} index={i} />
        ))}

        {/* Streaming indicator */}
        {isStreaming && streamingText && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2"
          >
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-accent to-neon-blue flex items-center justify-center mt-1 shadow-[0_0_10px_rgba(124,58,237,0.3)]">
              <span className="text-[10px] font-bold text-white">A</span>
            </div>
            <div className="max-w-[85%] rounded-2xl rounded-bl-md px-3.5 py-2.5 bg-white/[0.05] border border-white/[0.08]">
              <p className="text-[13px] leading-relaxed text-text-main">
                {streamingText}
                <span className="inline-block w-[2px] h-4 bg-accent2 ml-0.5 animate-pulse" />
              </p>
            </div>
          </motion.div>
        )}

        {/* Typing indicator (dots) */}
        {isStreaming && !streamingText && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-2"
          >
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-accent to-neon-blue flex items-center justify-center mt-1">
              <span className="text-[10px] font-bold text-white">A</span>
            </div>
            <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-white/[0.05] border border-white/[0.08] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-text-dim animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-text-dim animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-text-dim animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
