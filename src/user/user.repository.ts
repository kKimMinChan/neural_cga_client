import { eq } from 'drizzle-orm';
import { db } from 'src/db/db';
import { users } from 'src/db/schema';
import { CreateUserInput, SyncStatus } from './user.schema';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserRepository {
  // This class will handle database operations related to users.
  // For example, it can use an ORM like TypeORM or Prisma to interact with the database.

  async createUser(data: CreateUserInput) {
    const inserted = await db.insert(users).values(data).returning();
    return inserted[0];
  }

  async findUserById(id: string) {
    return db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .then((res) => res[0]);
  }

  async findUserByEmail(email: string) {
    return db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .then((res) => res[0]);
  }

  // async findUserBySyncStatus(syncStatus: SyncStatus) {
  //   return await db
  //     .select()
  //     .from(users)
  //     .where(eq(users.syncStatus, syncStatus));
  // }

  async updateUserSyncStatus(
    userId: string,
    data: {
      syncStatus: SyncStatus;
      lastSyncAt?: Date | null;
      syncErrorMessage?: string;
    },
  ) {
    const updated = await db
      .update(users)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    return updated[0];
  }

  // async findAllUsers() {
  //   // Logic to find all users
  // }

  // async updateUser(id: number, data: any) {
  //   // Logic to update a user
  // }

  // async deleteUser(id: number) {
  //   // Logic to delete a user
  // }
}
