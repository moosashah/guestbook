// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { CompilerService } from './services/compiler';
import { S3Service } from './services/s3';

const app = express();
const port = process.env.PORT || 3001;

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
