import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const kanbanId = '48359375-885d-4af4-a740-1b21679abd60';
const columnId = '13c82532-bc08-4a36-9bcb-7602555f752a';

const ideas = [
  {
    title: 'Gráfico de Gantt / Cronograma',
    description: 'Adicionar visualização de linha do tempo para gerenciar prazos e dependências entre tarefas.'
  },
  {
    title: 'Rastreamento de Tempo (Time Tracking)',
    description: 'Permitir que os usuários registrem o tempo gasto em cada tarefa (cronômetro ou entrada manual).'
  },
  {
    title: 'Dashboards e Analytics',
    description: 'Criar painéis com gráficos de burn-down, velocidade da equipe e métricas de conclusão de tarefas.'
  },
  {
    title: 'Automações e Workflows',
    description: 'Implementar gatilhos customizáveis (ex: ao mover tarefa para concluído, enviar notificação).'
  },
  {
    title: 'Controle de Acesso e Permissões (RBAC)',
    description: 'Adicionar papéis de usuário (Admin, Membro, Leitor) para melhor controle de quem edita o quê.'
  },
  {
    title: 'Quadros Brancos / Mapas Mentais',
    description: 'Área de desenho livre para brainstorming de ideias antes de transformá-las em cards.'
  },
  {
    title: 'Discussões / Chat por Tarefa',
    description: 'Seção de comentários nos cards para centralizar a comunicação sobre cada atividade.'
  },
  {
    title: 'Templates de Projetos',
    description: 'Permitir a criação de projetos baseados em modelos pré-definidos (Software, Marketing, etc).'
  }
];

async function main() {
  for (const idea of ideas) {
    await prisma.task.create({
      data: {
        title: idea.title,
        description: idea.description,
        status: 'TODO',
        kanbanId: kanbanId,
        columnId: columnId
      }
    });
    console.log(`Tarefa criada: ${idea.title}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
