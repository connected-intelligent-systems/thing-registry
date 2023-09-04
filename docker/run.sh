#!/bin/sh

if [ "$NODE_ENV" = "development" ]; then
    npm run migrate:development
    exec npm run start:development
else
    npm run migrate:production
    exec npm start
fi
