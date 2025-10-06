#!/bin/sh

curl -X POST localhost:4000/createtournoment \
  -H "Content-Type: application/json" \
  -d '{"player1": "jhon", "player2": "glace", "player3": "finesse", "player4": "cicry" }'
