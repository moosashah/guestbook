# Guestbook Monorepo

A wedding guestbook application with video message compilation, built with Turborepo.

## testing scripts

run `node bin/download-messages.js <eventId>` to download messages for that event

run `./bin/proven-concat-method` to compile into a single video

## Architecture

This monorepo contains:

- **`apps/guestbook`**: Next.js web application for collecting guest messages
- **`apps/compiler`**: Node.js microservice for stitching videos and uploading to S3
- **`apps/auth`**: Hono microservice that wraps openauth for auth
- **`packages/shared`**: had compiling issues of getting it into compiler so hard coded it into the compiler service which is written in js to skip build step. this could get nuked and just have each service have them hard coded

## Quick Start

```bash
# Install dependencies
pnpm install

# Start all apps in development mode
pnpm dev
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
- Webhook notifications - This was AI generated, leaving in for now
- Docker support

### Auth Service (Port 3002)

- Hono microservice
- openauth with dynamodb as persistence layer

## Deployment

### Guestbook + Auth

Deploys to Vercel when code is merged to main

### Compiler Service

Deploys to Fly.io when code is merged to main

## Environment Setup

```bash
cd apps/{app}
cp env.example .env
```

## Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS, TypeScript
- **Backend**: Node.js, Express.js, Hono, TypeScript
- **Database**: DynamoDB with ElectroDB
- **Storage**: AWS S3
- **Video Processing**: FFmpeg
- **Payments**: Stripe
- **Monorepo**: Turborepo
- **Deployment**: Docker, Vercel
