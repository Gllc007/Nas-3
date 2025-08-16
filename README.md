# Formulario NAS v6 (Orden + Zebra + listo para GitHub)
- Lista simple en el mismo orden de la tabla: 1a → 1b → 1c → 2 → 3 → 4a → 4b → 4c → 5 → 6a → 6b → 6c → 7a → 7b → 8a → 8b → 8c → 9 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 19 → 20 → 21 → 22 → 23
- Franjas alternadas (zebra) en las tarjetas de ítems para mejor lectura.
- Eliminados: **Nombre** y **Unidad/Box**; Se mantienen: **Identificador**, **Turno**, **Fecha/Hora**, **Nota**.
- Cálculo de puntaje, validaciones de exclusión, historial local, duplicar, imprimir, exportar CSV.

## Estructura lista para subir a GitHub
```
nas_form_web_v6/
 ├─ index.html
 ├─ assets/
 │   ├─ styles.css
 │   └─ app.js
 └─ README.md
```

## Publicación rápida en GitHub Pages
1. Crea un repositorio (ej.: `nas-form-web`).
2. Sube **todos** los archivos manteniendo la carpeta `assets/`.
3. En el repo: **Settings → Pages → Source: Deploy from a branch** → selecciona `main` / `/root` → Save.
4. Abre la URL que te entrega GitHub Pages.

## Catálogo en orden
- **1a** — Control de Signos Vitales por horario — 4.5 pts
- **1b** — Observación continua o activa durante 2 horas o más — 12.1 pts
- **1c** — Observación continua o activa 4 horas o más — 19.6 pts
- **2** — Control de exámenes de laboratorio, bioquímicos y microbiológicos — 4.3 pts
- **3** — Medicación excepto medicamentos vasoactivos — 5.6 pts
- **4a** — Procedimientos de higiene básica — 4.1 pts
- **4b** — Procedimientos de higiene con duración > 2 horas — 16.5 pts
- **4c** — Procedimientos de higiene con duración > 4 horas — 20.0 pts
- **5** — Cuidados de drenajes, excepto SNG — 1.8 pts
- **6a** — Movilización y cambios de posición; sentar en sillón hasta 3 veces — 5.5 pts
- **6b** — Movilización y cambios de posición; más de 3 veces/d o con 2 enfermeros — 12.4 pts
- **6c** — Movilización y cambios de posición; con 3 o más enfermeras/os — 17.0 pts
- **7a** — Apoyo y cuidado a familiares. Una hora de dedicación — 4.0 pts
- **7b** — Apoyo y cuidado a familiares. Al menos tres horas de dedicación — 32.0 pts
- **8a** — Tareas administrativas o de gestión: básicas — 4.2 pts
- **8b** — Tareas administrativas o de gestión hasta 2 horas — 23.2 pts
- **8c** — Tareas administrativas o de gestión más de 4 horas — 30.0 pts
- **9** — Asistencia ventilatoria, cualquier forma — 1.4 pts
- **10** — Cuidados de vía aérea artificial — 1.8 pts
- **11** — Tratamientos para mejorar la función respiratoria — 4.4 pts
- **12** — Medicación vasoactiva — 1.2 pts
- **13** — Reposición intravenosa de gran cantidad de líquidos (>3 L por día) — 2.5 pts
- **14** — Monitorización de aurícula izquierda (PICCO, Swan-Ganz, Vigileo, etc.) — 1.7 pts
- **15** — RCP tras parada cardiorrespiratoria en las últimas 24 h — 7.1 pts
- **16** — Técnicas de depuración extrarrenal (Diálisis, Novalung, etc.) — 7.7 pts
- **17** — Cuantificación de diuresis — 7.0 pts
- **18** — Medición de la presión intracraneal — 1.6 pts
- **19** — Tratamiento de complicaciones metabólicas (acidosis/alcalosis) — 1.3 pts
- **20** — Nutrición parenteral — 2.9 pts
- **21** — Nutrición enteral — 1.3 pts
- **22** — Intervenciones específicas en UCI (instalación CVC, PICC, etc.) — 2.8 pts
- **23** — Intervenciones específicas fuera de la UCI (TAC, RNM, RX, etc.) — 1.9 pts
