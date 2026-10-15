FROM node:20-alpine
WORKDIR /app
COPY apps/sync-api/package.json ./package.json
COPY apps/sync-api/src ./src
RUN mkdir -p /data/sync && chown -R node:node /app /data
USER node
ENV PORT=8787
ENV MMDP_SYNC_DATA_DIR=/data/sync
EXPOSE 8787
CMD ["node", "src/server.js"]
