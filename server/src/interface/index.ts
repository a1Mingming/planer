import { createApp } from './app';
import { migrate } from '../infrastructure/db/migrate';
import { seed } from '../infrastructure/db/seed';

const PORT = Number(process.env.PORT ?? 3001);

migrate();
seed();

const app = createApp();
app.listen(PORT, () => {
  console.info(`[server] running on http://localhost:${PORT}`);
});
