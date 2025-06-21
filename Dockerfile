# Use Node.js to build Tailwind + assets
FROM node:22-alpine AS builder

WORKDIR /app

# Install deps
COPY ./frontend/package*.json ./
RUN npm install

# Copy source files
COPY ./frontend .

# Build Tailwind CSS (output: ./src/output.css) + run full build
RUN npm run build

# nginx-gateway/Dockerfile

FROM nginx:stable-alpine

# Copy nginx personalized configuration
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy SSL certificates
COPY ./nginx/ssl/ /etc/nginx/ssl/

# Copy frontent build output
COPY --from=builder /app/dist/ /usr/share/nginx/html/

EXPOSE 443
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
