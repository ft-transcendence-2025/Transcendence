# Transcendence

## Materials

- [**Project Notion**](https://www.notion.so/uatilla/ft_Transcendence-1d8f776cb552800e9c80da43076fe9a2)
- [**Evaluation point calculator**](https://docs.google.com/spreadsheets/d/1Q4pmPAF-1SVinc3p4zwawTuW-6cizekHFWHoP5HHciU/edit?usp=sharing)

## Environment Configuration Guide

Before running the project, create the necessary `.env` (or secret) files in the corresponding folders and replace placeholders with your actual configuration.

---

### User-Management (`./env`)

```
DATABASE_URL="file:../DB/dev.db"
NODE_ENV="production"
PORT=3000
HOST="0.0.0.0"
```

### API-Gateway (`./env`)

```
# Authentication Secrets
JWT_ACCESS_SECRET="<your_jwt_access_secret>"
JWT_REFRESH_SECRET="<your_jwt_refresh_secret>"

# Environment Configuration
NODE_ENV="production"
PORT=3000

# Service URLs
PROD_AUTH_URL="http://user-management:3000/auth"
DEV_AUTH_URL="http://localhost:3000/auth"

PROD_USER_URL="http://user-management:3000/users"
DEV_USER_URL="http://localhost:3000/users"

PROD_PROFILE_URL="http://user-management:3000/profiles"
DEV_PROFILE_URL="http://localhost:3000/profiles"

PROD_FRIENDSHIP_URL="http://user-management:3000/friendships"
DEV_FRIENDSHIP_URL="http://localhost:3000/friendships"
```

### Frontend (`./frontend/.env`)

```
BASE_URL="<your_frontend_base_url>"
```

### Chat-Service (`./env`)

```
DATABASE_URL="file:../DB/dev.db"
```

### Secrets - Blockchain (`./Blockchain/secrets/avalanche_private_key.txt`)

```
<your_avalanche_private_key>
```
