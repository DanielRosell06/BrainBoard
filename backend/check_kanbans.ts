import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({
    include: {
      kanbans: {
        include: {
          columns: true,
        }
      }
    }
  });
  
  for (const p of projects) {
    console.log(`- [${p.id}] ${p.title}`);
    for (const k of p.kanbans) {
      console.log(`  - Kanban: [${k.id}] ${k.title}`);
      for (const col of k.columns) {
         console.log(`    - Column: [${col.id}] ${col.title}`);
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
