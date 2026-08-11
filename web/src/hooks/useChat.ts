'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Message, Session } from '@/types';
import { useWebSocket } from './useWebSocket';
import { avatarController } from '@/components/Avatar/controllers/AvatarController';
import { voicePlayer } from '@/utils/voicePlayer';
import { parseNaturalLanguageCommands } from '../utils/commandParser';

const VOICE_RESPONSES: Record<string, string[]> = {
  sleep: ["Going to sleep now, Boss. Zzz...", "Goodnight, Boss! Sweet dreams.", "I'm feeling sleepy, going to my bed."],
  wakeUp: ["Good morning, Boss! I'm awake.", "I'm up! Ready for tasks.", "Waking up and stretching!"],
  stand: ["Standing up, Boss.", "Okay, standing.", "Done, standing up."],
  sit: ["Sitting down now.", "Okay, taking a seat.", "Sure, sitting down."],
  wave: ["Hey! How are you doing? 👋", "Hello Boss! 😊", "Hi there!"],
  dance: ["Let's dance! 💃", "Busting some moves!", "Grooving to the music!"],
  lookOutside: ["Let's see what is happening outside.", "Checking out the city view.", "Looking out the window. It looks beautiful."],
  readBook: ["Time to read a book. 📚", "Reading mode active.", "Let's check out this book."],
  pickUpMug: ["Taking the coffee mug. ☕", "Picking up the cup.", "Getting some coffee!"],
  putMugBack: ["Putting the mug back on the table.", "Placing it down.", "Mug is back on the table."],
  lookAtMonitor: ["Checking my screen...", "Looking at the monitor.", "Inspecting the screen."],
  openWindow: ["Opening the window for some fresh air.", "Okay, opening the window.", "Window opened."],
  closeCurtains: ["Closing the curtains.", "Shutting the curtains.", "Curtains closed."],
  follow: ["Sure, following you now!", "I'm behind you.", "Following mode started."],
  stop: ["Stopping immediately.", "Standing here.", "Halted. Waiting for commands."],
  walk: ["Heading to the location.", "On my way!", "Going there, Boss.", "Right away, walking to the target."],
  default: ["Right away, Boss!", "On it!", "Task accepted! Running now."]
};

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: "Hello! I'm **Aleena**, your AI companion. ✨\n\nI can help you with conversations, tasks, creative projects, and more. How are you feeling today?",
    timestamp: Date.now() - 60000,
    emotion: 'happy',
  },
  {
    id: '2',
    role: 'user',
    content: "Hey Aleena! I'm doing great. Can you tell me about yourself?",
    timestamp: Date.now() - 50000,
  },
  {
    id: '3',
    role: 'assistant',
    content: "I'm so glad to hear that! 😊\n\nI'm a **digital human companion** — think of me as a blend of:\n\n- 🧠 An intelligent conversational AI\n- 🎭 A 3D holographic avatar with emotions\n- 📋 A personal task & memory assistant\n\nI can see, hear, and respond in real-time. I remember our conversations and learn your preferences over time.\n\n```python\n# My core capabilities\ncapabilities = [\n  'Natural conversation',\n  'Emotion recognition',\n  'Task management',\n  'Creative writing',\n  'Code assistance'\n]\n```\n\nWhat would you like to explore first?",
    timestamp: Date.now() - 40000,
    emotion: 'excited',
  },
];

const MOCK_SESSIONS: Session[] = [
  { id: 'session-1', title: 'Getting to know Aleena', created_at: Date.now() - 86400000, message_count: 12 },
  { id: 'session-2', title: 'Project brainstorming', created_at: Date.now() - 172800000, message_count: 8 },
  { id: 'session-3', title: 'Code review session', created_at: Date.now() - 259200000, message_count: 24 },
];

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [streamingText, setStreamingText] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const streamRef = useRef<NodeJS.Timeout | null>(null);

  const { send, lastMessage, isConnected } = useWebSocket();

  // Load session list and active history on websocket connect
  useEffect(() => {
    if (isConnected) {
      send({ type: 'session.list', data: {} });
      send({ type: 'history.get', data: {} });
      
      avatarController.onSpeechRequest = (text: string) => {
        voicePlayer.play(text);
        send({ type: 'voice.speak', data: { text } });
      };
    }
    return () => {
      avatarController.onSpeechRequest = null;
      voicePlayer.stop();
    };
  }, [isConnected, send]);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    const type = lastMessage.type;
    const data = lastMessage.data || lastMessage.payload || {};

    switch (type) {
      case 'chat.stream':
        setIsStreaming(true);
        setStreamingText((prev) => prev + (data.token || ''));
        break;

      case 'chat.done':
        setIsStreaming(false);
        const contentVal = data.full_response || data.content || streamingText;
        if (contentVal) {
          const newMsg: Message = {
            id: crypto.randomUUID?.() || String(Date.now()),
            role: 'assistant',
            content: contentVal,
            timestamp: Date.now(),
            emotion: data.emotion,
          };
          setMessages((prev) => [...prev, newMsg]);
          setStreamingText('');
        }
        break;

      case 'session.list':
        if (data.sessions) {
          setSessions(
            data.sessions.map((s: any) => ({
              id: s.session_id,
              title: s.title,
              created_at: new Date(s.created_at).getTime(),
            }))
          );
          if (data.active_session_id) {
            setCurrentSessionId(data.active_session_id);
          }
        }
        break;

      case 'session.created':
        const newSession: Session = {
          id: data.session_id,
          title: data.title,
          created_at: new Date(data.created_at).getTime(),
        };
        setSessions((prev) => [newSession, ...prev]);
        setCurrentSessionId(data.session_id);
        setMessages([]);
        break;

      case 'session.switched':
        setCurrentSessionId(data.session_id);
        send({ type: 'history.get', data: { session_id: data.session_id } });
        break;

      case 'history.data':
        if (data.messages) {
          setMessages(
            data.messages.map((m: any) => ({
              id: String(m.id),
              role: m.role,
              content: m.content,
              timestamp: new Date(m.timestamp).getTime(),
            }))
          );
        }
        break;

      case 'status.update':
        if (data.status) {
          window.dispatchEvent(new CustomEvent('avatar-status-update', { detail: data.status }));
        }
        break;

      case 'voice.result':
        if (data.text) {
          const userMsg: Message = {
            id: crypto.randomUUID?.() || String(Date.now()),
            role: 'user',
            content: data.text,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, userMsg]);
        }
        break;
    }
  }, [lastMessage, streamingText, send]);

  const sendMessage = useCallback(
    (content: string) => {
      const userMsg: Message = {
        id: crypto.randomUUID?.() || String(Date.now()),
        role: 'user',
        content,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);

      if (isConnected) {
        send({ type: 'chat.send', data: { text: content, session_id: currentSessionId } });
      } else {
        // Mock response when offline
        setIsStreaming(true);
        const mockResponse = getMockResponse(content);
        let i = 0;

        streamRef.current = setInterval(() => {
          if (i < mockResponse.length) {
            setStreamingText((prev) => prev + mockResponse[i]);
            i++;
          } else {
            if (streamRef.current) clearInterval(streamRef.current);
            setIsStreaming(false);
            const aiMsg: Message = {
              id: crypto.randomUUID?.() || String(Date.now()),
              role: 'assistant',
              content: mockResponse,
              timestamp: Date.now(),
              emotion: 'happy',
            };
            setMessages((prev) => [...prev, aiMsg]);
            setStreamingText('');
          }
        }, 20);
      }
    },
    [isConnected, currentSessionId, send]
  );

  const switchSession = useCallback(
    (sessionId: string) => {
      if (isConnected) {
        send({ type: 'session.switch', data: { session_id: sessionId } });
      } else {
        setCurrentSessionId(sessionId);
        setMessages([]);
        setStreamingText('');
      }
    },
    [isConnected, send]
  );

  const createSession = useCallback(() => {
    if (isConnected) {
      send({ type: 'session.create', data: {} });
    } else {
      const newSession: Session = {
        id: `session-${Date.now()}`,
        title: `New Chat ${sessions.length + 1}`,
        created_at: Date.now(),
        message_count: 0,
      };
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setMessages([]);
    }
  }, [isConnected, sessions.length, send]);

  const startVoice = useCallback(() => {
    if (isConnected) {
      send({ type: 'voice.start', data: {} });
    }
  }, [isConnected, send]);

  const stopVoice = useCallback(() => {
    if (isConnected) {
      send({ type: 'voice.stop', data: {} });
    }
  }, [isConnected, send]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) clearInterval(streamRef.current);
    };
  }, []);

  return {
    messages,
    sessions,
    currentSessionId,
    streamingText,
    isStreaming,
    isConnected,
    sendMessage,
    switchSession,
    createSession,
    startVoice,
    stopVoice,
  };
}

function getMockResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return "Hey there! 👋 It's wonderful to hear from you. I'm always here and ready to chat. What's on your mind today?";
  }
  if (lower.includes('help')) {
    return "Of course! I'm here to help. I can assist you with:\n\n- 💬 **Conversations** — just talk naturally\n- 📝 **Tasks** — I'll help you stay organized\n- 🎨 **Creative projects** — brainstorming, writing, design ideas\n- 💻 **Code** — debugging, explanations, reviews\n\nJust ask me anything!";
  }
  if (lower.includes('code') || lower.includes('program')) {
    return "I love talking about code! 💻 Here's a quick example:\n\n```typescript\nasync function greet(name: string): Promise<string> {\n  const response = await ai.generate(`Hello ${name}!`);\n  return response;\n}\n```\n\nWhat language or framework are you working with?";
  }
  return "That's a great point! I find this topic fascinating. Let me think about it...\n\nI'd love to explore this further with you. Could you tell me more about what specifically interests you about this? 🤔";
}
