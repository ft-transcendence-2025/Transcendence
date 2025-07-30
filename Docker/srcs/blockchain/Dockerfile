FROM golang:1.24.5 AS builder

RUN apt-get update \
    && apt-get install -y git make gcc musl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /go/src

RUN git clone --depth 1 --branch v1.13.2 https://github.com/ava-labs/avalanchego.git
RUN cd avalanchego/scripts && ./build.sh

FROM alpine:3.22

# Install curl first (lightweight, needed for network checks)
RUN apk add --no-cache curl

# Wait for Alpine's repos to be available (retry for 60s max)
RUN until curl -sSf https://dl-cdn.alpinelinux.org/alpine/v3.22/main/ >/dev/null; do \
        echo "Waiting for Alpine package repos to be available..."; \
        sleep 5; \
    done

# Now safely install remaining packages
RUN apk add --no-cache bash libc6-compat \
    && ln -sf /bin/bash /bin/sh \
    && echo 'export SHELL=/bin/bash' >> /etc/profile \
    && echo 'export SHELL=/bin/bash' >> /root/.profile

COPY --from=builder /go/src/avalanchego/build/avalanchego /usr/local/bin/

ENV SHELL=/bin/bash


# Install Avalanche Network Runner (version 1.8.3 for linux/amd64)
RUN curl -sSfL https://github.com/ava-labs/avalanche-network-runner/releases/download/v1.8.3/avalanche-network-runner_1.8.3_linux_amd64.tar.gz | tar -xz -C /usr/local/bin \
    && chmod +x /usr/local/bin/avalanche-network-runner

# Ensure /usr/local/bin is in PATH
ENV PATH="/usr/local/bin:$PATH"

EXPOSE 8080 8081

# Set default command for interactive shell
CMD ["/bin/bash"]