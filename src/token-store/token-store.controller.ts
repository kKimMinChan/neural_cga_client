import { Controller } from '@nestjs/common';
import { TokenStoreService } from './token-store.service';

@Controller('token-store')
export class TokenStoreController {
  constructor(private readonly tokenStoreService: TokenStoreService) {}
}
