#!/bin/sh
set -e
host="config-service:8888"
cmd="java -jar /app/app.jar"

until curl -f -s http://config-service:8888/application/default; do
  >&2 echo "Config Service is unavailable - sleeping"
  sleep 5
done

>&2 echo "Config Service is up - executing command"
exec $cmd