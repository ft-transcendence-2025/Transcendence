FROM node:24

WORKDIR /app

RUN npm init -y \
    && npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts \
    && npm install dotenv


COPY conf/ /app/

COPY tools/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT [ "/usr/local/bin/entrypoint.sh" ]
#CMD ["tail", "-f", "/dev/null"]