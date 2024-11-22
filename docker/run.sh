#!/bin/sh

if [ "$NODE_ENV" = "development" ]; then
    npm run migrate:development  || { echo "Migration failed"; exit 1; }
    exec npm run start:development
else
    npm run migrate:production || { echo "Migration failed"; exit 1; }
    exec npm start
fi
