FROM node:20-slim

WORKDIR /pong

COPY package*.json .
COPY tsconfig.json .

RUN mkdir -p log
RUN mkdir -p /etc/server/ssl
RUN apt-get update && apt-get upgrade -y && apt-get install -y openssl
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout /etc/server/ssl/private.key \
		-out /etc/server/ssl/certificate.crt  \
    -subj "/CN=pong"

RUN npm install

COPY src src

EXPOSE 4000

CMD ["npm", "run", "dev"]
