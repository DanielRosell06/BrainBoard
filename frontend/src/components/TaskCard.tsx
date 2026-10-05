import React, { useState } from 'react';
import {
  Trash2,
  Plus,
  Loader2,
  X,
  Tag as TagIcon,
  Edit2,
  Copy
} from 'lucide-react';
import type { Task, KanbanTag } from '../types';
import { SubtaskItem } from './SubtaskItem';
import { Draggable } from '@hello-pangea/dnd';

export interface TaskCardProps {
  task: Task;
  index: number;
  columns?: { id: string; title: string }[];
  availableTags?: KanbanTag[];
  stageName?: string;
  onMoveTask: (id: string, status: string, columnId?: string | null) => Promise<void>;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onAddSubtask: (taskId: string, title: string) => Promise<void>;
  onToggleSubtask: (id: string, isDone: boolean) => Promise<void>;
  onDeleteSubtask?: (id: string) => Promise<void>;
  onEditTask?: (task: Task) => void;
  onDuplicateTask?: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  index,
  columns: _columns = [],
  availableTags = [],
  stageName,
  onMoveTask: _onMoveTask,
  onUpdateTask,
  onDeleteTask,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onEditTask,
  onDuplicateTask,
}) => {
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [showTagsDropdown, setShowTagsDropdown] = useState(false);

  const handleToggleTag = async (tag: KanbanTag) => {
    if (!onUpdateTask) return;
    const currentTags = task.tags || [];
    const hasTag = currentTags.some((t) => t.id === tag.id);
    let newTags;
    if (hasTag) {
      newTags = currentTags.filter((t) => t.id !== tag.id);
    } else {
      newTags = [...currentTags, tag];
    }
    await onUpdateTask(task.id, { tags: newTags });
  };

  const completedSubtasks = task.subtasks?.filter((st) => st.isDone).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const progressPercent =
    totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const handleDelete = async () => {
    if (isDeleting) return;
    if (window.confirm(`Excluir a tarefa "${task.title}" e suas subtarefas?`)) {
      setIsDeleting(true);
      try {
        await onDeleteTask(task.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = subtaskTitle.trim();
    if (!title || isAddingSubtask) return;

    setIsAddingSubtask(true);
    try {
      await onAddSubtask(task.id, title);
      setSubtaskTitle('');
      setShowSubtaskForm(false);
    } finally {
      setIsAddingSubtask(false);
    }
  };

  // Format date or relative days
  const now = new Date();
  let dateDisplay = '';
  let isOverdue = false;

  if (task.dueDate) {
    const due = new Date(task.dueDate);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      dateDisplay = `Atrasado (${Math.abs(diffDays)}d)`;
      isOverdue = true;
    } else if (diffDays === 0) {
      dateDisplay = 'Entrega hoje';
    } else if (diffDays === 1) {
      dateDisplay = 'Amanhã';
    } else {
      dateDisplay = `${diffDays}d restantes`;
    }
  } else {
    const taskDate = new Date(task.createdAt);
    const diffDays = Math.max(
      0,
      Math.floor((now.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    dateDisplay =
      diffDays === 0
        ? 'Criado hoje'
        : diffDays === 1
        ? 'Criado ontem'
        : `Criado há ${diffDays}d`;
  }

  const isCompleted = task.status === 'DONE';

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`group relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 space-y-3.5 ${
            snapshot.isDragging ? 'shadow-xl scale-105 rotate-1 ring-2 ring-slate-900 z-50' : ''
          }`}
          style={provided.draggableProps.style}
        >
          {/* Top Header: Actions & Badges */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {stageName && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600">
                  {stageName}
                </span>
              )}

              {/* Tags Display */}
              {task.tags &&
                task.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {tag.name}
                  </span>
                ))}

              {/* Add Tag Dropdown Toggle */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTagsDropdown(!showTagsDropdown);
                  }}
                  className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1 rounded-md transition-colors"
                  title="Adicionar / Remover tags"
                >
                  <TagIcon className="w-3.5 h-3.5" />
                </button>

                {showTagsDropdown && (
                  <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-20 w-48 max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                    <div className="text-[11px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                      Tags do Kanban
                    </div>
                    {availableTags.length === 0 ? (
                      <div className="text-xs text-slate-500 p-2 text-center">
                        Nenhuma tag criada neste Kanban.
                      </div>
                    ) : (
                      availableTags.map((tag) => {
                        const hasTag = task.tags?.some((t) => t.id === tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleTag(tag);
                            }}
                            className={`w-full flex items-center justify-between p-1.5 rounded-lg text-xs hover:bg-slate-50 transition-colors text-left ${
                              hasTag ? 'font-semibold text-slate-900' : 'text-slate-600'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full bg-slate-400"
                              />
                              <span>{tag.name}</span>
                            </div>
                            {hasTag && <span className="text-slate-900 text-xs">✓</span>}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Duplicate Task Button */}
              {onDuplicateTask && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateTask(task);
                  }}
                  aria-label="Duplicar tarefa"
                  className="text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}

              {/* Edit Task Button */}
              {onEditTask && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditTask(task);
                  }}
                  aria-label="Editar tarefa"
                  className="text-slate-300 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}

              {/* Delete Task Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                disabled={isDeleting}
                aria-label="Excluir tarefa"
                className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Task Title & Description */}
          <div>
            <h4
              className={`text-sm font-semibold leading-snug tracking-tight transition-colors ${
                isCompleted
                  ? 'text-slate-400 line-through'
                  : 'text-slate-900'
              }`}
            >
              {task.title}
            </h4>
            {task.description && (
              <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
                {task.description}
              </p>
            )}
          </div>

          {/* Date metadata */}
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
            <span
              className={`${
                isOverdue
                  ? 'text-rose-600 font-semibold'
                  : isCompleted
                  ? 'text-slate-400'
                  : 'text-slate-500'
              }`}
            >
              {dateDisplay}
            </span>
          </div>

          {/* Subtasks Section */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] font-medium">
              <span className="text-slate-500">
                {totalSubtasks > 0
                  ? `${completedSubtasks} de ${totalSubtasks} subtarefas`
                  : 'Sem subtarefas'}
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSubtaskForm(!showSubtaskForm);
                }}
                className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors flex items-center justify-center p-1"
                title="Adicionar subtarefa"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Solid Progress Bar */}
            {totalSubtasks > 0 && (
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    progressPercent === 100 ? 'bg-emerald-500' : 'bg-slate-900'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}

            {/* Subtask list */}
            {task.subtasks && task.subtasks.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5" onPointerDown={(e) => e.stopPropagation()}>
                {task.subtasks.map((st) => (
                  <SubtaskItem
                    key={st.id}
                    subtask={st}
                    onToggle={onToggleSubtask}
                    onDelete={onDeleteSubtask}
                  />
                ))}
              </div>
            )}

            {/* Inline Add Subtask Input Form */}
            {showSubtaskForm && (
              <form onSubmit={(e) => { e.stopPropagation(); handleAddSubtask(e); }} className="flex items-center gap-1.5 pt-1">
                <input
                  type="text"
                  value={subtaskTitle}
                  onChange={(e) => setSubtaskTitle(e.target.value)}
                  onPointerDown={(e) => e.stopPropagation()}
                  placeholder="Nova subtarefa..."
                  autoFocus
                  className="flex-1 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={isAddingSubtask || !subtaskTitle.trim()}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center"
                >
                  {isAddingSubtask ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSubtaskForm(false);
                    setSubtaskTitle('');
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 text-xs rounded-lg hover:bg-slate-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};
