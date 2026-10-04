import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { NoteEditorView } from '../components/notes/NoteEditorView';

/**
 * NotePage — rich text note editor for a specific note within a project.
 * Route: /projects/:projectId/notes/:noteId
 */
export const NotePage: React.FC = () => {
  const { projectId, noteId } = useParams<{ projectId: string; noteId: string }>();

  const {
    activeProject,
    activeProjectId,
    activeNoteId,
    loadingProject,
    loadActiveProject,
    setActiveNoteId,
    handleNoteUpdated,
  } = useAppContext();

  // Sync project if arriving via direct URL
  useEffect(() => {
    if (projectId && projectId !== activeProjectId) {
      loadActiveProject(projectId, false);
    }
  }, [projectId, activeProjectId, loadActiveProject]);

  // Sync note selection from URL
  useEffect(() => {
    if (noteId && noteId !== activeNoteId) {
      setActiveNoteId(noteId);
    }
  }, [noteId, activeNoteId, setActiveNoteId]);

  if (loadingProject || !activeProject) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-3">
        <Loader2 className="w-8 h-8 text-neutral-900 animate-spin" />
      </div>
    );
  }

  if (!noteId) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 min-h-[600px]">
        <div className="text-center py-20 px-4">
          <h3 className="text-sm font-semibold text-neutral-900">Selecione uma nota</h3>
          <p className="text-xs text-neutral-500 mt-1">
            Escolha uma nota na barra lateral para começar a editar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <NoteEditorView
      noteId={noteId}
      project={activeProject}
      onNoteUpdated={handleNoteUpdated}
    />
  );
};
