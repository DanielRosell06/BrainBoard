import React from 'react';
import type { Task, KanbanTag } from '../types';
import { TaskCard } from './TaskCard';
import { Trash2 } from 'lucide-react';
import { Droppable } from '@hello-pangea/dnd';

export interface KanbanColumnProps {
  column: { id: string; title: string };
  columns?: { id: string; title: string }[];
  availableTags?: KanbanTag[];
  tasks: Task[];
  onMoveTask: (id: string, status: string) => Promise<void>;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onAddSubtask: (taskId: string, title: string) => Promise<void>;
  onToggleSubtask: (id: string, isDone: boolean) => Promise<void>;
  onDeleteSubtask?: (id: string) => Promise<void>;
  onOpenCreateTask?: () => void;
  onDeleteColumn?: () => void;
  onEditTask?: (task: Task) => void;
  onDuplicateTask?: (task: Task) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  columns = [],
  availableTags = [],
  tasks,
  onMoveTask,
  onUpdateTask,
  onDeleteTask,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onDeleteColumn,
  onEditTask,
  onDuplicateTask,
}) => {
  return (
    <div
      className="flex flex-col bg-neutral-100/50 rounded-2xl border border-neutral-200 overflow-hidden min-h-[550px] w-full"
    >
      {/* Column Header */}
      <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between group">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-neutral-900">
            {column.title}
          </h3>
          <span
            className="px-2 py-0.5 rounded-full text-[12px] font-medium text-neutral-500 bg-neutral-200/50"
          >
            {tasks.length}
          </span>
        </div>
        {onDeleteColumn && (
          <button
            onClick={onDeleteColumn}
            className="text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Excluir coluna"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Cards List / Container */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-4 flex flex-col gap-4 overflow-y-auto transition-colors ${
              snapshot.isDraggingOver ? 'bg-slate-100' : ''
            }`}
          >
            {tasks.length === 0 && !snapshot.isDraggingOver ? (
              <div className="h-44 rounded-xl flex flex-col items-center justify-center text-center">
                <p className="text-[12px] font-medium text-neutral-400">Vazio</p>
              </div>
            ) : (
              tasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  columns={columns}
                  availableTags={availableTags}
                  onMoveTask={onMoveTask}
                  onUpdateTask={onUpdateTask}
                  onDeleteTask={onDeleteTask}
                  onAddSubtask={onAddSubtask}
                  onToggleSubtask={onToggleSubtask}
                  onDeleteSubtask={onDeleteSubtask}
                  onEditTask={onEditTask}
                  onDuplicateTask={onDuplicateTask}
                />
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};
