FROM node:8-alpine
RUN mkdir -p /app
WORKDIR /app
COPY package.json .
COPY package-lock.json . 

RUN npm install
RUN npm audit fix
RUN npm prune

COPY . .
RUN ["npm", "run", "start"]