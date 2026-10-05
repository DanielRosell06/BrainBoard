import React, { useState, useEffect, useCallback } from 'react';
import {
  Brain,
  Plus,
  FolderKanban,
  Calendar,
  Menu,
  X,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  FileText,
  KanbanSquare,
  GripVertical,
  CheckSquare,
  PenTool,
  Link as LinkIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult, DragStart } from '@hello-pangea/dnd';
import { chatApi, projectsApi, kanbansApi, notesApi, whiteboardsApi, checklistsApi } from '../services/api';
import type { ProjectSummary, ActiveView, ChatConversation } from '../types';

export interface NavbarProps {
  currentView?: ActiveView;
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
  calendarCount?: number;
  activeChatId?: string | null;
  categoryCounts?: {
    ALL?: number;
    PROJECT?: number;
    COLLEGE?: number;
    PERSONAL?: number;
    [key: string]: number | undefined;
  };
  activeKanbanId?: string | null;
  activeNoteId?: string | null;
  activeWhiteboardId?: string | null;
  activeChecklistId?: string | null;
  loadProjects?: (silent?: boolean) => Promise<any>;
}

type ProjectFile = {
  id: string;
  title: string;
  order: number;
  _type: 'KANBAN' | 'NOTE' | 'WHITEBOARD' | 'CHECKLIST';
  _original: any;
};

const getProjectFiles = (p: ProjectSummary): ProjectFile[] => {
  const files: ProjectFile[] = [];
  if (p.kanbans) files.push(...p.kanbans.map(k => ({ ...k, _type: 'KANBAN' as const, _original: k })));
  if (p.notes) files.push(...p.notes.map(n => ({ ...n, _type: 'NOTE' as const, _original: n })));
  if (p.whiteboards) files.push(...p.whiteboards.map(w => ({ ...w, _type: 'WHITEBOARD' as const, _original: w })));
  if (p.checklists) files.push(...p.checklists.map(c => ({ ...c, _type: 'CHECKLIST' as const, _original: c })));

  return files.sort((a, b) => (a.order || 0) - (b.order || 0));
};

export const Navbar: React.FC<NavbarProps> = ({
  currentView = 'BOARD',
  projects = [],
  activeProjectId = null,
  onSelectProject,
  onOpenCreateProjectModal,
  onOpenCreateModal,
  onOpenCreateKanban,
  onOpenCreateNote,
  isConnected = true,
  calendarCount = 0,
  activeChatId = null,
  activeKanbanId,
  activeNoteId,
  loadProjects
}) => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [localProjects, setLocalProjects] = useState<ProjectSummary[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const isProjectContext = !!(activeProjectId && currentView && !['PROJECTS', 'CALENDAR', 'CHAT'].includes(currentView));

  useEffect(() => {
    setLocalProjects(projects);
  }, [projects]);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const loadConversations = useCallback(() => {
    chatApi.listConversations()
      .then(setConversations)
      .catch(console.error);
  }, []);

  useEffect(() => {
    loadConversations();
  }, [activeChatId, loadConversations]);

  useEffect(() => {
    const handleTitleUpdated = () => loadConversations();
    window.addEventListener('chat-title-updated', handleTitleUpdated);
    return () => window.removeEventListener('chat-title-updated', handleTitleUpdated);
  }, [loadConversations]);

  const handleCreateChat = async () => {
    try {
      const newChat = await chatApi.createConversation();
      setConversations(prev => [newChat, ...prev]);
      navigate(`/chat/${newChat.id}`);
      setIsMobileMenuOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleProjectClick = (pId: string) => {
    navigate(`/projects/${pId}`);
    setExpandedProjects((prev) => ({ ...prev, [pId]: true }));
    setIsMobileMenuOpen(false);
  };

  const onDragStart = (start: DragStart) => {
    if (start.type === 'PROJECT') {
      setExpandedProjects({});
    }
    setOpenDropdown(null);
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === 'PROJECT') {
      const newProjects = localProjects.map(p => ({ ...p }));
      const [removed] = newProjects.splice(source.index, 1);
      newProjects.splice(destination.index, 0, removed);
      
      const updates = newProjects
        .map((p, idx) => ({ id: p.id, order: idx, oldOrder: p.order }))
        .filter(u => u.order !== u.oldOrder)
        .map(u => ({ id: u.id, order: u.order }));

      newProjects.forEach((p, idx) => { p.order = idx; });
      setLocalProjects(newProjects);

      try {
        if (updates.length > 0) {
          await Promise.all(updates.map(u => projectsApi.update(u.id, { order: u.order })));
          if (loadProjects) loadProjects(true);
        }
      } catch (e) {
        console.error(e);
        setLocalProjects(projects);
      }
    } else if (type === 'FILE') {
      if (source.droppableId !== destination.droppableId) return;

      const projectId = source.droppableId.replace('FILES-', '');
      const projectIndex = localProjects.findIndex(p => p.id === projectId);
      if (projectIndex === -1) return;
      
      const project = { ...localProjects[projectIndex] };
      const files = getProjectFiles(project).map(f => ({ ...f }));
      const [removed] = files.splice(source.index, 1);
      files.splice(destination.index, 0, removed);

      const updates = files
        .map((f, idx) => ({ f, order: idx, oldOrder: f.order }))
        .filter(u => u.order !== u.oldOrder)
        .map(u => ({ f: u.f, order: u.order }));

      const newProject: ProjectSummary = { ...project, kanbans: [], notes: [], whiteboards: [], checklists: [] };
      files.forEach((f, idx) => {
        f.order = idx;
        const orig = { ...f._original, order: idx };
        if (f._type === 'KANBAN') newProject.kanbans!.push(orig);
        if (f._type === 'NOTE') newProject.notes!.push(orig);
        if (f._type === 'WHITEBOARD') newProject.whiteboards!.push(orig);
        if (f._type === 'CHECKLIST') newProject.checklists!.push(orig);
      });

      const newProjects = [...localProjects];
      newProjects[projectIndex] = newProject;
      setLocalProjects(newProjects);

      try {
        if (updates.length > 0) {
          await Promise.all(
            updates.map(({ f, order }) => {
              if (f._type === 'KANBAN') return kanbansApi.update(projectId, f.id, { order });
              if (f._type === 'NOTE') return notesApi.update(projectId, f.id, { order });
              if (f._type === 'WHITEBOARD') return whiteboardsApi.update(projectId, f.id, { order });
              if (f._type === 'CHECKLIST') return checklistsApi.update(f.id, { order });
            })
          );
          if (loadProjects) loadProjects(true);
        }
      } catch (e) {
        console.error(e);
        setLocalProjects(projects);
      }
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-6 space-y-8 bg-neutral-50 border-r-0">
      <div>
        <div className="flex items-center gap-3 px-1 py-1 mb-8">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-neutral-900 text-white shadow-none">
            <Brain className="w-5 h-5" />
            <span
              className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-neutral-50 ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
              title={isConnected ? 'Conectado' : 'Desconectado'}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-base tracking-tight text-neutral-900">
                BrainBoard
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <button
            onClick={() => {
              navigate('/projects');
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
              {localProjects.length}
            </span>
          </button>

          <button
            onClick={() => {
              navigate('/calendar');
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

          {localProjects.length > 0 ? (
            <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
              <Droppable droppableId="PROJECTS" type="PROJECT">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1 max-h-80 overflow-y-auto pr-1">
                    {localProjects.map((p, index) => {
                      const isActive = activeProjectId === p.id;
                      const isExpanded = expandedProjects[p.id] || false;
                      const projectFiles = getProjectFiles(p);
                      return (
                        <Draggable key={p.id} draggableId={p.id} index={index}>
                          {(provided) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} className="space-y-1">
                              <div
                                className={`w-full flex items-center justify-between px-2 py-2 rounded-xl text-sm transition-all group ${
                                  isActive
                                    ? 'bg-neutral-200/50 text-neutral-900 font-medium'
                                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/30'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate flex-1">
                                  <div {...provided.dragHandleProps} className="text-neutral-400 hover:text-neutral-600 cursor-grab">
                                    <GripVertical className="w-3.5 h-3.5" />
                                  </div>
                                  <div
                                    className="cursor-pointer p-0.5"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedProjects((prev) => ({ ...prev, [p.id]: !prev[p.id] }));
                                    }}
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="w-4 h-4 text-neutral-400" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                                    )}
                                  </div>
                                  <span className="truncate flex-1 cursor-pointer" onClick={() => handleProjectClick(p.id)}>{p.title}</span>
                                </div>
                                
                                <div className="relative flex items-center">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenDropdown(openDropdown === p.id ? null : p.id);
                                    }}
                                    className="p-1 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-neutral-200 text-neutral-500 transition-all"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                  {openDropdown === p.id && (
                                    <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-50">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (onSelectProject) onSelectProject(p.id);
                                          if (onOpenCreateKanban) onOpenCreateKanban();
                                          setOpenDropdown(null);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-50 text-neutral-700 flex items-center gap-2"
                                      >
                                        <KanbanSquare className="w-3.5 h-3.5" /> Kanban
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (onSelectProject) onSelectProject(p.id);
                                          if (onOpenCreateNote) onOpenCreateNote();
                                          setOpenDropdown(null);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-50 text-neutral-700 flex items-center gap-2"
                                      >
                                        <FileText className="w-3.5 h-3.5" /> Nota
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const title = prompt('Nome do Checklist:');
                                          if (title) {
                                            checklistsApi.create(p.id, { title }).then(() => {
                                              if (loadProjects) loadProjects(true);
                                            });
                                          }
                                          setOpenDropdown(null);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-50 text-neutral-700 flex items-center gap-2"
                                      >
                                        <CheckSquare className="w-3.5 h-3.5" /> Checklist
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const title = prompt('Nome do Whiteboard:');
                                          if (title) {
                                            whiteboardsApi.create(p.id, { title }).then(() => {
                                              if (loadProjects) loadProjects(true);
                                            });
                                          }
                                          setOpenDropdown(null);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-50 text-neutral-700 flex items-center gap-2"
                                      >
                                        <PenTool className="w-3.5 h-3.5" /> Whiteboard
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const url = prompt('URL do Bookmark:');
                                          if (url) {
                                            const title = prompt('Título (opcional):') || url;
                                            import('../services/api').then(({ bookmarksApi }) => {
                                              bookmarksApi.create(p.id, { title, url }).then(() => {
                                                if (loadProjects) loadProjects(true);
                                              });
                                            });
                                          }
                                          setOpenDropdown(null);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-50 text-neutral-700 flex items-center gap-2"
                                      >
                                        <LinkIcon className="w-3.5 h-3.5" /> Bookmark
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {isExpanded && (
                                <Droppable droppableId={`FILES-${p.id}`} type="FILE">
                                  {(provided) => (
                                    <div ref={provided.innerRef} {...provided.droppableProps} className="pl-4 pr-2 space-y-1 pb-2">

                                      
                                      {projectFiles.length > 0 ? projectFiles.map((f, fIndex) => {
                                        const isFActive = 
                                          (f._type === 'KANBAN' && activeKanbanId === f.id && currentView === 'BOARD') ||
                                          (f._type === 'NOTE' && activeNoteId === f.id && currentView === 'NOTE');
                                          
                                        const Icon = f._type === 'KANBAN' ? KanbanSquare : FileText;

                                        return (
                                          <Draggable key={`${f._type}-${f.id}`} draggableId={`${f._type}-${f.id}`} index={fIndex}>
                                            {(provided) => (
                                              <div 
                                                ref={provided.innerRef} 
                                                {...provided.draggableProps}
                                                className={`w-full flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs transition-colors text-left group ${
                                                  isFActive ? 'bg-neutral-200/50 text-neutral-900 font-medium' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/30'
                                                }`}
                                              >
                                                <div {...provided.dragHandleProps} className="text-neutral-300 hover:text-neutral-500 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <GripVertical className="w-3 h-3" />
                                                </div>
                                                <div 
                                                  className="flex items-center gap-2 truncate flex-1 cursor-pointer"
                                                  onClick={() => {
                                                    if (f._type === 'KANBAN') {
                                                      navigate(`/projects/${p.id}/kanban/${f.id}`);
                                                    } else if (f._type === 'NOTE') {
                                                      navigate(`/projects/${p.id}/notes/${f.id}`);
                                                    } else if (f._type === 'WHITEBOARD') {
                                                      navigate(`/projects/${p.id}/whiteboards/${f.id}`);
                                                    } else if (f._type === 'CHECKLIST') {
                                                      navigate(`/projects/${p.id}/checklists/${f.id}`);
                                                    }
                                                    setIsMobileMenuOpen(false);
                                                  }}
                                                >
                                                  <Icon className="w-3.5 h-3.5 shrink-0" />
                                                  <span className="truncate">{f.title}</span>
                                                </div>
                                              </div>
                                            )}
                                          </Draggable>
                                        );
                                      }) : (
                                        <div className="text-xs text-neutral-400 py-1 pl-2">Vazio</div>
                                      )}
                                      {provided.placeholder}
                                    </div>
                                  )}
                                </Droppable>
                              )}
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <div className="px-4 py-3 bg-neutral-200/30 mx-2 rounded-xl text-center">
              <p className="text-[11px] text-neutral-500 mb-1">Nenhum projeto ainda.</p>
              <button 
                onClick={onOpenCreateProjectModal}
                className="text-xs font-semibold text-neutral-700 hover:text-neutral-900 transition-colors"
              >
                Criar o primeiro
              </button>
            </div>
          )}
        </div>

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
          {conversations.length > 0 ? (
            <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
              {conversations.map((chat) => {
                const isActive = activeChatId === chat.id && currentView === 'CHAT';
                return (
                  <button
                    key={chat.id}
                    onClick={() => {
                      navigate(`/chat/${chat.id}`);
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
          ) : (
            <div className="px-4 py-3 bg-neutral-200/30 mx-2 rounded-xl text-center">
              <p className="text-[11px] text-neutral-500 mb-1">Nenhuma conversa ainda.</p>
              <button 
                onClick={handleCreateChat}
                className="text-xs font-semibold text-neutral-700 hover:text-neutral-900 transition-colors"
              >
                Comece por aqui
              </button>
            </div>
          )}
        </div>

      </div>

      <div className="mt-12 space-y-4 relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpenDropdown(openDropdown === 'GLOBAL_NEW' ? null : 'GLOBAL_NEW');
          }}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium rounded-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Novo</span>
        </button>

        {openDropdown === 'GLOBAL_NEW' && (
          <div className="absolute bottom-full mb-2 left-0 w-full bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-neutral-200 py-1.5 z-50 overflow-y-auto max-h-[60vh]">
            <button
              onClick={() => {
                if (onOpenCreateModal) onOpenCreateModal();
                setOpenDropdown(null);
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-50 text-neutral-700 flex items-center gap-2.5 transition-colors"
            >
              <div className="w-6 h-6 rounded-md bg-neutral-100 flex items-center justify-center"><KanbanSquare className="w-3.5 h-3.5 text-neutral-600" /></div>
              Nova Tarefa
            </button>
            <button
              onClick={() => {
                if (onOpenCreateProjectModal) onOpenCreateProjectModal();
                setOpenDropdown(null);
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-50 text-neutral-700 flex items-center gap-2.5 transition-colors"
            >
              <div className="w-6 h-6 rounded-md bg-neutral-100 flex items-center justify-center"><FolderKanban className="w-3.5 h-3.5 text-neutral-600" /></div>
              Novo Projeto
            </button>
            <button
              onClick={() => {
                handleCreateChat();
                setOpenDropdown(null);
              }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-50 text-neutral-700 flex items-center gap-2.5 transition-colors"
            >
              <div className="w-6 h-6 rounded-md bg-neutral-100 flex items-center justify-center"><MessageSquare className="w-3.5 h-3.5 text-neutral-600" /></div>
              Nova Conversa
            </button>

              <>
                <div className="h-px bg-neutral-100 my-1 mx-2" />
                <div className="px-4 py-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">No Projeto Ativo</div>
                <button
                  disabled={!isProjectContext}
                  onClick={() => {
                    if (onOpenCreateKanban) onOpenCreateKanban();
                    setOpenDropdown(null);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition-colors ${!isProjectContext ? 'opacity-50 cursor-not-allowed text-neutral-400' : 'hover:bg-neutral-50 text-neutral-700'}`}
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center ${!isProjectContext ? 'bg-neutral-50' : 'bg-neutral-100'}`}><KanbanSquare className={`w-3.5 h-3.5 ${!isProjectContext ? 'text-neutral-400' : 'text-neutral-600'}`} /></div>
                  Novo Kanban
                </button>
                <button
                  disabled={!isProjectContext}
                  onClick={() => {
                    if (onOpenCreateNote) onOpenCreateNote();
                    setOpenDropdown(null);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition-colors ${!isProjectContext ? 'opacity-50 cursor-not-allowed text-neutral-400' : 'hover:bg-neutral-50 text-neutral-700'}`}
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center ${!isProjectContext ? 'bg-neutral-50' : 'bg-neutral-100'}`}><FileText className={`w-3.5 h-3.5 ${!isProjectContext ? 'text-neutral-400' : 'text-neutral-600'}`} /></div>
                  Nova Nota
                </button>
                <button
                  disabled={!isProjectContext}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!activeProjectId) return;
                    const title = prompt('Nome do Checklist:');
                    if (title) {
                      checklistsApi.create(activeProjectId, { title }).then(() => {
                        if (loadProjects) loadProjects(true);
                      });
                    }
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition-colors ${!isProjectContext ? 'opacity-50 cursor-not-allowed text-neutral-400' : 'hover:bg-neutral-50 text-neutral-700'}`}
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center ${!isProjectContext ? 'bg-neutral-50' : 'bg-neutral-100'}`}><CheckSquare className={`w-3.5 h-3.5 ${!isProjectContext ? 'text-neutral-400' : 'text-neutral-600'}`} /></div>
                  Novo Checklist
                </button>
                <button
                  disabled={!isProjectContext}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!activeProjectId) return;
                    const title = prompt('Nome do Whiteboard:');
                    if (title) {
                      whiteboardsApi.create(activeProjectId, { title }).then(() => {
                        if (loadProjects) loadProjects(true);
                      });
                    }
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition-colors ${!isProjectContext ? 'opacity-50 cursor-not-allowed text-neutral-400' : 'hover:bg-neutral-50 text-neutral-700'}`}
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center ${!isProjectContext ? 'bg-neutral-50' : 'bg-neutral-100'}`}><PenTool className={`w-3.5 h-3.5 ${!isProjectContext ? 'text-neutral-400' : 'text-neutral-600'}`} /></div>
                  Novo Whiteboard
                </button>
                <button
                  disabled={!isProjectContext}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!activeProjectId) return;
                    const url = prompt('URL do Bookmark:');
                    if (url) {
                      const title = prompt('Título (opcional):') || url;
                      import('../services/api').then(({ bookmarksApi }) => {
                        bookmarksApi.create(activeProjectId, { title, url }).then(() => {
                          if (loadProjects) loadProjects(true);
                        });
                      });
                    }
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition-colors ${!isProjectContext ? 'opacity-50 cursor-not-allowed text-neutral-400' : 'hover:bg-neutral-50 text-neutral-700'}`}
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center ${!isProjectContext ? 'bg-neutral-50' : 'bg-neutral-100'}`}><LinkIcon className={`w-3.5 h-3.5 ${!isProjectContext ? 'text-neutral-400' : 'text-neutral-600'}`} /></div>
                  Novo Bookmark
                </button>
              </>
          </div>
        )}
        

      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 bg-neutral-50 shadow-none shrink-0 h-screen sticky top-0 overflow-y-auto">
        {sidebarContent}
      </aside>

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
