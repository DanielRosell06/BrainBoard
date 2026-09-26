import { GoogleGenAI, Type } from '@google/genai';
import { prisma } from '../../prisma.js';
import { projectService } from '../projects/services/project.service.js';
import { kanbanService } from '../projects/services/kanban.service.js';
import { noteService } from '../projects/services/note.service.js';
import { taskService } from '../projects/services/task.service.js';
import { updateLogService } from '../projects/services/update-log.service.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Models to try in order (fallback chain)
const MODEL_PRIORITY = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
];

// ---- Logging helpers -------------------------------------------------------
function logInfo(tag: string, msg: string, data?: any) {
  const ts = new Date().toISOString();
  console.log(`[CHAT][${ts}][${tag}] ${msg}`, data !== undefined ? JSON.stringify(data, null, 2) : '');
}

function logError(tag: string, msg: string, err?: any) {
  const ts = new Date().toISOString();
  const details = err
    ? { status: err.status, message: err.message, stack: err.stack?.split('\n').slice(0, 4) }
    : {};
  console.error(`[CHAT][${ts}][${tag}][ERROR] ${msg}`, JSON.stringify(details, null, 2));
}

// ---- Gemini tool definitions -----------------------------------------------
const toolDefinitions = [
  {
    name: 'list_projects',
    description: 'Lista todos os projetos cadastrados no sistema, incluindo IDs e status.',
  },
  {
    name: 'create_project',
    description: 'Cria um novo projeto no sistema.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title:       { type: 'STRING', description: 'Título do projeto' },
        description: { type: 'STRING', description: 'Descrição do projeto (opcional)' },
      },
      required: ['title'],
    },
  },
  {
    name: 'get_project_details',
    description: 'Obtém todos os detalhes de um projeto específico (etapas/stages, tarefas/tasks, membros).',
    parameters: {
      type: 'OBJECT',
      properties: {
        projectId: { type: 'STRING', description: 'O ID único do projeto' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'create_kanban',
    description: 'Cria um novo quadro Kanban em um projeto.',
    parameters: {
      type: 'OBJECT',
      properties: {
        projectId: { type: 'STRING', description: 'ID do projeto' },
        title:     { type: 'STRING', description: 'Título do Kanban' },
      },
      required: ['projectId', 'title'],
    },
  },
  {
    name: 'create_note',
    description: 'Cria uma nova nota em um projeto.',
    parameters: {
      type: 'OBJECT',
      properties: {
        projectId: { type: 'STRING', description: 'ID do projeto' },
        title:     { type: 'STRING', description: 'Título da nota' },
        content:   { type: 'STRING', description: 'Conteúdo da nota em markdown' },
      },
      required: ['projectId', 'title'],
    },
  },
  {
    name: 'create_task',
    description: 'Cria uma nova tarefa em um Kanban específico.',
    parameters: {
      type: 'OBJECT',
      properties: {
        kanbanId:    { type: 'STRING', description: 'ID do kanban' },
        title:       { type: 'STRING', description: 'Título da tarefa' },
        description: { type: 'STRING', description: 'Descrição da tarefa (opcional)' },
        status:      { type: 'STRING', description: '"TODO", "IN_PROGRESS" ou "DONE"' },
      },
      required: ['kanbanId', 'title'],
    },
  },
  {
    name: 'move_task',
    description: 'Altera o status de uma tarefa ou move para outro Kanban.',
    parameters: {
      type: 'OBJECT',
      properties: {
        taskId:   { type: 'STRING', description: 'ID da tarefa' },
        status:   { type: 'STRING', description: '"TODO", "IN_PROGRESS" ou "DONE"' },
        kanbanId: { type: 'STRING', description: 'Novo ID do kanban (opcional)' },
      },
      required: ['taskId', 'status'],
    },
  },
  {
    name: 'log_project_update',
    description: 'Adiciona uma entrada ao diário de bordo de um projeto.',
    parameters: {
      type: 'OBJECT',
      properties: {
        projectId: { type: 'STRING', description: 'ID do projeto' },
        title:     { type: 'STRING', description: 'Título da atualização' },
        content:   { type: 'STRING', description: 'Conteúdo detalhado' },
      },
      required: ['projectId', 'title', 'content'],
    },
  },
];

// ---- Tool implementations --------------------------------------------------
const toolImplementations: Record<string, (args: any) => Promise<any>> = {
  list_projects: async () => {
    logInfo('TOOL', 'Executing list_projects');
    return projectService.listProjects();
  },
  create_project: async (args) => {
    logInfo('TOOL', 'Executing create_project', args);
    return projectService.createProject(args);
  },
  get_project_details: async (args) => {
    logInfo('TOOL', 'Executing get_project_details', { projectId: args.projectId });
    return projectService.getProjectById(args.projectId);
  },
  create_kanban: async (args) => {
    logInfo('TOOL', 'Executing create_kanban', args);
    return kanbanService.createKanban({ projectId: args.projectId, title: args.title });
  },
  create_note: async (args) => {
    logInfo('TOOL', 'Executing create_note', args);
    return noteService.createNote(args.projectId, args.title, args.content || '');
  },
  create_task: async (args) => {
    logInfo('TOOL', 'Executing create_task', args);
    return taskService.createTask(args);
  },
  move_task: async (args) => {
    logInfo('TOOL', 'Executing move_task', args);
    return taskService.updateTask(args.taskId, { status: args.status, kanbanId: args.kanbanId });
  },
  log_project_update: async (args) => {
    logInfo('TOOL', 'Executing log_project_update', args);
    return updateLogService.createLog({ ...args, author: 'AI Assistant' });
  },
};

// ---- Retry helper ----------------------------------------------------------
async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 2000): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const isRetryable = err?.status === 503 || err?.status === 429;
      if (isRetryable && attempt < retries) {
        logInfo('RETRY', `Attempt ${attempt + 1} failed with status ${err.status}. Retrying in ${delayMs}ms...`);
        await new Promise(r => setTimeout(r, delayMs));
      } else {
        throw err;
      }
    }
  }
  throw new Error('Max retries exceeded');
}

// ---- Generate content with model fallback ----------------------------------
async function generateWithFallback(contents: any[], systemInstruction: string): Promise<{ response: any; model: string }> {
  for (const model of MODEL_PRIORITY) {
    logInfo('GEMINI', `Trying model: ${model}`);
    try {
      const response = await withRetry(() =>
        ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            tools: [{ functionDeclarations: toolDefinitions as any }],
          },
        })
      );
      logInfo('GEMINI', `Success with model: ${model}`);
      return { response, model };
    } catch (err: any) {
      logError('GEMINI', `Model ${model} failed`, err);
      if (model === MODEL_PRIORITY[MODEL_PRIORITY.length - 1]) {
        throw err;
      }
      logInfo('GEMINI', `Falling back to next model...`);
    }
  }
  throw new Error('All models exhausted');
}

// ---- Chat Service ----------------------------------------------------------
export const chatService = {
  async getConversations() {
    return prisma.chatConversation.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });
  },

  async createConversation(title: string = 'Nova conversa') {
    const count = await prisma.chatConversation.count();
    if (count >= 10) {
      const oldest = await prisma.chatConversation.findFirst({
        orderBy: { updatedAt: 'asc' },
      });
      if (oldest) {
        logInfo('DB', `Deleting oldest conversation: ${oldest.id}`);
        await prisma.chatConversation.delete({ where: { id: oldest.id } });
      }
    }
    return prisma.chatConversation.create({ data: { title } });
  },

  async getConversation(id: string) {
    return prisma.chatConversation.findUniqueOrThrow({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  },

  async deleteConversation(id: string) {
    await prisma.chatConversation.delete({ where: { id } });
  },

  async processMessage(conversationId: string, userContent: string) {
    logInfo('MSG', `Processing message for conversation ${conversationId}`, { contentPreview: userContent.slice(0, 80) });

    // 1. Save user message
    await prisma.chatMessage.create({
      data: { role: 'user', content: userContent, conversationId },
    });
    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    const history = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
    logInfo('MSG', `History loaded: ${history.length} messages`);

    // If this is the very first message, generate a title asynchronously
    if (history.length === 1) {
      logInfo('MSG', 'First message detected, generating title in background...');
      const titlePrompt = `Gere um título bem curto (máximo 4 palavras) para uma conversa baseada nesta mensagem: "${userContent}". Retorne APENAS o título, sem aspas.`;
      
      generateWithFallback([{ role: 'user', parts: [{ text: titlePrompt }] }], 'Você é um gerador de títulos curtos.')
        .then(async ({ response }) => {
          let newTitle = response.text?.trim()?.replace(/["']/g, '') || 'Nova conversa';
          if (newTitle.length > 30) newTitle = newTitle.slice(0, 30) + '...';
          
          await prisma.chatConversation.update({
            where: { id: conversationId },
            data: { title: newTitle }
          });
          logInfo('TITLE', `Conversation title updated to: ${newTitle}`);
        })
        .catch(e => logError('TITLE', 'Failed to generate title', e));
    }

    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const systemInstruction =
      'Você é um assistente IA integrado ao sistema BrainBoard. ' +
      'Você ajuda a gerenciar projetos, etapas (stages) e tarefas Kanban. ' +
      'Responda sempre em português. Use markdown para formatar respostas.';

    try {
      // 3. First Gemini call
      const { response } = await generateWithFallback(contents, systemInstruction);

      // 4. Handle function calls
      if (response.functionCalls && response.functionCalls.length > 0) {
        const call = response.functionCalls[0];
        logInfo('FUNC_CALL', `Function called: ${call.name}`, call.args);

        const fn = toolImplementations[call.name];
        let functionResult: any;

        if (fn) {
          try {
            functionResult = await fn(call.args);
            logInfo('FUNC_CALL', `Function ${call.name} returned successfully`);
          } catch (e: any) {
            logError('FUNC_CALL', `Function ${call.name} threw an error`, e);
            functionResult = { error: e.message };
          }
        } else {
          logError('FUNC_CALL', `Unknown function: ${call.name}`);
          functionResult = { error: `Função desconhecida: ${call.name}` };
        }

        const modelContent = response.candidates?.[0]?.content || {
          role: 'model',
          parts: [{ functionCall: { name: call.name, args: call.args } }]
        };

        const followUpContents = [
          ...contents,
          modelContent,
          { role: 'user', parts: [{ functionResponse: { name: call.name, response: { result: functionResult } } }] },
        ];

        const { response: finalResponse } = await generateWithFallback(followUpContents, systemInstruction);
        const responseText = finalResponse.text || 'Operação concluída.';
        logInfo('MSG', `Assistant response (after func call): ${responseText.slice(0, 100)}...`);

        return prisma.chatMessage.create({
          data: { role: 'assistant', content: responseText, conversationId },
        });
      }

      // 5. Direct text response
      const responseText = response.text || 'Não entendi. Pode reformular?';
      logInfo('MSG', `Assistant response: ${responseText.slice(0, 100)}...`);

      return prisma.chatMessage.create({
        data: { role: 'assistant', content: responseText, conversationId },
      });

    } catch (error: any) {
      logError('MSG', 'Gemini API call failed after all retries/fallbacks', error);

      let userMessage: string;
      if (error?.status === 503 || error?.status === 429) {
        userMessage = '⚠️ **Serviço temporariamente sobrecarregado.** Aguarde alguns segundos e tente novamente.';
      } else if (error?.status === 401 || error?.status === 403) {
        userMessage = '❌ **Erro de autenticação.** A chave `GEMINI_API_KEY` parece inválida ou expirada.';
      } else if (error?.status === 404) {
        userMessage = `❌ **Modelo não disponível.** Detalhe: ${error.message}`;
      } else {
        userMessage = `❌ **Erro inesperado** (status ${error?.status ?? 'N/A'}): ${error?.message ?? 'Sem detalhes. Veja os logs do backend para mais informações.'}`;
      }

      return prisma.chatMessage.create({
        data: { role: 'assistant', content: userMessage, conversationId },
      });
    }
  },
};
