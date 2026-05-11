import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import swaggerUi from 'swagger-ui-express';
import { Router } from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPEC_PATH = path.resolve(__dirname, '..', '..', 'openapi.yaml');

export const swaggerRouter = Router();

let spec: object | null = null;
try {
  spec = YAML.parse(fs.readFileSync(SPEC_PATH, 'utf8')) as object;
} catch (err) {
  console.warn('[swagger] cannot load openapi.yaml:', (err as Error).message);
}

if (spec) {
  swaggerRouter.use('/', swaggerUi.serve);
  swaggerRouter.get('/', swaggerUi.setup(spec, { customSiteTitle: 'GameShop API' }));
} else {
  swaggerRouter.get('/', (_req, res) => {
    res.status(503).type('text/plain').send('OpenAPI spec not found');
  });
}
