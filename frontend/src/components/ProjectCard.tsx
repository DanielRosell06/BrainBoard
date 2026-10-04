import React from 'react';
import { Trash2, Star, Archive } from 'lucide-react';
import type { ProjectSummary } from '../types';

interface ProjectCardProps {
  project: ProjectSummary;
  onClick: (id: string) => void;
  onDelete?: (id: string, title: string) => void;
  onToggleFavorite?: (id: string, isFavorite: boolean) => void;
  onArchive?: (id: string, title: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  onClick, 
  onDelete,
  onToggleFavorite,
  onArchive
}) => {
  const formattedDate = new Date(project.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const isArchived = project.status === 'ARCHIVED';

  return (
    <div className={`group relative w-full text-left rounded-2xl p-6 border shadow-card hover:shadow-card-hover transition-all duration-250 ${
      isArchived ? 'bg-neutral-50 border-neutral-200 opacity-70' : 'bg-white border-neutral-200'
    }`}
      style={project.color && !isArchived ? { borderTop: `4px solid ${project.color}` } : {}}
    >
      {/* Clickable Area */}
      <button
        type="button"
        onClick={() => onClick(project.id)}
        className="absolute inset-0 w-full h-full rounded-2xl z-0"
        aria-label={`Abrir projeto ${project.title}`}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{project.icon || '📁'}</span>
              <h3 className="text-base font-medium text-neutral-900 truncate cursor-pointer" onClick={() => onClick(project.id)}>
                {project.title}
              </h3>
            </div>
            {project.description && (
              <p className="mt-1 text-sm text-neutral-500 line-clamp-2 leading-relaxed">
                {project.description}
              </p>
            )}
          </div>

          {/* Actions & Status */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(project.id, !project.isFavorite);
                  }}
                  className={`p-1.5 rounded-lg transition-colors ${
                    project.isFavorite ? 'text-yellow-400 hover:text-yellow-500 hover:bg-yellow-50' : 'text-neutral-300 hover:text-yellow-400 hover:bg-yellow-50'
                  }`}
                  aria-label={project.isFavorite ? "Remover dos favoritos" : "Favoritar projeto"}
                >
                  <Star className="w-4 h-4" fill={project.isFavorite ? "currentColor" : "none"} />
                </button>
              )}
              
              {onArchive && !isArchived && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive(project.id, project.title);
                  }}
                  className="p-1.5 rounded-lg text-neutral-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                  aria-label="Arquivar projeto"
                >
                  <Archive className="w-4 h-4" />
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(project.id, project.title);
                  }}
                  className="p-1.5 rounded-lg text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  aria-label="Excluir projeto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-3 text-[12px] text-neutral-500 mt-6 pt-4 border-t border-neutral-100">
          {project._count && (
            <div className="flex items-center gap-2">
              <span>{project._count.kanbans} quadros</span>
              <span>·</span>
              <span>{project._count.members} membros</span>
              <span>·</span>
              <span>{project._count.updateLogs} logs</span>
            </div>
          )}

          <span className="ml-auto">
            {formattedDate}
          </span>

          {project.githubRepo && (
            <>
              <span>·</span>
              <a
                href={project.githubRepo}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-neutral-500 hover:text-neutral-900 transition-colors relative z-20 font-medium"
                aria-label="Abrir repositório no GitHub"
              >
                GitHub
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
