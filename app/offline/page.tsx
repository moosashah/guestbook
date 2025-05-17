import Link from "next/link"
import { WifiOff, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function OfflinePage() {
  return (
    <div className="container mx-auto py-12 px-4 flex items-center justify-center min-h-screen">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 pb-6 px-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600 mb-6">
            <WifiOff className="h-8 w-8" />
          </div>

          <h1 className="text-2xl font-bold mb-4">You're Offline</h1>
          <p className="text-muted-foreground mb-6">
            You appear to be offline. Some features may be limited until you reconnect to the internet.
          </p>

          <p className="text-sm text-muted-foreground mb-6">
            You can still view previously loaded events and messages.
          </p>

          <Link href="/">
            <Button>
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
