# nginx-gateway/generate-cert.sh
#!/bin/bash

mkdir -p nginx/ssl

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=PT/ST=Porto/L=Porto/O=42Portol/OU=Dev/CN=localhost"
