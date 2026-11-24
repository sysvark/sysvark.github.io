# SYSVARK

Web en español de SYSVARK, proyecto español de automatización empresarial, integración de herramientas y desarrollo de software a medida fundado por Álvaro Sánchez Pérez. Incluye una presentación de los servicios, cuatro demostraciones animadas con ejemplos ficticios y una calculadora del coste del trabajo manual.

## Ejecutar y compilar

Requiere Node.js 22 o superior. La web y la compilación no requieren instalar paquetes. Las escenas públicas utilizan HTML, CSS y JavaScript nativos. Desde la raíz:

```sh
node --test
node scripts/build.mjs
node scripts/serve.mjs
```

Abre http://127.0.0.1:4173. El servidor solo escucha en la interfaz local. Detén el proceso con Ctrl+C. Tras editar las fuentes, vuelve a compilar y recarga el navegador. Si usas npm, los equivalentes son `npm ci`, `npm test`, `npm run build` y `npm start`. No edites `dist/`: la compilación regenera este directorio.

## Arquitectura

HTML semántico, CSS responsive, gráficos SVG, módulos JavaScript y un ensamblador estático escrito en Node.js. Esta arquitectura mantiene el contenido indexable, elimina el servidor de producción y evita cargar un framework para mostrar la portada. Los lectores de archivos de la edición anterior se conservan en las fuentes y quedan fuera de la exportación.

| Ruta | Contenido |
|---|---|
| `index.html` | Portada en español, servicios, método, calculadora y preguntas frecuentes |
| `assets/` | Sistema visual web, navegación, calculadora, diagrama y metadatos gráficos |
| `brand/` | Maestros vectoriales, versiones PNG, avatares, portada social y guía de identidad |
| `demos/` | Sección interactiva, módulos XLSX y PDF, bibliotecas y licencias |
| `demos/files/` | Tres libros de operaciones y dos facturas ficticias con sus vistas previas |
| `demos/tests/` | Pruebas y generadores de muestras |
| `contact/` | Formulario, estilos y estados de envío |
| `aviso-legal.html`, `privacidad.html` | Información sobre esta edición informativa |
| `scripts/` | Exportación, comprobación de enlaces y servidor de desarrollo |
| `.github/workflows/pages.yml` | Pruebas, compilación y publicación desde main |
| `docs/` | Verificaciones, alta de cuentas e informe de entrega |

### Cambiar contenidos y diseño

Edita la sección correspondiente de `index.html`. Para añadir un servicio, replica un artículo dentro de Soluciones y ajusta su título, icono, texto y lista. Para una nueva demo, añade su panel en `demos/section.html`, define sus etapas en el módulo de demostraciones y verifica su rotación en el navegador. Conserva los marcadores de ensamblado DEMOS y CONTACT. Los componentes comparten colores y tipografía en `assets/site.css`. Si cambias el logotipo, actualiza el maestro en `brand/`, las variantes de uso y los recursos de `assets/`. Sigue la guía de identidad.

Para introducir otro idioma, conserva esta portada en la raíz y crea una ruta estática por idioma. Traduce etiquetas, validaciones y descripciones accesibles, actualiza `lang`, URLs canónicas, sitemap y enlaces de idioma antes de publicarla.

### Datos y contacto

Las escenas ilustran la consolidación de hojas, la lectura de facturas el reparto de solicitudes y un flujo de pedido conectado. Avanzan automáticamente con datos ficticios. El selector de ejemplo y los botones de etapa permiten recorrerlas manualmente. El modo de movimiento reducido desactiva el avance automático. La calculadora usa 52 semanas por año y 12 meses.

El formulario envía la consulta a sysvark@outlook.com mediante FormSubmit. El buzón debe confirmar el enlace de activación del proveedor. La web muestra el acuse únicamente cuando FormSubmit acepta la consulta y conserva los campos ante un error.

Las únicas variables son `SITE_URL` (origen HTTPS de la web, obtenido de Pages en el workflow), `FORMSPREE_ENDPOINT` (opcional) y `PORT` (desarrollo). Se leen del entorno del proceso. Todo valor incorporado al navegador es público. Mantén claves privadas, tokens, contraseñas y códigos de recuperación fuera de estas variables y del repositorio.

## GitHub Pages

1. En la cuenta dedicada, crea un repositorio público vacío llamado exactamente **usuario.github.io**, sustituyendo *usuario* por el nombre confirmado.
2. En **Settings → Pages → Build and deployment**, selecciona **GitHub Actions**. Sube las fuentes a la rama `main` y consulta la ejecución **Publicar web en Pages** en Actions.
3. La compilación instala desde el archivo de bloqueo, ejecuta las pruebas, integra secciones, comprueba los enlaces y sube únicamente `dist/`. El trabajo de despliegue recibe los permisos de escritura en Pages e identidad temporal. Si falla la compilación, el despliegue no se inicia.
4. Comprueba la URL de entorno de la ejecución terminada, el certificado HTTPS, el 404, la compactación al desplazarse y el ciclo completo de las cuatro escenas. En **Settings → Pages**, verifica **Enforce HTTPS** cuando esté disponible. La URL del repositorio no es la URL de la web.

Las condiciones de Pages afectan al uso comercial. Mantén esta edición informativa mientras se resuelve la captación. Consulta las fuentes y decisiones en `docs/verificaciones.md`. Para migrar, configura `SITE_URL` con el nuevo origen, compila y sirve el contenido de `dist/` desde la raíz de un alojamiento estático con HTTPS. No se ha configurado un dominio propio.

## Mantenimiento y diagnóstico

- **Solo aparece parte de la portada.** Usa la exportación de `dist/` servida por HTTP. El fichero fuente de la raíz conserva marcadores y los módulos necesitan un origen web.
- **La compilación falla por un enlace.** La excepción indica el HTML y el recurso o ancla que falta. Comprueba también mayúsculas y minúsculas antes de subir a Linux.
- **Actions no despliega.** Comprueba el nombre del repositorio, que la rama sea `main`, la fuente GitHub Actions y la primera etapa fallida en el registro. Tras corregirla, reintenta la ejecución.
- **Envío de contacto.** Comprueba la activación del buzón y el acuse de FormSubmit si hay errores.
- **Actualizar dependencias.** Revisa los avisos de seguridad y las versiones oficiales de PDF.js, JSZip y acciones de GitHub. Conserva las licencias. Repite pruebas de archivos, exportación, navegación y movimiento reducido después de actualizar. Las bibliotecas vendorizadas quedan fuera de npm audit.

Los logotipos de trayectoria se sirven localmente. Fuentes: [BBVA](https://www.bbva.com/wp-content/themes/coronita-bbvacom/assets/images/logos/bbva-logo-900x269.png), [Ministerio de Transportes](https://www.transportes.gob.es/sites/default/files/logos/logo-ministerio.svg), [Telefónica](https://commons.wikimedia.org/wiki/File:Telef%C3%B3nica_2021_logo.svg), [NTT DATA](https://commons.wikimedia.org/wiki/File:NTT_Data_2025.svg) y [UST](https://aslan.es/conociendo-a-ust-nuevo-asociado-aslan/).
