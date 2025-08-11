#!/bin/sh
set -e

# Compilar o projeto antes de rodar as migrations
npm run build

# Rodar as migrations usando o arquivo compilado
# npm run migration:run

# Iniciar a aplicação
exec npm run start:prod