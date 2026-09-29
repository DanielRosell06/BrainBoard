import React from 'react';
import {
  Search,
  FolderKanban,
  LayoutGrid,
  
  Calendar,
  
} from 'lucide-react';
import type { Project, ProjectSummary, ActiveView } from '../types';

export interface TopHeaderProps {
  currentView?: ActiveView;
  onSelectView?: (view: ActiveView) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenCreateModal: () => void;
  onOpenCreateProjectModal?: () => void;
  onOpenCreateAppointmentModal?: () => void;
  
  isConnected?: boolean;
  isSyncing?: boolean;
  onRefresh?: () => void;
  activeProject?: Project | ProjectSummary | null;
  onBackToProjects?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentView = 'PROJECTS',
  
  searchQuery,
  onSearchChange,
  onOpenCreateModal,
  onOpenCreateProjectModal,
  onOpenCreateAppointmentModal,
  
  activeProject = null,
}) => {
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Navigation tabs definition
  const viewTabs: { id: ActiveView; label: string; icon: React.ReactNode }[] = [
    { id: 'PROJECTS', label: 'Projetos', icon: <FolderKanban className="w-3.5 h-3.5" /> },
  ];

  if (activeProject) {
    viewTabs.push({ 
      id: 'BOARD', 
      label: 'Quadro Kanban', 
      icon: <LayoutGrid className="w-3.5 h-3.5" /> 
    });
  }

  viewTabs.push(
    { id: 'CALENDAR', label: 'Calendário', icon: <Calendar className="w-3.5 h-3.5" /> }
  );

  let viewTitle = 'Projetos';
  
  if (currentView === 'PROJECTS') {
    viewTitle = 'Projetos';
  } else if (currentView === 'CALENDAR') {
    viewTitle = 'Calendário';
  } else if (currentView === 'CHAT') {
    viewTitle = 'Assistente';
  } else if (activeProject) {
    viewTitle = activeProject.title;
  } else if (currentView === 'BOARD') {
    viewTitle = 'Painel de Projeto';
  } else if (currentView === 'NOTE') {
    viewTitle = 'Nota';
  }

  return (
    <header className="bg-neutral-50/90 backdrop-blur-md sticky top-0 z-20 px-8 lg:px-12 py-6 border-b border-neutral-200">
      <div className="flex flex-col gap-5">
        {/* Upper Row: Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <h1 className="text-[24px] font-semibold text-neutral-900 tracking-tight flex items-center gap-2 truncate">
            <span className="truncate">{viewTitle}</span>
          </h1>

          {/* Middle & Right Controls */}
          <div className="flex items-center gap-3 self-end sm:self-auto justify-end">
            {/* Search Pill Input */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar..."
                className="w-full pl-9 pr-12 py-2.5 bg-neutral-100 border border-transparent focus:border-neutral-300 focus:bg-white rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 bg-neutral-200/50 rounded">
                  <span>⌘</span>K
                </kbd>
              </div>
            </div>

            {/* Quick Contextual Actions */}
            {currentView === 'CALENDAR' && onOpenCreateAppointmentModal ? (
              <button
                onClick={onOpenCreateAppointmentModal}
                className="flex items-center justify-center py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium rounded-xl transition-all shrink-0"
              >
                <span>Novo</span>
              </button>
            ) : onOpenCreateProjectModal && currentView === 'PROJECTS' ? (
              <button
                onClick={onOpenCreateProjectModal}
                className="flex items-center justify-center py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium rounded-xl transition-all shrink-0"
              >
                <span>Novo</span>
              </button>
            ) : (
              <button
                onClick={onOpenCreateModal}
                className="flex items-center justify-center py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium rounded-xl transition-all shrink-0"
              >
                <span>Novo</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
