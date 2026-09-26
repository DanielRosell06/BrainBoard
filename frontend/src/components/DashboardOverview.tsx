import React from 'react';
import type { Task } from '../types';

interface DashboardOverviewProps {
  tasks: Task[];
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ tasks }) => {
  const totalTasks = tasks.length;
  const todoTasks = tasks.filter((t) => t.status === 'TODO').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const doneTasks = tasks.filter((t) => t.status === 'DONE').length;

  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="flex items-center gap-8 py-2 px-4 bg-transparent">
      <div className="flex flex-col">
        <span className="text-[12px] font-medium text-neutral-500">Total</span>
        <span className="text-xl font-semibold text-neutral-900">{totalTasks}</span>
      </div>
      
      <div className="w-px h-8 bg-neutral-200" />
      
      <div className="flex flex-col">
        <span className="text-[12px] font-medium text-neutral-500">Pendentes</span>
        <span className="text-xl font-semibold text-neutral-900">{todoTasks}</span>
      </div>
      
      <div className="w-px h-8 bg-neutral-200" />
      
      <div className="flex flex-col">
        <span className="text-[12px] font-medium text-neutral-500">Em andamento</span>
        <span className="text-xl font-semibold text-neutral-900">{inProgressTasks}</span>
      </div>
      
      <div className="w-px h-8 bg-neutral-200" />
      
      <div className="flex flex-col">
        <span className="text-[12px] font-medium text-neutral-500">Concluídas</span>
        <span className="text-xl font-semibold text-neutral-900">{doneTasks} <span className="text-sm text-neutral-400 font-medium ml-1">({completionRate}%)</span></span>
      </div>
    </div>
  );
};
