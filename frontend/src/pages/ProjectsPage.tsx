import React from 'react';
import { useAppContext } from '../context/AppContext';
import { ProjectList } from '../components/ProjectList';

/**
 * ProjectsPage — shows the full project portfolio list.
 * Route: /projects
 */
export const ProjectsPage: React.FC = () => {
  const {
    projects,
    searchQuery,
    handleSelectProject,
    setIsCreateProjectModalOpen,
    handleDeleteProject,
    handleToggleFavorite,
    handleArchiveProject
  } = useAppContext();

  return (
    <ProjectList
      projects={projects}
      onSelectProject={handleSelectProject}
      onOpenCreateProjectModal={() => setIsCreateProjectModalOpen(true)}
      searchQuery={searchQuery}
      onDeleteProject={handleDeleteProject}
      onToggleFavorite={handleToggleFavorite}
      onArchive={handleArchiveProject}
    />
  );
};
