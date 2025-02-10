# Build stage
FROM node:18

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the client
RUN npm run build

# Environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV VITE_API_URL=/api

# Expose port
EXPOSE 3001

# Start the server
CMD ["npm", "start"] 