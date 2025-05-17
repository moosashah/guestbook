"use client"

import type { Event, Message } from "./types"

const DB_NAME = "wedding-pwa-db"
const DB_VERSION = 1
const EVENTS_STORE = "events"
const MESSAGES_STORE = "messages"
const PENDING_EVENTS_STORE = "pending-events"

// Open IndexedDB
export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(EVENTS_STORE)) {
        db.createObjectStore(EVENTS_STORE, { keyPath: "id" })
      }

      if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
        db.createObjectStore(MESSAGES_STORE, { keyPath: "id" })
      }

      if (!db.objectStoreNames.contains(PENDING_EVENTS_STORE)) {
        db.createObjectStore(PENDING_EVENTS_STORE, { keyPath: "id" })
      }
    }

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result)
    }

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error)
    }
  })
}

// Save events to IndexedDB
export async function saveEvents(events: Event[]): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction(EVENTS_STORE, "readwrite")
    const store = transaction.objectStore(EVENTS_STORE)

    // Clear existing events
    store.clear()

    // Add all events
    events.forEach((event) => {
      store.add(event)
    })

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    console.error("Error saving events:", error)
    throw error
  }
}

// Get all events from IndexedDB
export async function getEvents(): Promise<Event[]> {
  try {
    const db = await openDB()
    const transaction = db.transaction(EVENTS_STORE, "readonly")
    const store = transaction.objectStore(EVENTS_STORE)
    const request = store.getAll()

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error("Error getting events:", error)
    return []
  }
}

// Save messages to IndexedDB
export async function saveMessages(messages: Message[]): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction(MESSAGES_STORE, "readwrite")
    const store = transaction.objectStore(MESSAGES_STORE)

    // Clear existing messages
    store.clear()

    // Add all messages
    messages.forEach((message) => {
      store.add(message)
    })

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    console.error("Error saving messages:", error)
    throw error
  }
}

// Get messages for a specific event
export async function getMessagesForEvent(eventId: string): Promise<Message[]> {
  try {
    const db = await openDB()
    const transaction = db.transaction(MESSAGES_STORE, "readonly")
    const store = transaction.objectStore(MESSAGES_STORE)
    const request = store.getAll()

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const messages = request.result.filter((message) => message.eventId === eventId)
        resolve(messages)
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error("Error getting messages:", error)
    return []
  }
}

// Save pending event (for offline creation/editing)
export async function savePendingEvent(event: Event): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction(PENDING_EVENTS_STORE, "readwrite")
    const store = transaction.objectStore(PENDING_EVENTS_STORE)

    store.put(event)

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        // Request background sync if available
        if ("serviceWorker" in navigator && "SyncManager" in window) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.sync.register("sync-events").catch((err) => {
              console.error("Background sync registration failed:", err)
            })
          })
        }
        resolve()
      }
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    console.error("Error saving pending event:", error)
    throw error
  }
}

// Check if we're offline
export function isOffline(): boolean {
  return typeof navigator !== "undefined" && !navigator.onLine
}
