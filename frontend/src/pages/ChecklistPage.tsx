import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { checklistsApi } from '../services/api';
import { Checklist, ChecklistItem } from '../types';
import { CheckSquare, Plus, Trash2, Edit2, Check, X } from 'lucide-react';

export const ChecklistPage: React.FC = () => {
  const { checklistId } = useParams<{ checklistId: string }>();
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [newItemText, setNewItemText] = useState('');
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    if (checklistId) {
      loadChecklist();
    }
  }, [checklistId]);

  const loadChecklist = async () => {
    try {
      setLoading(true);
      const data = await checklistsApi.get(checklistId!);
      setChecklist(data);
      setEditTitle(data.title);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTitle = async () => {
    if (!editTitle.trim() || !checklist) return;
    try {
      const updated = await checklistsApi.update(checklist.id, { title: editTitle.trim() });
      setChecklist({ ...checklist, title: updated.title });
      setIsEditingTitle(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim() || !checklist) return;
    try {
      const item = await checklistsApi.addItem(checklist.id, newItemText.trim());
      setChecklist({ ...checklist, items: [...checklist.items, item] });
      setNewItemText('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleItem = async (item: ChecklistItem) => {
    if (!checklist) return;
    try {
      // Optimistic
      const newItems = checklist.items.map(i => i.id === item.id ? { ...i, isDone: !i.isDone } : i);
      setChecklist({ ...checklist, items: newItems });
      
      await checklistsApi.toggleItem(item.id, !item.isDone);
    } catch (e) {
      console.error(e);
      // Revert optimism if needed (simple app, could reload or just ignore)
      loadChecklist();
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!checklist) return;
    try {
      // Optimistic
      const newItems = checklist.items.filter(i => i.id !== itemId);
      setChecklist({ ...checklist, items: newItems });
      
      await checklistsApi.deleteItem(itemId);
    } catch (e) {
      console.error(e);
      loadChecklist();
    }
  };

  if (loading) {
    return <div className="p-8 text-neutral-500">Carregando checklist...</div>;
  }

  if (!checklist) {
    return <div className="p-8 text-red-500">Checklist no encontrado.</div>;
  }

  const completedCount = checklist.items.filter(i => i.isDone).length;
  const totalCount = checklist.items.length;
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div className="flex-1">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="flex-1 text-2xl font-bold bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-1 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                <h1 className="text-2xl font-bold text-neutral-900">{checklist.title}</h1>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-3 mt-2 text-sm text-neutral-500">
              <span>{completedCount} de {totalCount} concludos</span>
              <span>&bull;</span>
              <span>{progress}%</span>
            </div>
            
            {totalCount > 0 && (
              <div className="w-full bg-neutral-100 rounded-full h-1.5 mt-4">
                <div 
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-300 ease-in-out" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleAddItem} className="mb-6 relative">
          <input
            type="text"
            placeholder="Adicionar novo item..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-4 pr-12 py-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newItemText.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
          </button>
        </form>

        <div className="space-y-2">
          {checklist.items.map(item => (
            <div 
              key={item.id} 
              className={`group flex items-center justify-between p-3 rounded-xl border transition-colors ${
                item.isDone ? 'bg-neutral-50 border-transparent' : 'bg-white border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={() => handleToggleItem(item)}
                  className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                    item.isDone ? 'bg-blue-500 border-blue-500 text-white' : 'border-neutral-300 text-transparent hover:border-blue-500'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <span className={`text-sm transition-colors ${item.isDone ? 'text-neutral-400 line-through' : 'text-neutral-700'}`}>
                  {item.text}
                </span>
              </div>
              <button
                onClick={() => handleDeleteItem(item.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          
          {checklist.items.length === 0 && (
            <div className="text-center py-8 text-neutral-400 text-sm">
              Nenhum item adicionado ainda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
