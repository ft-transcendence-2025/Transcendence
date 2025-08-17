FROM node:22.18.0

WORKDIR /app/api-management

RUN npm init -y \
    && npm install fastify@4.29.1 ethers@6.14.0 dotenv@16.6.1

COPY conf/api/ /app/api-management/ 

WORKDIR /app/blockchain-management

RUN npm init -y \
    && npm install --save-dev hardhat@2.26.0 @nomicfoundation/hardhat-toolbox@6.1.0 \
    && npm install @openzeppelin/contracts@5.4.0 dotenv@16.6.1 

COPY conf/blockchain/ /app/blockchain-management/ 
#Do I need to copy the package-lock.json?


COPY tools/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT [ "/usr/local/bin/entrypoint.sh" ]