import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
            message: 'Starting video stitching using proven method',
            inputCount: mediaFiles.length,
            outputPath
        }, null, 4));

        try {
            // Step 1: Convert all files to consistent MP4 format
            onProgress?.(0.1);
            const tempFiles = await this.convertToConsistentFormat(mediaFiles, onProgress);

            // Step 2: Create concatenation list
            onProgress?.(0.7);
            const concatListPath = await this.createConcatList(tempFiles);

            // Step 3: Concatenate using proven method
            onProgress?.(0.8);
            await this.concatenateFiles(concatListPath, outputPath);

            // Cleanup temporary files
            await this.cleanupTempFiles(tempFiles, concatListPath);

            onProgress?.(1.0);

            console.log(JSON.stringify({
                message: 'Video stitching completed using proven method',
                outputPath
            }, null, 4));

            return outputPath;
        } catch (error) {
            console.error(JSON.stringify({
                error: 'Video stitching failed',
                message: (error as Error).message
            }, null, 4));
            throw error;
        }
    }

    private async convertToConsistentFormat(
        mediaFiles: string[],
        onProgress?: (progress: number) => void
    ): Promise<string[]> {
        const tempFiles: string[] = [];
        const totalFiles = mediaFiles.length;

        console.log(JSON.stringify({
            message: 'Converting files to consistent MP4 format',
            fileCount: totalFiles
        }, null, 4));

        for (let i = 0; i < mediaFiles.length; i++) {
            const file = mediaFiles[i];
            const tempFile = `/tmp/temp_${nanoid()}.mp4`;

            // Determine if file is audio or video based on extension
            const isAudio = file.toLowerCase().endsWith('.wav') ||
                file.toLowerCase().endsWith('.mp3') ||
                file.toLowerCase().endsWith('.m4a') ||
                file.toLowerCase().endsWith('.aac');

            if (isAudio) {
                // Convert audio to video with black background (proven method)
                await this.convertAudioToVideo(file, tempFile);
            } else {
                // Convert video to consistent format
                await this.convertVideoToConsistentFormat(file, tempFile);
            }

            tempFiles.push(tempFile);

            // Update progress (0.1 to 0.7 for conversion step)
            const conversionProgress = 0.1 + (0.6 * (i + 1) / totalFiles);
            onProgress?.(conversionProgress);

            console.log(JSON.stringify({
                message: `Converted file ${i + 1}/${totalFiles}`,
                input: path.basename(file),
                output: path.basename(tempFile),
                type: isAudio ? 'audio-to-video' : 'video'
            }, null, 4));
        }

        return tempFiles;
    }

    private async convertAudioToVideo(inputPath: string, outputPath: string): Promise<void> {
        // Get audio duration first
        const { stdout: durationOutput } = await execAsync(
            `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${inputPath}"`
        );
        const duration = parseFloat(durationOutput.trim());

        // Convert audio to video with black background (exactly like proven method)
        const command = `ffmpeg -y -f lavfi -i "color=c=black:s=640x480:d=${duration}" -i "${inputPath}" -c:v libx264 -c:a aac -preset fast -crf 23 -shortest "${outputPath}"`;

        console.log(JSON.stringify({
            message: 'Converting audio to video',
            duration: `${duration}s`,
            command
        }, null, 4));

        await execAsync(command);
    }

    private async convertVideoToConsistentFormat(inputPath: string, outputPath: string): Promise<void> {
        // Convert video to consistent format (exactly like proven method)
        const command = `ffmpeg -y -i "${inputPath}" -c:v libx264 -c:a aac -preset fast -crf 23 "${outputPath}"`;

        console.log(JSON.stringify({
            message: 'Converting video to consistent format',
            command
        }, null, 4));

        await execAsync(command);
    }

    private async createConcatList(tempFiles: string[]): Promise<string> {
        const concatListPath = `/tmp/concat_list_${nanoid()}.txt`;

        const concatContent = tempFiles.map(file => `file '${file}'`).join('\n');
        await fs.writeFile(concatListPath, concatContent);

        console.log(JSON.stringify({
            message: 'Created concatenation list',
            path: concatListPath,
            files: tempFiles.length,
            content: concatContent
        }, null, 4));

        return concatListPath;
    }

    private async concatenateFiles(concatListPath: string, outputPath: string): Promise<void> {
        // Use the exact proven method concatenation
        const command = `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${outputPath}"`;

        console.log(JSON.stringify({
            message: 'Concatenating files using proven method',
            command
        }, null, 4));

        await execAsync(command);
    }

    private async cleanupTempFiles(tempFiles: string[], concatListPath: string): Promise<void> {
        try {
            // Clean up temporary MP4 files
            await Promise.all(
                tempFiles.map(async (file) => {
                    try {
                        await fs.unlink(file);
                    } catch (error) {
                        console.error(JSON.stringify({
                            error: 'Failed to cleanup temp file',
                            file,
                            message: (error as Error).message
                        }, null, 4));
                    }
                })
            );

            // Clean up concat list
            try {
                await fs.unlink(concatListPath);
            } catch (error) {
                console.error(JSON.stringify({
                    error: 'Failed to cleanup concat list',
                    file: concatListPath,
                    message: (error as Error).message
                }, null, 4));
            }

            console.log(JSON.stringify({
                message: 'Cleaned up temporary files',
                tempFilesCount: tempFiles.length
            }, null, 4));
        } catch (error) {
            console.error(JSON.stringify({
                error: 'Temp file cleanup failed',
                message: (error as Error).message
            }, null, 4));
        }
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
