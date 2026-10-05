import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, CheckSquare, Tag as TagIcon } from 'lucide-react';
import type { Kanban, Task, UpdateTaskInput } from '../types';

export interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  kanbans: Kanban[];
  task: Task;
  onUpdateTask: (taskId: string, updates: UpdateTaskInput) => Promise<void>;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  isOpen,
  onClose,
  kanbans,
  task,
  onUpdateTask,
}) => {
  const [title, setTitle] = useState('');
  const [selectedKanbanId, setSelectedKanbanId] = useState<string>('');
  const [columnId, setColumnId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const wasOpen = useRef(false);

  // Sync fields when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '');
      setErrorMessage('');
      setSelectedTagIds(task.tags ? task.tags.map(t => t.id) : []);
      setSelectedKanbanId(task.kanbanId || '');
      setColumnId(task.columnId || '');
    }
    wasOpen.current = isOpen;
  }, [isOpen, task]);

  // When selected kanban changes, update default columnId
  const handleKanbanChange = (newKanbanId: string) => {
    setSelectedKanbanId(newKanbanId);
    setSelectedTagIds([]);
    const kanbanObj = kanbans.find((k) => k.id === newKanbanId);
    if (kanbanObj?.columns && kanbanObj.columns.length > 0) {
      setColumnId(kanbanObj.columns[0].id);
    } else {
      setColumnId('');
    }
  };

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentKanban = kanbans.find((k) => k.id === selectedKanbanId);

  const handleToggleTagSelect = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();

    if (!cleanTitle) {
      setErrorMessage('O título da tarefa é obrigatório.');
      return;
    }

    if (!selectedKanbanId) {
      setErrorMessage('Selecione um Kanban para a tarefa.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Determine status from column title if possible
      let status = task.status;
      if (columnId && currentKanban?.columns) {
        const targetCol = currentKanban.columns.find((c) => c.id === columnId);
        if (targetCol) {
          const colTitleLower = targetCol.title.toLowerCase();
          if (
            colTitleLower.includes('concluí') ||
            colTitleLower.includes('conclui') ||
            colTitleLower.includes('done') ||
            colTitleLower.includes('finalizad')
          ) {
            status = 'DONE';
          } else if (
            colTitleLower.includes('andamento') ||
            colTitleLower.includes('progress') ||
            colTitleLower.includes('fazi')
          ) {
            status = 'IN_PROGRESS';
          } else {
            status = 'TODO';
          }
        }
      }

      // Find the actual tag objects for optimistic update
      const tagObjects = currentKanban?.tags?.filter(t => selectedTagIds.includes(t.id)) || [];

      await onUpdateTask(task.id, {
        title: cleanTitle,
        description: description.trim() || null,
        status,
        columnId: columnId || null,
        kanbanId: selectedKanbanId,
        tags: tagObjects,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      } as any);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao atualizar tarefa. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                Editar tarefa
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Atualize as informações da tarefa
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {errorMessage && (
              <div className="p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl font-medium">
                {errorMessage}
              </div>
            )}

            {/* Title Field */}
            <div className="space-y-1.5">
              <label htmlFor="task-title" className="block text-sm font-semibold text-slate-700">
                Título da Tarefa <span className="text-rose-500">*</span>
              </label>
              <input
                id="task-title"
                name="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="O que precisa ser feito?"
                autoFocus
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-200 focus:outline-none transition-all"
              />
            </div>

            {/* Kanban Selector */}
            {kanbans.length > 1 && (
              <div className="space-y-1.5">
                <label htmlFor="kanban-select" className="block text-sm font-semibold text-slate-700">
                  Kanban do Projeto <span className="text-rose-500">*</span>
                </label>
                <select
                  id="kanban-select"
                  value={selectedKanbanId}
                  onChange={(e) => handleKanbanChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-200 focus:outline-none transition-all cursor-pointer"
                >
                  {kanbans.map((kanban) => (
                    <option key={kanban.id} value={kanban.id}>
                      {kanban.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Column Selector */}
            {currentKanban?.columns && currentKanban.columns.length > 0 && (
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                  Coluna
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 max-h-36 overflow-y-auto p-0.5">
                  {currentKanban.columns.map((col) => {
                    const isChecked = columnId === col.id;
                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => setColumnId(col.id)}
                        className={`flex items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all text-center truncate ${
                          isChecked
                            ? 'bg-slate-900 border-slate-900 text-white shadow-sm font-semibold'
                            : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                        title={col.title}
                      >
                        {col.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description Field */}
            <div className="space-y-1.5">
              <label htmlFor="task-desc" className="block text-sm font-semibold text-slate-700">
                Descrição <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <textarea
                id="task-desc"
                name="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes adicionais da tarefa..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-200 focus:outline-none transition-all resize-none"
              />
            </div>

            {/* Tag Selection */}
            {currentKanban?.tags && currentKanban.tags.length > 0 && (
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <TagIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Tags <span className="text-slate-400 font-normal">(Opcional)</span></span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {currentKanban.tags.map((tag) => {
                    const isSelected = selectedTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleToggleTagSelect(tag.id)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                          isSelected
                            ? 'shadow-xs border-transparent text-white'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-slate-400'}`}
                        />
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Due Date Option */}
            <div className="space-y-1.5">
              <label htmlFor="task-due" className="block text-sm font-semibold text-slate-700">
                Data Limite <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <input
                id="task-due"
                name="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-200 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/50 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !selectedKanbanId}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center min-w-[120px] gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Salvar Alterações</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
