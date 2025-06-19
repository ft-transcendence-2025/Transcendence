# Use Node.js to build Tailwind + assets
FROM node:22-alpine AS builder

WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# Build Tailwind CSS (output: ./src/output.css) + run your full build
RUN npm run build
