import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { chatApi } from '../../services/api';
import type { ChatMessage } from '../../types';

export interface ChatViewProps {
  activeChatId: string | null;
}

export const ChatView: React.FC<ChatViewProps> = ({ activeChatId }) => {
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeChatId) {
      setIsLoading(true);
      chatApi.getConversation(activeChatId)
        .then((data) => {
          
          setMessages(data.messages || []);
        })
        .catch((err) => console.error('Failed to load conversation:', err))
        .finally(() => setIsLoading(false));
    } else {
      
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
    const tempUserId = `temp-user-${Date.now()}`;
    const tempAiId = `temp-ai-${Date.now()}`;
    
    setMessages((prev) => [
      ...prev,
      { id: tempUserId, role: 'user', content: userMessage, conversationId: activeChatId, createdAt: new Date().toISOString() },
      { id: tempAiId, role: 'assistant', content: '', conversationId: activeChatId, createdAt: new Date().toISOString() }
    ]);
    
    setIsLoading(true);

    try {
      let isFirstChunk = true;
      const responseMsg = await chatApi.sendMessageStream(
        activeChatId, 
        userMessage,
        (chunkText) => {
          if (isFirstChunk) {
            setIsLoading(false); // Stop loading animation when first chunk arrives
            isFirstChunk = false;
          }
          setMessages((prev) => 
            prev.map(m => m.id === tempAiId ? { ...m, content: m.content + chunkText } : m)
          );
        },
        () => {
          window.dispatchEvent(new Event('chat-title-updated'));
        }
      );
      
      // Update with final message from backend (which has proper DB ID)
      setMessages((prev) => {
        const withoutTemps = prev.filter(m => m.id !== tempUserId && m.id !== tempAiId);
        return [
          ...withoutTemps,
          { id: tempUserId + '-real', role: 'user', content: userMessage, conversationId: activeChatId, createdAt: new Date().toISOString() },
          responseMsg
        ];
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      // In case of error, show an error message in place of AI temp message
      setMessages((prev) => 
        prev.map(m => m.id === tempAiId ? { ...m, content: '⚠️ Ocorreu um erro ao gerar a resposta.' } : m)
      );
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
    <div className="flex flex-col h-full bg-white">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full px-4 py-8 space-y-8 pb-32">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center mt-20 opacity-60">
              <Sparkles className="w-12 h-12 text-slate-400 mb-4" />
              <p className="text-center text-slate-500 text-base font-medium">
                Olá! Como posso ajudar com os seus projetos hoje?
              </p>
            </div>
          )}
          
          {messages.map((msg) => (
            <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="flex gap-4 max-w-[85%]">
                {msg.role !== 'user' && (
                  <div className="shrink-0 mt-1">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-indigo-600" />
                    </div>
                  </div>
                )}
                
                <div className={`text-[15px] leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-slate-100 text-slate-800 px-5 py-3 rounded-3xl' 
                    : 'text-slate-800 prose prose-slate max-w-none prose-p:leading-relaxed prose-pre:bg-slate-50 prose-pre:text-slate-800 prose-pre:border prose-pre:border-slate-200 pt-1'
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
            <div className="flex w-full justify-start">
              <div className="flex gap-4 max-w-[85%]">
                <div className="shrink-0 mt-1">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse" />
                  </div>
                </div>
                <div className="pt-2 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                  <span className="text-sm text-slate-500 font-medium">Pensando...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white px-4 pb-6 pt-2">
        <div className="max-w-3xl mx-auto w-full">
          <div className="flex items-end gap-2 bg-slate-50 p-2 rounded-3xl border border-slate-200 focus-within:border-slate-300 focus-within:shadow-sm focus-within:bg-white transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Envie uma mensagem para o Assistente..."
              className="flex-1 max-h-48 min-h-[44px] bg-transparent border-0 focus:ring-0 resize-none py-3 px-4 text-[15px] text-slate-800 placeholder:text-slate-400 outline-none"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="shrink-0 mb-1 mr-1 p-3 rounded-full bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-30 disabled:bg-slate-400 transition-all flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="text-center mt-3">
            <p className="text-[11px] text-slate-400">O Assistente pode cometer erros. Verifique as informações importantes.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
