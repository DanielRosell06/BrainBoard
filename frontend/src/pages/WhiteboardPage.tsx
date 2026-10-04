import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Whiteboard } from '../types';
import { PenTool, Edit2, Check, X } from 'lucide-react';
import { Tldraw, Editor, getSnapshot, loadSnapshot } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';

export const WhiteboardPage: React.FC = () => {
  const { projectId, whiteboardId } = useParams<{ projectId: string; whiteboardId: string }>();
  const [whiteboard, setWhiteboard] = useState<Whiteboard | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  
  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (projectId && whiteboardId) {
      loadWhiteboard();
    }
  }, [projectId, whiteboardId]);

  const loadWhiteboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/whiteboards/${whiteboardId}`);
      if (response.ok) {
        const data = await response.json();
        setWhiteboard(data);
        setEditTitle(data.title);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTitle = async () => {
    if (!editTitle.trim() || !whiteboard) return;
    try {
      const response = await fetch(`/api/whiteboards/${whiteboardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim() }),
      });
      if (response.ok) {
        const updated = await response.json();
        setWhiteboard({ ...whiteboard, title: updated.title });
        setIsEditingTitle(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMount = (editor: Editor) => {
    if (whiteboard?.data && Object.keys(whiteboard.data).length > 0) {
      try {
        loadSnapshot(editor.store, whiteboard.data as any);
      } catch (err) {
        console.error('Error loading whiteboard data:', err);
      }
    }

    editor.store.listen(
      () => {
        // Debounce saving the snapshot
        if (saveTimeoutRef.current) {
          window.clearTimeout(saveTimeoutRef.current);
        }
        
        saveTimeoutRef.current = window.setTimeout(async () => {
          const snapshot = getSnapshot(editor.store);
          try {
            await fetch(`/api/whiteboards/${whiteboardId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ data: snapshot }),
            });
          } catch (e) {
            console.error('Failed to save whiteboard', e);
          }
        }, 1000);
      },
      { scope: 'document', source: 'user' }
    );
  };

  if (loading) {
    return <div className="p-8 text-neutral-500">Carregando whiteboard...</div>;
  }

  if (!whiteboard) {
    return <div className="p-8 text-red-500">Whiteboard n\u00e3o encontrado.</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 p-4 border-b border-neutral-200 bg-white">
        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
          <PenTool className="w-5 h-5" />
        </div>
        <div className="flex-1">
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-xl font-bold bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-1 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUpdateTitle();
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
              />
              <button onClick={handleUpdateTitle} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg">
                <Check className="w-5 h-5" />
              </button>
              <button onClick={() => setIsEditingTitle(false)} className="p-1.5 text-neutral-400 hover:bg-neutral-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <h1 className="text-xl font-bold text-neutral-900">{whiteboard.title}</h1>
              <button
                onClick={() => setIsEditingTitle(true)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-neutral-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 relative bg-neutral-50">
        <Tldraw onMount={handleMount} />
      </div>
    </div>
  );
};
