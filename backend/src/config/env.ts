import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ quiet: true });

const bool = z
  .enum(['true', 'false'])
  .default('true')
  .transform((v) => v === 'true');

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== '' ? v.trim() : undefined));

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3333),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  USE_MOCKS: bool,
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean)),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
  APP_API_KEY: optionalString,

  // Chaves de provedores externos — lidas SOMENTE daqui, nunca hardcoded no código.
  HIBP_API_KEY: optionalString,
  CNPJ_PROVIDER_URL: z.string().url().default('https://brasilapi.com.br/api/cnpj/v1'),
  ESCAVADOR_API_TOKEN: optionalString,
  NUMVERIFY_API_KEY: optionalString,
  EXTERNAL_TIMEOUT_MS: z.coerce.number().int().positive().default(8_000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variáveis de ambiente inválidas:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
