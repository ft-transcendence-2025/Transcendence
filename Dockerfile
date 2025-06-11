# nginx-gateway/Dockerfile

FROM nginx:stable-alpine

# Copia config personalizada
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Copia certificados TLS
COPY nginx/ssl/ /etc/nginx/ssl/

# Copia os arquivos do frontend (SPA)
COPY frontend/dist/ /usr/share/nginx/html/

EXPOSE 443
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
