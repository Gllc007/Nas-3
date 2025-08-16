# Formulario NAS (100% Web, sin servidor)
Calcula NAS, valida exclusiones y guarda cada evaluación en:
- Historial local (localStorage)
- (Opcional) Supabase sin backend propio

## Publicar rápido
- GitHub Pages: sube `index.html` y la carpeta `assets/` → Settings → Pages.
- Netlify / Vercel: arrastra la carpeta del proyecto.

## Supabase (opcional)
1) Crea proyecto en supabase.com
2) Ejecuta `schema.sql`
3) En `assets/app.js` rellena `SUPABASE_URL` y `SUPABASE_ANON_KEY` y descomenta el guardado.
