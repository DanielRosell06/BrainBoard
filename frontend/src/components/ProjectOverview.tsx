import React, { useState, useEffect } from 'react';
import type { Project } from '../types';
import { FolderKanban, FileText, ArrowRight, Edit2, Check, X, Loader2 } from 'lucide-react';
import { RichTextEditor } from './notes/RichTextEditor';
import { projectsApi } from '../services/api';

interface ProjectOverviewProps {
  project: Project;
  onSelectKanban: (kanbanId: string) => void;
  onSelectNote: (noteId: string) => void;
  onOpenCreateKanban: () => void;
  onOpenCreateNote: () => void;
  onProjectUpdated?: (updatedProject: Project) => void;
}

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({
  project,
  onSelectKanban,
  onSelectNote,
  onOpenCreateKanban,
  onOpenCreateNote,
  onProjectUpdated
}) => {
  const [description, setDescription] = useState(project.description ?? '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when project changes
  useEffect(() => {
    setDescription(project.description ?? '');
    setIsEditing(false);
  }, [project.id, project.description]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await projectsApi.update(project.id, {
        description,
      });
      setIsEditing(false);
      onProjectUpdated?.(updated);
    } catch (err) {
      console.error('Erro ao salvar descrição do projeto:', err);
      alert('Erro ao salvar a descrição do projeto.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDescription(project.description ?? '');
    setIsEditing(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 flex flex-col h-full min-w-0 w-full">
      {/* Header Info with Description */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col min-w-0 w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-neutral-900 truncate">{project.title}</h2>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 transition-colors disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Confirmar
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
            )}
          </div>
        </div>
        
        {isEditing ? (
          <div className="border border-neutral-200 rounded-xl bg-neutral-50 min-h-[300px] flex flex-col max-h-[500px]">
            <RichTextEditor
              content={description}
              onUpdate={(html) => setDescription(html)}
              placeholder="Descreva o objetivo deste projeto, requisitos, etc..."
            />
          </div>
        ) : (
          <div className="mt-2 text-neutral-700">
            {project.description ? (
              <div 
                className="prose prose-neutral max-w-none text-sm break-words"
                dangerouslySetInnerHTML={{ __html: project.description }}
              />
            ) : (
              <p className="text-neutral-400 text-sm italic">Nenhuma descrição fornecida.</p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12 min-w-0 w-full">
        {/* Kanbans Section */}
        <section className="space-y-4 min-w-0 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
              <FolderKanban className="w-5 h-5 text-neutral-500" />
              <h3>Quadros Kanban</h3>
            </div>
            <button
              onClick={onOpenCreateKanban}
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors border border-transparent hover:border-neutral-200"
            >
              + Novo
            </button>
          </div>

          {project.kanbans && project.kanbans.length > 0 ? (
            <div className="grid gap-4 min-w-0 w-full">
              {project.kanbans.map(kanban => {
                const totalTasks = kanban.tasks?.length || 0;
                
                return (
                  <div 
                    key={kanban.id}
                    onClick={() => onSelectKanban(kanban.id)}
                    className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md hover:border-neutral-300 transition-all cursor-pointer group min-w-0 w-full overflow-hidden"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="min-w-0 flex-1 pr-2">
                        <h4 className="font-semibold text-neutral-900 group-hover:text-neutral-700 transition-colors truncate">
                          {kanban.title}
                        </h4>
                        <p className="text-xs text-neutral-500 mt-0.5">{totalTasks} tarefas no total</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center group-hover:bg-neutral-100 transition-colors shrink-0">
                        <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-100 min-w-0 w-full">
                      {kanban.columns?.map(col => {
                        const count = kanban.tasks?.filter(t => t.columnId === col.id).length || 0;
                        return (
                          <div 
                            key={col.id} 
                            className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100/80 rounded-xl border border-neutral-200/80 transition-colors max-w-full min-w-0"
                          >
                            <span className="text-xs font-extrabold text-neutral-800 bg-neutral-200/70 px-1.5 py-0.5 rounded-md min-w-[20px] text-center shrink-0">
                              {count}
                            </span>
                            <span className="text-xs font-semibold text-neutral-600 truncate max-w-[130px]" title={col.title}>
                              {col.title}
                            </span>
                          </div>
                        );
                      })}
                      {(kanban.tasks?.filter(t => !t.columnId).length || 0) > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-200/80 max-w-full min-w-0">
                          <span className="text-xs font-extrabold text-amber-800 bg-amber-200/70 px-1.5 py-0.5 rounded-md min-w-[20px] text-center shrink-0">
                            {kanban.tasks.filter(t => !t.columnId).length}
                          </span>
                          <span className="text-xs font-semibold text-amber-700">Legado</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-neutral-200 border-dashed">
              <p className="text-neutral-500 text-sm">Nenhum quadro kanban.</p>
            </div>
          )}
        </section>

        {/* Notes Section */}
        <section className="space-y-4 min-w-0 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
              <FileText className="w-5 h-5 text-neutral-500" />
              <h3>Notas e Doc</h3>
            </div>
            <button
              onClick={onOpenCreateNote}
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors border border-transparent hover:border-neutral-200"
            >
              + Nova
            </button>
          </div>

          {project.notes && project.notes.length > 0 ? (
            <div className="grid gap-4 min-w-0 w-full">
              {project.notes.map(note => (
                <div
                  key={note.id}
                  onClick={() => onSelectNote(note.id)}
                  className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md hover:border-neutral-300 transition-all cursor-pointer group flex flex-col h-[148px] min-w-0 w-full"
                >
                  <div className="flex items-start justify-between mb-2 min-w-0">
                    <h4 className="font-semibold text-neutral-900 group-hover:text-neutral-700 transition-colors line-clamp-1 truncate">
                      {note.title}
                    </h4>
                  </div>
                  <div className="text-sm text-neutral-500 line-clamp-3 overflow-hidden flex-1 relative leading-relaxed break-words">
                     {/* basic strip html tags to preview */}
                    {note.content.replace(/<[^>]*>?/gm, ' ')}
                    <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-neutral-200 border-dashed">
              <p className="text-neutral-500 text-sm">Nenhuma nota.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
