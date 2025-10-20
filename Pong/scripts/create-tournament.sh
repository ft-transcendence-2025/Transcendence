#!/bin/env bash

curl -k -X POST https://localhost:5000/api/tournament/remote/create \
  -H "Content-Type: application/json" \
  -d '{ 
    "name": "Thor",
    "createdBy": "me"
  }' | jq

