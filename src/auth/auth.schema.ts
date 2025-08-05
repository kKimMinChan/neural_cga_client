import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요.'),
  password: z.string().min(2, '비밀번호는 최소 2자 이상이어야 합니다.'),
});

export type LoginInput = z.infer<typeof LoginSchema>;
