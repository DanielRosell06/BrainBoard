import React from 'react';
import type { Task, TaskStatus } from '../types';
import { TASK_STATUS_LABELS } from '../types';
import { TaskCard } from './TaskCard';

export interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onMoveTask: (id: string, status: TaskStatus) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onAddSubtask: (taskId: string, title: string) => Promise<void>;
  onToggleSubtask: (id: string, isDone: boolean) => Promise<void>;
  onDeleteSubtask?: (id: string) => Promise<void>;
  onOpenCreateTask?: () => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  tasks,
  onMoveTask,
  onDeleteTask,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}) => {
  const columnConfig: Record<
    TaskStatus,
    {
      emptyText: string;
    }
  > = {
    TODO: {
      emptyText: 'Vazio',
    },
    IN_PROGRESS: {
      emptyText: 'Vazio',
    },
    DONE: {
      emptyText: 'Vazio',
    },
  };

  const config = columnConfig[status];

  return (
    <div
      className="flex flex-col bg-neutral-100/50 rounded-2xl border border-neutral-200 overflow-hidden min-h-[550px]"
    >
      {/* Column Header */}
      <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900">
          {TASK_STATUS_LABELS[status]}
        </h3>
        <span
          className="px-2 py-0.5 rounded-full text-[12px] font-medium text-neutral-500 bg-neutral-200/50"
        >
          {tasks.length}
        </span>
      </div>

      {/* Cards List / Container */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="h-44 rounded-xl flex flex-col items-center justify-center text-center">
            <p className="text-[12px] font-medium text-neutral-400">{config.emptyText}</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onMoveTask={onMoveTask}
              onDeleteTask={onDeleteTask}
              onAddSubtask={onAddSubtask}
              onToggleSubtask={onToggleSubtask}
              onDeleteSubtask={onDeleteSubtask}
            />
          ))
        )}
      </div>
    </div>
  );
};
