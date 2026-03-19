FROM node:20-bookworm

# System deps: Python3, pip, git
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      python3-full python3-pip git curl jq \
      # Playwright Chromium runtime dependencies
      libnspr4 libnss3 libnss3-tools libatk1.0-0 libatk-bridge2.0-0 \
      libcups2 libxkbcommon0 libatspi2.0-0 libxcomposite1 libxdamage1 \
      libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2 \
      libdbus-1-3 libdrm2 libxshmfence1 fonts-liberation xvfb && \
    rm -rf /var/lib/apt/lists/*

# Install Playwright MCP globally and use its bundled Playwright to install Chromium
# This ensures the browser revision matches what the MCP server expects at runtime
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/playwright-browsers
RUN npm install -g @playwright/mcp@latest && \
    npx -p @playwright/mcp playwright install chromium && \
    chmod -R a+rwx /opt/playwright-browsers

# Python deps for soccerdata bridge
RUN pip3 install --break-system-packages \
    soccerdata==1.8.8 pandas lxml requests && \
    chmod -R a+w /usr/local/lib/python3.11/dist-packages/tls_requests/bin/

# Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code vercel

# Create non-root user (Claude Code refuses --dangerously-skip-permissions as root)
ARG UID=501
ARG GID=20
RUN groupadd -g ${GID} -o devuser 2>/dev/null || true && \
    useradd -m -u ${UID} -g ${GID} -s /bin/bash devuser

# Git config for the dev user
USER devuser
RUN git config --global user.name "Docker Dev" && \
    git config --global user.email "dev@docker.local" && \
    git config --global --add safe.directory /app

# Switch back to root for file operations
USER root
WORKDIR /app

# Install Node deps (package files only for Docker layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy project source
COPY . .

# Ensure data dirs exist and set ownership
RUN mkdir -p data/reports data/cache && \
    chown -R devuser:${GID} /app

# Pre-create .claude dir as devuser so the named volume inherits correct ownership
RUN mkdir -p /home/devuser/.claude && chown devuser:${GID} /home/devuser/.claude

COPY scripts/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER devuser
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
