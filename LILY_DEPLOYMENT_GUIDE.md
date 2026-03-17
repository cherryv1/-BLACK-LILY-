# Lily Dashboard - Guía de Deployment

## Estructura

```
.
├── dashboard/              # Lily Dashboard (React + tRPC)
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── worker-integration.ts
│   ├── server/
│   ├── drizzle/
│   └── package.json
├── src/                    # Tu código de Workers
├── public/                 # Archivos estáticos
├── wrangler.toml          # Configuración de Wrangler
└── lily-config.json       # Configuración de Lily
```

## Instalación Rápida

```bash
# 1. Clonar
git clone https://github.com/cherryv1/-BLACK-LILY-.git
cd -BLACK-LILY-

# 2. Instalar
npm install
cd dashboard && pnpm install && cd ..

# 3. Desarrollo
cd dashboard && pnpm dev
# Accede a: http://localhost:3000/lily

# 4. Producción
pnpm build && pnpm start
```

## Integración con Workers

En tu Worker, usa `worker-integration.ts`:

```typescript
import { sendMetricToLily } from './dashboard/src/worker-integration';

export default {
  async fetch(request: Request, env: Env) {
    const startTime = Date.now();
    const response = await handleRequest(request);
    
    await sendMetricToLily(
      {
        requestId: crypto.randomUUID(),
        layerName: 'generation',
        modelName: 'groq',
        statusCode: response.status,
        latency: Date.now() - startTime,
        region: request.headers.get('cf-ipcountry') || 'unknown',
      },
      env.DASHBOARD_URL
    );
    
    return response;
  },
};
```

## Features

✅ Monitoreo en tiempo real (6 capas)
✅ Multi-modelo (Groq, Cerebras, Gemini, Cloudflare Llama)
✅ Métricas y analytics
✅ Logs con filtrado
✅ Alertas automáticas
✅ Reportes
✅ Análisis IA
✅ Control de usuarios
✅ Responsive para Termux

## GitHub Actions

El workflow automático en `.github/workflows/deploy-lily-dashboard.yml` se ejecuta en cada push a main.

## Troubleshooting

- **Dashboard no carga**: Verifica DATABASE_URL
- **Workers no envían métricas**: Revisa DASHBOARD_URL en env
- **Tests fallan**: `cd dashboard && pnpm test`
