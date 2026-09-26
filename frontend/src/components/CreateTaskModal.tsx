import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { Kanban, TaskStatus, CreateTaskInput } from '../types';
import { TASK_STATUS_LABELS } from '../types';

export interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  kanbans: Kanban[];
  defaultKanbanId?: string;
  onCreateTask: (kanbanId: string, input: CreateTaskInput) => Promise<void>;
  defaultCategory?: string;
  defaultSprintActive?: boolean;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  kanbans,
  defaultKanbanId,
  onCreateTask,
  defaultSprintActive = false,
}) => {
  const [title, setTitle] = useState('');
  const [selectedKanbanId, setSelectedKanbanId] = useState<string>('');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSprintActive, setIsSprintActive] = useState<boolean>(defaultSprintActive);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sync default kanban and reset fields when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setStatus('TODO');
      setDueDate('');
      setIsSprintActive(Boolean(defaultSprintActive));
      setErrorMessage('');
      if (defaultKanbanId && kanbans.some((k) => k.id === defaultKanbanId)) {
        setSelectedKanbanId(defaultKanbanId);
      } else if (kanbans.length > 0) {
        setSelectedKanbanId(kanbans[0].id);
      } else {
        setSelectedKanbanId('');
      }
    }
  }, [isOpen, defaultKanbanId, kanbans, defaultSprintActive]);

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
      await onCreateTask(selectedKanbanId, {
        title: cleanTitle,
        description: description.trim() || undefined,
        status,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        isSprintActive,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao criar tarefa. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-card overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-white">
          <h2 className="text-base font-semibold text-neutral-900 leading-tight">
            Nova tarefa
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-xl hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMessage && (
            <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl font-medium">
              {errorMessage}
            </div>
          )}

          {/* Title Field */}
          <div className="space-y-1.5">
            <input
              id="task-title"
              name="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="O que precisa ser feito?"
              autoFocus
              className="w-full px-4 py-3 bg-neutral-50 border border-transparent focus:border-neutral-300 focus:bg-white rounded-xl text-base text-neutral-900 placeholder-neutral-400 focus:outline-none transition-all"
            />
          </div>

          {/* Kanban Selector */}
          <div className="space-y-1.5">
            <label htmlFor="kanban-select" className="block text-sm font-medium text-neutral-700">
              Kanban do Projeto
            </label>
            {kanbans.length === 0 ? (
              <div className="p-3 rounded-xl bg-neutral-100 text-sm text-neutral-700">
                Nenhum Kanban cadastrado neste projeto.
              </div>
            ) : (
              <select
                id="kanban-select"
                value={selectedKanbanId}
                onChange={(e) => setSelectedKanbanId(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-50 border border-transparent focus:border-neutral-300 focus:bg-white rounded-xl text-sm text-neutral-900 focus:outline-none transition-all appearance-none cursor-pointer"
              >
                {kanbans.map((kanban) => (
                  <option key={kanban.id} value={kanban.id}>
                    {kanban.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Status Selector */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700">
              Status Inicial
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['TODO', 'IN_PROGRESS', 'DONE'] as TaskStatus[]).map((optId) => {
                const isChecked = status === optId;
                return (
                  <label key={optId} className="cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value={optId}
                      checked={isChecked}
                      onChange={() => setStatus(optId)}
                      className="sr-only"
                    />
                    <div
                      className={`flex items-center justify-center p-2.5 rounded-xl border text-sm transition-all ${
                        isChecked
                          ? 'bg-neutral-900 border-neutral-900 text-white font-medium'
                          : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      {TASK_STATUS_LABELS[optId]}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Description Field */}
          <div className="space-y-1.5">
            <textarea
              id="task-desc"
              name="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição"
              className="w-full px-4 py-3 bg-neutral-50 border border-transparent focus:border-neutral-300 focus:bg-white rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none transition-all resize-none"
            />
          </div>

          {/* Due Date & Sprint Active Options */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Due Date Field */}
            <div className="flex-1 space-y-1.5">
              <label htmlFor="task-due" className="block text-sm font-medium text-neutral-700">
                Data Limite
              </label>
              <input
                id="task-due"
                name="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-50 border border-transparent focus:border-neutral-300 focus:bg-white rounded-xl text-sm text-neutral-900 focus:outline-none transition-all"
              />
            </div>

            {/* isSprintActive Checkbox */}
            <div className="flex-1 flex items-end">
              <label className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${
                isSprintActive 
                  ? 'bg-neutral-900 border-neutral-900 text-white' 
                  : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}>
                <input
                  type="checkbox"
                  checked={isSprintActive}
                  onChange={(e) => setIsSprintActive(e.target.checked)}
                  className="sr-only"
                />
                <span className="text-sm font-medium">Sprint Semanal</span>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !selectedKanbanId}
              className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all flex items-center justify-center min-w-[120px]"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Salvar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
