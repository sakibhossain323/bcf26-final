#!/bin/bash
# wait-for-it.sh

set -e

host="$1"
shift
cmd="$@"

>&2 echo "Waiting for $host to be ready..."
while ! nc -z "$host" 1>/dev/null 2>&1; do
  sleep 2
done

>&2 echo "$host is available - executing command"
exec $cmd