FROM node:20

RUN apt-get update && apt-get install -y \
  dumb-init \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g forever

RUN mkdir /app
COPY docker/run.sh /app
RUN chmod +x /app/run.sh
COPY package.json /app
WORKDIR /app
RUN npm install --production
RUN npm install cross-env

COPY prisma /app/prisma
RUN npx prisma generate

COPY index.js /app
COPY api-doc.yml /app
COPY lib /app/lib

EXPOSE 8080

USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD curl -f http://localhost:${PORT} || exit 1

CMD ["dumb-init", "./run.sh"]
