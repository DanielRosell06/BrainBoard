import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { chatApi } from '../../services/api';
import type { ChatConversation, ChatMessage } from '../../types';

export interface ChatViewProps {
  activeChatId: string | null;
}

export const ChatView: React.FC<ChatViewProps> = ({ activeChatId }) => {
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeChatId) {
      setIsLoading(true);
      chatApi.getConversation(activeChatId)
        .then((data) => {
          setConversation(data);
          setMessages(data.messages || []);
        })
        .catch((err) => console.error('Failed to load conversation:', err))
        .finally(() => setIsLoading(false));
    } else {
      setConversation(null);
      setMessages([]);
    }
  }, [activeChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || !activeChatId) return;

    const userMessage = input.trim();
    setInput('');
    
    // Optimistic UI update for user message
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: tempId, role: 'user', content: userMessage, conversationId: activeChatId, createdAt: new Date().toISOString() },
    ]);
    
    setIsLoading(true);

    try {
      const responseMsg = await chatApi.sendMessage(activeChatId, userMessage);
      setMessages((prev) => {
        // Remove temp message if needed, or just append the real ones. 
        // Actually, let's just refetch or append the response. 
        // A better approach is to rely on the response from backend which only returns the AI message.
        // Wait, the backend returns the saved assistant message.
        return [...prev.filter(m => m.id !== tempId), 
          { id: tempId + '-real', role: 'user', content: userMessage, conversationId: activeChatId, createdAt: new Date().toISOString() },
          responseMsg
        ];
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!activeChatId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
        <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-slate-800" />
        </div>
        <p className="text-sm font-medium">Selecione ou crie uma conversa para iniciar o Assistente IA.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl  bg-slate-900 flex items-center justify-center shadow-sm">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">{conversation?.title || 'Assistente IA'}</h2>
            <p className="text-xs font-medium text-slate-500">Powered by Gemini 2.5 Flash</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && !isLoading && (
          <div className="text-center text-slate-400 text-sm mt-10">
            Envie uma mensagem para começar a interagir com o BrainBoard.
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className="shrink-0 mt-1">
                {msg.role === 'user' ? (
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-600" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-300">
                    <Sparkles className="w-4 h-4 text-slate-900" />
                  </div>
                )}
              </div>
              
              <div className={`px-4 py-3 rounded-lg text-sm shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-slate-900 text-white rounded-tr-sm whitespace-pre-wrap' 
                  : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent prose-pre:m-0'
              }`}>
                {msg.role === 'user' ? (
                  msg.content
                ) : (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[80%]">
              <div className="shrink-0 mt-1">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-300">
                  <Sparkles className="w-4 h-4 text-slate-900" />
                </div>
              </div>
              <div className="px-4 py-4 rounded-lg bg-white border border-slate-200 rounded-tl-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-slate-800 animate-spin" />
                <span className="text-xs text-slate-500 font-medium">Processando...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="flex items-end gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200 focus-within:border-slate-400 focus-within:ring-4 focus-within:ring-slate-100 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre seus projetos, peça para criar tarefas..."
            className="flex-1 max-h-32 min-h-[44px] bg-transparent border-0 focus:ring-0 resize-none py-2.5 px-3 text-sm text-slate-700 placeholder:text-slate-400"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="shrink-0 mb-1 mr-1 p-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-slate-900 transition-colors shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
