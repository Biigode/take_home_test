# Take Home Test - Backend

## Visão Geral

Este projeto é uma API desenvolvida em Node.js utilizando o framework NestJS, com TypeORM para ORM e banco de dados PostgreSQL. O sistema foi projetado para processar logs de partidas, armazenar estatísticas de jogadores e partidas, e expor endpoints REST documentados via Swagger.

---

## Como rodar o projeto com Docker Compose

1. **Pré-requisitos:**

   - Docker e Docker Compose instalados

2. **Suba os containers:**

   ```sh
   docker compose up --build
   ```

   Isso irá:

   - Subir o banco Postgres
   - Rodar as migrations automaticamente
   - Iniciar a API NestJS

3. **Acesse a documentação Swagger:**
   - Após o serviço estar rodando, acesse: [http://localhost:3000/api](http://localhost:3000/api)

---

## Como executar os testes unitários

1. **Localmente (fora do Docker):**
   - Instale as dependências:
     ```sh
     npm install
     ```
   - Execute os testes:
     ```sh
     npm run test:cov
     ```

---

## Tecnologias Utilizadas

- **Node.js** + **NestJS**: Estrutura modular, injeção de dependências, validação e documentação automática de endpoints.
- **TypeORM**: ORM para integração com o banco de dados relacional, migrations e repositórios customizados.
- **PostgreSQL**: Banco de dados relacional robusto, rodando em container Docker.
- **Swagger**: Documentação automática dos endpoints e DTOs.
- **Jest**: Testes unitários e de integração.

---

## Estrutura do Projeto

- `src/`
  - `matches/`: Lógica de domínio, controllers, use cases, entidades e serviços relacionados a partidas e jogadores.
  - `main.ts`: Bootstrap da aplicação NestJS.
- `docker-compose.yml`: Orquestração dos serviços (app e banco).
- `Dockerfile`: Build da aplicação Node.
- `README.md`: Este arquivo.

---

## Observações

- As migrations são executadas automaticamente ao subir o container.
- O endpoint de upload aceita apenas arquivos `.txt`.
- O código está preparado para tratamento de erros de constraint (ex: duplicidade de externalId).
- Os testes cobrem os principais fluxos de negócio e validações.

---

## Contato

Em caso de dúvidas, sugestões ou problemas, entre em contato com o responsável pelo repositório.
