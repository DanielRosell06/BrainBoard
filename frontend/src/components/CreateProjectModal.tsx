import React, { useState, useEffect } from 'react';
import { X, Loader2, FolderKanban, Github, FileText } from 'lucide-react';
import type { CreateProjectInput } from '../types';

export interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (input: CreateProjectInput) => Promise<void>;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [businessLogic, setBusinessLogic] = useState('');
  const [color, setColor] = useState('#3b82f6'); // default blue
  const [icon, setIcon] = useState('📁');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setGithubRepo('');
      setBusinessLogic('');
      setColor('#3b82f6');
      setIcon('📁');
      setErrorMessage('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setErrorMessage('O título do projeto é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await onCreateProject({
        title: cleanTitle,
        description: description.trim() || undefined,
        githubRepo: githubRepo.trim() || undefined,
        businessLogic: businessLogic.trim() || undefined,
        color,
        icon,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao criar projeto. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                Novo Projeto
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Crie um novo projeto com etapas e controle inteligente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl font-medium">
              {errorMessage}
            </div>
          )}

          {/* Title Field */}
          <div className="space-y-2">
            <label htmlFor="project-title" className="block text-sm font-semibold text-slate-700">
              Título do Projeto <span className="text-rose-500">*</span>
            </label>
            <input
              id="project-title"
              name="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Plataforma E-commerce V2..."
              autoFocus
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-200 focus:outline-none transition-all"
            />
          </div>


          {/* Color and Icon Picker */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Cor</label>
              <div className="flex flex-wrap gap-2">
                {['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#64748b'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-slate-900 scale-110' : 'border-transparent hover:scale-110'} transition-transform`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Ícone</label>
              <div className="flex flex-wrap gap-2">
                {['📁', '🚀', '⭐', '🔥', '💡', '🎯', '⚡', '🛠️', '🎨'].map(i => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIcon(i)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg ${icon === i ? 'bg-slate-200 border border-slate-300' : 'bg-slate-50 border border-slate-100 hover:bg-slate-100'} transition-colors`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <label htmlFor="project-desc" className="block text-sm font-semibold text-slate-700">
              Descrição <span className="text-slate-400 font-normal">(Opcional)</span>
            </label>
            <textarea
              id="project-desc"
              name="description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Objetivos e escopo do projeto..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-200 focus:outline-none transition-all resize-none"
            />
          </div>

          {/* GitHub Repo */}
          <div className="space-y-2">
            <label htmlFor="project-github" className="block text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Github className="w-4 h-4 text-slate-500" />
              <span>Repositório GitHub <span className="text-slate-400 font-normal">(Opcional)</span></span>
            </label>
            <input
              id="project-github"
              name="githubRepo"
              type="text"
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
              placeholder="https://github.com/usuario/repositorio"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-200 focus:outline-none transition-all"
            />
          </div>

          {/* Business Logic (for AI MCP context) */}
          <div className="space-y-2">
            <label htmlFor="project-businessLogic" className="block text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Lógica de Negócio (Contexto MCP / IA) <span className="text-slate-400 font-normal">(Opcional)</span></span>
            </label>
            <textarea
              id="project-businessLogic"
              name="businessLogic"
              rows={3}
              value={businessLogic}
              onChange={(e) => setBusinessLogic(e.target.value)}
              placeholder="Regras de negócio, arquitetura técnica e diretrizes de IA..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-200 focus:outline-none transition-all resize-none font-mono"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Criando...</span>
                </>
              ) : (
                <span>Criar Projeto</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
