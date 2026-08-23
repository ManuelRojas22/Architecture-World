# ARCHITECTURE WORLD

Juego educativo 3D para aprender 6 arquitecturas de software.

## Ejecutar

```bash
npm install
npm start        # abre http://localhost:5173 en tu navegador
```

El juego funciona directamente desde `src/` con el servidor de Vite: **no hace falta ninguna carpeta `dist/` ni paso de build** para jugar.

## Build para GitHub Pages (opcional)

```bash
npm run build
```

Esto genera la carpeta `dist/` lista para subir (solo necesaria si quieres publicarlo como web estática).

### Publicar en GitHub Pages (manual)

1. Sube el contenido de `dist/` a la rama `main` (o `gh-pages`).
2. En el repositorio: Settings → Pages → Build and deployment → Deploy from a branch.
3. Selecciona la rama y carpeta `/ (root)` (o `/docs` si usas esa convención).
4. Guarda y espera la URL pública.

`vite.config.js` ya tiene `base: './'` para funcionar en subdirectorios.

## Estructura del código (Clean Architecture simplificada)

```
src/
├── main.js
├── presentation/
│   ├── HUD.js
│   ├── ArchitectureLabel.js
│   ├── ArchitectureModal.js
│   ├── Compendium.js
│   └── EndgameScreen.js
├── application/
│   ├── GameManager.js
│   ├── ArchitectureManager.js
│   ├── ProgressManager.js
│   └── InteractionManager.js
├── domain/
│   ├── Player.js
│   ├── Architecture.js
│   └── Discovery.js
├── infrastructure/
│   ├── ThreeRenderer.js
│   ├── PlayerController.js
│   ├── BuildingFactory.js
│   ├── AssetLoader.js
│   └── Storage.js
└── data/
    └── architectures.js
```

## Controles

- **W / A / S / D** mover
- **Shift** correr
- **Mouse** rotar cámara (click para bloquear puntero)
- **E** interactuar con edificio cercano
- **C** abrir/cerrar compendio
- **H** ayuda
- **Esc** cerrar paneles/modal

## Requisitos

- Navegador moderno con WebGL2
- Node ≥ 18 para desarrollo
