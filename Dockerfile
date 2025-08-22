FROM node:20-slim

WORKDIR /pong

COPY package*.json .
COPY tsconfig.json .

RUN mkdir -p log
RUN apt-get update && apt-get upgrade -y
RUN npm install

COPY src src

EXPOSE 4000

CMD ["npm", "run", "dev"]
