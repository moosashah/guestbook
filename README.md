# Guestbook Monorepo

A wedding guestbook application with video message compilation, built with Turborepo.

## Architecture

This monorepo contains:

- **`apps/guestbook`**: Next.js web application for collecting guest messages
- **`apps/compiler`**: Node.js microservice for stitching videos and uploading to S3
- **`packages/shared`**: Shared types, models, and utilities

## Quick Start

```bash
# Install dependencies
npm install

# Start all apps in development mode
npm run dev

# Build all apps
npm run build

# Run linting
npm run lint
```

## Apps

### Guestbook App (Port 3000)
- Next.js 15 with React 19
- Tailwind CSS + shadcn/ui components
- Stripe payment integration
- S3 media upload
- DynamoDB for data storage

### Compiler Service (Port 3001)
- Express.js microservice
- FFmpeg video processing
- S3 integration for media download/upload
- Webhook notifications
- Docker support

## Development

Each app can be developed independently:

```bash
# Work on guestbook only
cd apps/guestbook
npm run dev

# Work on compiler only
cd apps/compiler
npm run dev
```

## Deployment

### Guestbook App
Deploy to Vercel, Netlify, or any Next.js hosting platform.

### Compiler Service
Deploy as a Docker container to AWS ECS, Google Cloud Run, or similar container platforms.

```bash
cd apps/compiler
docker build -t compiler-service .
docker run -p 3001:3001 --env-file .env compiler-service
```

## Environment Setup

### Guestbook App
Copy environment variables from your existing setup.

### Compiler Service
```bash
cd apps/compiler
cp env.example .env
# Edit .env with your AWS credentials and configuration
```

## Workflow

1. **Guest Interaction**: Guests use the guestbook app to record video/audio messages
2. **Message Storage**: Messages are stored in S3, metadata in DynamoDB
3. **Compilation Trigger**: Wedding host triggers video compilation via guestbook app
4. **Processing**: Compiler service stitches messages together
5. **Delivery**: Final video is uploaded to S3 and host is notified

## Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS, TypeScript
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: DynamoDB with ElectroDB
- **Storage**: AWS S3
- **Video Processing**: FFmpeg
- **Payments**: Stripe
- **Monorepo**: Turborepo
- **Deployment**: Docker, Vercel

## Contributing

1. Install dependencies: `npm install`
2. Make your changes
3. Test locally: `npm run dev`
4. Build to verify: `npm run build`
5. Submit a pull request

## License

Private project - All rights reserved.
