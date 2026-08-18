import type { EventEmitter } from 'node:events';

export interface MediaEvent {
  type: string;
  version: number;
  aggregateId: string;
  tenantId: string;
  applicationId: string;
  occurredAt: string;
  payload: Record<string, unknown>;
}

class MediaEventBus {
  private emitter: EventEmitter | null = null;

  async publish(event: MediaEvent): Promise<void> {
    if (this.emitter) {
      this.emitter.emit(event.type, event);
    }
  }

  setEmitter(emitter: EventEmitter) {
    this.emitter = emitter;
  }
}

export const mediaEventBus = new MediaEventBus();
