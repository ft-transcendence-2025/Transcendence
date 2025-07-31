FROM node:24

WORKDIR /app

RUN npm init -y \
    && npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox \
    @openzeppelin/contracts


COPY conf/ /app/

CMD ["tail", "-f", "/dev/null"]