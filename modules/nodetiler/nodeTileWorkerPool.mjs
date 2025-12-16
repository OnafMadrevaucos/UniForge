/**
 * nodeTileWorkerPool.mjs — WorkerPool refinado (ESM)
 */
import { Worker } from "worker_threads";
import path from "path";

export class WorkerPool {
  constructor(workerPath, size = 4) {
    this.workerPath = workerPath;
    this.size = Math.max(1, size);
    this.workers = [];
    this.load = new Map(); // worker -> load
    this.queue = [];
    this._initializeWorkers();
  }

  _initializeWorkers() {
    for (let i = 0; i < this.size; i++) this._spawnWorker();
  }

  _spawnWorker() {
    const worker = new Worker(this.workerPath, { type: "module" });
    this.workers.push(worker);
    this.load.set(worker, 0);
    worker._currentTask = null;

    worker.on("message", (msg) => {
      const task = worker._currentTask;
      worker._currentTask = null;
      if (task) {
        if (msg && msg.error) task.reject(new Error(msg.error));
        else task.resolve(msg || "done");
      }
      this.load.set(worker, Math.max(0, this.load.get(worker) - 1));
      this._dispatchNext();
    });

    worker.on("error", (err) => {
      const task = worker._currentTask;
      worker._currentTask = null;
      if (task) task.reject(err);
      this._respawnBrokenWorker(worker);
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        this._respawnBrokenWorker(worker);
      }
    });
  }

  _respawnBrokenWorker(broken) {
    const idx = this.workers.indexOf(broken);
    if (idx !== -1) this.workers.splice(idx, 1);
    this.load.delete(broken);
    try { broken.terminate(); } catch (_) { }
    this._spawnWorker();
  }

  _leastBusyWorker() {
    let best = null;
    let lowest = Infinity;
    for (const [worker, weight] of this.load.entries()) {
      if (weight < lowest) {
        lowest = weight;
        best = worker;
      }
    }
    return best;
  }

  run(data, transferList = null) {
    return new Promise((resolve, reject) => {
      this.queue.push({ data, resolve, reject, transferList });
      this._dispatchNext();
    });
  }

  _dispatchNext() {
    if (this.queue.length === 0) return;
    const worker = this._leastBusyWorker();
    if (!worker || worker._currentTask) return;
    const next = this.queue.shift();
    worker._currentTask = next;
    this.load.set(worker, this.load.get(worker) + 1);
    try {
      if (next.transferList && next.transferList.length > 0) {
        worker.postMessage(next.data, next.transferList);
      } else {
        worker.postMessage(next.data);
      }
    } catch (err) {
      // If posting fails, reject and try next
      worker._currentTask = null;
      this.load.set(worker, Math.max(0, this.load.get(worker) - 1));
      next.reject(err);
      this._dispatchNext();
    }
  }

  cancelAll() {    
    for (const w of this.workers) {
      try { w.terminate(); } catch { }
    }
    this.queue = [];
  }

  async close() {
    const promises = this.workers.map(w => w.terminate().catch(() => { }));
    await Promise.all(promises);
    this.workers = [];
    this.queue.length = 0;
    this.load.clear();
  }
}
