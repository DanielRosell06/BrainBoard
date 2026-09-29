import React from 'react';
import { Trash2 } from 'lucide-react';
import type { ProjectSummary } from '../types';

interface ProjectCardProps {
  project: ProjectSummary;
  onClick: (id: string) => void;
  onDelete?: (id: string, title: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick, onDelete }) => {
  const formattedDate = new Date(project.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="group relative w-full text-left bg-white rounded-2xl p-6 border border-neutral-200 shadow-card hover:shadow-card-hover transition-all duration-250">
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
            <h3 className="text-base font-medium text-neutral-900 truncate cursor-pointer" onClick={() => onClick(project.id)}>
              {project.title}
            </h3>
            {project.description && (
              <p className="mt-1 text-sm text-neutral-500 line-clamp-2 leading-relaxed">
                {project.description}
              </p>
            )}
          </div>

          {/* Actions & Status */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(project.id, project.title);
                }}
                className="p-1.5 rounded-lg text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="Excluir projeto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

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
