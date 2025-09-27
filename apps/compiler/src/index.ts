// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { CompilerService } from './services/compiler';
import { S3Service } from './services/s3';

const app = express();
const port = process.env.PORT || 3001;

// Inactivity timer - exit after 10 seconds of no requests
let inactivityTimer: NodeJS.Timeout;
const INACTIVITY_TIMEOUT = 10 * 1000; // 10 seconds

function resetInactivityTimer() {
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
    }
    inactivityTimer = setTimeout(() => {
        console.log(JSON.stringify({
            message: 'No requests received for 10 seconds, shutting down compiler service',
            timestamp: new Date().toISOString()
        }, null, 4));
        process.exit(0);
    }, INACTIVITY_TIMEOUT);
}

// Initialize the timer
resetInactivityTimer();

// Middleware to reset timer on every request
app.use((req, res, next) => {
    resetInactivityTimer();
    next();
});

app.use(express.json());

const compilerService = new CompilerService();
const s3Service = new S3Service();

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'compiler' });
});

// Compile messages for an event
app.post('/compile/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        const { webhookUrl } = req.body;

        console.log(JSON.stringify({ message: 'Starting compilation', eventId }, null, 4));

        // Start compilation in background
        compilerService.compileEvent(eventId, webhookUrl).catch(error => {
            console.error(JSON.stringify({ error: 'Compilation failed', eventId, message: (error as Error).message }, null, 4));
        });

        res.json({
            message: 'Compilation started',
            eventId,
            status: 'processing'
        });
    } catch (error) {
        console.error(JSON.stringify({ error: 'Failed to start compilation', message: (error as Error).message }, null, 4));
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
        console.error(JSON.stringify({ error: 'Failed to get status', message: (error as Error).message }, null, 4));
        res.status(500).json({ error: 'Failed to get compilation status' });
    }
});

app.listen(port, () => {
    console.log(JSON.stringify({ message: `Compiler service running on port ${port}` }, null, 4));
});
