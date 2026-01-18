FROM ghcr.io/puppeteer/puppeteer:21.6.0

# Switch to root to install app dependencies and setup permissions
USER root

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# We skip chromium download because the base image already has a compatible version
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

RUN npm install

# Copy application code
COPY . .

# Create necessary directories and ensure write permissions
RUN mkdir -p uploads receipts && \
    chmod -R 777 uploads receipts

# Expose the port
EXPOSE 5000

# Start the application
CMD ["node", "server.js"]
