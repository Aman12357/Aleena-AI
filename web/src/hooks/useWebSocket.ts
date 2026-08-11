'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { WebSocketMessage } from '@/types';

function getWebSocketUrl(): string {
  if (typeof window === 'undefined') return 'ws://127.0.0.1:8765/ws';

  let envWsUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL;
  if (envWsUrl) {
    envWsUrl = envWsUrl.trim();
    if (envWsUrl.endsWith('/ws')) {
      envWsUrl = envWsUrl.substring(0, envWsUrl.length - 3);
    }
    if (envWsUrl.startsWith('http://')) {
      return envWsUrl.replace('http://', 'ws://') + '/ws';
    }
    if (envWsUrl.startsWith('https://')) {
      return envWsUrl.replace('https://', 'wss://') + '/ws';
    }
    return `${envWsUrl}/ws`;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `${protocol}//${window.location.host}/ws`;
  }

  return 'ws://127.0.0.1:8765/ws';
}

export function useWebSocket(url?: string): UseWebSocketReturn {
  const targetUrl = url || getWebSocketUrl();
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [status, setStatus] = useState<UseWebSocketReturn['status']>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const messageQueueRef = useRef<WebSocketMessage[]>([]);

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      setStatus('connecting');
      const ws = new WebSocket(targetUrl);

      ws.onopen = () => {
        setStatus('connected');
        reconnectAttempts.current = 0;

        // Flush queued messages
        while (messageQueueRef.current.length > 0) {
          const msg = messageQueueRef.current.shift();
          if (msg) ws.send(JSON.stringify(msg));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketMessage;
          setLastMessage(data);
        } catch {
          console.warn('Failed to parse WebSocket message:', event.data);
        }
      };

      ws.onerror = () => {
        setStatus('error');
      };

      ws.onclose = () => {
        setStatus('disconnected');
        wsRef.current = null;

        // Exponential backoff reconnect
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current += 1;
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      };

      wsRef.current = ws;
    } catch {
      setStatus('error');
    }
  }, [targetUrl]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent reconnect on unmount
        wsRef.current.close();
      }
    };
  }, [connect, targetUrl]);

  const send = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      messageQueueRef.current.push(message);
    }
  }, []);

  return {
    send,
    lastMessage,
    isConnected: status === 'connected',
    status,
  };
}
