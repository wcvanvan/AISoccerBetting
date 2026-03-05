/**
 * JobManager — tracks analysis jobs (data collection + analysis).
 * In-memory store with EventEmitter for SSE progress streaming.
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';

export type JobStatus =
  | 'pending'
  | 'collecting'
  | 'collected'
  | 'analyzing'
  | 'complete'
  | 'failed';

export type MarketType = 'goals' | 'corners' | 'cards';

export interface Job {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  market: MarketType;
  status: JobStatus;
  reportPath: string | null;
  analysisPath: string | null;
  error: string | null;
  logs: { time: number; message: string }[];
  createdAt: number;
  updatedAt: number;
}

class JobManagerImpl {
  private jobs = new Map<string, Job>();
  private emitters = new Map<string, EventEmitter>();
  private queue: string[] = [];
  private running = false;
  private runNext: (() => void) | null = null;

  create(
    homeTeam: string,
    awayTeam: string,
    date: string,
    market: MarketType
  ): Job {
    const id = crypto.randomUUID();
    const now = Date.now();
    const job: Job = {
      id,
      homeTeam,
      awayTeam,
      date,
      market,
      status: 'pending',
      reportPath: null,
      analysisPath: null,
      error: null,
      logs: [],
      createdAt: now,
      updatedAt: now,
    };
    this.jobs.set(id, job);
    this.emitters.set(id, new EventEmitter());
    return job;
  }

  get(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  getAll(): Job[] {
    return Array.from(this.jobs.values()).sort(
      (a, b) => b.createdAt - a.createdAt
    );
  }

  emitter(id: string): EventEmitter | undefined {
    return this.emitters.get(id);
  }

  updateStatus(id: string, status: JobStatus, message?: string): void {
    const job = this.jobs.get(id);
    if (!job) return;
    job.status = status;
    job.updatedAt = Date.now();
    if (message) {
      job.logs.push({ time: Date.now(), message });
    }
    this.emitters.get(id)?.emit('status', { status, message });
  }

  addLog(id: string, message: string): void {
    const job = this.jobs.get(id);
    if (!job) return;
    job.logs.push({ time: Date.now(), message });
    this.emitters.get(id)?.emit('log', message);
  }

  setError(id: string, error: string): void {
    const job = this.jobs.get(id);
    if (!job) return;
    job.status = 'failed';
    job.error = error;
    job.updatedAt = Date.now();
    this.emitters.get(id)?.emit('error', error);
  }

  setComplete(id: string): void {
    const job = this.jobs.get(id);
    if (!job) return;
    job.status = 'complete';
    job.updatedAt = Date.now();
    this.emitters.get(id)?.emit('complete', {
      reportPath: job.reportPath,
      analysisPath: job.analysisPath,
    });
  }

  /** Enqueue a job. Only one job runs at a time. Returns a promise that resolves when it's this job's turn. */
  async enqueue(id: string): Promise<void> {
    if (!this.running) {
      this.running = true;
      return;
    }
    this.queue.push(id);
    this.addLog(id, `Queued (position ${this.queue.length})`);
    return new Promise<void>((resolve) => {
      const check = () => {
        const idx = this.queue.indexOf(id);
        if (idx === 0 && !this.running) {
          this.queue.shift();
          this.running = true;
          resolve();
        }
      };
      // Store callback so dequeue can trigger it
      const interval = setInterval(() => {
        check();
        if (this.running && !this.queue.includes(id)) {
          clearInterval(interval);
        }
      }, 500);
    });
  }

  dequeue(): void {
    this.running = false;
  }
}

export const jobManager = new JobManagerImpl();
