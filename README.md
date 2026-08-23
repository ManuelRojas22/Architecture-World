# ARCHITECTURE WORLD

**Videojuego 3D educativo para dominar las arquitecturas de software explorando un mundo abierto.**

![version](https://img.shields.io/badge/versi%C3%B3n-1.1.2-blue)
![engine](https://img.shields.io/badge/motor-Three.js%20r164-049EF4)
![build](https://img.shields.io/badge/build-Vite%206-A259FF)
![licencia](https://img.shields.io/badge/uso-educativo-green)

Explora el mapa libremente, localiza las 6 estructuras y estudia cada arquitectura en su edificio hasta completar tu compendio y convertirte en **Arquitecto Master**.

| | |
|---|---|
| 🧱 Monolítica | ⚙️ Microservicios |
| 📚 En Capas (N-Tier) | 🔔 Basada en Eventos |
| ☁️ Serverless | 👻 Headless |

---

## Índice

1. [Las 6 arquitecturas](#las-6-arquitecturas)
2. [Características](#características)
3. [Inicio rápido](#inicio-rápido)
4. [Comandos disponibles](#comandos-disponibles)
5. [Cómo se juega](#cómo-se-juega)
6. [Controles](#controles)
7. [Opciones gráficas](#opciones-gráficas)
8. [Sistema de progreso y guardado](#sistema-de-progreso-y-guardado)
9. [Calidad gráfica adaptativa](#calidad-gráfica-adaptativa)
10. [Stack técnico](#stack-técnico)
11. [Arquitectura del código](#arquitectura-del-código)
12. [Publicar en la web](#publicar-en-la-web)
13. [Solución de problemas](#solución-de-problemas)
14. [Requisitos](#requisitos)

## Las 6 arquitecturas

El contenido educativo se define en `src/data/architectures.js`. Cada estructura del mundo enseña:

| # | Arquitectura | Idea clave | Ejemplos reales |
|---|---|---|---|
| 1 | **Microservicios** | Divide la aplicación en servicios independientes que comunican por APIs ligeras, cada uno con su propia base de datos | Netflix, Amazon, Uber |
| 2 | **Monolítica** | Una única unidad desplegable con UI, negocio y datos juntos; simple de desarrollar, difícil de escalar | Aplicaciones legacy, e-commerce simple |
| 3 | **Serverless** | Funciones gestionadas por el proveedor cloud que escalan a demanda; pagas por ejecución | AWS Lambda, Cloudflare Workers |
| 4 | **En Capas (N-Tier)** | Separación en presentación, negocio y datos; cada capa solo habla con la adyacente | Apps empresariales clásicas, Spring MVC |
| 5 | **Basada en Eventos** | Los componentes reaccionan a eventos asíncronos publicados en un broker; desacopla productores y consumidores | Kafka, RabbitMQ, sistemas de notificaciones |
| 6 | **Headless** | Backend sin interfaz que expone todo por API; el frontend se consume desde cualquier cliente | Headless CMS (Strapi), comercio headless |

De cada una aprenderás: qué es, cómo funciona, sus componentes típicos, ventajas, desventajas, ejemplos reales y un diagrama SVG.

## Características

### Mundo
- Mundo abierto 3D con **ciclo día/noche completo**: amaneceres, atardeceres, estrellas nocturnas, sol con corona y luna con halo pulsante
- Cielo fotográfico panorámico con degradado procedural de respaldo
- Entorno decorado: hierba alta, flores, nubes y luciérnagas (desactivables)

### Experiencia
- Pantalla de bienvenida animada con intro, menú principal, estadísticas para jugadores recurrentes y pantalla de carga
- Tutorial inicial e indicador de misión que te guía hacia la primera estructura
- Compendio con ventajas/desventajas, componentes, ejemplos reales (Netflix, Amazon, Uber…) y diagramas SVG por arquitectura
- Sistema de progreso con XP, niveles, guardado automático y **exportar/importar partida** vía portapapeles

### Rendimiento
- Detección automática de calidad del equipo (alta / media / baja)
- Escalado adaptativo de resolución cuando los FPS caen
- Selector manual de resolución (360p → 4K) y límite de FPS (30 → 240)

## Inicio rápido

```bash
git clone <repo>
cd game
npm install
npm start        # abre http://localhost:5173 automáticamente
```

> El juego corre directamente desde `src/` con el servidor de Vite: no necesitas `dist/` ni compilar nada para jugar.

## Comandos disponibles

| Comando | Qué hace |
|---|---|
| `npm start` | Servidor de desarrollo y abre el navegador (puerto 5173) |
| `npm run dev` | Igual que `start`, sin abrir el navegador |
| `npm run build` | Genera `dist/` minificada para producción (Terser, ES2022, elimina `console.*`) |
| `npm run preview` | Sirve `dist/` localmente para verificar el build |

## Cómo se juega

1. Pulsa **COMENZAR A EXPLORAR** en el menú principal
2. Sigue el indicador de misión hasta la primera estructura
3. Acércate y pulsa **E** para estudiarla: qué es, cómo funciona, ventajas, desventajas y ejemplos reales
4. Cada descubrimiento suma XP; completa las 6 para ver la pantalla final

## Controles

| Tecla | Acción |
|---|---|
| `W` `A` `S` `D` | Moverse |
| `Shift` | Correr |
| `Espacio` | Saltar |
| `Ratón` | Mirar (clic para capturar el puntero) |
| `E` | Interactuar con la estructura cercana |
| `C` | Abrir/cerrar el compendio |
| `H` | Ayuda |
| `Esc` | Cerrar paneles/modal |

## Opciones gráficas

Panel en vivo (⚙️ durante la partida); los cambios se aplican al instante y se guardan automáticamente.

| Grupo | Opción | Valores |
|---|---|---|
| Gráficos | Bloom · Sombras · Hierba · Luciérnagas · Nubes · Reflejos | On/Off |
| Gráficos | Intensidad de reflejos · Exposición · Niebla | Sliders |
| Gráficos | Mapa de sombras | 1024 / 2048 / 4096 |
| Gráficos | **Resolución de renderizado** | Automática, 360p, 480p, 540p, 720p, 1080p, 1440p, 4K |
| Gráficos | **Límite de FPS** | Sin límite, 240, 144, 120, 60, 30 |
| Controles | Sensibilidad del ratón · Velocidad · FOV | Sliders |
| Mundo | Ciclo día/noche automático · Hora manual | On/Off · 0–24 h |
| Partida | Exportar / Importar progreso | Portapapeles |

> Con un límite de FPS activo, el escalado adaptativo no reduce resolución al acercarse al tope elegido: solo reacciona si el equipo realmente no llega.

## Sistema de progreso y guardado

Todo se guarda automáticamente en `localStorage` del navegador — no hay servidor ni cuentas.

| Clave | Contenido |
|---|---|
| `architecture_world_progress` | Arquitecturas descubiertas, retos completados, nivel, XP y xpMax |
| `architecture_world_intro_seen` | Si ya viste el tutorial inicial |
| `architecture_world_settings` | Todas las opciones gráficas y de control |

- Cada estructura descubierta otorga XP; al acumular suficiente subes de nivel
- Al descubrir las 6 aparece la pantalla final con tus estadísticas
- **Exportar progreso** copia tu partida al portapapeles como texto Base64; **Importar** la restaura en otro navegador o dispositivo
- "Nueva partida" desde el menú borra progreso y tutorial (no las opciones)

## Calidad gráfica adaptativa

Al arrancar, el juego detecta la capacidad del equipo (`detectQuality`) y elige un perfil:

| Perfil | Condición | DPR máx. | Sombras | Hierba | Film grain |
|---|---|---|---|---|---|
| Alta | Muchos núcleos y pantalla pequeña/media | 1.5 | 2048 | 5000 briznas | Sí |
| Media | ≤ 8 núcleos o pantallas muy densas | 1.25 | 2048 | 3000 | No |
| Baja | Móvil, ≤ 4 núcleos o poca RAM | 1.0 | 1024 | 1400 | No |

Además, durante la partida se mide el FPS cada segundo:

- Si baja de **45 FPS**, la resolución interna se reduce progresivamente (hasta −40 %)
- Si supera **58 FPS**, va recuperando calidad hasta el 100 %
- Con límite de FPS configurado, estar cerca del tope no cuenta como bajo rendimiento

## Stack técnico

- **[Three.js r164](https://threejs.org/)** — render 3D WebGL2
  - Postproceso: `EffectComposer` + Bloom (`UnrealBloomPass`), grano de película (`FilmPass`, solo perfil alto) y salida sRGB
  - Cielo equirectangular fotográfico + degradado procedural de respaldo, sol/luna dinámicos y envmap PMREM generado en tiempo real para los reflejos
  - Tone mapping ACES Filmic, niebla exponencial, sombras PCF suaves
- **[Vite 6](https://vite.dev/)** — dev server y build (chunks separados para Three.js)
- **JavaScript ES2022 nativo**, sin frameworks ni dependencias de runtime aparte de Three.js
- Interfaz DOM/CSS puro sobre el canvas (menús, compendio, ajustes)

## Publicar en la web

```bash
npm run build    # genera dist/ minificado listo para hosting estático
```

<details>
<summary>Publicar en GitHub Pages (manual)</summary>

1. Sube el contenido de `dist/` a la rama `main` (o `gh-pages`).
2. Repositorio → **Settings → Pages → Build and deployment → Deploy from a branch**.
3. Selecciona rama y carpeta `/ (root)` (o `/docs` si usas esa convención).
4. Guarda y espera la URL pública.

</details>

`vite.config.js` ya incluye `base: './'`, así que funciona en subdirectorios sin cambios.

## Arquitectura del código

Clean Architecture simplificada: las dependencias apuntan siempre hacia dentro (`presentation/application` → `domain`; `infrastructure` implementa detalles técnicos intercambiables).```
┌─────────────────────────────────────────────┐
│ presentation/   HUD, WelcomeScreen, modals… │  Interfaz DOM
├─────────────────────────────────────────────┤
│ application/    GameManager, Progress…      │  Orquestación
├─────────────────────────────────────────────┤
│ domain/         Player, Architecture…       │  Entidades puras
├─────────────────────────────────────────────┤
│ infrastructure/ ThreeRenderer, Storage…     │  Three.js, localStorage
└─────────────────────────────────────────────┘
              data/architectures.js            Contenido educativo
```

<details>
<summary>Detalle completo de archivos</summary>

```
src/
├── main.js                     Arranque, bienvenida, ajustes y eventos globales
├── presentation/
│   ├── HUD.js                  Barra de progreso en partida
│   ├── WelcomeScreen.js        Intro, menú principal, stats y pantalla de carga
│   ├── IntroModal.js           Tutorial inicial para nuevos jugadores
│   ├── TutorialHints.js        Pistas de controles e indicador de misión
│   ├── ArchitectureLabel.js    Rótulos flotantes sobre cada estructura
│   ├── BuildingInfoPanel.js    Panel lateral de información de edificio
│   ├── ArchitectureModal.js    Ficha completa al interactuar (E)
│   ├── Compendium.js           Colección de arquitecturas descubiertas
│   └── EndgameScreen.js        Pantalla final al completar todo
├── application/
│   ├── GameManager.js          Bucle principal y cableado de sistemas
│   ├── ArchitectureManager.js  Posiciones y colisiones de estructuras
│   ├── ProgressManager.js      Descubrimientos, XP y niveles
│   └── InteractionManager.js   Proximidad e interacción
├── domain/
│   ├── Player.js               Jugador (movimiento, salto, colisión)
│   ├── Architecture.js         Modelo de arquitectura
│   └── Discovery.js            Evento de descubrimiento
├── infrastructure/
│   ├── ThreeRenderer.js        Renderer, postproceso, cielo, resolución y FPS
│   ├── Environment.js          Terreno, hierba, nubes, luciérnagas
│   ├── BuildingFactory.js      Construcción 3D de cada estructura
│   ├── AssetLoader.js          Carga de assets
│   ├── PlayerController.js     Entrada teclado/ratón → jugador
│   └── Storage.js              Persistencia en localStorage
└── data/
    └── architectures.js        Datos de las 6 arquitecturas
```

</details>

Para añadir una nueva arquitectura solo hay que ampliar `src/data/architectures.js`: el mundo, el compendio y el progreso se generan a partir de esos datos.

En la raíz del proyecto:

```
game/
├── index.html        Punto de entrada: paneles de ayuda y configuración, toast
├── style.css         Toda la interfaz (bienvenida, modales, HUD, ajustes)
├── vite.config.js    Build: base relativa, Terser, chunks para Three.js
├── public/           Assets estáticos copiados tal cual (imágenes del cielo)
└── src/              Código fuente (ver detalle arriba)
```

## Solución de problemas

| Problema | Solución |
|---|---|
| Pantalla negra | Verifica que tu navegador soporta WebGL2 (`webglreport.com`) y tiene aceleración hardware activa |
| Pocos FPS | Baja la Resolución (480p/540p), activa un Límite de FPS estable o desactiva sombras/reflejos |
| Perdí mi progreso | Usa Exportar progreso periódicamente; el guardado es local al navegador |
| El ratón "se escapa" | Haz clic sobre el juego para capturar el puntero; `Esc` lo libera |

## Requisitos

- Navegador moderno con **WebGL2**
- Node ≥ 18 (solo para desarrollo)

---

**v1.1.2** · Modo Exploración · Hecho con Three.js y Vite
