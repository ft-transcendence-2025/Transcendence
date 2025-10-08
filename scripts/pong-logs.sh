#!/bin/sh

cd ..

while [ 1 ]; do
  echo "\n"

  docker compose logs pong

  echo "\n"

  sleep 2
done
