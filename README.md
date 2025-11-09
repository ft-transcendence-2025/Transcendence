Dream Team:

[Aija Arepsa](https://github.com/AijaRe) - [Ebenézer Marquezine](https://github.com/ebmarque) - [Jhonas Leal](https://github.com/Jburlama) - [Leila Dantas](https://github.com/leilatdantas) - [Uatilla Almeida](https://github.com/Uatilla)

# Transcendence

Transcendence is a full-stack web application that reimagines the classic Pong game as a feature-rich multiplayer platform. The platform features sophisticated user management with JWT authentication and 2FA, real-time chat functionality, friend systems, multiple game modes (local multiplayer, AI opponents, online play, and tournaments), and a single-page application interface.

## Project features

- Backend: Node.js + Fastify
- Frontend: Typescript + Tailwind CSS + SPA
- SQLite database + Prisma for the backend
- Backend as Microservices
- Blockchain (Avalanche/Solidity) to store game results
- Two-Factor Authentication (2FA) and JWT
- User management: authentication and profiles
- Live Chat + friendships + invite to a match
- Remote players
- AI opponent
- Server-Side Pong and Pong API

### Login and profile

videos: 2FA login and dashboard

profile update


###  Friends and live chat

videos: invite a friend

start a chat

invite to play a game

### Pong Features

- Play two players on the same keyboard
- Play vs AI
- Play online
- Play a tournament with 4 players: online or 4 on the same keyboard


- Play vs AI
![vsAi](https://github.com/user-attachments/assets/8199f7b4-7b15-4c28-ab2b-273231916655)

- Game controls
<img width="610" height="462" alt="tutorial" src="https://github.com/user-attachments/assets/6b7a98a0-d94e-4aac-bbf8-254531a137f8" />

- Dashboard
<img width="1907" height="649" alt="dashboard" src="https://github.com/user-attachments/assets/7a35c4d7-54be-4e85-ad3b-930abf798597" />

- Player customization
<img width="791" height="447" alt="2players" src="https://github.com/user-attachments/assets/bca9ffe1-91b1-45b7-be3e-33d10c86d1d0" />

- Remote pong
<img width="1358" height="721" alt="waiting" src="https://github.com/user-attachments/assets/af714158-ceff-4e91-b6fa-2b80e53560e6" />

- Tournaments
<img width="1072" height="630" alt="localTournament" src="https://github.com/user-attachments/assets/14c710a4-763e-4849-b2db-15d94d38a4ef" />
<img width="1464" height="949" alt="tournamentBracket" src="https://github.com/user-attachments/assets/f18cd8d8-950b-4214-95e9-a2893780fb11" />


### Stats and match history

(picture of stats page)



## Materials

- Check each module README for details


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
BASE_URL=<your_frontend_base_url>
e.g. BASE_URL=https://localhost:5000/api
```

### Chat-Service (`./.env`)

```
DATABASE_URL="file:../DB/dev.db"
```

### Secrets - Blockchain (`./Blockchain/secrets/avalanche_private_key.txt`)

```
<your_avalanche_private_key>
```

## Run the project

- Configure the environment
- Run ```make``` in the root folder