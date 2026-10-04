import React from 'react';
import { Plus, FolderKanban, Sparkles } from 'lucide-react';
import type { ProjectSummary } from '../types';
import { ProjectCard } from './ProjectCard';

export interface ProjectListProps {
  projects: ProjectSummary[];
  onSelectProject: (id: string) => void;
  onOpenCreateProjectModal: () => void;
  searchQuery?: string;
  onDeleteProject?: (id: string, title: string) => void;
  onToggleFavorite?: (id: string, isFavorite: boolean) => void;
  onArchive?: (id: string, title: string) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  onSelectProject,
  onOpenCreateProjectModal,
  searchQuery = '',
  onDeleteProject,
  onToggleFavorite,
  onArchive
}) => {
  const [activeTab, setActiveTab] = React.useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');

  const filteredProjects = projects.filter((p) => {
    if (activeTab === 'ARCHIVED' && p.status !== 'ARCHIVED') return false;
    if (activeTab === 'ACTIVE' && p.status === 'ARCHIVED') return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      p.title.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  }).sort((a, b) => {
    // Favoritos primeiro
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return 0;
  });

  const activeCount = projects.filter(p => p.status !== 'ARCHIVED').length;
  const archivedCount = projects.filter(p => p.status === 'ARCHIVED').length;

  return (
    <div className="space-y-6">
      {/* Portfolio Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <button 
              onClick={() => setActiveTab('ACTIVE')}
              className={`text-xl font-extrabold tracking-tight flex items-center gap-2 ${activeTab === 'ACTIVE' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <span>Ativos</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${activeTab === 'ACTIVE' ? 'bg-slate-100 text-slate-900 border-slate-200' : 'bg-transparent border-slate-200 text-slate-400'}`}>
                {activeCount}
              </span>
            </button>
            <button 
              onClick={() => setActiveTab('ARCHIVED')}
              className={`text-xl font-extrabold tracking-tight flex items-center gap-2 ${activeTab === 'ARCHIVED' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <span>Arquivados</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${activeTab === 'ARCHIVED' ? 'bg-slate-100 text-slate-900 border-slate-200' : 'bg-transparent border-slate-200 text-slate-400'}`}>
                {archivedCount}
              </span>
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Selecione um projeto para visualizar e gerenciar seu quadro de etapas e tarefas
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateProjectModal}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Novo Projeto</span>
        </button>
      </div>

      {/* Projects Grid or Empty State */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-20 px-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 text-slate-900 flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            {searchQuery ? 'Nenhum projeto encontrado' : 'Nenhum projeto cadastrado ainda'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery
              ? `Não foram encontrados projetos correspondentes à busca "${searchQuery}".`
              : 'Crie seu primeiro projeto para começar a organizar etapas, metas e tarefas com o BrainBoard.'}
          </p>
          <button
            type="button"
            onClick={onOpenCreateProjectModal}
            className="mt-6 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Criar Primeiro Projeto</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={onSelectProject}
              onDelete={onDeleteProject}
              onToggleFavorite={onToggleFavorite}
              onArchive={onArchive}
            />
          ))}
        </div>
      )}
    </div>
  );
};
