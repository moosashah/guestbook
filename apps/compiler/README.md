# Compiler Service

A microservice that stitches together guest messages (video/audio) and uploads the final compiled video to S3 for wedding hosts to watch.

## Features

- Fetches guest messages from DynamoDB
- Downloads media files from S3
- Stitches videos together using FFmpeg
- Adds intro/outro slides
- Uploads final compiled video to S3
- Provides compilation status tracking
- Webhook notifications for completion

## API Endpoints

### POST `/compile/:eventId`
Starts compilation for an event.

**Body:**
```json
{
  "webhookUrl": "https://your-app.com/webhook/compilation-complete" // optional
}
```

**Response:**
```json
{
  "message": "Compilation started",
  "eventId": "event-123",
  "status": "processing"
}
```

### GET `/status/:eventId`
Gets compilation status for an event.

**Response:**
```json
{
  "eventId": "event-123",
  "status": "completed",
  "progress": 100,
  "outputUrl": "https://s3-bucket.amazonaws.com/compiled-videos/event-123/final-xyz.mp4"
}
```

### GET `/health`
Health check endpoint.

## Environment Variables

**Important:** The compiler service requires AWS credentials to function. 

Copy `env.example` to `.env` and configure:

- `AWS_REGION`: AWS region (default: eu-west-2)
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `S3_BUCKET_NAME`: S3 bucket name for media files
- `PORT`: Service port (default: 3001)
- `FFMPEG_PATH`: Custom FFmpeg path (optional)

## Development

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Docker

```bash
# Build image
docker build -t compiler-service .

# Run container
docker run -p 3001:3001 --env-file .env compiler-service
```

## Dependencies

- **FFmpeg**: Required for video processing
  - **Development**: Install locally (`brew install ffmpeg` on macOS)
  - **Production**: Automatically included in Docker container
- **Node.js 18+**: Runtime environment
- **AWS S3**: Media storage
- **DynamoDB**: Message and event data

## Video Processing Pipeline

1. **Fetch Data**: Retrieve event details and messages from DynamoDB
2. **Download Media**: Download all media files from S3 to local storage
3. **Create Intro**: Generate intro slide with event name and welcome message
4. **Stitch Videos**: Combine all media files in chronological order
5. **Add Outro**: Append thank you slide
6. **Upload**: Upload final video to S3
7. **Cleanup**: Remove temporary files
8. **Notify**: Send webhook notification (if configured)

## Error Handling

The service includes comprehensive error handling and logging. All errors are logged with structured JSON format for easy debugging and monitoring.

## Scaling Considerations

- Consider using a queue system (SQS) for handling multiple compilation requests
- Implement distributed storage for temporary files in multi-instance deployments
- Add monitoring and alerting for long-running compilations
- Consider using AWS Lambda for serverless processing of smaller events
