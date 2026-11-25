/* Configuración de ScoreAI. Edita estos valores; no hace falta recompilar. */
window.SCOREAI_CONFIG = {
  // URL del API (Cloudflare Worker o /api/scoreai si la web está en Vercel)
  API_URL: "https://scoreai-api.TU-SUBDOMINIO.workers.dev",
  // Enlace de tu página de citas de Google Calendar
  AGENDA_URL: "[URL_AGENDA]",
  // Opcional: site key de Cloudflare Turnstile (anti-bots). Vacío = desactivado.
  TURNSTILE_SITEKEY: "",
  // Preguntas en paralelo
  CONCURRENCY: 4
};
