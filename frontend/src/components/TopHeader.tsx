import React from 'react';
import {
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
  activeProject = null,
}) => {

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

          {/* Middle & Right Controls removed */}
        </div>
      </div>
    </header>
  );
};
