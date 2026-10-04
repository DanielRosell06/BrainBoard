# 🛠️ Melhorias Práticas — Brain Board

Estas ideias focam em melhorar a experiência real de uso do sistema, aproveitando coisas que já existem parcialmente no backend mas não têm UI, e adicionando novos tipos de conteúdo que fazem falta no dia a dia.

---

## 1. 📋 UI do Diário de Bordo (Update Logs)

> **Status:** Backend PRONTO (API completa), falta o Frontend

O backend já tem endpoints funcionando (`POST/GET/DELETE /api/projects/:id/update-logs`), mas não existe nenhuma tela para usar isso. A ideia é criar uma seção no `ProjectOverview` onde você possa:
- Registrar o que fez no projeto naquele dia
- Ver o histórico cronológico das atualizações
- Ter um "changelog pessoal" de cada projeto

**Por que melhora:** Você abre o projeto e vê exatamente onde parou na última vez, sem ter que ficar tentando lembrar.

---

## 2. 🔗 Links Rápidos / Bookmarks por Projeto

> **Status:** Funcionalidade nova (backend + frontend)

Um novo tipo de conteúdo no projeto: uma lista simples de URLs úteis.
- Link do Figma
- Link do deploy
- Documentação de referência
- API externa que está usando

Cada link tem: **título + URL + ícone/favicon opcional**.

**Por que melhora:** Hoje, pra guardar links, você precisa criar uma Nota inteira. Isso é overkill. Uma seção de bookmarks no overview do projeto resolve de forma muito mais rápida.

---

## 3. 🏠 Tela "Meu Dia" / Dashboard Pessoal

> **Status:** Funcionalidade nova (frontend, APIs já existem)

Uma página inicial (home) que mostra tudo de uma vez:
- ⚠️ Tarefas atrasadas (com deadline estourada)
- 📅 Tarefas com prazo pra hoje
- 🗓️ Compromissos do dia
- 📝 Notas editadas recentemente

**Por que melhora:** Hoje você tem que abrir projeto por projeto pra saber o que tem pra fazer. Essa tela te dá a visão geral em 2 segundos.

---

## 4. ⭐ Favoritar / Fixar Projetos no Topo

> **Status:** Funcionalidade simples (campo `isFavorite` no Project + sort na sidebar)

Botão de estrela nos projetos para fixar os mais usados no topo da sidebar e da listagem.

**Por que melhora:** Quando tiver 10+ projetos, você não precisa ficar scrollando pra achar o que está trabalhando agora.

---

## 5. 📄 Duplicar Tarefas e Notas

> **Status:** Funcionalidade simples (botão no frontend + chamada de API)

Um botão "Duplicar" nos cards do Kanban e nas notas. Copia tudo — título, descrição, subtarefas, tags — criando uma versão nova instantaneamente.

**Por que melhora:** Quando você tem tarefas parecidas (ex: "Implementar tela X" e "Implementar tela Y"), não precisa reescrever tudo do zero.

---

## 6. 🎨 Cores e Ícones nos Projetos

> **Status:** Funcionalidade simples (campos `color` e `icon` no Project)

Permitir escolher uma cor de destaque e um emoji para cada projeto. A cor aparece como borda/badge na sidebar e no card do projeto.

**Por que melhora:** Diferencia visualmente os projetos na sidebar — em vez de tudo ser uma lista cinza genérica, cada projeto tem identidade visual.

---

## 7. 📦 Arquivar Projetos

> **Status:** Funcionalidade simples (novo status `ARCHIVED` ou campo `isArchived`)

Opção de "Arquivar" um projeto concluído ou pausado:
- Remove da sidebar e da listagem principal
- Seção separada "Arquivados" para consultar quando quiser
- Dados preservados (diferente de deletar)

**Por que melhora:** Mantém a sidebar limpa e focada só no que está ativo, sem perder o histórico.

---

## 8. 👁️ Exibir businessLogic e GitHub no Overview

> **Status:** Backend PRONTO, falta o Frontend

Os campos "Lógica de Negócio" e "Repositório GitHub" são preenchidos na criação do projeto, mas **não aparecem em lugar nenhum** depois. A ideia é criar seções visíveis e editáveis na página de Overview do projeto.

**Por que melhora:** Informações que você mesmo preencheu ficam escondidas e inacessíveis. É basicamente um bug de UX.

---

> **📍 Local deste documento:** [`IDEIAS_MELHORIAS.md`](file:///c:/Repositorios/Diversao/BrainBoard/IDEIAS_MELHORIAS.md) na raiz do projeto Brain Board.
