# Build stage
FROM node:18-alpine as builder

# Set working directory
WORKDIR /app

# Install dependencies for node-gyp, canvas, and USB support
RUN apk add --no-cache \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    eudev-dev \
    libusb-dev \
    linux-headers

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Copy env example as .env if it doesn't exist
RUN if [ ! -f .env ]; then cp .env.example .env; fi

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Install gettext for envsubst
RUN apk add --no-cache gettext

# Copy built files from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration template
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Copy env injection script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Use custom entrypoint to inject environment variables
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]