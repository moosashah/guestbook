/**
 * Client-side upload utilities with progress tracking
 */

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (response: any) => void;
  onError?: (error: Error) => void;
}

export interface MessageUploadData {
  event_id: string;
  guest_name: string;
  media_type: 'audio' | 'video';
  message_blob: Blob;
}

interface UploadPart {
  ETag: string;
  PartNumber: number;
}

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

/**
 * Upload a message with progress tracking using direct S3 multipart upload
 */
export const uploadMessage = async (
  data: MessageUploadData,
  options: UploadOptions = {}
): Promise<any> => {
  const { onProgress, onSuccess, onError } = options;

  try {
    const { event_id, guest_name, media_type, message_blob } = data;
    const fileSize = message_blob.size;

    console.log(
      `[upload-client] Starting multipart upload for ${media_type} message, size: ${fileSize} bytes`
    );

    // Calculate number of parts
    const partsCount = Math.ceil(fileSize / CHUNK_SIZE);

    console.log(`[upload-client] File will be split into ${partsCount} parts`);

    // Step 1: Initiate multipart upload and get presigned URLs
    const initiateResponse = await fetch('/api/message/initiate-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_id,
        guest_name,
        media_type,
        file_size: fileSize,
        parts_count: partsCount,
      }),
    });

    if (!initiateResponse.ok) {
      const errorData = await initiateResponse.json();
      throw new Error(errorData.error || 'Failed to initiate upload');
    }

    const {
      message_id,
      upload_id,
      message_key,
      presigned_urls,
    }: {
      message_id: string;
      upload_id: string;
      message_key: string;
      presigned_urls: string[];
    } = await initiateResponse.json();

    console.log(
      `[upload-client] Upload initiated, message_id: ${message_id}, upload_id: ${upload_id}`
    );

    // Step 2: Upload each part directly to S3
    const uploadedParts: UploadPart[] = [];
    let uploadedBytes = 0;

    try {
      for (let partNumber = 1; partNumber <= partsCount; partNumber++) {
        const start = (partNumber - 1) * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, fileSize);
        const chunk = message_blob.slice(start, end);

        console.log(
          `[upload-client] Uploading part ${partNumber}/${partsCount}, size: ${chunk.size} bytes`
        );

        // Upload part to S3 using presigned URL
        const uploadResponse = await fetch(presigned_urls[partNumber - 1], {
          method: 'PUT',
          body: chunk,
          headers: {
            'Content-Type':
              media_type === 'video' ? 'video/webm' : 'audio/webm',
          },
        });

        if (!uploadResponse.ok) {
          throw new Error(
            `Failed to upload part ${partNumber}: ${uploadResponse.status} ${uploadResponse.statusText}`
          );
        }

        // Get ETag from response headers
        const etag = uploadResponse.headers.get('ETag');
        if (!etag) {
          throw new Error(`No ETag returned for part ${partNumber}`);
        }

        uploadedParts.push({
          ETag: etag,
          PartNumber: partNumber,
        });

        uploadedBytes += chunk.size;

        // Report progress
        if (onProgress) {
          const progress: UploadProgress = {
            loaded: uploadedBytes,
            total: fileSize,
            percentage: Math.round((uploadedBytes / fileSize) * 100),
          };
          console.log(
            `[upload-client] Upload progress: ${progress.percentage}%`
          );
          onProgress(progress);
        }
      }

      console.log(
        `[upload-client] All parts uploaded successfully, completing upload...`
      );

      // Step 3: Complete multipart upload and create message record
      const completeResponse = await fetch('/api/message/complete-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message_id,
          event_id,
          guest_name,
          media_type,
          message_key,
          upload_id,
          parts: uploadedParts,
        }),
      });

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json();
        throw new Error(errorData.error || 'Failed to complete upload');
      }

      const result = await completeResponse.json();
      console.log('[upload-client] Upload completed successfully:', result);

      if (onSuccess) onSuccess(result);
      return result;
    } catch (uploadError) {
      // If upload fails, abort the multipart upload to clean up S3 resources
      console.error(
        '[upload-client] Upload failed, aborting multipart upload...'
      );
      try {
        await fetch('/api/message/abort-upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message_key,
            upload_id,
          }),
        });
        console.log('[upload-client] Multipart upload aborted successfully');
      } catch (abortError) {
        console.error(
          '[upload-client] Failed to abort multipart upload:',
          abortError
        );
      }
      throw uploadError;
    }
  } catch (error) {
    console.error('[upload-client] Error during upload:', error);
    const uploadError =
      error instanceof Error ? error : new Error('Unknown upload error');
    if (onError) onError(uploadError);
    throw uploadError;
  }
};

/**
 * Format bytes to human readable format
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Format upload speed
 */
export const formatSpeed = (bytesPerSecond: number): string => {
  return formatBytes(bytesPerSecond) + '/s';
};

/**
 * Calculate estimated time remaining
 */
export const calculateETA = (
  loaded: number,
  total: number,
  startTime: number
): string => {
  const elapsed = (Date.now() - startTime) / 1000; // seconds
  const rate = loaded / elapsed; // bytes per second
  const remaining = (total - loaded) / rate; // seconds remaining

  if (remaining < 60) {
    return `${Math.round(remaining)}s`;
  } else if (remaining < 3600) {
    return `${Math.round(remaining / 60)}m`;
  } else {
    return `${Math.round(remaining / 3600)}h`;
  }
};
