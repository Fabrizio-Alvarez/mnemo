/**
 * Proxy para OpenCode Zen — senta entre omp y el endpoint real de Zen.
 *
 * Qué hace:
 * - Reenvía todo a https://opencode.ai/zen/v1/* sin tocar el body ni la auth
 *   (omp ya manda el Bearer token del provider opencode-zen).
 * - Si Zen devuelve 429 (FreeUsageLimitError — el límite de big-pickle free),
 *   reintenta con backoff exponencial (3 intentos).
 * - En el último retry, switch automático a glm-5.2 (modelo pago, sin rate
 *   limit free) para que la sesión no muera.
 * - Loguea todo a stderr (no interfiere con omp que lee stdout).
 *
 * Uso:  bun run ~/opencode-proxy/proxy.ts
 * Config opencode.json:  "opencode-zen": { "options": { "baseURL": "http://127.0.0.1:8818" } }
 */
import type { Request } from "bun";

const UPSTREAM = "https://opencode.ai/zen";
const PORT = 8818;
const FALLBACK_MODEL = "glm-5.2";
const MAX_RETRIES = 3;

function sleep(ms: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve, ms);
  return promise;
}

function getModel(parsed: unknown): string | undefined {
  if (parsed && typeof parsed === "object" && "model" in parsed) {
    const m = parsed.model;
    return typeof m === "string" ? m : undefined;
  }
  return undefined;
}

function withModel(bodyText: string, model: string): string {
  const parsed: unknown = JSON.parse(bodyText);
  if (parsed && typeof parsed === "object" && "model" in parsed) {
    const obj = parsed as Record<string, unknown>;
    obj.model = model;
    return JSON.stringify(obj);
  }
  return bodyText;
}

function log(msg: string): void {
  const ts = new Date().toISOString().slice(11, 19);
  console.error(`[proxy ${ts}] ${msg}`);
}

Bun.serve({
  port: PORT,
  hostname: "127.0.0.1",
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const target = `${UPSTREAM}${url.pathname}${url.search}`;

    // Copiar headers sin Host (fetch lo setea según la URL destino)
    const headers = new Headers();
    for (const [k, v] of req.headers) {
      if (k.toLowerCase() !== "host") headers.set(k, v);
    }

    const bodyText = req.method === "POST" ? await req.text() : undefined;
    const originalModel = bodyText !== undefined ? getModel(JSON.parse(bodyText)) : undefined;
    let currentBody = bodyText;
    let usingFallback = false;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const resp = await fetch(target, {
        method: req.method,
        headers,
        body: currentBody,
      });

      if (resp.status === 429 && attempt < MAX_RETRIES) {
        const retryIn = 1000 * 2 ** attempt;
        log(`429 model=${originalModel ?? "?"} attempt=${attempt + 1}/${MAX_RETRIES} — retry en ${retryIn}ms`);

        // Último retry: switch a fallback si el modelo original era otro
        if (attempt === MAX_RETRIES - 1 && originalModel !== undefined && originalModel !== FALLBACK_MODEL && bodyText !== undefined) {
          currentBody = withModel(bodyText, FALLBACK_MODEL);
          usingFallback = true;
          log(`fallback → ${FALLBACK_MODEL}`);
        }

        await sleep(retryIn);
        continue;
      }

      const model = usingFallback ? FALLBACK_MODEL : originalModel;
      log(`${req.method} ${url.pathname} → ${resp.status} model=${model ?? "?"}`);
      return new Response(resp.body, { status: resp.status, headers: resp.headers });
    }

    return new Response("proxy: max retries exceeded", { status: 502 });
  },
});

log(`escuchando en http://127.0.0.1:${PORT} → ${UPSTREAM}`);
