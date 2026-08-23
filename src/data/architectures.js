export const architectures = [
  {
    id: 'microservicios',
    order: 1,
    name: 'MICROSERVICIOS',
    shortName: 'Microservicios',
    position: { x: -10, z: -112 },
    color: 0x00ffff,
    description: {
      what: 'Arquitectura que divide una aplicación en pequeños servicios independientes que se comunican mediante APIs ligeras.',
      how: 'Cada servicio tiene su propia base de datos y lógica de negocio; se despliegan y escalan de forma independiente.',
      components: ['API Gateway', 'Servicio de usuarios', 'Servicio de pedidos', 'Servicio de pagos', 'Message broker'],
      advantages: ['Escalabilidad granular', 'Despliegue independiente', 'Tecnologías heterogéneas', 'Resiliencia'],
      disadvantages: ['Complejidad operativa', 'Latencia de red', 'Consistencia eventual', 'Testing distribuido'],
      examples: ['Netflix', 'Amazon', 'Uber'],
      diagramSvg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
        <style>.box{fill:#0ff;opacity:0.2;stroke:#0ff;stroke-width:2;rx:8;}.label{fill:#fff;font-family:sans-serif;font-size:12px;text-anchor:middle;}.arrow{stroke:#0ff;stroke-width:2;marker-end:url(#arrow);}</style>
        <defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#0ff"/></marker></defs>
        <rect class="box" x="20" y="60" width="80" height="80"/><text class="label" x="60" y="110">API Gateway</text>
        <rect class="box" x="150" y="20" width="100" height="50"/><text class="label" x="200" y="50">Usuarios</text>
        <rect class="box" x="150" y="80" width="100" height="50"/><text class="label" x="200" y="110">Pedidos</text>
        <rect class="box" x="150" y="140" width="100" height="50"/><text class="label" x="200" y="170">Pagos</text>
        <line class="arrow" x1="100" y1="100" x2="150" y2="45"/><line class="arrow" x1="100" y1="100" x2="150" y2="105"/><line class="arrow" x1="100" y1="100" x2="150" y2="165"/>
      </svg>`
    }
  },
  {
    id: 'monolitica',
    order: 2,
    name: 'MONOLÍTICA',
    shortName: 'Monolítica',
    position: { x: -108, z: -62 },
    color: 0xffaa00,
    description: {
      what: 'Toda la aplicación se construye como una única unidad desplegable que contiene UI, lógica de negocio y acceso a datos.',
      how: 'Un solo proceso maneja todas las peticiones; los módulos internos se comunican por llamadas de función directas.',
      components: ['Capa de presentación', 'Capa de negocio', 'Capa de datos', 'Base de datos única'],
      advantages: ['Simplicidad de desarrollo', 'Despliegue único', 'Testing fácil', 'Rendimiento (sin red)'],
      disadvantages: ['Escalabilidad limitada', 'Acoplamiento fuerte', 'Despliegue todo o nada', 'Tecnología única'],
      examples: ['Aplicaciones legacy', 'Pequeños proyectos', 'E-commerce simple'],
      diagramSvg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
        <style>.layer{fill:#ffaa00;opacity:0.15;stroke:#ffaa00;stroke-width:2;rx:6;}.label{fill:#fff;font-family:sans-serif;font-size:13px;text-anchor:middle;}</style>
        <rect class="layer" x="50" y="20" width="300" height="50"/><text class="label" x="200" y="52">Presentación</text>
        <rect class="layer" x="50" y="80" width="300" height="50"/><text class="label" x="200" y="112">Negocio</text>
        <rect class="layer" x="50" y="140" width="300" height="50"/><text class="label" x="200" y="172">Datos</text>
      </svg>`
    }
  },
  {
    id: 'serverless',
    order: 3,
    name: 'SERVERLESS',
    shortName: 'Serverless',
    position: { x: -102, z: 59 },
    color: 0x00ff88,
    description: {
      what: 'Ejecución de código en funciones efímeras gestionadas por el proveedor de nube; no hay servidores que administrar.',
      how: 'Eventos (HTTP, colas, timers) disparan funciones stateless que se escalan automáticamente a cero cuando no hay carga.',
      components: ['API Gateway', 'Funciones (FaaS)', 'Servicios gestionados (DB, Storage, Auth)', 'Event bus'],
      advantages: ['Costo por uso', 'Escalado automático', 'Sin ops de servidores', 'Despliegue rápido'],
      disadvantages: ['Cold start', 'Límites de tiempo/paquete', 'Vendor lock‑in', 'Depuración distribuida'],
      examples: ['AWS Lambda', 'Azure Functions', 'Google Cloud Functions'],
      diagramSvg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
        <style>.cloud{fill:#00ff88;opacity:0.15;stroke:#00ff88;stroke-width:2;}.fn{fill:#00ff88;opacity:0.2;stroke:#00ff88;stroke-width:2;rx:6;}.label{fill:#fff;font-family:sans-serif;font-size:12px;text-anchor:middle;}.arrow{stroke:#00ff88;stroke-width:2;marker-end:url(#arr);}</style>
        <defs><marker id="arr" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#00ff88"/></marker></defs>
        <ellipse class="cloud" cx="200" cy="30" rx="120" ry="30"/><text class="label" x="200" y="35">Nube / Proveedor</text>
        <rect class="fn" x="80" y="90" width="80" height="40"/><text class="label" x="120" y="115">Fn Auth</text>
        <rect class="fn" x="180" y="90" width="80" height="40"/><text class="label" x="220" y="115">Fn Pedido</text>
        <rect class="fn" x="280" y="90" width="80" height="40"/><text class="label" x="320" y="115">Fn Pago</text>
        <line class="arrow" x1="200" y1="60" x2="120" y2="90"/><line class="arrow" x1="200" y1="60" x2="220" y2="90"/><line class="arrow" x1="200" y1="60" x2="320" y2="90"/>
        <ellipse class="cloud" cx="200" cy="170" rx="100" ry="25"/><text class="label" x="200" y="175">Servicios gestionados</text>
      </svg>`
    }
  },
  {
    id: 'encapas',
    order: 4,
    name: 'EN CAPAS (N-TIER)',
    shortName: 'En Capas',
    position: { x: -9, z: 108 },
    color: 0xff00ff,
    description: {
      what: 'Separa la aplicación en capas horizontales (presentación, negocio, datos) con dependencias unidireccionales.',
      how: 'Cada capa expone servicios a la superior; la capa de datos es la única que accede a la BD.',
      components: ['Presentación (UI)', 'Lógica de negocio', 'Acceso a datos / Repositorios', 'Base de datos'],
      advantages: ['Separación de responsabilidades', 'Testabilidad por capas', 'Reutilización de negocio', 'Mantenibilidad'],
      disadvantages: ['Rigidez en cambios transversales', 'Posible "capas de dios"', 'Latencia por cruce de capas', 'Acoplamiento a BD'],
      examples: ['Java EE clásico', '.NET 3‑tier', 'Aplicaciones ERP'],
      diagramSvg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
        <style>.layer{fill:#ff00ff;opacity:0.12;stroke:#ff00ff;stroke-width:2;rx:6;}.label{fill:#fff;font-family:sans-serif;font-size:13px;text-anchor:middle;}.arrow{stroke:#ff00ff;stroke-width:2;marker-end:url(#a);}</style>
        <defs><marker id="a" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#ff00ff"/></marker></defs>
        <rect class="layer" x="50" y="20" width="300" height="45"/><text class="label" x="200" y="50">Presentación</text>
        <line class="arrow" x1="200" y1="65" x2="200" y2="80"/>
        <rect class="layer" x="50" y="80" width="300" height="45"/><text class="label" x="200" y="110">Negocio</text>
        <line class="arrow" x1="200" y1="125" x2="200" y2="140"/>
        <rect class="layer" x="50" y="140" width="300" height="45"/><text class="label" x="200" y="170">Datos</text>
      </svg>`
    }
  },
  {
    id: 'eventos',
    order: 5,
    name: 'BASADA EN EVENTOS',
    shortName: 'Eventos',
    position: { x: 98, z: 82 },
    color: 0xff4444,
    description: {
      what: 'Los componentes se comunican emitiendo y consumiendo eventos asíncronos a través de un bus o broker.',
      how: 'Productores publican eventos; consumidores suscritos reaccionan sin conocer al productor (desacoplamiento temporal).',
      components: ['Productores de eventos', 'Event Bus / Broker (Kafka, RabbitMQ)', 'Consumidores / Handlers', 'Event Store (opcional)'],
      advantages: ['Desacoplamiento fuerte', 'Escalabilidad horizontal', 'Resiliencia y replay', 'Extensibilidad fácil'],
      disadvantages: ['Complejidad de depuración', 'Consistencia eventual', 'Ordenación de eventos', 'Infraestructura extra'],
      examples: ['Sistemas IoT', 'Trading financiero', 'Microservicios con Kafka'],
      diagramSvg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
        <style>.node{fill:#ff4444;opacity:0.15;stroke:#ff4444;stroke-width:2;rx:8;}.bus{fill:#ff4444;opacity:0.1;stroke:#ff4444;stroke-width:3;rx:12;}.label{fill:#fff;font-family:sans-serif;font-size:12px;text-anchor:middle;}.arrow{stroke:#ff4444;stroke-width:2;marker-end:url(#e);}</style>
        <defs><marker id="e" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#ff4444"/></marker></defs>
        <rect class="node" x="20" y="30" width="100" height="40"/><text class="label" x="70" y="55">Productor A</text>
        <rect class="node" x="20" y="130" width="100" height="40"/><text class="label" x="70" y="155">Productor B</text>
        <rect class="bus" x="150" y="50" width="100" height="100"/><text class="label" x="200" y="105">Event Bus</text>
        <rect class="node" x="280" y="30" width="100" height="40"/><text class="label" x="330" y="55">Consumidor 1</text>
        <rect class="node" x="280" y="130" width="100" height="40"/><text class="label" x="330" y="155">Consumidor 2</text>
        <line class="arrow" x1="120" y1="50" x2="150" y2="80"/><line class="arrow" x1="120" y1="150" x2="150" y2="120"/>
        <line class="arrow" x1="250" y1="80" x2="280" y2="50"/><line class="arrow" x1="250" y1="120" x2="280" y2="150"/>
      </svg>`
    }
  },
  {
    id: 'headless',
    order: 6,
    name: 'HEADLESS',
    shortName: 'Headless',
    position: { x: 117, z: -42 },
    color: 0x8844ff,
    description: {
      what: 'Backend expone APIs (REST/GraphQL) sin frontend acoplado; cualquier canal (web, móvil, IoT) consume la misma API.',
      how: 'El "head" (UI) se separa completamente; el CMS o motor de negocio sirve contenido vía API a múltiples frontends.',
      components: ['API Headless (Content/Commerce)', 'Panel de administración', 'Frontends múltiples (Web, App, Voice)', 'CDN / Edge'],
      advantages: ['Omnicanal real', 'Frontend libre (React, Vue, nativo)', 'Escalabilidad de frontend separada', 'Reutilización de contenido'],
      disadvantages: ['Mayor esfuerzo inicial', 'Gestión de múltiples frontends', 'Complejidad de preview', 'Auth compartida'],
      examples: ['Contentful', 'Strapi', 'Shopify Hydrogen', 'Sanity'],
      diagramSvg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
        <style>.core{fill:#8844ff;opacity:0.15;stroke:#8844ff;stroke-width:2;rx:10;}.head{fill:#8844ff;opacity:0.12;stroke:#8844ff;stroke-width:2;rx:8;}.label{fill:#fff;font-family:sans-serif;font-size:12px;text-anchor:middle;}.arrow{stroke:#8844ff;stroke-width:2;marker-end:url(#h);}</style>
        <defs><marker id="h" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#8844ff"/></marker></defs>
        <rect class="core" x="130" y="60" width="140" height="80"/><text class="label" x="200" y="105">Backend / API</text>
        <rect class="head" x="20" y="20" width="90" height="40"/><text class="label" x="65" y="45">Web</text>
        <rect class="head" x="20" y="140" width="90" height="40"/><text class="label" x="65" y="165">Móvil</text>
        <rect class="head" x="290" y="20" width="90" height="40"/><text class="label" x="335" y="45">IoT</text>
        <rect class="head" x="290" y="140" width="90" height="40"/><text class="label" x="335" y="165">Voice</text>
        <line class="arrow" x1="130" y1="80" x2="110" y2="40"/><line class="arrow" x1="130" y1="120" x2="110" y2="160"/>
        <line class="arrow" x1="270" y1="80" x2="290" y2="40"/><line class="arrow" x1="270" y1="120" x2="290" y2="160"/>
      </svg>`
    }
  }
];
