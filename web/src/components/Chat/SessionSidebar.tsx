'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plus, MessageSquare, ChevronLeft } from 'lucide-react';
import type { Session } from '@/types';

interface SessionSidebarProps {
  sessions: Session[];
  currentSessionId: string;
  onSwitchSession: (id: string) => void;
  onCreateSession: () => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function SessionSidebar({
  sessions,
  currentSessionId,
  onSwitchSession,
  onCreateSession,
  isCollapsed,
  onToggle,
}: SessionSidebarProps) {
  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <motion.div
      animate={{ width: isCollapsed ? 0 : 220 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="flex-shrink-0 overflow-hidden border-r border-white/[0.06] backdrop-blur-xl bg-black/[0.35] relative"
    >
      <div className="w-[220px] h-full flex flex-col">
        {/* Header */}
        <div className="h-12 flex items-center justify-between px-3 border-b border-white/[0.06] flex-shrink-0">
          <span className="text-xs font-medium text-text-dim uppercase tracking-wider">Conversations</span>
          <div className="flex items-center gap-1">
            <button
              onClick={onCreateSession}
              className="w-6 h-6 rounded-md bg-accent/15 text-accent2 flex items-center justify-center hover:bg-accent/25 transition-colors"
            >
              <Plus size={13} />
            </button>
            <button
              onClick={onToggle}
              className="w-6 h-6 rounded-md bg-white/[0.05] text-text-dim flex items-center justify-center hover:bg-white/[0.1] transition-colors"
            >
              <ChevronLeft size={13} />
            </button>
          </div>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {sessions.map((session) => {
            const isActive = session.id === currentSessionId;
            return (
              <button
                key={session.id}
                onClick={() => onSwitchSession(session.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 group
                  ${
                    isActive
                      ? 'bg-accent/15 border border-accent/20'
                      : 'hover:bg-white/[0.04] border border-transparent'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare size={13} className={isActive ? 'text-accent2' : 'text-text-dim'} />
                  <span
                    className={`text-xs font-medium truncate ${
                      isActive ? 'text-text-main' : 'text-text-dim group-hover:text-text-main'
                    }`}
                  >
                    {session.title}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1 ml-5">
                  <span className="text-[9px] text-text-dim">{formatDate(session.created_at)}</span>
                  {session.message_count !== undefined && (
                    <span className="text-[9px] text-text-dim">{session.message_count} msgs</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
