# Stage 1: Build the application
FROM node:21-alpine3.18 AS builder

WORKDIR /work-whiz

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx nx build

# Stage 2: Runtime image
FROM node:21-alpine3.18

WORKDIR /work-whiz

ENV NODE_ENV=development

# Copy only what's necessary
COPY --from=builder /work-whiz/dist ./dist
COPY --from=builder /work-whiz/package.json ./
COPY --from=builder /work-whiz/node_modules ./node_modules

# Expose the application port
EXPOSE 8080

# Start the app
CMD ["node", "./dist/work-whiz/main.js"]
