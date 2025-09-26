#!/usr/bin/env node

const {
  createEventEntity,
  createMessageEntity,
} = require('../packages/shared/dist');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs').promises;
const path = require('path');
const DynamoDB = require('aws-sdk/clients/dynamodb');

// Load environment variables
require('dotenv').config();

const eventId = process.argv[2];
if (!eventId) {
  console.error('Usage: node bin/download-messages.js <eventId>');
  process.exit(1);
}

// Create DynamoDB client
const client = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'eu-west-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Create S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-west-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const bucketName = process.env.S3_BUCKET_NAME || 'guestbook-assets-2024-dev';

// Create entity instances
const MessageEntity = createMessageEntity(client);

async function downloadFile(s3Key, localPath) {
  try {
    console.log(`Downloading ${s3Key} to ${localPath}`);

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      throw new Error(`No body in S3 response for key: ${s3Key}`);
    }

    // Convert stream to buffer
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Write to local file
    await fs.writeFile(localPath, buffer);
    console.log(`✓ Downloaded ${s3Key} (${buffer.length} bytes)`);

    return localPath;
  } catch (error) {
    console.error(`✗ Failed to download ${s3Key}:`, error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log(`Fetching messages for event: ${eventId}`);

    // Fetch all messages for the event
    const messages = await MessageEntity.query
      .event({ event_id: eventId })
      .go();

    if (!messages.data || messages.data.length === 0) {
      console.log('No messages found for this event');
      return;
    }

    console.log(`Found ${messages.data.length} messages`);

    // Create messages directory if it doesn't exist
    const messagesDir = path.join(__dirname, '..', 'messages');
    await fs.mkdir(messagesDir, { recursive: true });

    // Download each message file
    const downloadedFiles = [];
    for (let i = 0; i < messages.data.length; i++) {
      const message = messages.data[i];
      const extension = message.media_type === 'video' ? 'webm' : 'wav';
      const localFileName = `${i + 1}_${message.guest_name.replace(/[^a-zA-Z0-9]/g, '_')}_${message.media_type}.${extension}`;
      const localPath = path.join(messagesDir, localFileName);

      try {
        await downloadFile(message.media_key, localPath);
        downloadedFiles.push({
          path: localPath,
          type: message.media_type,
          guestName: message.guest_name,
        });
      } catch (error) {
        console.error(
          `Failed to download message from ${message.guest_name}:`,
          error.message
        );
      }
    }

    console.log(
      `\n✓ Downloaded ${downloadedFiles.length} files to ./messages/`
    );

    // Create a manifest file
    const manifest = {
      eventId,
      downloadedAt: new Date().toISOString(),
      files: downloadedFiles.map(f => ({
        path: path.relative(path.join(__dirname, '..'), f.path),
        type: f.type,
        guestName: f.guestName,
      })),
    };

    await fs.writeFile(
      path.join(messagesDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    console.log('✓ Created manifest.json');
    console.log('\nFiles ready for FFmpeg testing!');
    console.log('Run: ./bin/ffmpeg-test.sh to compile with different settings');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
