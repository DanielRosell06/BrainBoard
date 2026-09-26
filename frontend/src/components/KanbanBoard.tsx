import React from 'react';
import type { Project, Task, TaskStatus } from '../types';
import { KanbanColumn } from './KanbanColumn';
import { DashboardOverview } from './DashboardOverview';

export interface KanbanBoardProps {
  project?: Project | null;
  tasks: Task[];
  onMoveTask: (id: string, status: TaskStatus) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onAddSubtask: (taskId: string, title: string) => Promise<void>;
  onToggleSubtask: (id: string, isDone: boolean) => Promise<void>;
  onDeleteSubtask?: (id: string) => Promise<void>;
  onOpenCreateTask: (kanbanId?: string) => void;
  onOpenCreateModal?: () => void;
  selectedCategory?: string;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onMoveTask,
  onDeleteTask,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onOpenCreateTask,
  onOpenCreateModal,
}) => {
  const todoTasks = tasks.filter((t) => t.status === 'TODO');
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS');
  const doneTasks = tasks.filter((t) => t.status === 'DONE');

  const handleCreateTaskTrigger = () => {
    if (onOpenCreateTask) {
      onOpenCreateTask();
    } else if (onOpenCreateModal) {
      onOpenCreateModal();
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Dashboard Overview Metrics Section */}
      <DashboardOverview tasks={tasks} />

      {/* Modern Professional Board Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-neutral-500 font-medium">
            <span className="hidden sm:inline">Quadro Kanban</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleCreateTaskTrigger()}
            className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium rounded-xl transition-all"
          >
            <span>Nova Tarefa</span>
          </button>
        </div>
      </div>
        /* 3-Column Traditional Status Grid (TODO, IN_PROGRESS, DONE) */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KanbanColumn
            status="TODO"
            tasks={todoTasks}
            onMoveTask={onMoveTask}
            onDeleteTask={onDeleteTask}
            onAddSubtask={onAddSubtask}
            onToggleSubtask={onToggleSubtask}
            onDeleteSubtask={onDeleteSubtask}
          />

          <KanbanColumn
            status="IN_PROGRESS"
            tasks={inProgressTasks}
            onMoveTask={onMoveTask}
            onDeleteTask={onDeleteTask}
            onAddSubtask={onAddSubtask}
            onToggleSubtask={onToggleSubtask}
            onDeleteSubtask={onDeleteSubtask}
          />

          <KanbanColumn
            status="DONE"
            tasks={doneTasks}
            onMoveTask={onMoveTask}
            onDeleteTask={onDeleteTask}
            onAddSubtask={onAddSubtask}
            onToggleSubtask={onToggleSubtask}
            onDeleteSubtask={onDeleteSubtask}
          />
        </div>
      {/* When total tasks is 0 */}
      {tasks.length === 0 && (
        <div className="text-center py-20 px-4 mt-6">
          <h3 className="text-sm font-semibold text-neutral-900">
            Nenhuma tarefa
          </h3>
          <button
            onClick={() => handleCreateTaskTrigger()}
            className="mt-4 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium rounded-xl transition-all inline-flex items-center gap-1.5"
          >
            <span>Nova Tarefa</span>
          </button>
        </div>
      )}
    </div>
  );
};
