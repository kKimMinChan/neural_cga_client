import { appState } from 'src/db/schema';
import { db } from 'src/db/db';
import { eq } from 'drizzle-orm';

export class SyncRepository {
  async getLastSyncedAt() {
    const rows = await db
      .select({
        lastSyncedAt: appState.lastSyncedAt,
      })
      .from(appState)
      .where(eq(appState.id, 'singleton'))
      .limit(1);

    // rows[0]?.lastSyncedAt 가 undefined면 아직 첫 동기화 전이라는 뜻.
    return rows.length ? rows[0].lastSyncedAt : undefined;
  }

  async updateLastSyncedAt(newCursorIso: string) {
    await db
      .insert(appState)
      .values({
        id: 'singleton',
        lastSyncedAt: newCursorIso,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: appState.id,
        set: {
          lastSyncedAt: newCursorIso,
          updatedAt: new Date(),
        },
      });
  }
}
