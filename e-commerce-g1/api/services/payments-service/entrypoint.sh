#!/bin/sh
# Aborta o script se qualquer comando falhar
set -e

echo "Running database migrations..."
# 'migrate deploy' aplica as migrações que já existem na pasta /prisma/migrations
npx prisma migrate deploy

echo "Starting the application..."
# Executa o comando principal do container (o nosso 'npm run dev')
exec "$@"