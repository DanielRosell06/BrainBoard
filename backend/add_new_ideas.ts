import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const kanbanId = '48359375-885d-4af4-a740-1b21679abd60';
const columnId = '13c82532-bc08-4a36-9bcb-7602555f752a'; // Coluna "Fazer"

const ideas = [
  {
    title: 'UI do Diário de Bordo (Update Logs)',
    description: 'O backend JÁ tem a API de Update Logs (POST/GET/DELETE) funcionando, mas não existe nenhuma tela no frontend pra isso. Criar uma seção no ProjectOverview para registrar e visualizar o histórico de atualizações do projeto — tipo um changelog pessoal do que foi feito dia a dia.'
  },
  {
    title: 'Links Rápidos / Bookmarks por Projeto',
    description: 'Novo tipo de conteúdo no projeto: uma lista simples de URLs úteis (Figma, deploy, documentação, API, repositório). Evita ter que criar uma Nota inteira só pra guardar links. Cada link tem título + URL + ícone opcional.'
  },
  {
    title: 'Tela "Meu Dia" / Dashboard Pessoal',
    description: 'Uma página inicial (home) que mostra de uma vez: tarefas atrasadas, tarefas com prazo pra hoje, compromissos do dia, e notas editadas recentemente. Em vez de abrir projeto por projeto pra ver o que tem pra fazer.'
  },
  {
    title: 'Favoritar / Fixar Projetos no Topo',
    description: 'Adicionar um botão de estrela nos projetos para fixar os mais usados no topo da sidebar e da lista de projetos. Quando tiver vários projetos, não precisa ficar scrollando pra achar o principal.'
  },
  {
    title: 'Duplicar Tarefas e Notas',
    description: 'Botão simples de "Duplicar" nos cards de tarefa e nas notas. Copia o conteúdo inteiro (incluindo subtarefas e tags) pra criar uma versão nova rapidamente, sem ter que reescrever tudo do zero.'
  },
  {
    title: 'Cores e Ícones nos Projetos',
    description: 'Permitir escolher uma cor de destaque e/ou um emoji para cada projeto. Isso diferencia visualmente os projetos na sidebar e na lista — em vez de tudo ser igual e genérico.'
  },
  {
    title: 'Arquivar Projetos (em vez de deletar)',
    description: 'Adicionar a opção de "Arquivar" um projeto concluído ou pausado, tirando ele da sidebar e da listagem principal sem apagar os dados. Com uma seção separada "Arquivados" pra acessar quando quiser.'
  },
  {
    title: 'Exibir businessLogic e GitHub no Overview',
    description: 'Os campos "Lógica de Negócio" e "Repositório GitHub" são preenchidos na criação do projeto mas não aparecem em lugar nenhum no ProjectOverview. Criar seções visíveis e editáveis pra esses dados na página do projeto.'
  },
];

async function main() {
  for (const idea of ideas) {
    await prisma.task.create({
      data: {
        title: idea.title,
        description: idea.description,
        status: 'TODO',
        kanbanId: kanbanId,
        columnId: columnId,
      }
    });
    console.log(`Criada: ${idea.title}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
