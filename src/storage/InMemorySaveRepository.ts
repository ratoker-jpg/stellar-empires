import type { SaveEnvelope, SaveRepository } from './types';

export class InMemorySaveRepository implements SaveRepository {
  readonly #saves = new Map<string, SaveEnvelope>();

  async put(save: SaveEnvelope): Promise<void> {
    this.#saves.set(save.slotId, save);
  }

  async get(slotId: string): Promise<SaveEnvelope | undefined> {
    return this.#saves.get(slotId);
  }

  async list(): Promise<readonly SaveEnvelope[]> {
    return [...this.#saves.values()].sort((left, right) =>
      left.slotId.localeCompare(right.slotId),
    );
  }

  async delete(slotId: string): Promise<void> {
    this.#saves.delete(slotId);
  }
}
