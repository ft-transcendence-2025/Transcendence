# First Stage: Prepare the local avalanche blockchain (AvalancheGo).
FROM golang:1.24.5 AS builder

RUN apt-get update \
    && apt-get install -y git make gcc musl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /go/src

RUN git clone --depth 1 --branch v1.13.2 https://github.com/ava-labs/avalanchego.git \
    && cd avalanchego/scripts && ./build.sh

# Second Stage: Build the Avalanche Network Runner - ANR (Avalanche blockchain manager)
FROM alpine:3.22

RUN for i in $(seq 1 5); do apk update && break || sleep 5; done \
    && apk add libc6-compat curl bash netcat-openbsd\
    && rm -rf /var/cache/apk/* \
    && echo 'export SHELL=/bin/bash' >> /etc/profile \
    && echo 'export SHELL=/bin/bash' >> /root/.profile

COPY --from=builder /go/src/avalanchego/build/avalanchego /usr/local/bin

RUN curl -sSfL https://github.com/ava-labs/avalanche-network-runner/releases/download/v1.8.3/avalanche-network-runner_1.8.3_linux_amd64.tar.gz | tar -xz -C /usr/local/bin \
   && chmod +x /usr/local/bin/avalanche-network-runner

ENV PATH="/usr/local/bin:$PATH" \
    SHELL=/bin/bash

COPY tools/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 9650 9652 9654 9656 9658 8080 8081

WORKDIR /app
COPY tools/blockchain-specs.json /app/


ENTRYPOINT [ "/usr/local/bin/entrypoint.sh" ]
