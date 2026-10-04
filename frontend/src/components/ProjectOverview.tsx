import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../types';
import { FolderKanban, FileText, ArrowRight, Edit2, Check, X, Loader2, Github, Activity, CheckSquare, Link as LinkIcon, PenTool, Copy } from 'lucide-react';
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
  const navigate = useNavigate();
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
        <div className="flex items-center justify-between mb-4 gap-4">
          <input
            key={project.id}
            type="text"
            defaultValue={project.title}
            onBlur={async (e) => {
              const newTitle = e.target.value.trim();
              if (!newTitle || newTitle === project.title) return;
              try {
                const updated = await projectsApi.update(project.id, { title: newTitle });
                onProjectUpdated?.(updated);
              } catch (err) {
                console.error('Failed to update project title', err);
                e.target.value = project.title;
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
              if (e.key === 'Escape') {
                e.currentTarget.value = project.title;
                e.currentTarget.blur();
              }
            }}
            className="text-2xl font-bold text-neutral-900 bg-transparent border-none outline-none focus:ring-0 w-full hover:bg-neutral-50 focus:bg-neutral-50 px-2 py-1 rounded transition-colors -ml-2"
          />
          
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

        {/* Technical Context (Business Logic / GitHub) */}
        {(project.businessLogic || project.githubRepo) && !isEditing && (
          <div className="mt-6 pt-6 border-t border-neutral-100 grid grid-cols-1 md:grid-cols-2 gap-6">
            {project.githubRepo && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Repositório</h4>
                <a href={project.githubRepo} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1.5">
                  <Github className="w-4 h-4" />
                  {project.githubRepo.replace('https://github.com/', '')}
                </a>
              </div>
            )}
            
            {project.businessLogic && (
              <div className="space-y-1.5 md:col-span-2">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Lógica de Negócio (IA Context)</h4>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {project.businessLogic}
                </div>
              </div>
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

        {/* Checklists Section */}
        <section className="space-y-4 min-w-0 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
              <CheckSquare className="w-5 h-5 text-neutral-500" />
              <h3>Checklists</h3>
            </div>
            <button
              onClick={() => {
                const title = prompt('Nome do Checklist:');
                if (!title) return;
                import('../services/api').then(({ checklistsApi }) => {
                  checklistsApi.create(project.id, { title }).then((newChecklist) => {
                    if (onProjectUpdated) {
                      onProjectUpdated({
                        ...project,
                        checklists: [...(project.checklists || []), { ...newChecklist, items: [] }]
                      });
                    }
                  });
                });
              }}
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors border border-transparent hover:border-neutral-200"
            >
              + Novo
            </button>
          </div>

          {project.checklists && project.checklists.length > 0 ? (
            <div className="grid gap-4 min-w-0 w-full">
              {project.checklists.map(checklist => {
                const total = checklist.items?.length || 0;
                const done = checklist.items?.filter(i => i.isDone).length || 0;
                const percent = total === 0 ? 0 : Math.round((done / total) * 100);
                return (
                  <div key={checklist.id} onClick={() => navigate(`/projects/${project.id}/checklists/${checklist.id}`)} className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md hover:border-neutral-300 transition-all cursor-pointer group min-w-0 w-full">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-neutral-900 group-hover:text-neutral-700 transition-colors truncate">
                        {checklist.title}
                      </h4>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-neutral-500 mb-1">
                        <span>{done}/{total} concluídos</span>
                        <span>{percent}%</span>
                      </div>
                      <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-neutral-200 border-dashed">
              <p className="text-neutral-500 text-sm">Nenhum checklist.</p>
            </div>
          )}
        </section>

        {/* Bookmarks Section */}
        <section className="space-y-4 min-w-0 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
              <LinkIcon className="w-5 h-5 text-neutral-500" />
              <h3>Bookmarks</h3>
            </div>
            <button
              onClick={() => {
                const url = prompt('URL do Bookmark:');
                if (!url) return;
                const title = prompt('Título (opcional):') || url;
                const group = prompt('Grupo/Categoria (opcional):') || undefined;
                import('../services/api').then(({ bookmarksApi }) => {
                  bookmarksApi.create(project.id, { title, url, group }).then((newBookmark) => {
                    if (onProjectUpdated) {
                      onProjectUpdated({
                        ...project,
                        bookmarks: [...(project.bookmarks || []), newBookmark]
                      });
                    }
                  });
                });
              }}
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors border border-transparent hover:border-neutral-200"
            >
              + Novo
            </button>
          </div>

          {project.bookmarks && project.bookmarks.length > 0 ? (
            <div className="grid gap-4 min-w-0 w-full">
              {Object.entries(
                project.bookmarks.reduce((acc, b) => {
                  const g = b.group || 'Geral';
                  if (!acc[g]) acc[g] = [];
                  acc[g].push(b);
                  return acc;
                }, {} as Record<string, typeof project.bookmarks>)
              ).map(([group, bmarks]) => (
                <div key={group} className="space-y-2">
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider pl-1">{group}</h4>
                  <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
                    {bmarks.map((bookmark, idx) => (
                      <a
                        key={bookmark.id}
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-3 p-4 hover:bg-neutral-50 transition-colors group ${idx !== bmarks.length - 1 ? 'border-b border-neutral-100' : ''}`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform">
                          {bookmark.icon || '🔗'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-neutral-900 truncate group-hover:text-blue-600 transition-colors">
                            {bookmark.title}
                          </p>
                          {bookmark.description && (
                            <p className="text-xs text-neutral-500 truncate mt-0.5">{bookmark.description}</p>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-neutral-200 border-dashed">
              <p className="text-neutral-500 text-sm">Nenhum link salvo.</p>
            </div>
          )}
        </section>

        {/* Whiteboards Section */}
        <section className="space-y-4 min-w-0 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
              <PenTool className="w-5 h-5 text-neutral-500" />
              <h3>Whiteboards</h3>
            </div>
            <button
              onClick={() => {
                const title = prompt('Nome do Quadro Branco:');
                if (!title) return;
                import('../services/api').then(({ whiteboardsApi }) => {
                  whiteboardsApi.create(project.id, { title }).then((newWhiteboard) => {
                    if (onProjectUpdated) {
                      onProjectUpdated({
                        ...project,
                        whiteboards: [...(project.whiteboards || []), newWhiteboard]
                      });
                    }
                  });
                });
              }}
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors border border-transparent hover:border-neutral-200"
            >
              + Novo
            </button>
          </div>

          {project.whiteboards && project.whiteboards.length > 0 ? (
            <div className="grid gap-4 min-w-0 w-full">
              {project.whiteboards.map(whiteboard => (
                <div
                  key={whiteboard.id}
                  onClick={() => navigate(`/projects/${project.id}/whiteboards/${whiteboard.id}`)}
                  className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md hover:border-neutral-300 transition-all cursor-pointer group flex flex-col min-w-0 w-full"
                >
                  <div className="flex items-center justify-between min-w-0">
                    <h4 className="font-semibold text-neutral-900 group-hover:text-neutral-700 transition-colors line-clamp-1 truncate">
                      {whiteboard.title}
                    </h4>
                    <PenTool className="w-4 h-4 text-neutral-300 group-hover:text-neutral-400 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-neutral-200 border-dashed">
              <p className="text-neutral-500 text-sm">Nenhum whiteboard.</p>
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
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Duplicate note
                        import('../services/api').then(({ notesApi }) => {
                          notesApi.create(project.id, {
                            title: `${note.title} (Cópia)`,
                            content: note.content
                          }).then(() => {
                            if (onProjectUpdated) {
                              onProjectUpdated({
                                ...project,
                                notes: [...(project.notes || []), { ...note, id: Math.random().toString(), title: `${note.title} (Cópia)` }]
                              });
                            } else {
                              alert('Nota duplicada! Atualize a página.');
                            }
                          });
                        });
                      }}
                      className="p-1 rounded text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-2"
                      title="Duplicar Nota"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
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

      {/* Update Logs Section */}
      <section className="space-y-4 min-w-0 w-full pt-4 border-t border-neutral-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
            <Activity className="w-5 h-5 text-neutral-500" />
            <h3>Diário de Bordo (Update Logs)</h3>
          </div>
          <button
            onClick={() => {
              const title = prompt('O que foi feito? (Título)');
              if (!title) return;
              const content = prompt('Detalhes extras (opcional):');
              // Assuming there is an api endpoint. For now, since we don't have handleCreateLog passed as prop, 
              // we can just call it directly from API and trigger onProjectUpdated or alert to reload.
              // A proper way is passing a prop, but to keep it simple and fit context we can just trigger it.
              // Wait, I should add a prop or use api directly. Let's use api directly.
              import('../services/api').then(({ updateLogsApi }) => {
                 updateLogsApi.create(project.id, { title, content: content || ' ' }).then(() => {
                    alert('Log adicionado! Atualize a página ou sincronize.');
                 });
              });
            }}
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors border border-transparent hover:border-neutral-200"
          >
            + Novo Log
          </button>
        </div>

        {project.updateLogs && project.updateLogs.length > 0 ? (
          <div className="space-y-4 min-w-0 w-full">
            {project.updateLogs.map(log => (
              <div key={log.id} className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-neutral-900">{log.title}</h4>
                    <span className="text-xs text-neutral-400 shrink-0">
                      {new Date(log.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600 break-words whitespace-pre-wrap">{log.content}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-neutral-200 border-dashed">
            <p className="text-neutral-500 text-sm">Nenhum registro no diário de bordo.</p>
          </div>
        )}
      </section>
    </div>
  );
};
