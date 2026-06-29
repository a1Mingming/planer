import { z } from 'zod';

export const CreateTagSchema = z.object({
  name: z.string().min(1, '标签名不能为空').max(20, '标签名最多 20 字符'),
});
