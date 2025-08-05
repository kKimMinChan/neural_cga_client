import { ConflictException, Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { CreateUserInput } from './user.schema';
import * as bcrypt from 'bcrypt';
import { UserSyncService } from 'src/sync/user-sync/user-sync.service';

@Injectable()
export class UserService {
  constructor(
    private readonly repo: UserRepository,
    private readonly sync: UserSyncService,
  ) {}

  // async create(body: CreateUserInput) {
  //   const existing = await this.repo.findUserByEmail(body.email);
  //   if (existing) {
  //     throw new ConflictException('이미 등록된 이메일입니다.');
  //   }

  //   const hashedPassword = await bcrypt.hash(body.password, 10);

  //   const user = await this.repo.createUser({
  //     ...body,
  //     role: 'user',
  //     password: hashedPassword,
  //   });

  //   console.log('User created:', user);

  //   if (user) {
  //     await this.sync.enqueueUserSync(user.id, user);
  //     console.log('User sync enqueued for user:', user.id);
  //   }

  //   const { password, ...userWithoutPassword } = user;
  //   return userWithoutPassword;
  // }

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: any) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
