# Stage 1: Build the application
FROM node:21-alpine3.18 AS builder

WORKDIR /work-whiz

# Copy package files first to leverage Docker cache
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build the application
RUN npx nx build

# Stage 2: Create the runtime image
FROM node:21-alpine3.18

# Set environment variables
ENV NODE_ENV=development

WORKDIR /work-whiz

# Copy the build artifacts from the builder stage
COPY --from=builder /work-whiz/dist ./dist
COPY --from=builder /work-whiz/package.json ./
COPY --from=builder /work-whiz/node_modules ./node_modules
COPY --from=builder /work-whiz/ecosystem.config.js ./

# Copy the .env file (if it's part of the build process)
COPY .env .env

# Expose the application port (choose the correct one)
EXPOSE 4200

# Install PM2 globally
RUN npm install -g pm2

# Start the app using PM2
CMD [ "node", "--env-file=./.env", "./dist/work-whiz/main.js" ]