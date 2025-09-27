FROM node:18-alpine

# Install ffmpeg and font packages
RUN apk add --no-cache ffmpeg fontconfig ttf-liberation

# Create fonts directory and copy custom fonts
RUN mkdir -p /usr/share/fonts/custom
COPY fonts/ /usr/share/fonts/custom/

# Update font cache
RUN fc-cache -f -v

WORKDIR /app

# Copy package files
COPY package.json ./
COPY ../../packages/shared/package.json ./packages/shared/

# Install dependencies
RUN npm install

# Copy source code
COPY . .
COPY ../../packages/shared ./packages/shared

# Build the application
RUN npm run build

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
