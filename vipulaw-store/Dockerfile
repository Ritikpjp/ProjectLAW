FROM node:22-bookworm-slim

# Python + PyMuPDF are used at upload time to find free spots for the QR stamp.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 python3-pip openssl ca-certificates \
 && pip3 install --no-cache-dir --break-system-packages pymupdf numpy \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PYTHON_BIN=python3

COPY package.json package-lock.json ./
# devDependencies are kept: the build needs Tailwind/TypeScript and the seed uses tsx.
RUN npm ci --include=dev

COPY . .
RUN DATABASE_URL="file:/tmp/build.db" npx prisma generate \
 && DATABASE_URL="file:/tmp/build.db" APP_SECRET="build-time-placeholder-build-time-placeholder" npm run build

RUN chmod +x deploy/entrypoint.sh && mkdir -p /data && chown -R node:node /data /app
USER node
EXPOSE 3000
ENTRYPOINT ["deploy/entrypoint.sh"]
