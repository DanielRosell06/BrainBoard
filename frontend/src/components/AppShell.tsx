import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Navbar } from './Navbar';
import { TopHeader } from './TopHeader';
import { CreateTaskModal } from './CreateTaskModal';
import { CreateProjectModal } from './CreateProjectModal';
import { CreateKanbanModal } from './CreateKanbanModal';
import { CreateNoteModal } from './CreateNoteModal';
import { CreateAppointmentModal } from './calendar/CreateAppointmentModal';

/**
 * AppShell — persistent layout wrapper for all authenticated routes.
 * Renders the sidebar, top header, global modals, and an <Outlet /> for pages.
 */
export const AppShell: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    projects,
    activeProject,
    activeProjectId,
    activeKanbanId,
    activeNoteId,
    activeWhiteboardId,
    activeChecklistId,
    activeChatId,
    calendarCount,
    searchQuery,
    loading,
    isConnected,
    isSyncing,
    error,
    isCreateTaskModalOpen,
    isCreateProjectModalOpen,
    isCreateKanbanModalOpen,
    isCreateNoteModalOpen,
    isCreateAppointmentModalOpen,
    createTaskDefaultStageId,
    setSearchQuery,
    setActiveKanbanId,
    setActiveNoteId,
    setActiveWhiteboardId,
    setActiveChecklistId,
    setActiveChatId,
    setIsCreateTaskModalOpen,
    setIsCreateProjectModalOpen,
    setIsCreateKanbanModalOpen,
    setIsCreateNoteModalOpen,
    setIsCreateAppointmentModalOpen,
    setCreateTaskDefaultStageId,
    loadProjects,
    loadActiveProject,
    syncAll,
    handleSelectProject,
    handleCreateProject,
    handleCreateKanban,
    handleCreateNote,
    handleCreateTask,
    handleOpenCreateTask,
  } = useAppContext();

  // Derive the current "view" from the URL for Navbar/TopHeader active states
  const currentPath = location.pathname;
  const isChat = currentPath.startsWith('/chat');
  const isCalendar = currentPath === '/calendar';
  const isProjects = currentPath === '/projects';
  const isBoardPath = currentPath.includes('/kanban/');
  const isNotePath = currentPath.includes('/notes/');
  const isChecklistPath = currentPath.includes('/checklists/');
  const isWhiteboardPath = currentPath.includes('/whiteboards/');

  // Determine active view string used by TopHeader for title/buttons
  type LegacyView = 'PROJECTS' | 'PROJECT_OVERVIEW' | 'BOARD' | 'NOTE' | 'CALENDAR' | 'CHAT' | 'CHECKLIST' | 'WHITEBOARD';
  let currentView: LegacyView = 'PROJECTS';
  if (isChat) currentView = 'CHAT';
  else if (isCalendar) currentView = 'CALENDAR';
  else if (isBoardPath) currentView = 'BOARD';
  else if (isNotePath) currentView = 'NOTE';
  else if (isChecklistPath) currentView = 'CHECKLIST';
  else if (isWhiteboardPath) currentView = 'WHITEBOARD';
  else if (activeProjectId && !isProjects) currentView = 'PROJECT_OVERVIEW';

  const isChatView = currentView === 'CHAT';

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col md:flex-row">
      {/* Lateral Sidebar */}
      <Navbar
        currentView={currentView}
        onSelectView={(view) => {
          if (view === 'PROJECTS') navigate('/projects');
          else if (view === 'CALENDAR') navigate('/calendar');
          else if (view === 'CHAT') navigate('/chat');
          else if (view === 'BOARD' && activeProjectId && activeKanbanId)
            navigate(`/projects/${activeProjectId}/kanban/${activeKanbanId}`);
          else if (view === 'NOTE' && activeProjectId && activeNoteId)
            navigate(`/projects/${activeProjectId}/notes/${activeNoteId}`);
          else if (view === 'CHECKLIST' && activeProjectId && activeChecklistId)
            navigate(`/projects/${activeProjectId}/checklists/${activeChecklistId}`);
          else if (view === 'WHITEBOARD' && activeProjectId && activeWhiteboardId)
            navigate(`/projects/${activeProjectId}/whiteboards/${activeWhiteboardId}`);
          else if (view === 'PROJECT_OVERVIEW' && activeProjectId)
            navigate(`/projects/${activeProjectId}`);
        }}
        projects={projects}
        loadProjects={loadProjects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        activeKanbanId={activeKanbanId}
        onSelectKanban={(kId) => {
          setActiveKanbanId(kId);
          if (activeProjectId && kId)
            navigate(`/projects/${activeProjectId}/kanban/${kId}`);
        }}
        activeNoteId={activeNoteId}
        onSelectNote={(nId) => {
          setActiveNoteId(nId);
          if (activeProjectId && nId)
            navigate(`/projects/${activeProjectId}/notes/${nId}`);
        }}
        activeChecklistId={activeChecklistId}
        onSelectChecklist={(cId: string | null) => {
          setActiveChecklistId(cId);
          if (activeProjectId && cId)
            navigate(`/projects/${activeProjectId}/checklists/${cId}`);
        }}
        activeWhiteboardId={activeWhiteboardId}
        onSelectWhiteboard={(wId: string | null) => {
          setActiveWhiteboardId(wId);
          if (activeProjectId && wId)
            navigate(`/projects/${activeProjectId}/whiteboards/${wId}`);
        }}
        onOpenCreateProjectModal={() => setIsCreateProjectModalOpen(true)}
        onOpenCreateModal={() => handleOpenCreateTask()}
        onOpenCreateKanban={() => setIsCreateKanbanModalOpen(true)}
        onOpenCreateNote={() => setIsCreateNoteModalOpen(true)}
        isConnected={isConnected}
        calendarCount={calendarCount}
        activeChatId={activeChatId}
        onSelectChat={(id) => {
          setActiveChatId(id);
          navigate(`/chat/${id}`);
        }}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-neutral-50">
        {/* Top Header */}
        <TopHeader
          currentView={currentView}
          onSelectView={(view) => {
            if (view === 'PROJECTS') navigate('/projects');
            else if (view === 'CALENDAR') navigate('/calendar');
            else if (view === 'CHAT') navigate('/chat');
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenCreateModal={() => handleOpenCreateTask()}
          onOpenCreateProjectModal={() => setIsCreateProjectModalOpen(true)}
          onOpenCreateAppointmentModal={() => setIsCreateAppointmentModalOpen(true)}
          isConnected={isConnected}
          isSyncing={isSyncing}
          onRefresh={() => syncAll(false)}
          activeProject={activeProject}
          onBackToProjects={() => handleSelectProject(null)}
        />

        {/* Page Content */}
        <main
          className={`flex-1 w-full mx-auto min-w-0 ${
            isChatView ? 'max-w-none px-0 py-0' : 'max-w-7xl px-8 lg:px-12 py-8 space-y-8'
          }`}
        >
          {/* Error Banner */}
          {error && (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-100 text-neutral-600 text-sm">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-neutral-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => {
                  loadProjects();
                  if (activeProjectId) loadActiveProject(activeProjectId);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-50 text-neutral-900 text-xs font-semibold transition-colors border border-neutral-200"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reconectar</span>
              </button>
            </div>
          )}

          {/* Global loading spinner (initial projects fetch only) */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-3">
              <Loader2 className="w-8 h-8 text-neutral-900 animate-spin" />
            </div>
          ) : (
            /* Route page renders here */
            <Outlet />
          )}
        </main>
      </div>

      {/* ── Global Modals ── */}
      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
        onCreateProject={handleCreateProject}
      />

      {activeProjectId && (
        <CreateKanbanModal
          isOpen={isCreateKanbanModalOpen}
          onClose={() => setIsCreateKanbanModalOpen(false)}
          projectId={activeProjectId}
          onCreateKanban={handleCreateKanban}
        />
      )}

      {activeProjectId && (
        <CreateNoteModal
          isOpen={isCreateNoteModalOpen}
          onClose={() => setIsCreateNoteModalOpen(false)}
          projectId={activeProjectId}
          onCreateNote={handleCreateNote}
        />
      )}

      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => {
          setIsCreateTaskModalOpen(false);
          setCreateTaskDefaultStageId(undefined);
        }}
        kanbans={activeProject?.kanbans || []}
        defaultKanbanId={createTaskDefaultStageId}
        onCreateTask={handleCreateTask}
      />

      <CreateAppointmentModal
        isOpen={isCreateAppointmentModalOpen}
        onClose={() => setIsCreateAppointmentModalOpen(false)}
        onAppointmentCreated={() => syncAll(true)}
      />
    </div>
  );
};
