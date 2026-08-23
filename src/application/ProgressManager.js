import { Discovery } from '../domain/Discovery.js';
import { Storage } from '../infrastructure/Storage.js';

export class ProgressManager {
  constructor(initialData = {}, total) {
    this.discovered = new Set(initialData.discovered || []);
    this.total = total;
    this.completed = initialData.completed || 0;
    this.level = initialData.level || 1;
    this.xp = initialData.xp || 0;
    this.xpMax = initialData.xpMax || 1000;
    this.onCompleteCallback = null;
    this.onDiscoverCallback = null;
  }

  discover(id) {
    if (!this.discovered.has(id)) {
      Discovery.markDiscovered(id, this.discovered);
      this.addXP(150);
      this.persist();
      this.checkComplete();
      if (this.onDiscoverCallback) this.onDiscoverCallback(id);
      window.dispatchEvent(new CustomEvent('arch-discovered', { detail: { id } }));
    }
  }

  addXP(amount) {
    this.xp += amount;
    while (this.xp >= this.xpMax) {
      this.xp -= this.xpMax;
      this.level++;
      this.xpMax = Math.floor(this.xpMax * 1.3);
    }
    this.persist();
  }

  addCompleted() {
    this.completed++;
    this.addXP(100);
    this.persist();
  }

  isDiscovered(id) { return Discovery.isDiscovered(id, this.discovered); }

  getProgressText() { return Discovery.getProgress(this.discovered, this.total); }

  getDiscoveredList() { return Array.from(this.discovered); }

  getDiscoveredCount() { return this.discovered.size; }

  persist() { 
    Storage.save({ 
      discovered: this.getDiscoveredList(),
      completed: this.completed,
      level: this.level,
      xp: this.xp,
      xpMax: this.xpMax
    }); 
  }

  checkComplete() {
    if (Discovery.isComplete(this.discovered, this.total) && this.onCompleteCallback) {
      this.onCompleteCallback();
    }
  }

  onComplete(cb) { this.onCompleteCallback = cb; }
  onDiscover(cb) { this.onDiscoverCallback = cb; }

  getStats() {
    return { 
      discovered: this.getDiscoveredList().length, 
      total: this.total,
      completed: this.completed,
      level: this.level,
      xp: this.xp,
      xpMax: this.xpMax
    };
  }
}