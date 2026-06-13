# AGENTS.md

Static todo app — no build tools, no package manager, no tests.

## Project

- `todo.html` — entrypoint, open directly in browser
- `script.js` — all app logic (IIFE, no modules)
- `style.css` — styles with CSS custom properties for theming

## Notes

- All UI strings are hardcoded in Chinese (zh-CN)
- Data persists via `localStorage` (keys: `todos`, `todo-theme`)
- Theme uses `data-theme` attribute on `<html>`; CSS variables in `style.css`
- No dependencies, no dev server, no transpilation — edit and refresh
