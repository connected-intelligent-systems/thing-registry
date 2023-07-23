#!/bin/sh

npx prisma migrate deploy

if [ "$NODE_ENV" = "development" ]; then
    exec npm run start:development
else
    exec npm start
fi
