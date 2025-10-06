#!/bin/sh

id=$(($1))

curl -X GET localhost:4000/gettournoment/$id
