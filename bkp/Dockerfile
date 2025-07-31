FROM golang:1.24.5 AS builder

RUN apt-get update \
    && apt-get install -y git make gcc musl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /go/src

RUN git clone --depth 1 --branch v1.13.2 https://github.com/ava-labs/avalanchego.git
RUN cd avalanchego/scripts && ./build.sh


# Second stage.
FROM alpine:3.22

RUN apk add --no-cache bash libc6-compat curl nodejs npm\
    && ln -sf /bin/bash /bin/sh \
    && echo 'export SHELL=/bin/bash' >> /etc/profile \
    && echo 'export SHELL=/bin/bash' >> /root/.profile

# Copy AvalancheGo binaries from the builder image.
COPY --from=builder /go/src/avalanchego/build/avalanchego /usr/local/bin/

# Install Avalanche Network Runner (version 1.8.3 for linux/amd64)
RUN curl -sSfL https://github.com/ava-labs/avalanche-network-runner/releases/download/v1.8.3/avalanche-network-runner_1.8.3_linux_amd64.tar.gz | tar -xz -C /usr/local/bin \
    && chmod +x /usr/local/bin/avalanche-network-runner

WORKDIR /app


# Setting the hardhat dependencies
RUN npm init -y && \
    npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts

# RUN npm init -y \
#     && npm install --save-dev hardhat \
#     && npm install @nomicfoundation/hardhat-toolbox \
#     && npm install @openzeppelin/contracts \
#     && rm package.json package-lock.json 

COPY conf/ /app/

# Ensure /usr/local/bin is in PATH
ENV PATH="/usr/local/bin:$PATH" PATH="/usr/local/bin:/app/node_modules/.bin:$PATH" SHELL=/bin/bash

EXPOSE 8080 8081

# Copy the script with MariaDB initialization.
COPY tools/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

RUN [ "/usr/local/bin/entrypoint.sh" ]