'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Video, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface CompileVideoButtonProps {
    eventId: string;
    hasFinalVideo: boolean;
    onCompilationComplete: () => void;
}

interface CompilationStatus {
    eventId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    outputUrl?: string;
    error?: string;
}

export function CompileVideoButton({ eventId, hasFinalVideo, onCompilationComplete }: CompileVideoButtonProps) {
    const [isCompiling, setIsCompiling] = useState(false);
    const [compilationStatus, setCompilationStatus] = useState<CompilationStatus | null>(null);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    // Clear polling on unmount
    useEffect(() => {
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        };
    }, []);

    const startPolling = () => {
        // Clear any existing polling
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
        }

        pollingRef.current = setInterval(async () => {
            try {
                const response = await fetch(`/api/compile?eventId=${eventId}`);
                const status: CompilationStatus = await response.json();

                setCompilationStatus(status);

                if (status.status === 'completed') {
                    setIsCompiling(false);
                    if (pollingRef.current) {
                        clearInterval(pollingRef.current);
                        pollingRef.current = null;
                    }
                    toast.success('Video compilation completed!');
                    onCompilationComplete();
                } else if (status.status === 'failed') {
                    setIsCompiling(false);
                    if (pollingRef.current) {
                        clearInterval(pollingRef.current);
                        pollingRef.current = null;
                    }
                    toast.error(status.error || 'Video compilation failed');
                }
            } catch (error) {
                console.error('Polling error:', error);
                // Continue polling even if there's an error
            }
        }, 1000); // Poll every second
    };

    const handleCompile = async () => {
        if (hasFinalVideo) {
            toast.error('Final video already exists. Delete it first to recompile.');
            return;
        }

        setIsCompiling(true);
        setCompilationStatus(null);

        try {
            const response = await fetch('/api/compile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ eventId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to start compilation');
            }

            toast.success('Video compilation started!');
            startPolling();
        } catch (error) {
            console.error('Compilation failed:', error);
            toast.error((error as Error).message || 'Failed to start compilation');
            setIsCompiling(false);
        }
    };

    const stopCompilation = () => {
        setIsCompiling(false);
        setCompilationStatus(null);
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    };

    if (hasFinalVideo) {
        return null;
    }

    return (
        <div className="flex flex-col gap-2">
            <Button
                onClick={handleCompile}
                disabled={isCompiling}
                variant="default"
            >
                {isCompiling ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Compiling Video...
                    </>
                ) : (
                    <>
                        <Video className="mr-2 h-4 w-4" />
                        Compile Final Video
                    </>
                )}
            </Button>

            {isCompiling && compilationStatus && (
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Status: {compilationStatus.status}</span>
                        {compilationStatus.progress && (
                            <span>{Math.round(compilationStatus.progress)}%</span>
                        )}
                    </div>
                    {compilationStatus.progress && (
                        <Progress value={compilationStatus.progress} className="w-full" />
                    )}
                    <Button
                        onClick={stopCompilation}
                        variant="outline"
                        size="sm"
                        className="w-full"
                    >
                        Stop Monitoring
                    </Button>
                </div>
            )}
        </div>
    );
}
