import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Config del adapter (@opennextjs/cloudflare 1.x). Sin overrides de caché:
// todas las rutas de Mnemo son force-dynamic (no hay ISR ni páginas estáticas
// que cachear en el edge).
export default defineCloudflareConfig({});
