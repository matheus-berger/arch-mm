# 1. Escolha a imagem base do Node.js
FROM node:18-alpine

# 2. Defina o diretório de trabalho dentro do container
WORKDIR /app

# 3. Copie os arquivos de dependências
COPY package*.json ./

# 4. Instale as dependências
RUN npm install

# 5. Copie o resto do código da sua API para dentro do container
COPY . .

# 6. Exponha a porta que a API vai usar internamente
EXPOSE 3000

# 7. Defina o comando para iniciar a API quando o container rodar
CMD ["npm", "run", "dev"]
