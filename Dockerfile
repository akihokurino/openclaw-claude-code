FROM ghcr.io/phioranex/openclaw-docker:latest
USER root

RUN apt-get update && apt-get install -y \
    python3 \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
    libxcomposite1 libxdamage1 libxrandr2 libgbm1 \
    libxkbcommon0 libpango-1.0-0 libcairo2 libasound2 \
    fonts-liberation fonts-noto-cjk \
    fonts-ipafont-gothic fonts-ipafont-mincho \
    locales \
    && locale-gen ja_JP.UTF-8 \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g @anthropic-ai/claude-code
RUN npx playwright install chromium

RUN echo '#!/bin/bash\nnode /app/dist/index.js "$@"' > /usr/local/bin/openclaw && \
    chmod +x /usr/local/bin/openclaw

RUN mkdir -p /home/node/.claude/hooks && chown -R node:node /home/node/.claude

COPY claude.json /home/node/.claude.json
COPY playwright-config.json /home/node/playwright-config.json
RUN chown node:node /home/node/.claude.json /home/node/playwright-config.json

USER node
