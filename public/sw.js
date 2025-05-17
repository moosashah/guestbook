const CACHE_NAME = "wedding-pwa-v1"
const OFFLINE_URL = "/offline"

// Resources to cache
const RESOURCES_TO_CACHE = [
  "/",
  "/offline",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/wedding-ceremony.png",
  "/anniversary-cake-celebration.png",
  "/qr-code.png",
  "/video-message.png",
  "/globals.css",
  // Add other static assets here
]

// Install event - cache resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(RESOURCES_TO_CACHE)
    }),
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => cacheName !== CACHE_NAME).map((cacheName) => caches.delete(cacheName)),
      )
    }),
  )
  self.clients.claim()
})

// Fetch event - serve from cache or network
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return
  }

  // For HTML requests - network first, fallback to cache, then offline page
  if (event.request.headers.get("Accept")?.includes("text/html")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the latest version
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
          return response
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }
            return caches.match("/offline")
          })
        }),
    )
    return
  }

  // For other requests - cache first, fallback to network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }
      return fetch(event.request)
        .then((response) => {
          // Cache the response
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
          return response
        })
        .catch(() => {
          // For image requests, return a placeholder
          if (event.request.destination === "image") {
            return new Response(
              '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="300" fill="#eaeaea"/><text x="50%" y="50%" font-family="Arial" font-size="24" text-anchor="middle" fill="#888">Image Offline</text></svg>',
              {
                headers: { "Content-Type": "image/svg+xml" },
              },
            )
          }
          return new Response("Content not available offline")
        })
    }),
  )
})

// Background sync for offline form submissions
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-events") {
    event.waitUntil(syncEvents())
  }
})

// Function to sync events when back online
async function syncEvents() {
  try {
    const db = await openDB()
    const pendingEvents = await db.getAll("pending-events")

    for (const event of pendingEvents) {
      try {
        // Attempt to send the event data
        const response = await fetch("/api/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        })

        if (response.ok) {
          // If successful, remove from pending
          await db.delete("pending-events", event.id)
        }
      } catch (error) {
        console.error("Failed to sync event:", error)
      }
    }
  } catch (error) {
    console.error("Error during sync:", error)
  }
}

// IndexedDB helper
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("wedding-pwa-db", 1)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains("pending-events")) {
        db.createObjectStore("pending-events", { keyPath: "id" })
      }
      if (!db.objectStoreNames.contains("events")) {
        db.createObjectStore("events", { keyPath: "id" })
      }
      if (!db.objectStoreNames.contains("messages")) {
        db.createObjectStore("messages", { keyPath: "id" })
      }
    }

    request.onsuccess = (event) => resolve(event.target.result)
    request.onerror = (event) => reject(event.target.error)
  })
}
