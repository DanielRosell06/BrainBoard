import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { RichTextEditor } from './RichTextEditor';
import { notesApi } from '../../services/api';
import type { Note, Project } from '../../types';
import { Save, CheckCircle2, Loader2, Clock, FileText } from 'lucide-react';

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

export interface NoteEditorViewProps {
  noteId: string;
  project: Project;
  /** Callback para atualizar a nota no estado do App */
  onNoteUpdated?: (updatedNote: Note) => void;
}

export const NoteEditorView: React.FC<NoteEditorViewProps> = ({
  noteId,
  project,
  onNoteUpdated,
}) => {
  const note = useMemo(
    () => project.notes?.find((n) => n.id === noteId) ?? null,
    [project.notes, noteId]
  );

  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);

  // Atualizar estado local quando a nota muda (troca de nota)
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setSaveStatus('saved');
    }
  }, [note?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // Função de salvamento
  const saveNote = useCallback(
    async (newTitle: string, newContent: string) => {
      if (!note) return;
      setSaveStatus('saving');
      try {
        const updated = await notesApi.update(project.id, note.id, {
          title: newTitle,
          content: newContent,
        });
        if (isMounted.current) {
          setSaveStatus('saved');
          onNoteUpdated?.(updated);
        }
      } catch (err) {
        console.error('Erro ao salvar nota:', err);
        if (isMounted.current) setSaveStatus('error');
      }
    },
    [note, project.id, onNoteUpdated]
  );

  // Auto-save com debounce de 2 segundos
  const scheduleAutoSave = useCallback(
    (newTitle: string, newContent: string) => {
      setSaveStatus('unsaved');
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        saveNote(newTitle, newContent);
      }, 2000);
    },
    [saveNote]
  );

  // Handlers
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    scheduleAutoSave(newTitle, content);
  };

  const handleContentUpdate = (html: string) => {
    setContent(html);
    scheduleAutoSave(title, html);
  };

  // Ctrl+S para salvar manualmente
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        saveNote(title, content);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [title, content, saveNote]);

  // Nota não encontrada
  if (!note) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 min-h-[600px]">
        <div className="text-center py-20 px-4">
          <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-neutral-900">Nota não encontrada</h3>
          <p className="text-xs text-neutral-500 mt-1">
            A nota selecionada pode ter sido excluída.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 flex flex-col min-h-[600px] max-h-[calc(100vh-12rem)]">
      {/* Header: título + status de salvamento */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-neutral-200">
        {/* Título editável */}
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Título da nota..."
          className="flex-1 text-xl font-bold text-neutral-900 bg-transparent border-none outline-none placeholder-neutral-300 focus:placeholder-neutral-400 transition-colors"
        />

        {/* Indicador de status de salvamento */}
        <div className="flex items-center gap-1.5 text-xs font-medium shrink-0">
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Salvo
            </span>
          )}
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-neutral-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Salvando...
            </span>
          )}
          {saveStatus === 'unsaved' && (
            <span className="flex items-center gap-1 text-amber-500">
              <Clock className="w-3.5 h-3.5" />
              Não salvo
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1 text-rose-500">
              <Save className="w-3.5 h-3.5" />
              Erro ao salvar
            </span>
          )}
        </div>

        {/* Botão de salvar manual */}
        <button
          onClick={() => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
            saveNote(title, content);
          }}
          title="Salvar (Ctrl+S)"
          className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
        >
          <Save className="w-4 h-4" />
        </button>
      </div>

      {/* Editor Rich Text */}
      <div className="flex-1 min-h-0 flex flex-col">
        <RichTextEditor
          content={content}
          onUpdate={handleContentUpdate}
          placeholder="Comece a escrever sua nota..."
        />
      </div>
    </div>
  );
};
