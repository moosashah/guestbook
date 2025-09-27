import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface MediaFile {
    path: string;
    guestName: string;
    mediaType: 'video' | 'audio';
}

export class VideoProcessor {
    private fontPath: string;

    constructor() {
        // Set ffmpeg path based on environment
        // Docker/Alpine: /usr/bin/ffmpeg, macOS Homebrew: /opt/homebrew/bin/ffmpeg
        const ffmpegPath = process.env.FFMPEG_PATH ||
            (process.platform === 'darwin' ? '/opt/homebrew/bin/ffmpeg' : '/usr/bin/ffmpeg');

        // Set font path based on environment
        // Docker/Alpine: /usr/share/fonts/custom/Arial.ttf, macOS: system fonts
        this.fontPath = process.env.FONT_PATH ||
            (process.platform === 'darwin' ? '/System/Library/Fonts/Supplemental/Arial.ttf' : '/usr/share/fonts/custom/Arial.ttf');

        ffmpeg.setFfmpegPath(ffmpegPath);

        console.log(JSON.stringify({
            message: 'VideoProcessor initialized',
            ffmpegPath,
            fontPath: this.fontPath,
            platform: process.platform
        }, null, 4));

        // Validate font exists
        this.validateFontPath();
    }

    private async validateFontPath(): Promise<void> {
        try {
            await fs.access(this.fontPath);
            console.log(JSON.stringify({
                message: 'Font file validated successfully',
                fontPath: this.fontPath
            }, null, 4));
        } catch (error) {
            console.warn(JSON.stringify({
                warning: 'Font file not found, will use fallback',
                fontPath: this.fontPath,
                message: (error as Error).message
            }, null, 4));

            // Try fallback fonts
            const fallbackFonts = [
                '/usr/share/fonts/liberation/LiberationSans-Regular.ttf', // Alpine ttf-liberation
                '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf', // Debian/Ubuntu
                '/usr/share/fonts/dejavu/DejaVuSans.ttf', // Alternative Alpine
                '/System/Library/Fonts/Geneva.ttf' // macOS fallback
            ];

            for (const fallbackFont of fallbackFonts) {
                try {
                    await fs.access(fallbackFont);
                    this.fontPath = fallbackFont;
                    console.log(JSON.stringify({
                        message: 'Using fallback font',
                        fontPath: this.fontPath
                    }, null, 4));
                    return;
                } catch {
                    // Continue to next fallback
                }
            }

            console.error(JSON.stringify({
                error: 'No valid font found, text overlay may fail'
            }, null, 4));
        }
    }

    async stitchVideos(
        mediaFiles: MediaFile[],
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
        mediaFiles: MediaFile[],
        onProgress?: (progress: number) => void
    ): Promise<string[]> {
        const tempFiles: string[] = [];
        const totalFiles = mediaFiles.length;

        console.log(JSON.stringify({
            message: 'Converting files to consistent MP4 format',
            fileCount: totalFiles
        }, null, 4));

        for (let i = 0; i < mediaFiles.length; i++) {
            const mediaFile = mediaFiles[i];
            const tempFile = `/tmp/temp_${nanoid()}.mp4`;

            if (mediaFile.mediaType === 'audio') {
                // Convert audio to video with custom waveform and guest name
                await this.convertAudioToVideo(mediaFile.path, tempFile, mediaFile.guestName);
            } else {
                // Convert video to consistent format with guest name overlay
                await this.convertVideoToConsistentFormat(mediaFile.path, tempFile, mediaFile.guestName);
            }

            tempFiles.push(tempFile);

            // Update progress (0.1 to 0.7 for conversion step)
            const conversionProgress = 0.1 + (0.6 * (i + 1) / totalFiles);
            onProgress?.(conversionProgress);

            console.log(JSON.stringify({
                message: `Converted file ${i + 1}/${totalFiles}`,
                input: path.basename(mediaFile.path),
                output: path.basename(tempFile),
                type: mediaFile.mediaType,
                guestName: mediaFile.guestName
            }, null, 4));
        }

        return tempFiles;
    }

    private async convertAudioToVideo(inputPath: string, outputPath: string, guestName: string): Promise<void> {
        // Trim audio from the start (like proven method)
        const audioTrimStart = '0.1';

        console.log(JSON.stringify({
            message: 'Converting audio to video with custom waveform and guest name',
            guestName,
            trimStart: audioTrimStart
        }, null, 4));

        // Convert audio to video with custom waveform, background, and guest name overlay (exactly like proven method)
        const command = `ffmpeg -y -i "${inputPath}" ` +
            `-f lavfi -i "color=c=#FFFAF9:s=640x480" -r 25 ` +
            `-ss "${audioTrimStart}" ` +
            `-filter_complex "[0:a]showwaves=size=640x480:colors=#B34A6B:mode=line[vout];[1:v][vout]overlay=format=auto:shortest=1,format=yuv420p[v];[v]drawtext=text='${guestName}':fontfile='${this.fontPath}':fontcolor=#B34A6B:fontsize=44:x=(w-text_w)/2:y=h-80:shadowcolor=black@0.6:shadowx=2:shadowy=2[vfinal]" ` +
            `-map "[vfinal]" -map 0:a ` +
            `-c:v libx264 -c:a aac -preset fast -crf 23 ` +
            `-r 25 -video_track_timescale 25000 -avoid_negative_ts make_zero ` +
            `"${outputPath}"`;

        console.log(JSON.stringify({
            message: 'Audio to video conversion command',
            command
        }, null, 4));

        await execAsync(command);
    }

    private async convertVideoToConsistentFormat(inputPath: string, outputPath: string, guestName: string): Promise<void> {
        // Detect and trim black frames at the start (like proven method)
        const trimStart = await this.detectBlackFrameEnd(inputPath);

        console.log(JSON.stringify({
            message: 'Converting video with guest name overlay and black frame trimming',
            guestName,
            trimStart
        }, null, 4));

        // Convert video with guest name overlay and black frame trimming (exactly like proven method)
        const command = `ffmpeg -y -i "${inputPath}" ` +
            `-ss "${trimStart}" ` +
            `-vf "drawtext=text='${guestName}':fontfile='${this.fontPath}':fontcolor=#B34A6B:fontsize=44:x=(w-text_w)/2:y=h-80:shadowcolor=black@0.6:shadowx=2:shadowy=2" ` +
            `-c:v libx264 -c:a aac -preset fast -crf 23 ` +
            `-r 25 -video_track_timescale 25000 -avoid_negative_ts make_zero ` +
            `"${outputPath}"`;

        console.log(JSON.stringify({
            message: 'Video conversion command',
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
        // Use the exact proven method concatenation with additional flags
        const command = `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" ` +
            `-c:v copy -c:a copy ` +
            `-avoid_negative_ts make_zero ` +
            `-fflags +genpts ` +
            `"${outputPath}"`;

        console.log(JSON.stringify({
            message: 'Concatenating files using proven method',
            command
        }, null, 4));

        await execAsync(command);
    }

    private async detectBlackFrameEnd(inputPath: string): Promise<string> {
        try {
            console.log(JSON.stringify({
                message: 'Detecting first non-black frame',
                inputPath: path.basename(inputPath)
            }, null, 4));

            // Detect black frames using the same method as the bash script
            const { stdout } = await execAsync(
                `ffmpeg -i "${inputPath}" -vf "blackdetect=d=0.01:pix_th=0.05" -f null - 2>&1 | grep "black_end:" | head -1 | sed 's/.*black_end:\\([0-9.]*\\).*/\\1/' || echo ""`
            );

            const firstFrame = stdout.trim();

            if (!firstFrame || firstFrame === '') {
                // If no black frames detected, use aggressive trim like bash script
                const trimStart = '0.2';
                console.log(JSON.stringify({
                    message: 'No black frames detected, using aggressive trim',
                    trimStart
                }, null, 4));
                return trimStart;
            } else {
                // Start from the end of the black period with a small buffer
                const trimStart = Math.max(0, parseFloat(firstFrame) + 0.05).toString();
                console.log(JSON.stringify({
                    message: 'Black frames detected',
                    blackFrameEnd: firstFrame,
                    trimStart
                }, null, 4));
                return trimStart;
            }
        } catch (error) {
            console.error(JSON.stringify({
                error: 'Black frame detection failed, using default trim',
                message: (error as Error).message
            }, null, 4));
            return '0.2'; // Fallback to aggressive trim
        }
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



    async cleanup(mediaFiles: MediaFile[], outputPath?: string): Promise<void> {
        try {
            // Clean up downloaded media files
            await Promise.all(
                mediaFiles.map(async (mediaFile) => {
                    try {
                        await fs.unlink(mediaFile.path);
                        console.log(JSON.stringify({ message: 'Cleaned up file', file: mediaFile.path }, null, 4));
                    } catch (error) {
                        console.error(JSON.stringify({
                            error: 'Failed to cleanup file',
                            file: mediaFile.path,
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
