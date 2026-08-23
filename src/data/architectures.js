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
];
