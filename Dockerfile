FROM node:20

RUN apt-get update && apt-get install -y \
  dumb-init \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g forever
RUN mkdir /app
COPY docker/run.sh /app
RUN chmod +x /app/run.sh
COPY package.json /app
COPY plugins /app/plugins
WORKDIR /app
RUN npm install --production
RUN npm install cross-env
RUN npm install mocha 

COPY index.js /app
COPY api-doc.yml /app
COPY lib /app/lib

EXPOSE 80

CMD ["dumb-init", "./run.sh"]
