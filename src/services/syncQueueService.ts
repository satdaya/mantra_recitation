import { MantraRecitation } from '../types';
import { mantraService } from './mantraService';

interface QueuedRecitation {
  id: string;
  recitation: Omit<MantraRecitation, 'id'>;
  timestamp: number;
  retries: number;
}

interface SyncStatus {
  pending: number;
  syncing: boolean;
  lastSyncAttempt: number | null;
  lastSuccessfulSync: number | null;
}

class SyncQueueService {
  private queueKey = 'syncQueue';
  private statusKey = 'syncStatus';
  private maxRetries = 5;
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Array<(status: SyncStatus) => void> = [];

  /**
   * Add a recitation to the sync queue
   */
  queueRecitation(recitation: Omit<MantraRecitation, 'id'>): string {
    const queue = this.getQueue();
    const queuedItem: QueuedRecitation = {
      id: `queued-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      recitation,
      timestamp: Date.now(),
      retries: 0,
    };

    queue.push(queuedItem);
    localStorage.setItem(this.queueKey, JSON.stringify(queue));
    this.updateStatus();

    return queuedItem.id;
  }

  /**
   * Get all queued items
   */
  getQueue(): QueuedRecitation[] {
    try {
      const queue = localStorage.getItem(this.queueKey);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Error reading sync queue:', error);
      return [];
    }
  }

  /**
   * Get sync status
   */
  getStatus(): SyncStatus {
    try {
      const status = localStorage.getItem(this.statusKey);
      if (status) {
        return JSON.parse(status);
      }
    } catch (error) {
      console.error('Error reading sync status:', error);
    }

    return {
      pending: 0,
      syncing: false,
      lastSyncAttempt: null,
      lastSuccessfulSync: null,
    };
  }

  /**
   * Update sync status
   */
  private updateStatus(updates?: Partial<SyncStatus>) {
    const queue = this.getQueue();
    const currentStatus = this.getStatus();
    const newStatus: SyncStatus = {
      ...currentStatus,
      pending: queue.length,
      ...updates,
    };

    localStorage.setItem(this.statusKey, JSON.stringify(newStatus));
    this.notifyListeners(newStatus);
  }

  /**
   * Attempt to sync all queued recitations
   */
  async syncQueue(): Promise<void> {
    const queue = this.getQueue();

    if (queue.length === 0) {
      return;
    }

    // Check if backend is available
    const isBackendAvailable = await mantraService.testConnection();
    if (!isBackendAvailable) {
      console.log('Backend not available, skipping sync');
      this.updateStatus({ lastSyncAttempt: Date.now() });
      return;
    }

    this.updateStatus({ syncing: true, lastSyncAttempt: Date.now() });

    const successfulIds: string[] = [];
    const failedQueue: QueuedRecitation[] = [];

    for (const item of queue) {
      try {
        // Attempt to sync this recitation
        const success = await mantraService.saveRecitation({
          mantraId: 'default', // You may want to enhance this
          count: item.recitation.count,
          duration: item.recitation.duration || 0,
          notes: item.recitation.notes,
        });

        if (success) {
          console.log(`Successfully synced recitation ${item.id}`);
          successfulIds.push(item.id);
        } else {
          throw new Error('Sync failed');
        }
      } catch (error) {
        console.error(`Failed to sync recitation ${item.id}:`, error);

        // Increment retry count
        item.retries += 1;

        // Keep in queue if under max retries
        if (item.retries < this.maxRetries) {
          failedQueue.push(item);
        } else {
          console.warn(`Max retries reached for recitation ${item.id}, removing from queue`);
        }
      }
    }

    // Update queue with failed items
    localStorage.setItem(this.queueKey, JSON.stringify(failedQueue));

    const allSynced = failedQueue.length === 0;
    this.updateStatus({
      syncing: false,
      lastSuccessfulSync: allSynced ? Date.now() : this.getStatus().lastSuccessfulSync,
    });

    console.log(`Sync complete: ${successfulIds.length} synced, ${failedQueue.length} remaining`);
  }

  /**
   * Start automatic background sync (every 30 seconds)
   */
  startAutoSync(intervalMs: number = 30000) {
    if (this.syncInterval) {
      return; // Already running
    }

    console.log('Starting auto-sync...');
    this.syncInterval = setInterval(() => {
      this.syncQueue();
    }, intervalMs);

    // Initial sync
    this.syncQueue();
  }

  /**
   * Stop automatic background sync
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Stopped auto-sync');
    }
  }

  /**
   * Subscribe to sync status changes
   */
  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);

    // Immediately call with current status
    listener(this.getStatus());

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(status: SyncStatus) {
    this.listeners.forEach(listener => listener(status));
  }

  /**
   * Clear the sync queue (use with caution)
   */
  clearQueue() {
    localStorage.removeItem(this.queueKey);
    this.updateStatus({ pending: 0 });
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.getQueue().length;
  }
}

export const syncQueueService = new SyncQueueService();
