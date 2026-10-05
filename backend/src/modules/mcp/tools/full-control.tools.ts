import { projectService } from '../../projects/services/project.service.js';
import { kanbanService } from '../../projects/services/kanban.service.js';
import { kanbanCustomizationService } from '../../projects/services/kanban-customization.service.js';
import { noteService } from '../../projects/services/note.service.js';
import { memberService } from '../../projects/services/member.service.js';
import { appointmentService } from '../../calendar/appointment.service.js';
import { calendarService } from '../../calendar/calendar.service.js';
import { updateLogService } from '../../projects/services/update-log.service.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const fullControlToolSchemas: Tool[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // PROJETOS - operações faltantes
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'update_project',
    description: 'Atualiza título, descrição, status, tipo, repositório GitHub ou configurações de um projeto.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId:     { type: 'string', description: 'ID do projeto.' },
        title:         { type: 'string', description: 'Novo título (opcional).' },
        description:   { type: 'string', description: 'Nova descrição (opcional).' },
        status:        { type: 'string', enum: ['PLANNING', 'ACTIVE', 'COMPLETED'], description: 'Novo status.' },
        githubRepo:    { type: 'string', description: 'URL do repositório GitHub (opcional).' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'delete_project',
    description: 'Exclui permanentemente um projeto e TODOS os seus dados (kanbans, tarefas, notas, membros, logs).',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto a ser excluído.' },
      },
      required: ['projectId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // KANBAN - operações faltantes
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'update_kanban',
    description: 'Atualiza o título de um quadro Kanban existente.',
    inputSchema: {
      type: 'object',
      properties: {
        kanbanId: { type: 'string', description: 'ID do kanban.' },
        title:    { type: 'string', description: 'Novo título do kanban.' },
      },
      required: ['kanbanId', 'title'],
    },
  },
  {
    name: 'delete_kanban',
    description: 'Exclui um quadro Kanban e todas as suas tarefas, colunas e tags.',
    inputSchema: {
      type: 'object',
      properties: {
        kanbanId: { type: 'string', description: 'ID do kanban a excluir.' },
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
    inputSchema: {
      type: 'object',
      properties: {
        kanbanId: { type: 'string', description: 'ID do kanban.' },
        title:    { type: 'string', description: 'Título da coluna (ex: "Em Review", "Bloqueado").' },
        order:    { type: 'number', description: 'Posição/ordem da coluna (opcional, padrão: 0).' },
      },
      required: ['kanbanId', 'title'],
    },
  },
  {
    name: 'update_kanban_column',
    description: 'Atualiza o título ou a ordem de uma coluna do Kanban.',
    inputSchema: {
      type: 'object',
      properties: {
        columnId: { type: 'string', description: 'ID da coluna.' },
        title:    { type: 'string', description: 'Novo título da coluna (opcional).' },
        order:    { type: 'number', description: 'Nova posição/ordem (opcional).' },
      },
      required: ['columnId'],
    },
  },
  {
    name: 'remove_kanban_column',
    description: 'Remove uma coluna do Kanban.',
    inputSchema: {
      type: 'object',
      properties: {
        columnId: { type: 'string', description: 'ID da coluna a remover.' },
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
    inputSchema: {
      type: 'object',
      properties: {
        kanbanId: { type: 'string', description: 'ID do kanban.' },
        name:     { type: 'string', description: 'Nome da tag (ex: "Urgente", "Bug", "Feature").' },
        color:    { type: 'string', description: 'Cor em hexadecimal (ex: "#ef4444"). Padrão: "#3b82f6".' },
      },
      required: ['kanbanId', 'name'],
    },
  },
  {
    name: 'update_kanban_tag',
    description: 'Atualiza o nome ou cor de uma tag do Kanban.',
    inputSchema: {
      type: 'object',
      properties: {
        tagId: { type: 'string', description: 'ID da tag.' },
        name:  { type: 'string', description: 'Novo nome da tag (opcional).' },
        color: { type: 'string', description: 'Nova cor em hexadecimal (opcional).' },
      },
      required: ['tagId'],
    },
  },
  {
    name: 'remove_kanban_tag',
    description: 'Remove uma tag do Kanban.',
    inputSchema: {
      type: 'object',
      properties: {
        tagId: { type: 'string', description: 'ID da tag a remover.' },
      },
      required: ['tagId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTAS - operações faltantes
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'delete_note',
    description: 'Exclui uma nota permanentemente.',
    inputSchema: {
      type: 'object',
      properties: {
        noteId: { type: 'string', description: 'ID da nota a excluir.' },
      },
      required: ['noteId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MEMBROS DO PROJETO
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'list_members',
    description: 'Lista todos os membros de um projeto.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto.' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'add_member',
    description: 'Adiciona um novo membro a um projeto com nome e papel definidos.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto.' },
        name:      { type: 'string', description: 'Nome do membro.' },
        role:      { type: 'string', description: 'Papel/função no projeto (ex: "Desenvolvedor", "Designer").' },
        email:     { type: 'string', description: 'E-mail do membro (opcional).' },
      },
      required: ['projectId', 'name', 'role'],
    },
  },
  {
    name: 'update_member',
    description: 'Atualiza nome, papel ou e-mail de um membro do projeto.',
    inputSchema: {
      type: 'object',
      properties: {
        memberId: { type: 'string', description: 'ID do membro.' },
        name:     { type: 'string', description: 'Novo nome (opcional).' },
        role:     { type: 'string', description: 'Novo papel (opcional).' },
        email:    { type: 'string', description: 'Novo e-mail (opcional).' },
      },
      required: ['memberId'],
    },
  },
  {
    name: 'remove_member',
    description: 'Remove um membro de um projeto.',
    inputSchema: {
      type: 'object',
      properties: {
        memberId: { type: 'string', description: 'ID do membro a remover.' },
      },
      required: ['memberId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPROMISSOS / AGENDA - operações faltantes
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'list_appointments',
    description: 'Lista compromissos do calendário com filtros opcionais de data e status.',
    inputSchema: {
      type: 'object',
      properties: {
        startDate:   { type: 'string', description: 'Data de início do filtro (ISO-8601, opcional).' },
        endDate:     { type: 'string', description: 'Data de fim do filtro (ISO-8601, opcional).' },
        isCompleted: { type: 'boolean', description: 'Filtrar por status de conclusão (opcional).' },
      },
    },
  },
  {
    name: 'update_appointment',
    description: 'Atualiza título, datas, descrição, local ou status de conclusão de um compromisso.',
    inputSchema: {
      type: 'object',
      properties: {
        appointmentId:  { type: 'string', description: 'ID do compromisso.' },
        title:          { type: 'string', description: 'Novo título (opcional).' },
        startTime:      { type: 'string', description: 'Novo horário de início ISO-8601 (opcional).' },
        endTime:        { type: 'string', description: 'Novo horário de término ISO-8601 (opcional).' },
        description:    { type: 'string', description: 'Nova descrição (opcional).' },
        locationOrLink: { type: 'string', description: 'Novo local ou link (opcional).' },
        isCompleted:    { type: 'boolean', description: 'Marcar como concluído (opcional).' },
      },
      required: ['appointmentId'],
    },
  },
  {
    name: 'delete_appointment',
    description: 'Exclui um compromisso do calendário.',
    inputSchema: {
      type: 'object',
      properties: {
        appointmentId: { type: 'string', description: 'ID do compromisso a excluir.' },
      },
      required: ['appointmentId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CALENDÁRIO UNIFICADO
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'list_calendar_events',
    description: 'Lista todos os eventos do calendário unificado (compromissos + prazos de tarefas) em um período.',
    inputSchema: {
      type: 'object',
      properties: {
        startDate:        { type: 'string', description: 'Data de início do filtro (ISO-8601, opcional).' },
        endDate:          { type: 'string', description: 'Data de fim do filtro (ISO-8601, opcional).' },
        projectId:        { type: 'string', description: 'Filtrar por projeto (opcional).' },
        includeCompleted: { type: 'boolean', description: 'Incluir eventos concluídos (padrão: false).' },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DIÁRIO DE BORDO - operação faltante
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'delete_update_log',
    description: 'Exclui uma entrada do diário de bordo.',
    inputSchema: {
      type: 'object',
      properties: {
        logId: { type: 'string', description: 'ID do log de atualização a excluir.' },
      },
      required: ['logId'],
    },
  },
];

export async function handleFullControlTools(name: string, args: any) {
  // ─── PROJETOS ──────────────────────────────────────────────────────────────
  if (name === 'update_project') {
    const projectId = String(args?.projectId ?? '').trim();
    if (!projectId) throw new Error('projectId é obrigatório');
    const { projectId: _, ...data } = args;
    const project = await projectService.updateProject(projectId, data);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ success: true, message: `Projeto ${projectId} atualizado com sucesso.`, id: project.id, project }, null, 2) }],
    };
  }

  if (name === 'delete_project') {
    const projectId = String(args?.projectId ?? '').trim();
    if (!projectId) throw new Error('projectId é obrigatório');
    await projectService.deleteProject(projectId);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ success: true, message: `Projeto ${projectId} excluído com sucesso.`, id: projectId }, null, 2) }],
    };
  }

  // ─── KANBAN ────────────────────────────────────────────────────────────────
  if (name === 'update_kanban') {
    const kanbanId = String(args?.kanbanId ?? '').trim();
    const title = String(args?.title ?? '').trim();
    if (!kanbanId || !title) throw new Error('kanbanId e title são obrigatórios');
    const kanban = await kanbanService.updateKanban(kanbanId, { title });
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ success: true, message: `Kanban ${kanbanId} atualizado.`, id: kanban.id, kanban }, null, 2) }],
    };
  }

  if (name === 'delete_kanban') {
    const kanbanId = String(args?.kanbanId ?? '').trim();
    if (!kanbanId) throw new Error('kanbanId é obrigatório');
    await kanbanService.deleteKanban(kanbanId);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ success: true, message: `Kanban ${kanbanId} excluído com sucesso.`, id: kanbanId }, null, 2) }],
    };
  }

  // ─── COLUNAS DO KANBAN ─────────────────────────────────────────────────────
  if (name === 'add_kanban_column') {
    const kanbanId = String(args?.kanbanId ?? '').trim();
    const title = String(args?.title ?? '').trim();
    if (!kanbanId || !title) throw new Error('kanbanId e title são obrigatórios');
    const column = await kanbanCustomizationService.addColumn(kanbanId, title, args?.order);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ success: true, message: `Coluna '${title}' adicionada.`, id: column.id, column }, null, 2) }],
    };
  }

  if (name === 'update_kanban_column') {
    const columnId = String(args?.columnId ?? '').trim();
    if (!columnId) throw new Error('columnId é obrigatório');
    const column = await kanbanCustomizationService.updateColumn(columnId, args?.title, args?.order);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ success: true, message: `Coluna ${columnId} atualizada.`, id: column.id, column }, null, 2) }],
    };
  }

  if (name === 'remove_kanban_column') {
    const columnId = String(args?.columnId ?? '').trim();
    if (!columnId) throw new Error('columnId é obrigatório');
    await kanbanCustomizationService.removeColumn(columnId);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ success: true, message: `Coluna ${columnId} removida.`, id: columnId }, null, 2) }],
    };
  }

  // ─── TAGS DO KANBAN ────────────────────────────────────────────────────────
  if (name === 'add_kanban_tag') {
    const kanbanId = String(args?.kanbanId ?? '').trim();
    const tagName = String(args?.name ?? '').trim();
    if (!kanbanId || !tagName) throw new Error('kanbanId e name são obrigatórios');
    const tag = await kanbanCustomizationService.addTag(kanbanId, tagName);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ success: true, message: `Tag '${tagName}' adicionada.`, id: tag.id, tag }, null, 2) }],
    };
  }

  if (name === 'update_kanban_tag') {
    const tagId = String(args?.tagId ?? '').trim();
    if (!tagId) throw new Error('tagId é obrigatório');
    const tag = await kanbanCustomizationService.updateTag(tagId, args?.name);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ success: true, message: `Tag ${tagId} atualizada.`, id: tag.id, tag }, null, 2) }],
    };
  }

  if (name === 'remove_kanban_tag') {
    const tagId = String(args?.tagId ?? '').trim();
    if (!tagId) throw new Error('tagId é obrigatório');
    await kanbanCustomizationService.removeTag(tagId);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ success: true, message: `Tag ${tagId} removida.`, id: tagId }, null, 2) }],
    };
  }

  // ─── NOTAS ─────────────────────────────────────────────────────────────────
  if (name === 'delete_note') {
    const noteId = String(args?.noteId ?? '').trim();
    if (!noteId) throw new Error('noteId é obrigatório');
    await noteService.deleteNote(noteId);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ success: true, message: `Nota ${noteId} excluída com sucesso.`, id: noteId }, null, 2) }],
    };
  }

  // ─── MEMBROS ───────────────────────────────────────────────────────────────
  if (name === 'list_members') {
    const projectId = String(args?.projectId ?? '').trim();
    if (!projectId) throw new Error('projectId é obrigatório');
    const members = await memberService.listMembersByProject(projectId);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(members, null, 2) }],
    };
  }

  if (name === 'add_member') {
    const projectId = String(args?.projectId ?? '').trim();
    const memberName = String(args?.name ?? '').trim();
    const role = String(args?.role ?? '').trim();
    if (!projectId || !memberName || !role) throw new Error('projectId, name e role são obrigatórios');
    const member = await memberService.createMember({
      projectId,
      name: memberName,
      role,
      email: args?.email ? String(args.email).trim() : null,
    });
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ success: true, message: `Membro '${memberName}' adicionado.`, id: member.id, member }, null, 2) }],
    };
  }

  if (name === 'update_member') {
    const memberId = String(args?.memberId ?? '').trim();
    if (!memberId) throw new Error('memberId é obrigatório');
    const data: any = {};
    if (args?.name) data.name = String(args.name).trim();
    if (args?.role) data.role = String(args.role).trim();
    if (args?.email !== undefined) data.email = args.email === null ? null : String(args.email).trim();
    const member = await memberService.updateMember(memberId, data);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ success: true, message: `Membro ${memberId} atualizado.`, id: member.id, member }, null, 2) }],
    };
  }

  if (name === 'remove_member') {
    const memberId = String(args?.memberId ?? '').trim();
    if (!memberId) throw new Error('memberId é obrigatório');
    await memberService.deleteMember(memberId);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ success: true, message: `Membro ${memberId} removido.`, id: memberId }, null, 2) }],
    };
  }

  // ─── COMPROMISSOS ──────────────────────────────────────────────────────────
  if (name === 'list_appointments') {
    const appointments = await appointmentService.listAppointments({
      startDate: args?.startDate,
      endDate: args?.endDate,
      isCompleted: args?.isCompleted,
    });
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(appointments, null, 2) }],
    };
  }

  if (name === 'update_appointment') {
    const appointmentId = String(args?.appointmentId ?? '').trim();
    if (!appointmentId) throw new Error('appointmentId é obrigatório');
    const { appointmentId: _, ...data } = args;
    const appointment = await appointmentService.updateAppointment(appointmentId, data);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ success: true, message: `Compromisso ${appointmentId} atualizado.`, id: appointment.id, appointment }, null, 2) }],
    };
  }

  if (name === 'delete_appointment') {
    const appointmentId = String(args?.appointmentId ?? '').trim();
    if (!appointmentId) throw new Error('appointmentId é obrigatório');
    await appointmentService.deleteAppointment(appointmentId);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ success: true, message: `Compromisso ${appointmentId} excluído.`, id: appointmentId }, null, 2) }],
    };
  }

  // ─── CALENDÁRIO ────────────────────────────────────────────────────────────
  if (name === 'list_calendar_events') {
    const events = await calendarService.getCalendarEvents({
      startDate: args?.startDate,
      endDate: args?.endDate,
      projectId: args?.projectId,
      includeCompleted: args?.includeCompleted,
    });
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(events, null, 2) }],
    };
  }

  // ─── DIÁRIO DE BORDO ──────────────────────────────────────────────────────
  if (name === 'delete_update_log') {
    const logId = String(args?.logId ?? '').trim();
    if (!logId) throw new Error('logId é obrigatório');
    await updateLogService.deleteLog(logId);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ success: true, message: `Log ${logId} excluído.`, id: logId }, null, 2) }],
    };
  }

  return null;
}
