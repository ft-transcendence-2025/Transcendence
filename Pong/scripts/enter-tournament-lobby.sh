#!/bin/env bash

curl -k -X GET https://localhost:5000/api/tournament/remote/$1 | jq
