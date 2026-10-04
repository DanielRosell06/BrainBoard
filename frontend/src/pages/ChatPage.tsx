import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ChatView } from '../components/chat/ChatView';

/**
 * ChatPage — AI assistant chat view.
 * Routes: /chat  and  /chat/:chatId
 */
export const ChatPage: React.FC = () => {
  const { chatId } = useParams<{ chatId?: string }>();

  const { activeChatId, setActiveChatId } = useAppContext();

  // Sync activeChatId from URL params on mount / param change
  useEffect(() => {
    if (chatId && chatId !== activeChatId) {
      setActiveChatId(chatId);
    }
  }, [chatId, activeChatId, setActiveChatId]);

  return <ChatView activeChatId={chatId || activeChatId} />;
};
