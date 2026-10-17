import { app } from './app';
import { env } from './config/env';

app.listen(env.PORT, '0.0.0.0', () => {
  console.info(`OmniSearch API em http://localhost:${env.PORT}/api/v1 (mocks: ${env.USE_MOCKS ? 'ligados' : 'desligados'})`);
});
