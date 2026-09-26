import React, { useState, useEffect } from 'react';
import {
  Brain,
  Plus,
  FolderKanban,
  GraduationCap,
  Calendar,
  Menu,
  X,
  Flame,
  
  MessageSquare,
  ChevronRight,
  ChevronDown,
  FileText,
  KanbanSquare,
} from 'lucide-react';
import { chatApi } from '../services/api';
import type { ProjectSummary, ActiveView, ChatConversation } from '../types';

export interface NavbarProps {
  currentView?: ActiveView;
  onSelectView?: (view: ActiveView) => void;
  projects?: ProjectSummary[];
  activeProjectId?: string | null;
  onSelectProject?: (id: string | null) => void;
  onOpenCreateProjectModal?: () => void;
  onOpenCreateModal: () => void;
  onOpenCreateKanban?: () => void;
  onOpenCreateNote?: () => void;
  isConnected?: boolean;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  sprintActiveCount?: number;
  calendarCount?: number;
  activeChatId?: string | null;
  onSelectChat?: (id: string) => void;
  categoryCounts?: {
    ALL?: number;
    PROJECT?: number;
    COLLEGE?: number;
    PERSONAL?: number;
    [key: string]: number | undefined;
  };
  activeKanbanId?: string | null;
  activeNoteId?: string | null;
  onSelectKanban?: (id: string | null) => void;
  onSelectNote?: (id: string | null) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView = 'BOARD',
  onSelectView,
  projects = [],
  activeProjectId = null,
  onSelectProject,
  onOpenCreateProjectModal,
  onOpenCreateModal,
  onOpenCreateKanban,
  onOpenCreateNote,
  isConnected = true,
  sprintActiveCount = 0,
  calendarCount = 0,
  activeChatId = null,
  onSelectChat,
  activeKanbanId,
  activeNoteId,
  onSelectKanban,
  onSelectNote,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  useEffect(() => {
    chatApi.listConversations()
      .then(setConversations)
      .catch(console.error);
  }, [activeChatId]); // Refetch when chat changes

  const handleCreateChat = async () => {
    try {
      const newChat = await chatApi.createConversation();
      setConversations(prev => [newChat, ...prev]);
      if (onSelectChat) onSelectChat(newChat.id);
      setIsMobileMenuOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-6 space-y-8 bg-neutral-50 border-r-0">
      {/* Brand Header */}
      <div>
        <div className="flex items-center gap-3 px-1 py-1 mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-neutral-900 text-white shadow-none">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-base tracking-tight text-neutral-900">
                BrainBoard
              </span>
            </div>
          </div>
        </div>

        {/* Primary Navigation */}
        <div className="space-y-1">
          {/* 1. Portfolio View Button */}
          <button
            onClick={() => {
              if (onSelectView) onSelectView('PROJECTS');
              if (onSelectProject) onSelectProject(null);
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-colors ${
              currentView === 'PROJECTS' && !activeProjectId
                ? 'bg-neutral-200/50 text-neutral-900 font-medium'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <FolderKanban className="w-4 h-4 text-neutral-900" />
              <span>Projetos</span>
            </div>
            <span className="text-[12px] font-medium text-neutral-500">
              {projects.length}
            </span>
          </button>



          {/* 3. Visão Global View Button */}
          <button
            onClick={() => {
              if (onSelectView) onSelectView('SPRINT');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-colors ${
              currentView === 'SPRINT'
                ? 'bg-neutral-200/50 text-neutral-900 font-medium'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <Flame className="w-4 h-4 text-neutral-900" />
              <span>Sprint</span>
            </div>
            {sprintActiveCount > 0 && (
              <span className="text-[12px] font-medium text-neutral-500">
                {sprintActiveCount}
              </span>
            )}
          </button>

          {/* 4. Área Acadêmica View Button */}
          <button
            onClick={() => {
              if (onSelectView) onSelectView('ACADEMIC');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-colors ${
              currentView === 'ACADEMIC'
                ? 'bg-neutral-200/50 text-neutral-900 font-medium'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <GraduationCap className="w-4 h-4 text-neutral-900" />
              <span>Acadêmico</span>
            </div>
          </button>

          {/* 5. Calendário View Button */}
          <button
            onClick={() => {
              if (onSelectView) onSelectView('CALENDAR');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-colors ${
              currentView === 'CALENDAR'
                ? 'bg-neutral-200/50 text-neutral-900 font-medium'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-neutral-900" />
              <span>Calendário</span>
            </div>
            {calendarCount > 0 && (
              <span className="text-[12px] font-medium text-neutral-500">
                {calendarCount}
              </span>
            )}
          </button>

                  </div>

        {/* Project Switcher List */}
        {projects.length > 0 && (
          <div className="mt-8 space-y-1">
            <div className="flex items-center justify-between px-4 mb-3">
              <p className="text-xs font-medium text-neutral-500">Projetos</p>
              {onOpenCreateProjectModal && (
                <button
                  type="button"
                  onClick={onOpenCreateProjectModal}
                  aria-label="Criar novo projeto"
                  className="text-neutral-400 hover:text-neutral-900 p-0.5 rounded transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
              {projects.map((p) => {
                const isActive = activeProjectId === p.id;
                const isExpanded = expandedProjects[p.id] || false;
                return (
                  <div key={p.id} className="space-y-1">
                    <button
                      onClick={() => {
                        setExpandedProjects((prev) => ({ ...prev, [p.id]: !prev[p.id] }));
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all ${
                        isActive
                          ? 'bg-neutral-200/50 text-neutral-900 font-medium'
                          : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/30'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 shrink-0 text-neutral-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 shrink-0 text-neutral-400" />
                        )}
                        <span className="truncate">{p.title}</span>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="pl-11 pr-4 space-y-1 pb-2">
                        {p.kanbans && p.kanbans.length > 0 && p.kanbans.map((k) => {
                          const isKActive = activeKanbanId === k.id;
                          return (
                            <button
                              key={k.id}
                              onClick={() => {
                                if (onSelectProject) onSelectProject(p.id);
                                if (onSelectKanban) onSelectKanban(k.id);
                                if (onSelectView) onSelectView('BOARD');
                                setIsMobileMenuOpen(false);
                              }}
                              className={`w-full flex items-center gap-2 py-1.5 text-xs transition-colors text-left truncate ${
                                isKActive ? 'text-neutral-900 font-medium' : 'text-neutral-500 hover:text-neutral-900'
                              }`}
                            >
                              <KanbanSquare className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{k.title}</span>
                            </button>
                          );
                        })}
                        {p.notes && p.notes.length > 0 && p.notes.map((n) => {
                          const isNActive = activeNoteId === n.id;
                          return (
                            <button
                              key={n.id}
                              onClick={() => {
                                if (onSelectProject) onSelectProject(p.id);
                                if (onSelectNote) onSelectNote(n.id);
                                if (onSelectView) onSelectView('NOTE');
                                setIsMobileMenuOpen(false);
                              }}
                              className={`w-full flex items-center gap-2 py-1.5 text-xs transition-colors text-left truncate ${
                                isNActive ? 'text-neutral-900 font-medium' : 'text-neutral-500 hover:text-neutral-900'
                              }`}
                            >
                              <FileText className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{n.title}</span>
                            </button>
                          );
                        })}
                        {(!p.kanbans || p.kanbans.length === 0) && (!p.notes || p.notes.length === 0) && (
                          <div className="text-xs text-neutral-400 py-1">Vazio</div>
                        )}
                        <div className="flex gap-2 pt-2 pb-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); if (onSelectProject) onSelectProject(p.id); if (onOpenCreateKanban) onOpenCreateKanban(); }}
                            className="text-[10px] flex items-center gap-1 font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
                          >
                            <Plus className="w-3 h-3" /> Kanban
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); if (onSelectProject) onSelectProject(p.id); if (onOpenCreateNote) onOpenCreateNote(); }}
                            className="text-[10px] flex items-center gap-1 font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
                          >
                            <Plus className="w-3 h-3" /> Nota
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Conversations List */}
        {conversations.length > 0 && (
          <div className="mt-8 space-y-1">
            <div className="flex items-center justify-between px-4 mb-3">
              <p className="text-xs font-medium text-neutral-500">Conversas</p>
              <button
                type="button"
                onClick={handleCreateChat}
                aria-label="Nova conversa"
                className="text-neutral-400 hover:text-neutral-900 p-0.5 rounded transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
              {conversations.map((chat) => {
                const isActive = activeChatId === chat.id && currentView === 'CHAT';
                return (
                  <button
                    key={chat.id}
                    onClick={() => {
                      if (onSelectChat) onSelectChat(chat.id);
                      if (onSelectView) onSelectView('CHAT');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all ${
                      isActive
                        ? 'bg-neutral-200/50 text-neutral-900 font-medium'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <MessageSquare className="w-4 h-4 shrink-0 text-neutral-400" />
                      <span className="truncate">{chat.title || 'Nova Conversa'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Button & Status */}
      <div className="mt-12 space-y-4">
        <button
          onClick={() => {
            onOpenCreateModal();
            setIsMobileMenuOpen(false);
          }}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium rounded-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Novo</span>
        </button>
        
        <div className="flex justify-center items-center gap-1.5 pt-4">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
            title={isConnected ? 'Conectado' : 'Desconectado'}
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Lateral Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-neutral-50 shadow-none shrink-0 h-screen sticky top-0 overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile Top Header Bar */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-neutral-200 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
            <Brain className="w-4 h-4" />
          </div>
          <span className="font-semibold text-base text-neutral-900">BrainBoard</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCreateModal}
            className="p-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl text-neutral-600 hover:bg-neutral-100"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs flex">
          <div className="w-72 bg-white h-full shadow-lg overflow-y-auto">
            {sidebarContent}
          </div>
          <div
            className="flex-1"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        </div>
      )}
    </>
  );
};




