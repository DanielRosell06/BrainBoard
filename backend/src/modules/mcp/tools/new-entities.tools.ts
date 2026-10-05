import { whiteboardService } from '../../projects/services/whiteboard.service.js';
import { checklistService } from '../../projects/services/checklist.service.js';
import { bookmarkService } from '../../projects/services/bookmark.service.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const newEntitiesToolSchemas: Tool[] = [
  {
    name: 'create_whiteboard',
    description: 'Cria um novo whiteboard.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto.' },
        title: { type: 'string', description: 'Título do whiteboard.' },
        data: { type: 'object', description: 'Dados JSON iniciais do canvas (opcional).' },
      },
      required: ['projectId', 'title'],
    },
  },
  {
    name: 'update_whiteboard',
    description: 'Atualiza um whiteboard existente.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID do whiteboard.' },
        title: { type: 'string', description: 'Novo título (opcional).' },
        data: { type: 'object', description: 'Novos dados JSON do canvas (opcional).' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_whiteboard',
    description: 'Exclui um whiteboard.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID do whiteboard a ser excluído.' },
      },
      required: ['id'],
    },
  },
  {
    name: 'create_checklist',
    description: 'Cria uma nova checklist.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto.' },
        title: { type: 'string', description: 'Título da checklist.' },
      },
      required: ['projectId', 'title'],
    },
  },
  {
    name: 'add_checklist_item',
    description: 'Adiciona um item a uma checklist.',
    inputSchema: {
      type: 'object',
      properties: {
        checklistId: { type: 'string', description: 'ID da checklist.' },
        text: { type: 'string', description: 'Texto do item.' },
      },
      required: ['checklistId', 'text'],
    },
  },
  {
    name: 'toggle_checklist_item',
    description: 'Alterna o status de concluído (isDone) de um item de checklist.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID do item da checklist.' },
        isDone: { type: 'boolean', description: 'Novo status (opcional, inverte se não informado).' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_checklist',
    description: 'Exclui uma checklist inteira e todos os seus itens.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID da checklist a ser excluída.' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_checklist_item',
    description: 'Exclui um item específico de uma checklist.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID do item da checklist a ser excluído.' },
      },
      required: ['id'],
    },
  },
  {
    name: 'create_bookmark',
    description: 'Cria um novo bookmark (favorito/link).',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto.' },
        title: { type: 'string', description: 'Título do bookmark.' },
        url: { type: 'string', description: 'URL do bookmark.' },
        description: { type: 'string', description: 'Descrição opcional.' },
        group: { type: 'string', description: 'Grupo opcional para categorizar.' },
        icon: { type: 'string', description: 'Ícone opcional.' },
      },
      required: ['projectId', 'title', 'url'],
    },
  },
  {
    name: 'list_bookmarks',
    description: 'Lista todos os bookmarks de um projeto.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto.' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'update_bookmark',
    description: 'Atualiza um bookmark existente.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID do bookmark.' },
        title: { type: 'string', description: 'Novo título (opcional).' },
        url: { type: 'string', description: 'Nova URL (opcional).' },
        description: { type: 'string', description: 'Nova descrição (opcional).' },
        group: { type: 'string', description: 'Novo grupo (opcional).' },
        icon: { type: 'string', description: 'Novo ícone (opcional).' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_bookmark',
    description: 'Exclui um bookmark.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID do bookmark a ser excluído.' },
      },
      required: ['id'],
    },
  },
];

export async function handleNewEntitiesTools(name: string, args: any) {
  if (name === 'create_whiteboard') {
    const { projectId, title, data } = args;
    const whiteboard = await whiteboardService.createWhiteboard(projectId, title, data);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ success: true, message: 'Whiteboard criado', whiteboard }, null, 2) }],
    };
  }

  if (name === 'update_whiteboard') {
    const { id, title, data } = args;
    const whiteboard = await whiteboardService.updateWhiteboard(id, { title, data });
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ success: true, message: 'Whiteboard atualizado', whiteboard }, null, 2) }],
    };
  }

  if (name === 'delete_whiteboard') {
    const { id } = args;
    await whiteboardService.deleteWhiteboard(id);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ success: true, message: 'Whiteboard excluído' }, null, 2) }],
    };
  }

  if (name === 'create_checklist') {
    const { projectId, title } = args;
    const checklist = await checklistService.createChecklist(projectId, title);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ success: true, message: 'Checklist criada', checklist }, null, 2) }],
    };
  }

  if (name === 'add_checklist_item') {
    const { checklistId, text } = args;
    const item = await checklistService.addItem(checklistId, text);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ success: true, message: 'Item adicionado à checklist', item }, null, 2) }],
    };
  }

  if (name === 'toggle_checklist_item') {
    const { id, isDone } = args;
    const item = await checklistService.toggleItem(id, isDone);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ success: true, message: 'Item atualizado', item }, null, 2) }],
    };
  }

  if (name === 'delete_checklist') {
    const { id } = args;
    await checklistService.deleteChecklist(id);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ success: true, message: 'Checklist excluída' }, null, 2) }],
    };
  }

  if (name === 'delete_checklist_item') {
    const { id } = args;
    await checklistService.deleteItem(id);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ success: true, message: 'Item de checklist excluído' }, null, 2) }],
    };
  }

  if (name === 'create_bookmark') {
    const { projectId, title, url, description, group } = args;
    const bookmark = await bookmarkService.createBookmark(projectId, { title, url, description, group });
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ success: true, message: 'Bookmark criado', bookmark }, null, 2) }],
    };
  }

  if (name === 'list_bookmarks') {
    const { projectId } = args;
    const bookmarks = await bookmarkService.listBookmarksByProject(projectId);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ success: true, bookmarks }, null, 2) }],
    };
  }

  if (name === 'update_bookmark') {
    const { id, title, url, description, group } = args;
    const bookmark = await bookmarkService.updateBookmark(id, { title, url, description, group });
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ success: true, message: 'Bookmark atualizado', bookmark }, null, 2) }],
    };
  }

  if (name === 'delete_bookmark') {
    const { id } = args;
    await bookmarkService.deleteBookmark(id);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ success: true, message: 'Bookmark excluído' }, null, 2) }],
    };
  }

  return null;
}
