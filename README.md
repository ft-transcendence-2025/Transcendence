# Transcendence


<img width="952" height="780" alt="createAccount" src="https://github.com/user-attachments/assets/941bc154-e9a9-49a3-be30-bf5d67997ae3" />


<img width="970" height="556" alt="login" src="https://github.com/user-attachments/assets/42ea3913-63cc-495a-88a7-9288ecffcc0c" />

<img width="1907" height="649" alt="dashboard" src="https://github.com/user-attachments/assets/7a35c4d7-54be-4e85-ad3b-930abf798597" />

<img width="791" height="447" alt="2players" src="https://github.com/user-attachments/assets/bca9ffe1-91b1-45b7-be3e-33d10c86d1d0" />

<img width="610" height="462" alt="tutorial" src="https://github.com/user-attachments/assets/6b7a98a0-d94e-4aac-bbf8-254531a137f8" />

<img width="1072" height="630" alt="localTournament" src="https://github.com/user-attachments/assets/14c710a4-763e-4849-b2db-15d94d38a4ef" />

<img width="1358" height="721" alt="waiting" src="https://github.com/user-attachments/assets/af714158-ceff-4e91-b6fa-2b80e53560e6" />

<img width="1464" height="949" alt="tournamentBracket" src="https://github.com/user-attachments/assets/f18cd8d8-950b-4214-95e9-a2893780fb11" />













## Materials

- [**Evaluation point calculator**](https://docs.google.com/spreadsheets/d/1Q4pmPAF-1SVinc3p4zwawTuW-6cizekHFWHoP5HHciU/edit?usp=sharing)

## Environment Configuration Guide

Before running the project, create the necessary `.env` (or secret) files in the corresponding folders and replace placeholders with your actual configuration.

---

### User-Management (`./.env`)

```
DATABASE_URL="file:../DB/dev.db"
NODE_ENV="production"
PORT=3000
HOST="0.0.0.0"
```

### API-Gateway (`./.env`)

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

### Frontend (`./.frontend/.env`)

```
BASE_URL="<your_frontend_base_url>"
```

### Chat-Service (`./.env`)

```
DATABASE_URL="file:../DB/dev.db"
```

### Secrets - Blockchain (`./Blockchain/secrets/avalanche_private_key.txt`)

```
<your_avalanche_private_key>
```
