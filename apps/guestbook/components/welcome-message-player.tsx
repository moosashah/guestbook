"use client";

import { useState, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeMessagePlayerProps {
    eventId: string;
}

export function WelcomeMessagePlayer({ eventId }: WelcomeMessagePlayerProps) {
    const [welcomeMessageUrl, setWelcomeMessageUrl] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWelcomeMessageUrl = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`/api/welcome-message/${eventId}`);

                if (!response.ok) {
                    if (response.status === 404) {
                        setError("No welcome message available");
                    } else {
                        setError("Failed to load welcome message");
                    }
                    return;
                }

                const data = await response.json();
                setWelcomeMessageUrl(data.url);
            } catch (err) {
                console.error("Error fetching welcome message:", err);
                setError("Failed to load welcome message");
            } finally {
                setIsLoading(false);
            }
        };

        fetchWelcomeMessageUrl();
    }, [eventId]);

    const handlePlayPause = () => {
        const video = document.getElementById(`welcome-video-${eventId}`) as HTMLVideoElement;
        if (video) {
            if (isPlaying) {
                video.pause();
            } else {
                video.play();
            }
        }
    };

    const handleVideoPlay = () => setIsPlaying(true);
    const handleVideoPause = () => setIsPlaying(false);
    const handleVideoEnded = () => setIsPlaying(false);

    if (isLoading) {
        return (
            <div className="mb-6 bg-muted rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                    Welcome message from the couple:
                </p>
                <div className="aspect-video bg-black/10 rounded flex items-center justify-center">
                    <div className="animate-pulse">
                        <Volume2 className="h-12 w-12 text-muted-foreground" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !welcomeMessageUrl) {
        return null; // Don't show anything if there's no welcome message
    }

    return (
        <div className="mb-6 bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-3 text-center">
                Welcome message from the couple:
            </p>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                    id={`welcome-video-${eventId}`}
                    src={welcomeMessageUrl}
                    className="w-full h-full object-cover"
                    onPlay={handleVideoPlay}
                    onPause={handleVideoPause}
                    onEnded={handleVideoEnded}
                    controls={false}
                    playsInline
                />

                {/* Custom play/pause overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                        onClick={handlePlayPause}
                        size="lg"
                        className="bg-black/50 hover:bg-black/70 text-white rounded-full p-4"
                        variant="ghost"
                    >
                        {isPlaying ? (
                            <Pause className="h-8 w-8" />
                        ) : (
                            <Play className="h-8 w-8 ml-1" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
