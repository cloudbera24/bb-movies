ROM node:20-alpine

WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy ALL source files
COPY . .

# Verify files are copied
RUN ls -la

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "server.js"]
