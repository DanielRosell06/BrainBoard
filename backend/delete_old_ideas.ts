import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const oldTitles = [
  'Suporte a Upload de Arquivos e Imagens',
  'Edição Rápida (Inline Edit) no Kanban',
  'Barra de Busca Global',
  'Filtros Simples no Kanban',
  'Lixeira (Soft Delete)',
  'Modo Escuro (Dark Mode)',
  'Suporte a Markdown nas Descrições',
  'Histórico de Atividades (Activity Log)'
];

async function main() {
  const result = await prisma.task.deleteMany({
    where: {
      title: { in: oldTitles },
      kanbanId: '48359375-885d-4af4-a740-1b21679abd60'
    }
  });
  console.log(`Deleted ${result.count} old tasks.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
