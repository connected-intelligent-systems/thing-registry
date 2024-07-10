FROM node:21-alpine3.19

RUN apk --no-cache add curl

WORKDIR /app

COPY docker/run.sh /app
RUN chmod +x /app/run.sh

COPY package.json /app
COPY package-lock.json /app

RUN npm install --production
RUN npm install cross-env

COPY prisma /app/prisma
RUN npx prisma generate

COPY index.js /app
COPY api-doc.yml /app
COPY lib /app/lib

EXPOSE 8080

USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD curl -f http://localhost:8080 || exit 1

CMD ["/app/run.sh"]
