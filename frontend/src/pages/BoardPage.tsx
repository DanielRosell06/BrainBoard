import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { KanbanBoard } from '../components/KanbanBoard';

/**
 * BoardPage — shows a Kanban board for a specific project+kanban.
 * Route: /projects/:projectId/kanban/:kanbanId
 */
export const BoardPage: React.FC = () => {
  const { projectId, kanbanId } = useParams<{ projectId: string; kanbanId: string }>();

  const {
    activeProject,
    activeProjectId,
    activeKanbanId,
    loadingProject,
    loadActiveProject,
    setActiveKanbanId,
    displayedTasks,
    handleMoveTask,
    handleUpdateTask,
    handleDeleteTask,
    handleAddSubtask,
    handleToggleSubtask,
    handleDeleteSubtask,
    handleOpenCreateTask,
  } = useAppContext();

  // Sync project if arriving via direct URL
  useEffect(() => {
    if (projectId && projectId !== activeProjectId) {
      loadActiveProject(projectId, false);
    }
  }, [projectId, activeProjectId, loadActiveProject]);

  // Sync kanban selection from URL
  useEffect(() => {
    if (kanbanId && kanbanId !== activeKanbanId) {
      setActiveKanbanId(kanbanId);
    }
  }, [kanbanId, activeKanbanId, setActiveKanbanId]);

  if (loadingProject || !activeProject) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-3">
        <Loader2 className="w-8 h-8 text-neutral-900 animate-spin" />
      </div>
    );
  }

  const kanban = activeProject.kanbans?.find((k) => k.id === kanbanId) || null;

  return (
    <KanbanBoard
      project={activeProject}
      kanban={kanban}
      tasks={displayedTasks}
      onMoveTask={handleMoveTask}
      onUpdateTask={handleUpdateTask}
      onDeleteTask={handleDeleteTask}
      onAddSubtask={handleAddSubtask}
      onToggleSubtask={handleToggleSubtask}
      onDeleteSubtask={handleDeleteSubtask}
      onOpenCreateTask={handleOpenCreateTask}
      onOpenCreateModal={() => handleOpenCreateTask()}
      onRefreshKanban={() => {
        if (projectId) loadActiveProject(projectId, true);
      }}
    />
  );
};
