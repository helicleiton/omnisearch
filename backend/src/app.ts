import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { globalRateLimiter } from './middlewares/rateLimiter';
import { searchRouter } from './routes/search.routes';

export const app = express();

// Atrás de proxy/load balancer (Render, Railway, Nginx), o rate limit precisa do IP real.
if (env.NODE_ENV === 'production') app.set('trust proxy', 1);

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    // Apps nativos não enviam Origin; a lista vale para clientes web (Expo Web).
    origin: (origin, cb) => cb(null, !origin || env.CORS_ORIGINS.includes(origin)),
    methods: ['GET', 'POST'],
  }),
);
app.use(express.json({ limit: '10kb' }));
app.use(globalRateLimiter);

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', mocks: env.USE_MOCKS, timestamp: new Date().toISOString() });
});

app.use('/api/v1', searchRouter);

app.use(notFoundHandler);
app.use(errorHandler);
