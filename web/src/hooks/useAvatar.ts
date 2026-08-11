'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { AvatarState, AppStatus } from '@/types';

export function useAvatar() {
  const [emotion, setEmotion] = useState<string>('neutral');
  const [mouthOpen, setMouthOpen] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [status, setStatus] = useState<AppStatus>('ready');

  const lipSyncRef = useRef<NodeJS.Timeout | null>(null);
  const targetMouthRef = useRef(0);

  // Lip sync simulation
  useEffect(() => {
    if (isSpeaking) {
      lipSyncRef.current = setInterval(() => {
        // Generate pseudo-random mouth movement for speech simulation
        const noise = Math.sin(Date.now() * 0.01) * 0.3 +
          Math.sin(Date.now() * 0.023) * 0.2 +
          Math.random() * 0.3;
        targetMouthRef.current = Math.max(0, Math.min(1, noise + 0.2));
        setMouthOpen((prev) => prev + (targetMouthRef.current - prev) * 0.3);
      }, 50);
    } else {
      if (lipSyncRef.current) clearInterval(lipSyncRef.current);
      // Smoothly close mouth
      const closeInterval = setInterval(() => {
        setMouthOpen((prev) => {
          if (prev < 0.01) {
            clearInterval(closeInterval);
            return 0;
          }
          return prev * 0.85;
        });
      }, 30);
    }

    return () => {
      if (lipSyncRef.current) clearInterval(lipSyncRef.current);
    };
  }, [isSpeaking]);

  // Compute status from states
  useEffect(() => {
    if (isSpeaking) setStatus('speaking');
    else if (isThinking) setStatus('thinking');
    else if (isListening) setStatus('listening');
    else setStatus('ready');
  }, [isSpeaking, isThinking, isListening]);

  const setAvatarState = useCallback((state: Partial<AvatarState>) => {
    if (state.emotion !== undefined) setEmotion(state.emotion);
    if (state.mouthOpen !== undefined) setMouthOpen(state.mouthOpen);
    if (state.isSpeaking !== undefined) setIsSpeaking(state.isSpeaking);
    if (state.isListening !== undefined) setIsListening(state.isListening);
    if (state.isThinking !== undefined) setIsThinking(state.isThinking);
  }, []);

  // Listen to WebSocket status changes dispatched from useChat
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStatus = (e: Event) => {
      const statusValue = (e as CustomEvent).detail;
      setIsListening(statusValue === 'listening');
      setIsSpeaking(statusValue === 'speaking');
      setIsThinking(statusValue === 'thinking');
    };
    window.addEventListener('avatar-status-update', handleStatus);
    return () => window.removeEventListener('avatar-status-update', handleStatus);
  }, []);

  return {
    emotion,
    mouthOpen,
    isSpeaking,
    isListening,
    isThinking,
    status,
    setAvatarState,
    setIsSpeaking,
    setIsListening,
    setIsThinking,
    setEmotion,
  };
}
