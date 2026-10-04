import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AppShell } from './components/AppShell';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectOverviewPage } from './pages/ProjectOverviewPage';
import { BoardPage } from './pages/BoardPage';
import { NotePage } from './pages/NotePage';
import { CalendarPage } from './pages/CalendarPage';
import { ChatPage } from './pages/ChatPage';
import { ChecklistPage } from './pages/ChecklistPage';
import { WhiteboardPage } from './pages/WhiteboardPage';

/**
 * App — root component.
 * Wraps the app in AppProvider (global state + handlers) and declares all routes.
 * The actual UI shell (sidebar, header, modals) lives in AppShell.
 */
export const App: React.FC = () => (
  <AppProvider>
    <Routes>
      {/* All routes share the AppShell layout (sidebar + header + modals) */}
      <Route element={<AppShell />}>
        {/* Root redirect */}
        <Route index element={<Navigate to="/projects" replace />} />

        {/* Projects portfolio */}
        <Route path="projects" element={<ProjectsPage />} />

        {/* Project detail */}
        <Route path="projects/:projectId" element={<ProjectOverviewPage />} />

        {/* Kanban board */}
        <Route path="projects/:projectId/kanban/:kanbanId" element={<BoardPage />} />

        {/* Note editor */}
        <Route path="projects/:projectId/notes/:noteId" element={<NotePage />} />

        {/* Checklist */}
        <Route path="projects/:projectId/checklists/:checklistId" element={<ChecklistPage />} />

        {/* Whiteboard */}
        <Route path="projects/:projectId/whiteboards/:whiteboardId" element={<WhiteboardPage />} />

        {/* Calendar */}
        <Route path="calendar" element={<CalendarPage />} />

        {/* Chat (with or without chatId) */}
        <Route path="chat" element={<ChatPage />} />
        <Route path="chat/:chatId" element={<ChatPage />} />
      </Route>
    </Routes>
  </AppProvider>
);
