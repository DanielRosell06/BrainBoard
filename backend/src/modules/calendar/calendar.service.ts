import { prisma } from '../../prisma.js';
import { parseIsoDate } from '../shared/date.utils.js';
import type {
  CalendarEventProjection,
  CalendarFilterOptions,
} from './calendar.types.js';

export class CalendarService {
  async getCalendarEvents(filters?: CalendarFilterOptions): Promise<CalendarEventProjection[]> {
    const aptWhere: any = {};
    const taskWhere: any = { dueDate: { not: null } };
    

    if (filters?.startDate) {
      const start = parseIsoDate(filters.startDate, 'startDate');
      aptWhere.startTime = { gte: start };
      taskWhere.dueDate = { ...(taskWhere.dueDate || {}), gte: start };
      
    }

    if (filters?.endDate) {
      const end = parseIsoDate(filters.endDate, 'endDate');
      aptWhere.endTime = { lte: end };
      taskWhere.dueDate = { ...(taskWhere.dueDate || {}), lte: end };
      
    }

    if (filters?.includeCompleted !== true) {
      aptWhere.isCompleted = false;
      taskWhere.status = { not: 'DONE' };
      
    }

    if (filters?.projectId) {
      taskWhere.kanban = { projectId: filters.projectId };
    }

    

    const [appointments, tasks] = await Promise.all([prisma.appointment.findMany({where: aptWhere, orderBy: {startTime: 'asc'}}), prisma.task.findMany({where: taskWhere, include: {kanban: {include: {project: true}}}, orderBy: {dueDate: 'asc'}})]);

    const appointmentEvents: CalendarEventProjection[] = appointments.map((a) => ({
      id: `appointment-${a.id}`,
      sourceId: a.id,
      sourceType: 'APPOINTMENT',
      title: a.title,
      description: a.description,
      start: a.startTime.toISOString(),
      end: a.endTime.toISOString(),
      locationOrLink: a.locationOrLink,
      isCompleted: a.isCompleted,
      color: a.isCompleted ? '#94a3b8' : '#6366f1',
    }));

    const taskEvents: CalendarEventProjection[] = tasks.map((t) => {
      const dueDateIso = t.dueDate!.toISOString();
      const isDone = t.status === 'DONE';
      let color = '#3b82f6';
      if (isDone) color = '#10b981';

      return {
        id: `task-${t.id}`,
        sourceId: t.id,
        sourceType: 'TASK_DEADLINE',
        title: `[${t.kanban.project.title}] ${t.title}`,
        description: t.description,
        start: dueDateIso,
        end: dueDateIso,
        isCompleted: isDone,
        color,
        projectTitle: t.kanban.project.title,
        kanbanTitle: t.kanban.title,
        projectType: t.kanban.project.type,
        status: t.status,
      };
    });

    const allEvents = [...appointmentEvents, ...taskEvents];
    allEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    return allEvents;
  }
}

export const calendarService = new CalendarService();
