FROM node:22.18.0

WORKDIR /app

RUN npm init -y \
    && npm install --save-dev hardhat@2.17.0 \
    && npm install @nomicfoundation/hardhat-toolbox@6.1.0 \
    && npm install @openzeppelin/contracts@5.4.0 \
    && npm install dotenv@16.6.1

COPY conf/ /app/

COPY tools/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT [ "/usr/local/bin/entrypoint.sh" ]