import { Card, CardContent } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"
import type { Message } from "@/lib/types"
import { Mic, Video, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MessageCardProps {
  message: Message
}

export default function MessageCard({ message }: MessageCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-muted rounded-full flex items-center justify-center">
            {message.mediaType === "video" ? (
              <Video className="h-6 w-6 text-muted-foreground" />
            ) : (
              <Mic className="h-6 w-6 text-muted-foreground" />
            )}
          </div>

          <div className="flex-grow min-w-0">
            <h3 className="font-semibold truncate">{message.guestName}</h3>
            <p className="text-sm text-muted-foreground">{formatDate(message.createdAt)}</p>
          </div>

          <Button size="sm" variant="outline" className="flex-shrink-0">
            <Play className="h-4 w-4 mr-1" />
            Play
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
