'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';

export interface ChatProduct {
  title: string;
  brand?: string;
  category?: string;
  ingredients?: string;
  directions?: string;
  buyLinks?: string[];
  imageUrl?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  products?: ChatProduct[];
}

interface ChatContextType {
  chatMessages: ChatMessage[];
  setChatMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
  resetConversation: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children, initialMessage }: { children: ReactNode; initialMessage: string }) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: initialMessage
    }
  ]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Generate sessionId on mount so calendar works before first chat
  useEffect(() => {
    if (!sessionId) {
      // Use crypto.randomUUID() if available (HTTPS/localhost), otherwise fallback
      const newSessionId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      setSessionId(newSessionId);
      console.log('🆔 Generated session ID:', newSessionId);
    }
  }, []);

  const resetConversation = () => {
    setChatMessages([
      {
        role: 'assistant',
        content: initialMessage
      }
    ]);
    setSessionId(null);
  };

  return (
    <ChatContext.Provider
      value={{
        chatMessages,
        setChatMessages,
        sessionId,
        setSessionId,
        resetConversation
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  return context;
}

export function useChatRequired() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatRequired must be used within a ChatProvider');
  }
  return context;
}
