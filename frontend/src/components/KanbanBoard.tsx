import React, { useState } from 'react';
import type { Project, Task, Kanban } from '../types';
import { KanbanColumn as KanbanColumnComponent } from './KanbanColumn';
import { DashboardOverview } from './DashboardOverview';
import { Plus, X, Tag, LayoutGrid } from 'lucide-react';
import { kanbanColumnsApi, kanbanTagsApi } from '../services/api';

export interface KanbanBoardProps {
  project?: Project | null;
  kanban?: Kanban | null;
  tasks: Task[];
  onMoveTask: (id: string, status: string, columnId?: string | null) => Promise<void>;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onAddSubtask: (taskId: string, title: string) => Promise<void>;
  onToggleSubtask: (id: string, isDone: boolean) => Promise<void>;
  onDeleteSubtask?: (id: string) => Promise<void>;
  onOpenCreateTask: (kanbanId?: string) => void;
  onOpenCreateModal?: () => void;
  selectedCategory?: string;
  onRefreshKanban: () => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  kanban,
  tasks,
  onMoveTask,
  onUpdateTask,
  onDeleteTask,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onOpenCreateTask,
  onOpenCreateModal,
  onRefreshKanban,
}) => {
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');
  const [isCreatingDefaultCols, setIsCreatingDefaultCols] = useState(false);

  if (!kanban) {
    return <div className="p-8 text-center text-slate-500 font-medium">Selecione um Kanban</div>;
  }

  const handleCreateTaskTrigger = async () => {
    if (!kanban.columns || kanban.columns.length === 0) {
      await handleCreateDefaultColumns();
    }
    if (onOpenCreateTask) {
      onOpenCreateTask(kanban.id);
    } else if (onOpenCreateModal) {
      onOpenCreateModal();
    }
  };

  const handleCreateDefaultColumns = async () => {
    if (isCreatingDefaultCols) return;
    setIsCreatingDefaultCols(true);
    try {
      await kanbanColumnsApi.create(kanban.id, { title: 'A Fazer', order: 0 });
      await kanbanColumnsApi.create(kanban.id, { title: 'Em Andamento', order: 1 });
      await kanbanColumnsApi.create(kanban.id, { title: 'Concluído', order: 2 });
      onRefreshKanban();
    } catch (e) {
      console.error('Error creating default columns:', e);
    } finally {
      setIsCreatingDefaultCols(false);
    }
  };

  const handleAddColumn = async () => {
    if (!newColumnTitle.trim()) return;
    try {
      await kanbanColumnsApi.create(kanban.id, {
        title: newColumnTitle.trim(),
        order: kanban.columns?.length || 0,
      });
      setNewColumnTitle('');
      setIsAddingColumn(false);
      onRefreshKanban();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!confirm('Deseja excluir esta coluna? As tarefas nela ficarão na primeira coluna.')) return;
    try {
      await kanbanColumnsApi.delete(columnId);
      onRefreshKanban();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    try {
      await kanbanTagsApi.create(kanban.id, {
        name: newTagName.trim(),
        color: newTagColor,
      });
      setNewTagName('');
      onRefreshKanban();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      await kanbanTagsApi.delete(tagId);
      onRefreshKanban();
    } catch (e) {
      console.error(e);
    }
  };

  const existingColumnIds = new Set(kanban.columns?.map((c) => c.id) || []);

  return (
    <div className="space-y-6 flex flex-col h-full min-w-0 w-full">
      <DashboardOverview tasks={tasks} />

      {/* Board Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-4 flex-wrap min-w-0">
          <div className="flex items-center gap-2 text-lg text-slate-900 font-bold truncate">
            <span>{kanban.title}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsTagsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl transition-all shadow-xs"
          >
            <Tag className="w-4 h-4 text-slate-500" />
            <span>Gerenciar Tags</span>
          </button>
          <button
            type="button"
            onClick={handleCreateTaskTrigger}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Tarefa</span>
          </button>
        </div>
      </div>

      {/* Zero columns notice banner */}
      {(!kanban.columns || kanban.columns.length === 0) && (
        <div className="p-6 bg-slate-100/70 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
          <LayoutGrid className="w-8 h-8 text-slate-400" />
          <h3 className="text-base font-bold text-slate-900">Este Quadro ainda não tem colunas</h3>
          <p className="text-sm text-slate-500 max-w-md">
            Crie as colunas padrão (A Fazer, Em Andamento, Concluído) ou adicione colunas personalizadas para organizar suas atividades.
          </p>
          <button
            type="button"
            onClick={handleCreateDefaultColumns}
            disabled={isCreatingDefaultCols}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50"
          >
            {isCreatingDefaultCols ? 'Criando colunas...' : 'Criar Colunas Padrão'}
          </button>
        </div>
      )}

      {/* Columns Container */}
      <div className="flex gap-6 overflow-x-auto pb-6 items-start min-w-0 w-full">
        {kanban.columns?.map((col, index) => {
          // Filter tasks belonging to this column.
          // If first column, also capture tasks with missing/orphan columnId
          const colTasks = tasks.filter((t) => {
            if (t.columnId === col.id) return true;
            if (index === 0 && (!t.columnId || !existingColumnIds.has(t.columnId))) return true;
            return false;
          });

          return (
            <div key={col.id} className="min-w-[320px] max-w-[320px] shrink-0">
              <KanbanColumnComponent
                column={col}
                columns={kanban.columns || []}
                availableTags={kanban.tags || []}
                tasks={colTasks}
                onMoveTask={(taskId, status) => onMoveTask(taskId, status, col.id)}
                onUpdateTask={onUpdateTask}
                onDeleteTask={onDeleteTask}
                onAddSubtask={onAddSubtask}
                onToggleSubtask={onToggleSubtask}
                onDeleteSubtask={onDeleteSubtask}
                onDeleteColumn={() => handleDeleteColumn(col.id)}
              />
            </div>
          );
        })}

        {/* Add Column Card / Button */}
        <div className="min-w-[320px] max-w-[320px] shrink-0">
          {isAddingColumn ? (
            <div className="bg-slate-100 rounded-2xl border border-slate-200 p-4 space-y-3">
              <input
                type="text"
                autoFocus
                placeholder="Nome da coluna (ex: Em Revisão)..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddColumn();
                  if (e.key === 'Escape') setIsAddingColumn(false);
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddColumn}
                  disabled={!newColumnTitle.trim()}
                  className="flex-1 bg-slate-900 text-white text-xs font-semibold py-2 rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  Adicionar Coluna
                </button>
                <button
                  onClick={() => setIsAddingColumn(false)}
                  className="px-3 py-2 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingColumn(true)}
              className="w-full h-[58px] flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 hover:text-slate-900 hover:border-slate-400 hover:bg-slate-100/50 transition-all font-semibold text-sm"
            >
              <Plus className="w-5 h-5" />
              <span>Adicionar Coluna</span>
            </button>
          )}
        </div>
      </div>

      {/* Manage Tags Modal */}
      {isTagsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative border border-slate-200 space-y-5">
            <button
              onClick={() => setIsTagsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Tags do Quadro</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Crie e gerencie as etiquetas disponíveis para "{kanban.title}"
              </p>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {kanban.tags?.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50/50"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/10"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="font-semibold text-slate-800 text-xs">{tag.name}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteTag(tag.id)}
                    className="text-rose-500 hover:text-rose-700 text-xs font-semibold p-1 hover:bg-rose-50 rounded-md transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              ))}
              {(!kanban.tags || kanban.tags.length === 0) && (
                <div className="text-center text-xs text-slate-500 py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Nenhuma tag cadastrada ainda.
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
              <input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="w-9 h-9 rounded-xl cursor-pointer border border-slate-300 p-0.5 bg-white shrink-0"
                title="Escolher cor da tag"
              />
              <input
                type="text"
                placeholder="Nome da tag (ex: Urgente)..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                className="flex-1 px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
              />
              <button
                onClick={handleAddTag}
                disabled={!newTagName.trim()}
                className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors shrink-0"
              >
                Criar Tag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
