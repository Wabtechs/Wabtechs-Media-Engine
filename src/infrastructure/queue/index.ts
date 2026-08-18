import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

export type JobType =
  | 'media.upload'
  | 'media.optimize'
  | 'media.generate_variants'
  | 'media.background_removal'
  | 'media.video_transcode'
  | 'media.generate_thumbnail'
  | 'media.cleanup';

let _connection: IORedis | null = null;
let _queue: Queue | null = null;

export function createRedisConnection(redisUrl: string): IORedis {
  if (!_connection) {
    _connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  return _connection;
}

export function getQueue(redisUrl: string): Queue {
  if (!_queue) {
    const connection = createRedisConnection(redisUrl);
    _queue = new Queue('media-jobs', {
      connection,
      defaultJobOptions: {
        removeOnComplete: { age: 86400, count: 1000 },
        removeOnFail: { age: 604800, count: 500 },
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    });
  }
  return _queue;
}

export function createWorker(
  redisUrl: string,
  jobType: JobType,
  processor: (jobData: Record<string, unknown>) => Promise<Record<string, unknown>>,
  concurrency: number = 2,
): Worker {
  const connection = createRedisConnection(redisUrl);
  const worker = new Worker(
    'media-jobs',
    async (job) => {
      if (job.name !== jobType) return;
      return processor(job.data as Record<string, unknown>);
    },
    {
      connection,
      concurrency,
      lockDuration: 300000,
    },
  );
  return worker;
}

export async function closeQueue() {
  if (_queue) {
    await _queue.close();
    _queue = null;
  }
  if (_connection) {
    await _connection.quit();
    _connection = null;
  }
}
