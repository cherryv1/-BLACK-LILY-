/**
 * Integración de Lily Dashboard con Cloudflare Workers
 * Envía métricas desde tu Worker a la API del dashboard
 */

export interface LilyMetric {
  requestId: string;
  layerName: 'acquisition' | 'obfuscation' | 'tunnel' | 'edge' | 'generation' | 'feedback';
  modelName: 'groq' | 'cerebras' | 'gemini' | 'cloudflare-llama';
  statusCode: number;
  latency: number;
  region: string;
  timestamp?: number;
  metadata?: Record<string, any>;
}

export async function sendMetricToLily(
  metric: LilyMetric,
  dashboardUrl: string
): Promise<boolean> {
  try {
    const response = await fetch(`${dashboardUrl}/api/trpc/lily.logs.logRequest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: metric,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('[Lily] Error sending metric:', error);
    return false;
  }
}
