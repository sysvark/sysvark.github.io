# Auditoría integral de SYSVARK

**26 de noviembre de 2026 · Candidato local para aprobación.** La referencia inicial es el commit `973cea7`. Las correcciones técnicas están en `85c28ed` y `ca76872`, en la rama `auditoria/perfeccionamiento-2026-11`. La revisión no ha cambiado producción, la visibilidad del repositorio ni los servicios contratados.

## Diagnóstico y prioridades

La web estática tenía una identidad reconocible, cuatro ejemplos de negocio y una exportación sin dependencias npm de producción. Se mantuvo esta arquitectura. Los defectos de mayor impacto afectaban a la exposición del proyecto, el uso sin JavaScript, la estabilidad móvil y la interpretación de las estimaciones. Algunas comprobaciones automáticas aprobaban estados que seguían siendo problemáticos para una persona.

| Área | Hallazgo inicial | Corrección y comprobación |
|---|---|---|
| Publicación | El pie enlazaba al perfil de GitHub, la compilación copiaba toda la carpeta de recursos y subir a main desplegaba. | Se retiró el enlace. El build exige 34 nombres exactos, comprueba los enlaces y detiene la salida si encuentra ficheros inesperados, mapas o patrones habituales de secretos. CI separa validación y despliegue. |
| Cabecera y portada | El enlace para saltar al contenido podía quedar detrás de la cabecera. La navegación móvil sin JS ocupaba parte del hero. A 320 px los nombres del diagrama eran difíciles de leer. | Foco visible por encima de la barra, menú compacto hasta 920 px, cabecera estática sin scripting y diagrama vertical en móvil. Durante la iteración se eliminó un cambio de geometría al arrancar JS. |
| Lectura y servicios | Demos, cabecera y contacto seguían ejes distintos. Varios enlaces de servicios apuntaban al mismo punto. La opacidad inicial de los títulos en movimiento reducía su contraste. | Contenedor y espaciado comunes, destinos por servicio, lectura estable durante scroll, realce por puntero y títulos con contraste suficiente durante la entrada. A 1440 px, cabecera, demos y contacto comparten un margen de 80 px. |
| Demos | Sin JS se solapaban cuatro escenas con controles inertes. La rotación podía trasladar el foco mientras se leía una etapa. | Cuatro ejemplos estáticos legibles como alternativa. Con JS se conservan selector, etapas y reproducción. Mientras el teclado está dentro de las etapas, el visitante mantiene escena y foco. Se probaron un ciclo completo y la preferencia de movimiento reducido. |
| Calculadora | Siete guiones sin JS, valores negativos o vacíos con un resultado anterior sin explicación, tarifa poco útil para céntimos y cifras que podían interpretarse como ahorro efectivo. | Módulo de cálculo puro y ejemplo inicial legible sin JS. Los campos y deslizadores comparten límites; se explica cuándo se muestra la última estimación válida. Se presentan horas y valor del tiempo, y se conserva la advertencia sobre ahorro efectivo. |
| Contacto | La validación permitía entradas formadas solo por espacios; el teléfono opcional carecía de validación práctica. Algunos textos de desarrollo describían un borrador de correo obsoleto. | Validación de campos, privacidad enlazada y explicación del siguiente paso. Solo el acuse explícito del proveedor activa «Mensaje enviado». Ante error se conserva lo escrito. Se comprobó con interceptación local, incluidos rechazo y doble envío. |
| Confianza y contenido | La zona de organizaciones podía confundirse con la cartera comercial actual. La documentación de varias etapas de entrega contenía estados históricos. | Se mantiene la aclaración de que los proyectos preceden a SYSVARK, los logos originales y el fundido individual. Se identificaron los documentos históricos y se actualizó el README operativo. |
| FAQ, pie y páginas auxiliares | Había diferencias de tipografía, objetivos táctiles y espaciados entre familias de componentes. El estilo de error era independiente. | Tokens comunes, comprobación del acordeón por teclado, pie simplificado y aviso legal, privacidad y 404 coherentes. Se probó un 404 anidado con código HTTP real. |

### Criterio visual

Se preservan el color petróleo, el isotipo, los fondos claros, las conexiones y la composición abierta de las marcas. El fichero de tokens concentra superficies, bordes, tipografía, ancho, espaciado, foco y tiempo de transición. Se reservaron las animaciones para explicar cambios de estado y se mantuvo el funcionamiento con movimiento reducido. En el formulario se priorizó la lectura del siguiente paso; en las escenas, que la información permanezca estable durante la interacción por teclado.

## Rendimiento antes y después

Lighthouse 12.8.2 en Chrome para Windows, navegación inicial, servidor HTTP local, perfiles móvil simulado y escritorio. Mismo método de servicio en ambas versiones. Comparación de tres ejecuciones móviles y dos de escritorio por versión. En [las mediciones](lighthouse.json), los nombres que empiezan por **baseline** corresponden al punto de restauración, **final** a la iteración intermedia y **release** al candidato definitivo. El envío del formulario no forma parte de estas mediciones.

| Indicador | Inicial | Candidato |
|---|---:|---:|
| Lighthouse móvil, rendimiento (mediana y rango) | 91 (77–92) | **100 (94–100)** |
| Lighthouse escritorio, rendimiento | 100 en ambas | **100 en ambas** |
| Accesibilidad / buenas prácticas / SEO | 96 / 100 / 100 | **100 / 100 / 92** |
| LCP móvil (mediana) | 2,10 s | **1,51 s** |
| LCP escritorio (rango) | 0,42–0,45 s | **0,37–0,38 s** |
| CLS móvil (tres cargas) | 0 | **0** |
| Peso total observado por Lighthouse móvil (rango) | 319–328 kB | **126–135 kB** |
| Exportación en disco | 36 ficheros, 409.174 bytes | **34 ficheros, 211.640 bytes** |

Las variantes WebP de BBVA, Transportes y UST conservan transparencia y resolución suficiente para dibujarse hasta a 3×. La firma de Outlook sigue en su URL existente. El peso de la exportación incluye imágenes sociales y firma que no se descargan necesariamente al cargar la portada. Las cachés y la compresión de GitHub Pages pueden producir transferencias distintas de las locales.

Una iteración intermedia registró CLS 0,109 y accesibilidad 96–97. Se corrigieron el arranque de la cabecera y el contraste de títulos durante el movimiento, y se repitieron las medidas. El mínimo de rendimiento móvil final, 94, queda un punto por debajo del objetivo en una ejecución. Son observaciones de laboratorio, no una garantía de puntuación.

**SEO.** Los documentos tienen título, idioma, descripción y jerarquía revisados. El sitemap lista las tres páginas indexables y el 404 tiene noindex. Se conservaron las URL canónicas, metadatos sociales y datos estructurados verificables. El único criterio SEO fallido en Lighthouse final fue la descarga de robots.txt desde la página. La CSP restringe fetch al destino de contacto. Una consulta HTTP independiente obtuvo 200 tanto para robots.txt como para el sitemap y confirmó su contenido. Se conservó la restricción. Esto no verifica la indexación en Search Console. [Resultados HTTP](rastreo.json)

**Respuesta a interacciones.** En una sesión reproducida de menú, demo, calculadora y FAQ, la mayor duración de evento registrada en Chrome pasó de 128 a 32 ms. Son eventos de laboratorio con umbral de observación de 16 ms. No se dispone de INP real del percentil 75, ni de LCP/CLS de campo del candidato todavía local. [Serie de eventos](interacciones.json)

## Evidencias de calidad y pruebas

- **Repositorio y referencia.** Inventario inicial de 86 archivos versionados, cuatro páginas HTML, componentes estáticos, bibliotecas y muestras históricas, identidad gráfica, configuración, documentación y pruebas. Se guardó la rama local `restauracion/preauditoria-973cea7`, se compiló su revisión aparte y se visitó la web pública. La producción previa se capturó en tres tamaños.
- **Automatización.** Once pruebas Node superadas. Cubren el lector histórico de informes, las fórmulas, límites, céntimos, décimas, ceros, entradas inválidas, invariantes de tiempo mensual y anual, estados del formulario y rechazo de artefactos inesperados. La calculadora utiliza 52 semanas y 12 meses sin redondear resultados intermedios.
- **Regresión funcional.** La prueba larga pasó en Edge con tres tamaños, navegación móvil, rutas de teclado, ciclo automático completo, etapas manuales, diagramas, controles de cálculo y alternativa sin JS. Se rechazó el envío sin consentimiento, campo inválido y respuesta negativa; el camino de éxito se verificó con un acuse simulado. No se envió ningún dato a FormSubmit durante la auditoría. La confirmación del proveedor y la entrega final al buzón son verificaciones diferentes.
- **Ejes, solapamientos y navegación.** Matriz de 320, 360, 375, 390, 393, 414, 430, 480, 600, 740, 760, 768, 820, 1024, 1280, 1366, 1440, 1536, 1920 y 2560 píxeles. También 844×390, 1024×600, 1366×768 y anchuras equivalentes a zoom. Se revisaron las páginas auxiliares a 320, 768 y 1440. Las 35 configuraciones por motor terminaron sin desbordamientos detectados. En una segunda prueba se aplicó zoom **nativo** 100, 125, 200 y 400 % en Edge; la anchura efectiva llegó a 313 px sin desplazamiento horizontal. [Zoom](zoom-real.json)
- **Navegadores.** Edge 158.0.4370.45, Chrome 158.0.8127.37, Firefox 153 y WebKit 26.5 en Windows. El control de errores propios de JS y peticiones fallidas de la matriz terminó limpio. WebKit aporta cobertura del motor; quedan sin probar Safari en hardware Apple y dispositivos físicos. [Edge](despues-edge.json) · [Chrome](despues-chrome.json) · [Firefox](despues-firefox.json) · [WebKit](despues-webkit.json)
- **Accesibilidad.** axe-core 4.14.1 con reglas A/AA y buenas prácticas no notificó infracciones en la portada, las cuatro escenas y las tres vistas auxiliares auditadas en Edge. Se comprobó el foco del enlace de salto, menú, FAQ, controles de etapa, formulario y el recorrido sin JS. Las pruebas automáticas y de teclado no certifican WCAG AA. Falta revisión humana con lector de pantalla y valoración del control del movimiento automático.
- **Rondas.** Se tomó una referencia inicial, se corrigieron interacciones y exposición, se unificó el diseño, se comprobó reflujo y teclado, se optimizaron imágenes y carga, se ejecutó regresión y se repitió la revisión final. Ante una lectura transitoria de WebKit se esperó al ancho CSS real y a dos fotogramas antes de medir. Los originales de las imágenes permanecen en la fuente; las vistas de revisión son derivadas de la captura completa.

### Capturas comparativas

| Pantalla | Página completa antes | Página completa después |
|---|---|---|
| Móvil, 390 px | [Inicial](capturas/antes-390.png) | [Candidato](capturas/despues-390.png) |
| Tableta, 768 px | [Inicial](capturas/antes-768.png) | [Candidato](capturas/despues-768.png) |
| Escritorio, 1440 px | [Inicial](capturas/antes-1440.png) | [Candidato](capturas/despues-1440.png) |

## Seguridad, privacidad y decisiones pendientes

El código fuente y el historial de la versión desplegada **siguen en un repositorio público**. Quitar el enlace del pie reduce la exposición desde la web. El candidato tampoco exporta el informe, pruebas, documentación privada, archivos .env, la carpeta .git, mapas de código ni bibliotecas históricas. Se comprobaron los nombres y los contenidos de texto del artefacto con reglas de detección de credenciales. Cero coincidencias de los patrones examinados no acredita ausencia universal de secretos. El HTML, CSS y JavaScript distribuidos siguen siendo inspeccionables. No se añadieron bloqueos de herramientas del navegador ni ofuscación.

**Para proteger el original**, la primera opción a verificar es publicar este sitio desde un repositorio privado en el mismo plan/cuenta manteniendo la URL. Antes de cambiar visibilidad hay que confirmar el plan, el comportamiento de Pages y la continuidad del sitio y de la firma de Outlook. Una alternativa es una fuente privada con un repositorio público separado que contenga solo el resultado de compilación. Otra es un alojamiento estático con ingesta privada, especialmente si el alcance comercial requiere cambiar de proveedor. Un cambio posterior no revoca copias ya descargadas del historial público. [Análisis, fuentes y requisitos de autorización](seguridad.md)

El informe de seguridad detalla además el estado de HSTS, las limitaciones de cabeceras en Pages, las reglas de CSP, el análisis de dependencias y las consultas públicas. Antes de declarar completa la documentación legal, el titular debe verificar identidad fiscal, domicilio y requisitos registrales aplicables, base jurídica, retención, acuerdos y transferencias de los proveedores, uso de las marcas y compatibilidad del alojamiento con la actividad real. No se añadieron identificadores ni permisos ficticios. El cliente no incorpora analítica ni cookies propias en el recorrido auditado.

## Archivos, publicación y reversión

- **Construcción y CI:** .github/workflows/pages.yml, scripts/build.mjs, scripts/release.mjs, scripts/serve.mjs y tests/release.test.mjs. Exportación, comprobación, CSP y autorización manual de despliegue.
- **Interfaz:** index.html, assets/tokens.css, assets/site.css, assets/site.js, assets/architecture.svg, las tres marcas WebP de assets/experience, assets/legal.css, 404.html, aviso-legal.html y privacidad.html.
- **Funcionalidad:** assets/calculator.mjs, contact/contact.css, contact/contact.js, contact/section.html, demos/demo.css, demos/demo.mjs, demos/section.html y sus pruebas de calculadora y contacto.
- **QA y documentación:** scripts/revisar-web.mjs, scripts/auditar-navegador.mjs, README.md, anotaciones de estado histórico en docs/entrega.md y docs/verificaciones.md, este informe y sus evidencias. No hay nuevas dependencias de ejecución de la web. Playwright, Lighthouse y axe se usaron como herramientas de desarrollo externas.

**Reproducción.** Con Node 22 o superior, ejecutar `node --test`, `node scripts/build.mjs` y `node scripts/serve.mjs`. La página local se sirve en http://127.0.0.1:4173 por defecto. Con Playwright disponible, `node scripts/revisar-web.mjs` prueba la interacción sin envíos reales. Para la matriz, ejecutar `node scripts/auditar-navegador.mjs http://127.0.0.1:4173 despues`. La herramienta admite PLAYWRIGHT_ENTRY, BROWSER_PATH, QA_ENGINE, QA_NAME, AXE_ENTRY y QA_CAPTURE. Para repetir Lighthouse, usar las cuatro categorías con perfil móvil predeterminado y repetir con preset desktop, sirviendo ambas revisiones bajo las mismas condiciones.

**Publicación pendiente de autorización expresa.** Revisar el candidato local, integrar el código aprobado en main y ejecutar manualmente **Validar y publicar la web** sobre main. Conviene mantener el informe y sus capturas en desarrollo privado si se quiere evitar que se consulten directamente en un repositorio público. La exclusión de dist no impide que se lean en GitHub si se suben a un repositorio público. Verificar inicio, recursos, URL de la firma, navegación, condiciones legales y 404 en el destino real. Una prueba de entrega al buzón requiere permiso independiente.

**Reversión.** El punto de restauración conserva el contenido previo. Si se autoriza un despliegue y se necesita volver, crear un commit de reversión del cambio de interfaz, restaurar la versión aprobada de los archivos afectados y conservar el mecanismo de publicación manual bajo revisión. Volver a validar el artefacto antes de desplegarlo. No hace falta forzar ramas ni sobrescribir historial. Hasta la decisión de publicación, producción sigue en la revisión anterior.
