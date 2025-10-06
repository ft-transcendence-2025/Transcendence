#!/bin/sh

curl -k -X POST https://localhost:5000/api/getgame/remote \
  -H "Content-Type: application/json" \
  -d '{"name": "jhon"}'
