# Setup Instructions

## Environment Variables

Both apps require AWS credentials to function properly. Follow these steps:

### 1. Guestbook App (`apps/guestbook/`)

Copy the example environment file and fill in your credentials:

```bash
cd apps/guestbook
cp env.example .env.local
```

Edit `.env.local` with your actual values:
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# AWS Configuration  
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=eu-west-2

# Compiler Service URL
COMPILER_SERVICE_URL=http://localhost:3001
```

### 2. Compiler Service (`apps/compiler/`)

Copy the example environment file and fill in your credentials:

```bash
cd apps/compiler
cp env.example .env
```

Edit `.env` with your actual values:
```bash
# AWS Configuration
AWS_REGION=eu-west-2
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
S3_BUCKET_NAME=guestbook-assets-2024-dev

# Service Configuration
PORT=3001

# FFmpeg Configuration (optional)
FFMPEG_PATH=/usr/bin/ffmpeg
```

## Development

### Setup Environment Variables

```bash
# Guestbook app
cd apps/guestbook
cp env.example .env.local
# Edit .env.local with your AWS and Stripe credentials

# Compiler service  
cd ../compiler
cp env.example .env
# Edit .env with your AWS credentials
```

### Start All Services

```bash
# From the root directory
pnpm install
pnpm dev
```

This will start:
- Guestbook app on http://localhost:3000 (local Next.js)
- Compiler service on http://localhost:3001 (Docker with FFmpeg)

The compiler service automatically runs in Docker (with FFmpeg included), while the guestbook app runs locally for fast development.

## Troubleshooting

### "Missing credentials in config" Error

This means AWS credentials are not properly configured. Make sure:

1. You've created the `.env` files in both apps
2. The environment variables are correctly named (no typos)
3. The values don't have extra spaces or quotes
4. You've restarted the dev server after adding the environment variables

### FFmpeg Not Found

**If using the recommended Docker setup:** FFmpeg is automatically included in the Docker container, so no additional installation is needed.

**If running compiler locally:** Install FFmpeg on your system:

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Or set custom path in .env
FFMPEG_PATH=/path/to/your/ffmpeg
```

## Production Deployment

### Guestbook App
Deploy to Vercel, Netlify, or similar platform. Make sure to set all environment variables in your deployment platform.

### Compiler Service
Deploy as a Docker container to AWS ECS, Google Cloud Run, or similar:

```bash
cd apps/compiler
docker build -t compiler-service .
docker run -p 3001:3001 --env-file .env compiler-service
```
