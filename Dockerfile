FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY .env ./

# Install dependencies
RUN npm install

# Copy source code
COPY server.js ./

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
