"use client";

import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { formatBytes, formatSpeed, calculateETA, UploadProgress } from "@/lib/upload-client";
import { useState, useEffect } from "react";

interface UploadProgressProps {
    progress: UploadProgress | null;
    status: "idle" | "uploading" | "success" | "error";
    error?: string;
    onRetry?: () => void;
    onCancel?: () => void;
    className?: string;
}

export function UploadProgressComponent({
    progress,
    status,
    error,
    onRetry,
    onCancel,
    className,
}: UploadProgressProps) {
    const [startTime, setStartTime] = useState<number>(Date.now());
    const [uploadSpeed, setUploadSpeed] = useState<number>(0);

    // Reset start time when upload begins
    useEffect(() => {
        if (status === "uploading" && !progress) {
            setStartTime(Date.now());
        }
    }, [status, progress]);

    // Calculate upload speed
    useEffect(() => {
        if (progress && status === "uploading") {
            const elapsed = (Date.now() - startTime) / 1000;
            if (elapsed > 0) {
                setUploadSpeed(progress.loaded / elapsed);
            }
        }
    }, [progress, startTime, status]);

    if (status === "idle") {
        return null;
    }

    return (
        <Card className={className}>
            <CardContent className="p-4">
                <div className="space-y-4">
                    {/* Status Icon and Title */}
                    <div className="flex items-center gap-3">
                        {status === "uploading" && (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                                <span className="font-medium">Uploading message...</span>
                            </>
                        )}
                        {status === "success" && (
                            <>
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <span className="font-medium text-green-700">Upload completed!</span>
                            </>
                        )}
                        {status === "error" && (
                            <>
                                <XCircle className="h-5 w-5 text-red-500" />
                                <span className="font-medium text-red-700">Upload failed</span>
                            </>
                        )}
                    </div>

                    {/* Progress Bar */}
                    {(status === "uploading" || status === "success") && progress && (
                        <div className="space-y-2">
                            <Progress value={progress.percentage} className="w-full" />
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>{progress.percentage}%</span>
                                <span>
                                    {formatBytes(progress.loaded)} / {formatBytes(progress.total)}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Upload Stats */}
                    {status === "uploading" && progress && uploadSpeed > 0 && (
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Speed: {formatSpeed(uploadSpeed)}</span>
                            {progress.loaded < progress.total && (
                                <span>ETA: {calculateETA(progress.loaded, progress.total, startTime)}</span>
                            )}
                        </div>
                    )}

                    {/* Error Message */}
                    {status === "error" && error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 justify-end">
                        {status === "uploading" && onCancel && (
                            <Button variant="outline" size="sm" onClick={onCancel}>
                                Cancel
                            </Button>
                        )}
                        {status === "error" && onRetry && (
                            <Button variant="outline" size="sm" onClick={onRetry}>
                                Retry
                            </Button>
                        )}
                        {status === "success" && (
                            <div className="text-sm text-green-600">
                                Your message has been uploaded successfully!
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
