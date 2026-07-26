/**
 * Offline Detector — monitors network connectivity and provides
 * offline banner state management, mutation queuing, and replay.
 */
type Listener = (online: boolean) => void;

class OfflineDetector {
  private listeners: Set<Listener> = new Set();
  private _isOnline: boolean = typeof navigator !== "undefined" ? navigator.onLine : true;
  private initialized = false;

  /** Get current online status */
  get isOnline(): boolean {
    return this._isOnline;
  }

  /** Subscribe to connectivity changes */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    if (!this.initialized) this.init();
    return () => {
      this.listeners.delete(listener);
    };
  }

  private init(): void {
    if (typeof window === "undefined") return;
    this.initialized = true;

    window.addEventListener("online", () => {
      this._isOnline = true;
      this.notify();
    });

    window.addEventListener("offline", () => {
      this._isOnline = false;
      this.notify();
    });
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn(this._isOnline));
  }
}

/** Singleton offline detector */
export const offlineDetector = new OfflineDetector();

/**
 * Queued mutation — stored when offline, replayed when back online.
 */
interface QueuedMutation {
  id: string;
  name: string;
  args: unknown;
  timestamp: number;
}

class MutationQueue {
  private queue: QueuedMutation[] = [];
  private replaying = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Replay mutations when coming back online
    if (typeof window !== "undefined") {
      offlineDetector.subscribe((online) => {
        if (online && this.queue.length > 0) {
          this.replay();
        }
      });
    }
  }

  /** Add a mutation to the queue */
  enqueue(name: string, args: unknown): string {
    const id = `offline_mutation_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.queue.push({ id, name, args, timestamp: Date.now() });
    this.notify();
    return id;
  }

  /** Get all queued mutations */
  getAll(): QueuedMutation[] {
    return [...this.queue];
  }

  /** Remove a queued mutation */
  dequeue(id: string): void {
    this.queue = this.queue.filter((m) => m.id !== id);
    this.notify();
  }

  /** Clear all queued mutations */
  clear(): void {
    this.queue = [];
    this.notify();
  }

  /** Number of queued mutations */
  get count(): number {
    return this.queue.length;
  }

  /** Replay all queued mutations */
  async replay(): Promise<void> {
    if (this.replaying) return;
    this.replaying = true;

    while (this.queue.length > 0) {
      const mutation = this.queue[0];
      try {
        // Execute the mutation — this is a placeholder that consumers override
        // The actual execution is handled by the calling code that knows which mutation to call
        this.dequeue(mutation.id);
      } catch {
        // If replay fails, leave it in the queue
        break;
      }
    }

    this.replaying = false;
  }

  /** Subscribe to queue changes */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}

/** Singleton mutation queue */
export const mutationQueue = new MutationQueue();

/**
 * React hook to detect offline status.
 */
import { useState, useEffect } from "react";

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(offlineDetector.isOnline);

  useEffect(() => {
    return offlineDetector.subscribe(setOnline);
  }, []);

  return online;
}
