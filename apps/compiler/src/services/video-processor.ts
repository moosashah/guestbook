import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

export class VideoProcessor {
    constructor() {
        // Set ffmpeg path based on environment
        // Docker/Alpine: /usr/bin/ffmpeg, macOS Homebrew: /opt/homebrew/bin/ffmpeg
        const ffmpegPath = process.env.FFMPEG_PATH ||
            (process.platform === 'darwin' ? '/opt/homebrew/bin/ffmpeg' : '/usr/bin/ffmpeg');

        ffmpeg.setFfmpegPath(ffmpegPath);

        console.log(JSON.stringify({
            message: 'VideoProcessor initialized',
            ffmpegPath,
            platform: process.platform
        }, null, 4));
    }

    async stitchVideos(
        mediaFiles: string[],
        event: any,
        onProgress?: (progress: number) => void
    ): Promise<string> {
        const outputPath = `/tmp/final_${nanoid()}.mp4`;

        console.log(JSON.stringify({
            message: 'Starting video stitching',
            inputCount: mediaFiles.length,
            outputPath
        }, null, 4));

        return new Promise((resolve, reject) => {
            const command = ffmpeg();

            // Add all media files
            mediaFiles.forEach(file => {
                command.input(file);
            });

            // Configure output
            command
                .outputOptions([
                    '-c:v libx264',
                    '-c:a aac',
                    '-preset fast',
                    '-crf 23',
                    '-movflags +faststart'
                ])
                .output(outputPath)
                .on('start', (commandLine) => {
                    console.log(JSON.stringify({
                        message: 'FFmpeg process started',
                        command: commandLine
                    }, null, 4));
                })
                .on('progress', (progress) => {
                    console.log(JSON.stringify({
                        message: 'Processing progress',
                        percent: progress.percent
                    }, null, 4));

                    if (onProgress && progress.percent) {
                        onProgress(progress.percent / 100);
                    }
                })
                .on('end', () => {
                    console.log(JSON.stringify({
                        message: 'Video stitching completed',
                        outputPath
                    }, null, 4));
                    resolve(outputPath);
                })
                .on('error', (error) => {
                    console.error(JSON.stringify({
                        error: 'FFmpeg error',
                        message: (error as Error).message
                    }, null, 4));
                    reject(error);
                });

            // Start processing
            command.run();
        });
    }



    async cleanup(mediaFiles: string[], outputPath?: string): Promise<void> {
        try {
            // Clean up downloaded media files
            await Promise.all(
                mediaFiles.map(async (file) => {
                    try {
                        await fs.unlink(file);
                        console.log(JSON.stringify({ message: 'Cleaned up file', file }, null, 4));
                    } catch (error) {
                        console.error(JSON.stringify({
                            error: 'Failed to cleanup file',
                            file,
                            message: (error as Error).message
                        }, null, 4));
                    }
                })
            );

            // Clean up output file if specified
            if (outputPath) {
                try {
                    await fs.unlink(outputPath);
                    console.log(JSON.stringify({ message: 'Cleaned up output file', outputPath }, null, 4));
                } catch (error) {
                    console.error(JSON.stringify({
                        error: 'Failed to cleanup output file',
                        outputPath,
                        message: (error as Error).message
                    }, null, 4));
                }
            }
        } catch (error) {
            console.error(JSON.stringify({
                error: 'Cleanup failed',
                message: (error as Error).message
            }, null, 4));
        }
    }
}
