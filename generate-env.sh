#!/bin/sh
# Generate env.js file by reading BASE_URL from .env file

BASE_URL=$(grep '^BASE_URL=' /app/.env | cut -d '=' -f2-)

cat > /usr/share/nginx/html/env.js << EOF
window.ENV = {
  BASE_URL: '${BASE_URL}'
};
EOF