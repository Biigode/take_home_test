# Take Home Test - Backend

## Visão Geral

Este projeto é uma API desenvolvida em Node.js utilizando o framework NestJS, com TypeORM para ORM e banco de dados PostgreSQL. O sistema foi projetado para processar logs de partidas, armazenar estatísticas de jogadores e partidas, e expor endpoints REST documentados via Swagger.

- Um cron job foi implementado utilizando o módulo oficial do NestJS (@nestjs/schedule) para limpar automaticamente a pasta de uploads a cada 5 minutos, garantindo que arquivos temporários não ocupem espaço desnecessário no servidor.

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

## Bônus e Considerações

Durante o desenvolvimento, foram implementados e avaliados os seguintes bônus/desafios extras:

### Bônus Implementados

- **Ranking Global dos jogadores**
  - Endpoint: `GET /matches/global-ranking`
  - Exibe o ranking global computando dados de todas as partidas.

- **Ranking detalhado por partida**
  - Endpoint: `GET /matches/:matchId/ranking`
  - O retorno inclui:
    - Lista de jogadores, kills, deaths e kill/death ratio
    - Arma favorita do vencedor (`favoriteWeaponWinner`)
    - Jogador com maior sequência de frags sem morrer (`bestStreakPlayer` e `bestStreak`)
    - Award para vencedor invicto (`winnerNoDeathAward`)
    - Awards de 5 kills em 1 minuto (`award5Kills1Min`)

- **Listagem geral de partidas**
  - Endpoint: `GET /matches`
  - Mostra todas as partidas, com mortes e estatísticas básicas de cada jogador.

### Bônus Não Implementados

- **Classificação de jogadores em times e Friendly Fire (-1 no score)**
  - Não implementado. O sistema atual considera apenas jogadores individuais, sem lógica de times ou penalização por Friendly Fire.

---

## Possíveis Melhorias

Esta solução pode ser aprimorada para cenários de maior escala e experiência do usuário. Por exemplo:

- Utilizar um sistema de eventos/filas para processar uploads de arquivos de forma assíncrona, evitando que o usuário fique com a requisição presa enquanto o arquivo é processado.
- Implementar workers/background jobs para processar grandes volumes de dados sem impactar a performance da API.
- Adicionar cache para rankings globais ou parciais, otimizando consultas recorrentes.
- Suporte a times e lógica de Friendly Fire, conforme sugerido nos bônus.
