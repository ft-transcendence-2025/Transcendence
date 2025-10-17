#!/bin/env bash

wscat -c wss://localhost:5000/ws/game/remotetournament/tournament-1 -n | jq
