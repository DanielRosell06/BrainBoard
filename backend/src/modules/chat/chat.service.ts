import { GoogleGenAI, Type } from '@google/genai';
import { prisma } from '../../prisma.js';
import { projectService } from '../projects/services/project.service.js';
import { kanbanService } from '../projects/services/kanban.service.js';
import { kanbanCustomizationService } from '../projects/services/kanban-customization.service.js';
import { noteService } from '../projects/services/note.service.js';
import { taskService } from '../projects/services/task.service.js';
import { subtaskService } from '../projects/services/subtask.service.js';
import { updateLogService } from '../projects/services/update-log.service.js';
import { memberService } from '../projects/services/member.service.js';
import { appointmentService } from '../calendar/appointment.service.js';
import { calendarService } from '../calendar/calendar.service.js';

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
  // ═══════════════════════════════════════════════════════════════════════════
  // PROJETOS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'list_projects',
    description: 'Lista todos os projetos cadastrados no sistema, incluindo IDs, status e descrição.',
  },
  {
    name: 'create_project',
    description: 'Cria um novo projeto no sistema.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title:         { type: 'STRING', description: 'Título do projeto' },
        description:   { type: 'STRING', description: 'Descrição do projeto (opcional)' },
        status:        { type: 'STRING', description: 'Status inicial: PLANNING, ACTIVE ou COMPLETED (padrão: PLANNING)' },
        businessLogic: { type: 'STRING', description: 'Lógica de negócio em Markdown (opcional)' },
        githubRepo:    { type: 'STRING', description: 'URL do repositório GitHub (opcional)' },
      },
      required: ['title'],
    },
  },
  {
    name: 'get_project_details',
    description: 'Obtém todos os detalhes de um projeto específico: etapas, tarefas, notas, membros, logs e configurações.',
    parameters: {
      type: 'OBJECT',
      properties: {
        projectId: { type: 'STRING', description: 'O ID único do projeto' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'update_project',
    description: 'Atualiza título, descrição, status ou tipo de um projeto existente.',
    parameters: {
      type: 'OBJECT',
      properties: {
        projectId:   { type: 'STRING', description: 'ID do projeto' },
        title:       { type: 'STRING', description: 'Novo título (opcional)' },
        description: { type: 'STRING', description: 'Nova descrição (opcional)' },
        status:      { type: 'STRING', description: 'Novo status: PLANNING, ACTIVE ou COMPLETED (opcional)' },
        githubRepo:  { type: 'STRING', description: 'URL do repositório GitHub (opcional)' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'delete_project',
    description: 'Exclui permanentemente um projeto e TODOS os seus dados associados (kanbans, tarefas, notas, membros, logs).',
    parameters: {
      type: 'OBJECT',
      properties: {
        projectId: { type: 'STRING', description: 'ID do projeto a ser excluído' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'update_business_logic',
    description: 'Atualiza a lógica de negócio / regras arquiteturais de um projeto em Markdown.',
    parameters: {
      type: 'OBJECT',
      properties: {
        projectId:     { type: 'STRING', description: 'ID do projeto' },
        businessLogic: { type: 'STRING', description: 'Texto completo em Markdown descrevendo regras de negócio ou arquitetura' },
      },
      required: ['projectId', 'businessLogic'],
    },
  },
  {
    name: 'update_project_settings',
    description: 'Atualiza repositório GitHub, configurações JSON dinâmicas e/ou lógica de negócio de um projeto.',
    parameters: {
      type: 'OBJECT',
      properties: {
        projectId:     { type: 'STRING', description: 'ID do projeto' },
        githubRepo:    { type: 'STRING', description: 'URL ou slug do repositório GitHub' },
        settings:      { type: 'STRING', description: 'JSON string com configurações dinâmicas (stack, URLs de deploy, etc)' },
        businessLogic: { type: 'STRING', description: 'Lógica de negócio / regras arquiteturais' },
      },
      required: ['projectId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // KANBAN
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'create_kanban',
    description: 'Cria um novo quadro Kanban em um projeto (já vem com 3 colunas padrão: A Fazer, Em Andamento, Concluído).',
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
    name: 'update_kanban',
    description: 'Atualiza o título de um quadro Kanban existente.',
    parameters: {
      type: 'OBJECT',
      properties: {
        kanbanId: { type: 'STRING', description: 'ID do kanban' },
        title:    { type: 'STRING', description: 'Novo título do kanban' },
      },
      required: ['kanbanId', 'title'],
    },
  },
  {
    name: 'delete_kanban',
    description: 'Exclui um quadro Kanban e todas as suas tarefas, colunas e tags.',
    parameters: {
      type: 'OBJECT',
      properties: {
        kanbanId: { type: 'STRING', description: 'ID do kanban a excluir' },
      },
      required: ['kanbanId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COLUNAS DO KANBAN
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'add_kanban_column',
    description: 'Adiciona uma nova coluna personalizada a um quadro Kanban.',
    parameters: {
      type: 'OBJECT',
      properties: {
        kanbanId: { type: 'STRING', description: 'ID do kanban' },
        title:    { type: 'STRING', description: 'Título da coluna (ex: "Em Review", "Bloqueado")' },
        order:    { type: 'NUMBER', description: 'Posição/ordem da coluna (opcional, padrão: 0)' },
      },
      required: ['kanbanId', 'title'],
    },
  },
  {
    name: 'update_kanban_column',
    description: 'Atualiza o título ou a ordem de uma coluna do Kanban.',
    parameters: {
      type: 'OBJECT',
      properties: {
        columnId: { type: 'STRING', description: 'ID da coluna' },
        title:    { type: 'STRING', description: 'Novo título da coluna (opcional)' },
        order:    { type: 'NUMBER', description: 'Nova posição/ordem (opcional)' },
      },
      required: ['columnId'],
    },
  },
  {
    name: 'remove_kanban_column',
    description: 'Remove uma coluna do Kanban.',
    parameters: {
      type: 'OBJECT',
      properties: {
        columnId: { type: 'STRING', description: 'ID da coluna a remover' },
      },
      required: ['columnId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TAGS DO KANBAN
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'add_kanban_tag',
    description: 'Adiciona uma tag/etiqueta colorida a um quadro Kanban.',
    parameters: {
      type: 'OBJECT',
      properties: {
        kanbanId: { type: 'STRING', description: 'ID do kanban' },
        name:     { type: 'STRING', description: 'Nome da tag (ex: "Urgente", "Bug", "Feature")' },
        color:    { type: 'STRING', description: 'Cor em hexadecimal (ex: "#ef4444"). Padrão: "#3b82f6"' },
      },
      required: ['kanbanId', 'name'],
    },
  },
  {
    name: 'update_kanban_tag',
    description: 'Atualiza o nome ou cor de uma tag do Kanban.',
    parameters: {
      type: 'OBJECT',
      properties: {
        tagId: { type: 'STRING', description: 'ID da tag' },
        name:  { type: 'STRING', description: 'Novo nome da tag (opcional)' },
        color: { type: 'STRING', description: 'Nova cor em hexadecimal (opcional)' },
      },
      required: ['tagId'],
    },
  },
  {
    name: 'remove_kanban_tag',
    description: 'Remove uma tag do Kanban.',
    parameters: {
      type: 'OBJECT',
      properties: {
        tagId: { type: 'STRING', description: 'ID da tag a remover' },
      },
      required: ['tagId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTAS
  // ═══════════════════════════════════════════════════════════════════════════
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
    name: 'read_note',
    description: 'Lê o conteúdo e detalhes de uma nota específica pelo ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        noteId: { type: 'STRING', description: 'ID da nota' },
      },
      required: ['noteId'],
    },
  },
  {
    name: 'update_note',
    description: 'Edita o título e/ou conteúdo de uma nota existente.',
    parameters: {
      type: 'OBJECT',
      properties: {
        noteId:  { type: 'STRING', description: 'ID da nota' },
        title:   { type: 'STRING', description: 'Novo título da nota (opcional)' },
        content: { type: 'STRING', description: 'Novo conteúdo em Markdown da nota (opcional)' },
      },
      required: ['noteId'],
    },
  },
  {
    name: 'delete_note',
    description: 'Exclui uma nota permanentemente.',
    parameters: {
      type: 'OBJECT',
      properties: {
        noteId: { type: 'STRING', description: 'ID da nota a excluir' },
      },
      required: ['noteId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TAREFAS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'create_task',
    description: 'Cria uma nova tarefa em um Kanban específico.',
    parameters: {
      type: 'OBJECT',
      properties: {
        kanbanId:       { type: 'STRING', description: 'ID do kanban' },
        title:          { type: 'STRING', description: 'Título da tarefa' },
        description:    { type: 'STRING', description: 'Descrição da tarefa (opcional)' },
        status:         { type: 'STRING', description: '"TODO", "IN_PROGRESS" ou "DONE" (padrão: TODO)' },
        dueDate:        { type: 'STRING', description: 'Data de entrega em ISO-8601 (opcional)' },
        isSprintActive: { type: 'BOOLEAN', description: 'Incluir na Sprint ativa (opcional)' },
      },
      required: ['kanbanId', 'title'],
    },
  },
  {
    name: 'get_task',
    description: 'Obtém os detalhes completos de uma tarefa específica incluindo subtarefas e tags.',
    parameters: {
      type: 'OBJECT',
      properties: {
        taskId: { type: 'STRING', description: 'ID da tarefa' },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'list_tasks',
    description: 'Lista tarefas com filtros opcionais por kanban, projeto, status ou sprint.',
    parameters: {
      type: 'OBJECT',
      properties: {
        kanbanId:       { type: 'STRING', description: 'Filtrar por ID do kanban (opcional)' },
        projectId:      { type: 'STRING', description: 'Filtrar por ID do projeto (opcional)' },
        status:         { type: 'STRING', description: '"TODO", "IN_PROGRESS" ou "DONE" (opcional)' },
        isSprintActive: { type: 'BOOLEAN', description: 'Filtrar pela Sprint ativa (opcional)' },
      },
    },
  },
  {
    name: 'update_task',
    description: 'Atualiza título, descrição, status, data de entrega, kanban ou sprint de uma tarefa.',
    parameters: {
      type: 'OBJECT',
      properties: {
        taskId:         { type: 'STRING', description: 'ID da tarefa' },
        title:          { type: 'STRING', description: 'Novo título (opcional)' },
        description:    { type: 'STRING', description: 'Nova descrição (opcional)' },
        status:         { type: 'STRING', description: '"TODO", "IN_PROGRESS" ou "DONE" (opcional)' },
        kanbanId:       { type: 'STRING', description: 'Mover para outro kanban (opcional)' },
        dueDate:        { type: 'STRING', description: 'Nova data de entrega ISO-8601 (opcional, null para limpar)' },
        isSprintActive: { type: 'BOOLEAN', description: 'Adicionar ou remover da Sprint (opcional)' },
      },
      required: ['taskId'],
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
    name: 'delete_task',
    description: 'Exclui uma tarefa e todas as suas subtarefas em cascata.',
    parameters: {
      type: 'OBJECT',
      properties: {
        taskId: { type: 'STRING', description: 'ID da tarefa a excluir' },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'add_to_sprint',
    description: 'Marca ou desmarca uma tarefa para a Sprint semanal ativa.',
    parameters: {
      type: 'OBJECT',
      properties: {
        taskId:         { type: 'STRING', description: 'ID da tarefa' },
        isSprintActive: { type: 'BOOLEAN', description: 'true para adicionar, false para remover (padrão: true)' },
      },
      required: ['taskId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SUBTAREFAS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'add_subtask',
    description: 'Adiciona um item de checklist (subtarefa) a uma tarefa existente.',
    parameters: {
      type: 'OBJECT',
      properties: {
        taskId: { type: 'STRING', description: 'ID da tarefa pai' },
        title:  { type: 'STRING', description: 'Título da subtarefa' },
      },
      required: ['taskId', 'title'],
    },
  },
  {
    name: 'toggle_subtask',
    description: 'Marca ou desmarca uma subtarefa como concluída.',
    parameters: {
      type: 'OBJECT',
      properties: {
        subtaskId: { type: 'STRING', description: 'ID da subtarefa' },
        isDone:    { type: 'BOOLEAN', description: 'true = concluída, false = pendente. Se omitido, inverte o estado atual.' },
      },
      required: ['subtaskId'],
    },
  },
  {
    name: 'delete_subtask',
    description: 'Exclui uma subtarefa.',
    parameters: {
      type: 'OBJECT',
      properties: {
        subtaskId: { type: 'STRING', description: 'ID da subtarefa a excluir' },
      },
      required: ['subtaskId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MEMBROS DO PROJETO
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'list_members',
    description: 'Lista todos os membros de um projeto.',
    parameters: {
      type: 'OBJECT',
      properties: {
        projectId: { type: 'STRING', description: 'ID do projeto' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'add_member',
    description: 'Adiciona um novo membro a um projeto com nome e papel definidos.',
    parameters: {
      type: 'OBJECT',
      properties: {
        projectId: { type: 'STRING', description: 'ID do projeto' },
        name:      { type: 'STRING', description: 'Nome do membro' },
        role:      { type: 'STRING', description: 'Papel/função no projeto (ex: "Desenvolvedor", "Designer", "Product Owner")' },
        email:     { type: 'STRING', description: 'E-mail do membro (opcional)' },
      },
      required: ['projectId', 'name', 'role'],
    },
  },
  {
    name: 'update_member',
    description: 'Atualiza nome, papel ou e-mail de um membro do projeto.',
    parameters: {
      type: 'OBJECT',
      properties: {
        memberId: { type: 'STRING', description: 'ID do membro' },
        name:     { type: 'STRING', description: 'Novo nome (opcional)' },
        role:     { type: 'STRING', description: 'Novo papel (opcional)' },
        email:    { type: 'STRING', description: 'Novo e-mail (opcional)' },
      },
      required: ['memberId'],
    },
  },
  {
    name: 'remove_member',
    description: 'Remove um membro de um projeto.',
    parameters: {
      type: 'OBJECT',
      properties: {
        memberId: { type: 'STRING', description: 'ID do membro a remover' },
      },
      required: ['memberId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPROMISSOS / AGENDA
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'create_appointment',
    description: 'Cria um novo compromisso no calendário com horário de início e término.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title:          { type: 'STRING', description: 'Título do compromisso' },
        startTime:      { type: 'STRING', description: 'Data/hora de início (ISO-8601, ex: 2026-10-01T14:00:00Z)' },
        endTime:        { type: 'STRING', description: 'Data/hora de término (ISO-8601)' },
        description:    { type: 'STRING', description: 'Descrição detalhada (opcional)' },
        locationOrLink: { type: 'STRING', description: 'Local físico ou link da reunião (opcional)' },
      },
      required: ['title', 'startTime', 'endTime'],
    },
  },
  {
    name: 'list_appointments',
    description: 'Lista compromissos do calendário com filtros opcionais de data e status.',
    parameters: {
      type: 'OBJECT',
      properties: {
        startDate:       { type: 'STRING', description: 'Data de início do filtro (ISO-8601, opcional)' },
        endDate:         { type: 'STRING', description: 'Data de fim do filtro (ISO-8601, opcional)' },
        isCompleted:     { type: 'BOOLEAN', description: 'Filtrar por status de conclusão (opcional)' },
      },
    },
  },
  {
    name: 'update_appointment',
    description: 'Atualiza título, datas, descrição, local ou status de conclusão de um compromisso.',
    parameters: {
      type: 'OBJECT',
      properties: {
        appointmentId:  { type: 'STRING', description: 'ID do compromisso' },
        title:          { type: 'STRING', description: 'Novo título (opcional)' },
        startTime:      { type: 'STRING', description: 'Novo horário de início ISO-8601 (opcional)' },
        endTime:        { type: 'STRING', description: 'Novo horário de término ISO-8601 (opcional)' },
        description:    { type: 'STRING', description: 'Nova descrição (opcional)' },
        locationOrLink: { type: 'STRING', description: 'Novo local ou link (opcional)' },
        isCompleted:    { type: 'BOOLEAN', description: 'Marcar como concluído (opcional)' },
      },
      required: ['appointmentId'],
    },
  },
  {
    name: 'delete_appointment',
    description: 'Exclui um compromisso do calendário.',
    parameters: {
      type: 'OBJECT',
      properties: {
        appointmentId: { type: 'STRING', description: 'ID do compromisso a excluir' },
      },
      required: ['appointmentId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CALENDÁRIO & PRAZOS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'list_calendar_events',
    description: 'Lista todos os eventos do calendário unificado (compromissos + prazos de tarefas) em um período.',
    parameters: {
      type: 'OBJECT',
      properties: {
        startDate:        { type: 'STRING', description: 'Data de início do filtro (ISO-8601, opcional)' },
        endDate:          { type: 'STRING', description: 'Data de fim do filtro (ISO-8601, opcional)' },
        projectId:        { type: 'STRING', description: 'Filtrar por projeto (opcional)' },
        includeCompleted: { type: 'BOOLEAN', description: 'Incluir eventos concluídos (padrão: false)' },
      },
    },
  },
  {
    name: 'list_upcoming_deadlines',
    description: 'Consulta prazos, entregas e compromissos próximos (padrão: 7 dias).',
    parameters: {
      type: 'OBJECT',
      properties: {
        days:             { type: 'NUMBER', description: 'Janela de dias à frente para busca (padrão: 7)' },
        projectId:        { type: 'STRING', description: 'Filtrar por projeto (opcional)' },
        includeCompleted: { type: 'BOOLEAN', description: 'Incluir itens concluídos (padrão: false)' },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DIÁRIO DE BORDO (UPDATE LOGS)
  // ═══════════════════════════════════════════════════════════════════════════
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
  {
    name: 'delete_update_log',
    description: 'Exclui uma entrada do diário de bordo.',
    parameters: {
      type: 'OBJECT',
      properties: {
        logId: { type: 'STRING', description: 'ID do log de atualização a excluir' },
      },
      required: ['logId'],
    },
  },
];

// ---- Tool implementations --------------------------------------------------
const toolImplementations: Record<string, (args: any) => Promise<any>> = {
  // ─── PROJETOS ──────────────────────────────────────────────────────────────
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
  update_project: async (args) => {
    logInfo('TOOL', 'Executing update_project', args);
    const { projectId, ...data } = args;
    return projectService.updateProject(projectId, data);
  },
  delete_project: async (args) => {
    logInfo('TOOL', 'Executing delete_project', { projectId: args.projectId });
    return projectService.deleteProject(args.projectId);
  },
  update_business_logic: async (args) => {
    logInfo('TOOL', 'Executing update_business_logic', args);
    return projectService.updateBusinessLogic(args.projectId, args.businessLogic);
  },
  update_project_settings: async (args) => {
    logInfo('TOOL', 'Executing update_project_settings', args);
    const settings = args.settings ? (typeof args.settings === 'string' ? JSON.parse(args.settings) : args.settings) : undefined;
    return projectService.updateProjectSettings(args.projectId, {
      githubRepo: args.githubRepo,
      settings,
      businessLogic: args.businessLogic,
    });
  },

  // ─── KANBAN ────────────────────────────────────────────────────────────────
  create_kanban: async (args) => {
    logInfo('TOOL', 'Executing create_kanban', args);
    return kanbanService.createKanban({ projectId: args.projectId, title: args.title });
  },
  update_kanban: async (args) => {
    logInfo('TOOL', 'Executing update_kanban', args);
    return kanbanService.updateKanban(args.kanbanId, { title: args.title });
  },
  delete_kanban: async (args) => {
    logInfo('TOOL', 'Executing delete_kanban', { kanbanId: args.kanbanId });
    return kanbanService.deleteKanban(args.kanbanId);
  },

  // ─── COLUNAS DO KANBAN ─────────────────────────────────────────────────────
  add_kanban_column: async (args) => {
    logInfo('TOOL', 'Executing add_kanban_column', args);
    return kanbanCustomizationService.addColumn(args.kanbanId, args.title, args.order);
  },
  update_kanban_column: async (args) => {
    logInfo('TOOL', 'Executing update_kanban_column', args);
    return kanbanCustomizationService.updateColumn(args.columnId, args.title, args.order);
  },
  remove_kanban_column: async (args) => {
    logInfo('TOOL', 'Executing remove_kanban_column', { columnId: args.columnId });
    return kanbanCustomizationService.removeColumn(args.columnId);
  },

  // ─── TAGS DO KANBAN ────────────────────────────────────────────────────────
  add_kanban_tag: async (args) => {
    logInfo('TOOL', 'Executing add_kanban_tag', args);
    return kanbanCustomizationService.addTag(args.kanbanId, args.name);
  },
  update_kanban_tag: async (args) => {
    logInfo('TOOL', 'Executing update_kanban_tag', args);
    return kanbanCustomizationService.updateTag(args.tagId, args.name);
  },
  remove_kanban_tag: async (args) => {
    logInfo('TOOL', 'Executing remove_kanban_tag', { tagId: args.tagId });
    return kanbanCustomizationService.removeTag(args.tagId);
  },

  // ─── NOTAS ─────────────────────────────────────────────────────────────────
  create_note: async (args) => {
    logInfo('TOOL', 'Executing create_note', args);
    return noteService.createNote(args.projectId, args.title, args.content || '');
  },
  read_note: async (args) => {
    logInfo('TOOL', 'Executing read_note', { noteId: args.noteId });
    return noteService.getNoteById(args.noteId);
  },
  update_note: async (args) => {
    logInfo('TOOL', 'Executing update_note', args);
    const updateData: { title?: string; content?: string } = {};
    if (args.title) updateData.title = args.title;
    if (args.content !== undefined) updateData.content = args.content;
    return noteService.updateNote(args.noteId, updateData);
  },
  delete_note: async (args) => {
    logInfo('TOOL', 'Executing delete_note', { noteId: args.noteId });
    return noteService.deleteNote(args.noteId);
  },

  // ─── TAREFAS ───────────────────────────────────────────────────────────────
  create_task: async (args) => {
    logInfo('TOOL', 'Executing create_task', args);
    return taskService.createTask(args);
  },
  get_task: async (args) => {
    logInfo('TOOL', 'Executing get_task', { taskId: args.taskId });
    return taskService.getTaskById(args.taskId);
  },
  list_tasks: async (args) => {
    logInfo('TOOL', 'Executing list_tasks', args);
    const filters: any = {};
    if (args?.kanbanId) filters.kanbanId = args.kanbanId;
    if (args?.projectId) filters.projectId = args.projectId;
    if (args?.status) filters.status = args.status;
    if (args?.isSprintActive !== undefined) filters.isSprintActive = args.isSprintActive;
    return taskService.listTasks(filters);
  },
  update_task: async (args) => {
    logInfo('TOOL', 'Executing update_task', args);
    const { taskId, ...data } = args;
    return taskService.updateTask(taskId, data);
  },
  move_task: async (args) => {
    logInfo('TOOL', 'Executing move_task', args);
    return taskService.updateTask(args.taskId, { status: args.status, kanbanId: args.kanbanId });
  },
  delete_task: async (args) => {
    logInfo('TOOL', 'Executing delete_task', { taskId: args.taskId });
    return taskService.deleteTask(args.taskId);
  },
  add_to_sprint: async (args) => {
    logInfo('TOOL', 'Executing add_to_sprint', args);
    const isSprintActive = args.isSprintActive !== undefined ? Boolean(args.isSprintActive) : true;
    return taskService.updateTask(args.taskId, { isSprintActive });
  },

  // ─── SUBTAREFAS ────────────────────────────────────────────────────────────
  add_subtask: async (args) => {
    logInfo('TOOL', 'Executing add_subtask', args);
    return subtaskService.createSubtask(args.taskId, args.title);
  },
  toggle_subtask: async (args) => {
    logInfo('TOOL', 'Executing toggle_subtask', args);
    const isDone = typeof args.isDone === 'boolean' ? args.isDone : undefined;
    return subtaskService.toggleSubtask(args.subtaskId, isDone);
  },
  delete_subtask: async (args) => {
    logInfo('TOOL', 'Executing delete_subtask', { subtaskId: args.subtaskId });
    return subtaskService.deleteSubtask(args.subtaskId);
  },

  // ─── MEMBROS ───────────────────────────────────────────────────────────────
  list_members: async (args) => {
    logInfo('TOOL', 'Executing list_members', { projectId: args.projectId });
    return memberService.listMembersByProject(args.projectId);
  },
  add_member: async (args) => {
    logInfo('TOOL', 'Executing add_member', args);
    return memberService.createMember({
      projectId: args.projectId,
      name: args.name,
      role: args.role,
      email: args.email || null,
    });
  },
  update_member: async (args) => {
    logInfo('TOOL', 'Executing update_member', args);
    const { memberId, ...data } = args;
    return memberService.updateMember(memberId, data);
  },
  remove_member: async (args) => {
    logInfo('TOOL', 'Executing remove_member', { memberId: args.memberId });
    return memberService.deleteMember(args.memberId);
  },

  // ─── COMPROMISSOS / AGENDA ─────────────────────────────────────────────────
  create_appointment: async (args) => {
    logInfo('TOOL', 'Executing create_appointment', args);
    return appointmentService.createAppointment({
      title: args.title,
      startTime: args.startTime,
      endTime: args.endTime,
      description: args.description || null,
      locationOrLink: args.locationOrLink || null,
    });
  },
  list_appointments: async (args) => {
    logInfo('TOOL', 'Executing list_appointments', args);
    return appointmentService.listAppointments({
      startDate: args?.startDate,
      endDate: args?.endDate,
      isCompleted: args?.isCompleted,
    });
  },
  update_appointment: async (args) => {
    logInfo('TOOL', 'Executing update_appointment', args);
    const { appointmentId, ...data } = args;
    return appointmentService.updateAppointment(appointmentId, data);
  },
  delete_appointment: async (args) => {
    logInfo('TOOL', 'Executing delete_appointment', { appointmentId: args.appointmentId });
    return appointmentService.deleteAppointment(args.appointmentId);
  },

  // ─── CALENDÁRIO & PRAZOS ──────────────────────────────────────────────────
  list_calendar_events: async (args) => {
    logInfo('TOOL', 'Executing list_calendar_events', args);
    return calendarService.getCalendarEvents({
      startDate: args?.startDate,
      endDate: args?.endDate,
      projectId: args?.projectId,
      includeCompleted: args?.includeCompleted,
    });
  },
  list_upcoming_deadlines: async (args) => {
    logInfo('TOOL', 'Executing list_upcoming_deadlines', args);
    const days = typeof args?.days === 'number' && args.days > 0 ? args.days : 7;
    const projectId = args?.projectId || undefined;
    const includeCompleted = Boolean(args?.includeCompleted);
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const [tasks, appointments] = await Promise.all([
      prisma.task.findMany({
        where: {
          dueDate: { gte: now, lte: futureDate },
          ...(includeCompleted ? {} : { status: { not: 'DONE' } }),
          ...(projectId ? { kanban: { projectId } } : {}),
        },
        include: { kanban: { include: { project: true } } },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.appointment.findMany({
        where: {
          startTime: { gte: now, lte: futureDate },
          ...(includeCompleted ? {} : { isCompleted: false }),
        },
        orderBy: { startTime: 'asc' },
      }),
    ]);

    return {
      queryWindow: { days, from: now.toISOString(), to: futureDate.toISOString() },
      totalUpcoming: tasks.length + appointments.length,
      deadlines: tasks.map((t) => ({
        id: t.id, title: t.title, dueDate: t.dueDate?.toISOString(),
        status: t.status, project: t.kanban.project.title, kanban: t.kanban.title,
      })),
      appointments: appointments.map((a) => ({
        id: a.id, title: a.title, startTime: a.startTime.toISOString(),
        endTime: a.endTime.toISOString(), locationOrLink: a.locationOrLink, isCompleted: a.isCompleted,
      })),
    };
  },

  // ─── DIÁRIO DE BORDO ──────────────────────────────────────────────────────
  log_project_update: async (args) => {
    logInfo('TOOL', 'Executing log_project_update', args);
    return updateLogService.createLog({ ...args, author: 'AI Assistant' });
  },
  delete_update_log: async (args) => {
    logInfo('TOOL', 'Executing delete_update_log', { logId: args.logId });
    return updateLogService.deleteLog(args.logId);
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
    // keeping processMessage just in case, but we will use processMessageStream
    // Actually, I can just replace processMessage or keep both. Let's keep it as is and add processMessageStream below.
  },

  async processMessageStream(conversationId: string, userContent: string, res: any) {
    logInfo('MSG', `Processing stream message for conversation ${conversationId}`, { contentPreview: userContent.slice(0, 80) });

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    // Ensure the client receives the headers immediately
    res.flushHeaders?.();

    const sendEvent = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      (res as any).flush?.();
    };

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
          sendEvent('title', newTitle);
        })
        .catch(e => logError('TITLE', 'Failed to generate title', e));
    }

    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const systemInstruction =
      'Você é um assistente IA integrado ao sistema BrainBoard com CONTROLE TOTAL sobre o sistema. ' +
      'Você pode gerenciar TUDO: projetos (criar, editar, excluir, configurar), quadros Kanban (criar, editar, excluir, ' +
      'adicionar/editar/remover colunas e tags), tarefas (criar, editar, mover, excluir, adicionar à sprint), ' +
      'subtarefas (criar, alternar status, excluir), notas (criar, ler, editar, excluir), membros do projeto ' +
      '(adicionar, editar, remover), compromissos (criar, editar, excluir), consultar calendário e prazos, ' +
      'e manter o diário de bordo (logs de atualização). ' +
      'Sempre use as ferramentas disponíveis para executar ações no sistema. ' +
      'Responda sempre em português. Use markdown para formatar respostas.';

    const runStream = async (contentsToRun: any[]) => {
       let error;
       for (const model of MODEL_PRIORITY) {
          try {
             logInfo('GEMINI', `Trying stream model: ${model}`);
             const stream = await ai.models.generateContentStream({
                model,
                contents: contentsToRun,
                config: {
                   systemInstruction,
                   tools: [{ functionDeclarations: toolDefinitions as any }],
                }
             });
             return stream;
          } catch(e) {
             error = e;
             logError('GEMINI', `Model ${model} stream failed`, e);
          }
       }
       throw error;
    };

    try {
       let currentContents = [...contents];
       let finalResponseText = '';
       let done = false;

       while (!done) {
          let stream = await runStream(currentContents);
          let functionCallObj: any = null;
          let thoughtSignature: string | undefined;
          let turnText = '';

          for await (const chunk of stream) {
             if (chunk.candidates?.[0]?.content?.parts) {
                for (const p of chunk.candidates[0].content.parts) {
                   if (p.thoughtSignature) {
                      thoughtSignature = p.thoughtSignature;
                   }
                }
             }
             if (chunk.functionCalls && chunk.functionCalls.length > 0) {
                functionCallObj = chunk.functionCalls[0];
             }
             if (chunk.text) {
                turnText += chunk.text;
                finalResponseText += chunk.text;
                sendEvent('chunk', chunk.text);
             }
          }

          if (functionCallObj) {
             logInfo('FUNC_CALL', `Function called: ${functionCallObj.name}`);
             
             const fn = toolImplementations[functionCallObj.name];
             let functionResult: any;
             if (fn) {
                try {
                   functionResult = await fn(functionCallObj.args);
                } catch (e: any) {
                   functionResult = { error: e.message };
                }
             } else {
                functionResult = { error: `Função desconhecida: ${functionCallObj.name}` };
             }

             const assembledParts: any[] = [];
             if (turnText) assembledParts.push({ text: turnText });
             
             const fCallPart: any = { functionCall: functionCallObj };
             if (thoughtSignature) fCallPart.thoughtSignature = thoughtSignature;
             assembledParts.push(fCallPart);

             currentContents = [
                ...currentContents,
                { role: 'model', parts: assembledParts },
                { role: 'user', parts: [{ functionResponse: { name: functionCallObj.name, response: { result: functionResult }, id: functionCallObj.id } }] },
             ];
             // The loop will continue to process the next step
          } else {
             done = true;
          }
       }

       const responseText = finalResponseText || 'Operação concluída.';
       const savedMessage = await prisma.chatMessage.create({
          data: { role: 'assistant', content: responseText, conversationId }
       });

       sendEvent('done', savedMessage);
       res.end();

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

       const savedMessage = await prisma.chatMessage.create({
         data: { role: 'assistant', content: userMessage, conversationId },
       });

       sendEvent('done', savedMessage);
       res.end();
    }
  },
};
