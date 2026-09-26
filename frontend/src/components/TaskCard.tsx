import React, { useState } from 'react';
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Plus,
  Loader2,
  Flame,
  X
} from 'lucide-react';
import type { Task, TaskStatus } from '../types';
import { SubtaskItem } from './SubtaskItem';
import { tasksApi } from '../services/api';

export interface TaskCardProps {
  task: Task;
  stageName?: string;
  onMoveTask: (id: string, status: TaskStatus) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onAddSubtask: (taskId: string, title: string) => Promise<void>;
  onToggleSubtask: (id: string, isDone: boolean) => Promise<void>;
  onDeleteSubtask?: (id: string) => Promise<void>;
  onToggleSprint?: (id: string, isSprintActive: boolean) => Promise<void>;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  stageName,
  onMoveTask,
  onDeleteTask,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onToggleSprint,
}) => {
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [isSprintActive, setIsSprintActive] = useState<boolean>(Boolean(task.isSprintActive));
  const [isTogglingSprint, setIsTogglingSprint] = useState(false);

  const completedSubtasks = task.subtasks?.filter((st) => st.isDone).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const progressPercent =
    totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const handleMove = async (newStatus: TaskStatus) => {
    if (isMoving) return;
    setIsMoving(true);
    try {
      await onMoveTask(task.id, newStatus);
    } finally {
      setIsMoving(false);
    }
  };

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

  const handleToggleSprint = async () => {
    if (isTogglingSprint) return;
    const nextVal = !isSprintActive;
    setIsTogglingSprint(true);
    setIsSprintActive(nextVal);
    try {
      if (onToggleSprint) {
        await onToggleSprint(task.id, nextVal);
      } else {
        await tasksApi.toggleSprint(task.id, nextVal);
      }
    } catch (err) {
      console.error('Failed to toggle sprint state:', err);
      setIsSprintActive(!nextVal);
    } finally {
      setIsTogglingSprint(false);
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
    const diffDays = Math.max(0, Math.floor((now.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24)));
    dateDisplay =
      diffDays === 0
        ? 'Criado hoje'
        : diffDays === 1
        ? 'Criado ontem'
        : `Criado há ${diffDays}d`;
  }

  return (
    <div className="group relative bg-white rounded-2xl p-6 border border-neutral-200 shadow-card hover:shadow-card-hover transition-all duration-250 space-y-4">
      {/* Top Header: Actions & Badges */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {stageName && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium bg-neutral-100 text-neutral-600">
              {stageName}
            </span>
          )}
          {/* Quick Sprint Active Toggle Badge */}
          <button
            type="button"
            onClick={handleToggleSprint}
            disabled={isTogglingSprint}
            title="Sprint"
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[12px] font-medium transition-all ${
              isSprintActive
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200'
            }`}
          >
            {isTogglingSprint ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Flame className={`w-3 h-3 ${isSprintActive ? 'text-white fill-white' : ''}`} />
            )}
            <span>Sprint</span>
          </button>
        </div>

        {/* Delete button (Trash2 / onDeleteTask) */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          aria-label="Excluir tarefa"
          className="text-neutral-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Task Title & Description */}
      <div>
        <h4
          className={`text-base font-medium leading-snug tracking-tight transition-colors ${
            task.status === 'DONE'
              ? 'text-neutral-400 line-through font-normal'
              : 'text-neutral-900'
          }`}
        >
          {task.title}
        </h4>
        {task.description && (
          <p className="mt-1 text-sm text-neutral-500 line-clamp-2 leading-relaxed font-normal">
            {task.description}
          </p>
        )}
      </div>
      
      {/* Date metadata */}
      <div className="flex items-center gap-1.5 text-[12px] font-medium">
        <span
          className={`${
            isOverdue
              ? 'text-red-500 font-semibold'
              : task.status === 'DONE'
              ? 'text-neutral-400'
              : 'text-neutral-500'
          }`}
        >
          {dateDisplay}
        </span>
      </div>

      {/* Subtasks Section */}
      <div className="space-y-3 pt-4 border-t border-neutral-100">
        <div className="flex items-center justify-between text-[12px] font-medium">
          <span className="text-neutral-500">
            {totalSubtasks > 0 ? `${completedSubtasks} de ${totalSubtasks} concluídas` : 'Sem subtarefas'}
          </span>

          <button
            type="button"
            onClick={() => setShowSubtaskForm(!showSubtaskForm)}
            className="text-neutral-400 hover:text-neutral-900 transition-colors flex items-center justify-center p-1"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Solid Progress Bar */}
        <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 bg-neutral-900"
            style={{ width: `${totalSubtasks > 0 ? progressPercent : 0}%` }}
          />
        </div>

        {/* Subtask list */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
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
          <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-2">
            <input
              type="text"
              value={subtaskTitle}
              onChange={(e) => setSubtaskTitle(e.target.value)}
              placeholder="Subtarefa..."
              autoFocus
              className="flex-1 bg-neutral-50 border border-neutral-200 focus:border-neutral-900 focus:bg-white rounded-xl px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none transition-all"
            />
            <button
              type="submit"
              disabled={isAddingSubtask || !subtaskTitle.trim()}
              className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center"
            >
              {isAddingSubtask ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowSubtaskForm(false);
                setSubtaskTitle('');
              }}
              className="px-2 py-2 text-neutral-400 hover:text-neutral-700 text-sm rounded-xl hover:bg-neutral-100"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      {/* Movement Action Buttons */}
      <div className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-2">
        {task.status === 'TODO' && (
          <button
            type="button"
            onClick={() => handleMove('IN_PROGRESS')}
            disabled={isMoving}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-900 transition-all"
          >
            {isMoving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </button>
        )}

        {task.status === 'IN_PROGRESS' && (
          <>
            <button
              type="button"
              onClick={() => handleMove('TODO')}
              disabled={isMoving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-900 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleMove('DONE')}
              disabled={isMoving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-neutral-900 hover:bg-neutral-800 text-white transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </>
        )}

        {task.status === 'DONE' && (
          <button
            type="button"
            onClick={() => handleMove('IN_PROGRESS')}
            disabled={isMoving}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-900 transition-all"
          >
            {isMoving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowLeft className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};
