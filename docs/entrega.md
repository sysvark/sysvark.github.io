# Entrega técnica de SYSVARK

## Activos

Identidad visual en `brand/` y `assets/`. El archivo `brand/GUIA.md` identifica tipografía, paleta, eslogan y cada variante. Portada española con cuatro servicios, dos demostraciones, calculadora, método, preguntas frecuentes, formulario desactivado, aviso legal y política de privacidad. La exportación en `dist/` incluye icono, Open Graph, datos estructurados, sitemap, robots y 404.

## Pruebas ejecutadas el 24 de noviembre de 2026

- Node 24 pasó las cinco pruebas unitarias de consolidación, exportación y estados del formulario. Las pruebas del proveedor se ejecutaron con respuestas controladas.
- La compilación verificó las rutas y anclas de todos los HTML generados.
- Edge 158.0.4370.33 ejecutó ambas demos. Los tres XLSX ficticios produjeron nueve filas de entrada y ocho consolidadas, con un duplicado, una referencia discrepante y una fila no válida. Se comprobó el error al cargar solo un libro. Ambas facturas se leyeron desde sus PDF, con totales de 145,20 y 290,40 euros. Se editaron campos y se comprobó su presencia en el CSV descargado.
- La portada se probó a 390, 768 y 1440 px, sin desbordamiento horizontal. Se verificaron el menú móvil, el estado del formulario y el cálculo de 12 h semanales a 20 €/h con un 50 % de tiempo liberado: 52 h mensuales, 26 h liberadas y 520 € de valor mensual potencial. Las pruebas de ambas demos verificaron la ausencia de solicitudes a otros orígenes y errores de ejecución.
- Una navegación local de escritorio a 1440 × 900 en Edge registró 376,5 ms hasta load, 21.287 bytes de HTML y 37.804 bytes de recursos contabilizados al inicio. Medición puntual en loopback. No se obtuvo puntuación Lighthouse ni una medición de red pública. Capturas en `docs/capturas/`.
- Se buscaron patrones comunes de claves privadas y tokens en las fuentes sin coincidencias. PDF.js se actualizó tras la detección de GHSA-hq66-cqwq-w95j en la copia inicial. Las bibliotecas distribuidas son PDF.js 6.5.438 (Apache 2.0) y JSZip 3.10.2 (MIT o GPLv3). Se descargaron del registro npm y se comprobó la integridad SHA-512 de los paquetes antes de copiar los archivos de navegador y sus licencias. [Aviso de seguridad](https://github.com/advisories/GHSA-hq66-cqwq-w95j)

## Cuentas, costes y estado operativo

El titular confirmó el buzón sysvark@outlook.com, el perfil github.com/sysvark y el cambio de correo en GitHub. Gestiona las opciones de seguridad y recuperación desde las cuentas dedicadas.

El repositorio local contiene la configuración de publicación en GitHub Pages. Revisar la última ejecución de Actions y la URL pública para confirmar el despliegue. El formulario no está conectado a servicios externos en la edición entregada. Coste contratado para el proyecto: **0 €/mes**. Sin dominios comprados, suscripciones de pago ni medios de pago introducidos.

El titular debe completar las comprobaciones registrales y los datos legales descritos en `docs/verificaciones.md` antes de abrir la captación. El procedimiento de mantenimiento, activación y migración está en el README.
