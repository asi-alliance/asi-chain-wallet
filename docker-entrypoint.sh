#!/bin/sh

# Replace environment variables in nginx config
envsubst '${VITE_RCHAIN_HTTP_URL} ${VITE_RCHAIN_GRPC_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Execute the CMD
exec "$@"