'use client';

import React, { useState, useRef } from 'react';
import { Send, Plus, Mic, Image as ImageIcon } from 'lucide-react';

interface InputBarProps {
  onSend: (message: string) => void;
  isListening: boolean;
  onMicToggle: () => void;
}

export default function InputBar({ onSend, isListening, onMicToggle }: InputBarProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-16 flex items-center gap-2 px-4 border-t border-white/[0.06] bg-black/[0.3] backdrop-blur-xl">
      {/* Attachment */}
      <button className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-text-dim hover:text-text-main hover:bg-white/[0.1] transition-all">
        <Plus size={16} />
      </button>

      {/* Image upload */}
      <button className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-text-dim hover:text-text-main hover:bg-white/[0.1] transition-all">
        <ImageIcon size={16} />
      </button>

      {/* Text input */}
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message Aleena..."
        className="flex-1 h-10 px-4 rounded-full bg-white/[0.05] border border-white/[0.08] text-sm text-text-main placeholder:text-text-dim focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all"
      />

      {/* Microphone */}
      <button
        onClick={onMicToggle}
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all relative
          ${
            isListening
              ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30 shadow-[0_0_20px_rgba(0,242,255,0.2)]'
              : 'bg-white/[0.05] border border-white/[0.08] text-text-dim hover:text-text-main hover:bg-white/[0.1]'
          }`}
      >
        {isListening && (
          <span className="absolute inset-0 rounded-xl animate-ping bg-neon-blue/20" />
        )}
        <Mic size={16} />
      </button>

      {/* Send */}
      <button
        onClick={handleSend}
        disabled={!text.trim()}
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all
          ${
            text.trim()
              ? 'bg-accent text-white shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:bg-accent2'
              : 'bg-white/[0.05] border border-white/[0.08] text-text-dim cursor-not-allowed'
          }`}
      >
        <Send size={16} />
      </button>
    </div>
  );
}
