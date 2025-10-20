#!/bin/env bash

tournament_list=$(curl -k -X GET https://localhost:5000/api/tournament/remote)


echo ${tournament_list} | jq .data
