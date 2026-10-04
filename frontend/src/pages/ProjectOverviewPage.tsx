import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ProjectOverview } from '../components/ProjectOverview';
import type { Project } from '../types';

/**
 * ProjectOverviewPage — shows a single project's overview (kanbans, notes, settings).
 * Route: /projects/:projectId
 */
export const ProjectOverviewPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const {
    activeProject,
    activeProjectId,
    loadingProject,
    loadActiveProject,
    setActiveProject,
    setActiveKanbanId,
    setActiveNoteId,
    setIsCreateKanbanModalOpen,
    setIsCreateNoteModalOpen,
    setProjects,
  } = useAppContext();

  // Load project when projectId changes (e.g., direct URL access / navigation)
  useEffect(() => {
    if (projectId && projectId !== activeProjectId) {
      loadActiveProject(projectId, false);
    }
  }, [projectId, activeProjectId, loadActiveProject]);

  if (loadingProject || !activeProject || activeProject.id !== projectId) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-3">
        <Loader2 className="w-8 h-8 text-neutral-900 animate-spin" />
      </div>
    );
  }

  return (
    <ProjectOverview
      project={activeProject}
      onSelectKanban={(kId) => {
        setActiveKanbanId(kId);
        navigate(`/projects/${projectId}/kanban/${kId}`);
      }}
      onSelectNote={(nId) => {
        setActiveNoteId(nId);
        navigate(`/projects/${projectId}/notes/${nId}`);
      }}
      onOpenCreateKanban={() => setIsCreateKanbanModalOpen(true)}
      onOpenCreateNote={() => setIsCreateNoteModalOpen(true)}
      onProjectUpdated={(updatedProject: Project) => {
        setActiveProject(updatedProject);
        setProjects((prev) =>
          prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
        );
      }}
    />
  );
};
