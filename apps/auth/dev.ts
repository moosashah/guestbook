import { serve } from "@hono/node-server"
import app from "./index.js"

serve({
    port: 3002,
    fetch: app.fetch
})

console.log("Auth server running on http://localhost:3002")
