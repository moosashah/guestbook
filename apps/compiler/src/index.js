// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { CompilerService } from './services/stitcher.js';

const app = express();
const port = process.env.PORT || 3001;

// Inactivity timer - exit after 10 seconds of no requests AND no active compilations
// Skip timeout in development mode
let inactivityTimer;
const INACTIVITY_TIMEOUT = 10 * 1000; // 10 seconds
const activeCompilations = new Set();
const isDevelopment = process.env.NODE_ENV === 'development';

function resetInactivityTimer(activeCompilations) {
  // Skip timeout in development mode
  if (isDevelopment) {
    console.log(
      JSON.stringify(
        {
          message: 'Development mode detected, skipping inactivity timeout',
          NODE_ENV: process.env.NODE_ENV,
          timestamp: new Date().toISOString(),
        },
        null,
        4
      )
    );
    return;
  }

  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }
  inactivityTimer = setTimeout(() => {
    // Check if there are any active compilations before shutting down
    if (activeCompilations.size > 0) {
      console.log(
        JSON.stringify(
          {
            message:
              'No requests received for 10 seconds, but compilations are active. Resetting timer.',
            activeCompilations: Array.from(activeCompilations),
            timestamp: new Date().toISOString(),
          },
          null,
          4
        )
      );
      resetInactivityTimer(activeCompilations); // Reset timer and check again later
      return;
    }

    console.log(
      JSON.stringify(
        {
          message:
            'No requests received for 10 seconds, shutting down compiler service',
          timestamp: new Date().toISOString(),
        },
        null,
        4
      )
    );
    process.exit(0);
  }, INACTIVITY_TIMEOUT);
}

// Initialize the timer (will be skipped in development)
resetInactivityTimer(activeCompilations);

// Middleware to reset timer on every request (will be skipped in development)
app.use((_req, _res, next) => {
  resetInactivityTimer(activeCompilations);
  next();
});

app.use(express.json());

const compilerService = new CompilerService(activeCompilations);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'compiler' });
});

// Compile messages for an event
app.post('/compile/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { webhookUrl } = req.body;

    console.log(
      JSON.stringify({ message: 'Starting compilation', eventId }, null, 4)
    );

    // Start compilation in background (CompilerService manages activeCompilations internally)
    compilerService.compileEvent(eventId, webhookUrl).catch(error => {
      console.error(
        JSON.stringify(
          { error: 'Compilation failed', eventId, message: error.message },
          null,
          4
        )
      );
    });

    res.json({
      message: 'Compilation started',
      eventId,
      status: 'processing',
    });
  } catch (error) {
    console.error(
      JSON.stringify(
        { error: 'Failed to start compilation', message: error.message },
        null,
        4
      )
    );
    res.status(500).json({ error: 'Failed to start compilation' });
  }
});

// Get compilation status
app.get('/status/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const status = await compilerService.getCompilationStatus(eventId);
    res.json(status);
  } catch (error) {
    console.error(
      JSON.stringify(
        { error: 'Failed to get status', message: error.message },
        null,
        4
      )
    );
    res.status(500).json({ error: 'Failed to get compilation status' });
  }
});

app.listen(port, () => {
  console.log(
    JSON.stringify(
      { message: `Compiler service running on port ${port}` },
      null,
      4
    )
  );
});
