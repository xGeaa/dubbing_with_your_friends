# 🤖 Directrices de Operación para Claude Code — DubbingWYF

> Este archivo contiene las reglas y flujos de trabajo clave para **Claude Code** en este repositorio.

---

## 🧠 Memoria Viva del Proyecto (MANDATORIO)

Antes de realizar cambios significativos o iniciar una sesión de trabajo:
1. Revisa la memoria del proyecto guardada en la bóveda de Obsidian:
   `Ruta Vault`: `/Users/fersa/Documents/Obsidian/AI-Brain/DubbingWYF/_Memoria/`
   - `00_Estado_del_Proyecto.md` — Dashboard y estado global.
   - `01_Configuracion_App.md` — Stack, puertos, variables `.env`.
   - `02_Mapa_de_Archivos.md` — Mapa del monorepo.
   - `03_Base_de_Datos.md` — Esquema Supabase SQL & Storage.
   - `04_SocketIO_Eventos.md` — Protocolo WebSocket y FSM.
   - `_BACKLOG_FUNCIONALIDAD.md` — Backlog de Issues.

2. Al finalizar cada bloque de trabajo/Issue:
   - Actualiza el archivo de memoria correspondiente en Obsidian.

---

## 🛠️ Comandos Principales

```bash
# Desarrollo local (Next.js web + Server Express en paralelo via Turborepo)
npm run dev

# Verificación de tipos y linting (OBLIGATORIO antes de cada PR)
npm run type-check
npm run lint

# Build de producción
npm run build
```

---

## 🌿 Convenciones de Git y Desarrollo

- **Nomenclatura de Ramas**: `feature/faseX-descripcion` o `fix/issue-descripcion`.
- **Commits**: Formato convencional (`feat: ...`, `fix: ...`, `docs: ...`, `refactor: ...`).
- **Idioma**: Comunicación con el usuario en **Español**, clara y estructurada.
- **Calidad de Código**: Cero advertencias de TypeScript (`tsc --noEmit`), código limpio, responsive mobile-first.
