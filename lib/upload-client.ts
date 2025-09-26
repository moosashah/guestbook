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
    media_type: "audio" | "video";
    message_blob: Blob;
}

/**
 * Upload a message with progress tracking
 */
export const uploadMessage = async (
    data: MessageUploadData,
    options: UploadOptions = {}
): Promise<any> => {
    const { onProgress, onSuccess, onError } = options;

    try {
        // Create FormData for the request
        const formData = new FormData();
        formData.append("event_id", data.event_id);
        formData.append("guest_name", data.guest_name);
        formData.append("media_type", data.media_type);
        formData.append("message_blob", data.message_blob);

        console.log(`[upload-client] Starting upload for ${data.media_type} message, size: ${data.message_blob.size} bytes`);

        // Create XMLHttpRequest for progress tracking
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            // Track upload progress
            xhr.upload.addEventListener("progress", (event) => {
                if (event.lengthComputable && onProgress) {
                    const progress: UploadProgress = {
                        loaded: event.loaded,
                        total: event.total,
                        percentage: Math.round((event.loaded / event.total) * 100),
                    };
                    console.log(`[upload-client] Upload progress: ${progress.percentage}%`);
                    onProgress(progress);
                }
            });

            // Handle completion
            xhr.addEventListener("load", () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        console.log("[upload-client] Upload completed successfully:", response);
                        if (onSuccess) onSuccess(response);
                        resolve(response);
                    } catch (parseError) {
                        const error = new Error("Failed to parse response");
                        console.error("[upload-client] Response parse error:", parseError);
                        if (onError) onError(error);
                        reject(error);
                    }
                } else {
                    try {
                        const errorResponse = JSON.parse(xhr.responseText);
                        const error = new Error(errorResponse.error || `Upload failed with status ${xhr.status}`);
                        console.error("[upload-client] Upload failed:", errorResponse);
                        if (onError) onError(error);
                        reject(error);
                    } catch (parseError) {
                        const error = new Error(`Upload failed with status ${xhr.status}`);
                        console.error("[upload-client] Upload failed with unparseable response");
                        if (onError) onError(error);
                        reject(error);
                    }
                }
            });

            // Handle errors
            xhr.addEventListener("error", () => {
                const error = new Error("Network error during upload");
                console.error("[upload-client] Network error during upload");
                if (onError) onError(error);
                reject(error);
            });

            // Handle timeout
            xhr.addEventListener("timeout", () => {
                const error = new Error("Upload timeout");
                console.error("[upload-client] Upload timeout");
                if (onError) onError(error);
                reject(error);
            });

            // Configure and send request
            xhr.open("POST", "/api/message");
            xhr.timeout = 5 * 60 * 1000; // 5 minutes timeout for large files
            xhr.send(formData);
        });
    } catch (error) {
        console.error("[upload-client] Error preparing upload:", error);
        const uploadError = error instanceof Error ? error : new Error("Unknown upload error");
        if (onError) onError(uploadError);
        throw uploadError;
    }
};

/**
 * Format bytes to human readable format
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

/**
 * Format upload speed
 */
export const formatSpeed = (bytesPerSecond: number): string => {
    return formatBytes(bytesPerSecond) + "/s";
};

/**
 * Calculate estimated time remaining
 */
export const calculateETA = (loaded: number, total: number, startTime: number): string => {
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
