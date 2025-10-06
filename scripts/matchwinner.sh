#!/bin/sh

id=$(($1))
match=$(($2))
winner=$3

curl -X POST localhost:4000/tournoment/matchwinner \
  -H "Content-Type: application/json" \
  -d '{"id": '"${id}"', "match": '"${match}"', "winner": "'"${winner}"'"}'
