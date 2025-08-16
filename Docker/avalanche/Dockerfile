FROM node:22.18.0

WORKDIR /app/blockchain-management

RUN npm init -y \
    && npm install --save-dev hardhat@2.17.0 \
    && npm install @nomicfoundation/hardhat-toolbox@6.1.0 @openzeppelin/contracts@5.4.0 \
    && npm install dotenv@16.6.1 fastify@4.29.1 ethers@6.14.0

COPY conf/ /app/blockchain-management/

COPY tools/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT [ "/usr/local/bin/entrypoint.sh" ]