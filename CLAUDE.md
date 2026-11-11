# AI Lab · PRA2MEDIA (ailab.pra2media.com)

Contexto del proyecto (Claude web y Claude Code web). Responde siempre en español.

## Qué es

Proyecto nuevo de PRA2MEDIA (agencia digital, Ecuador), publicado como sitio estático (HTML, CSS y JS) en **https://ailab.pra2media.com**. Ya funciona con https. Hoy tiene solo una página temporal: «AI Lab · próximamente».

## Dónde vive

- Hosting: IONOS, el mismo webspace de reporte.pra2media.com.
- Carpeta del sitio en el servidor: `/ailab` (ruta completa `/homepages/4/d661274447/htdocs/ailab`).
- La página de inicio es `ailab/index.html`. Cualquier otro archivo queda en `ailab.pra2media.com/<archivo>`.
- Sitio estático: sin WordPress, sin base de datos y sin PHP salvo que se pida.

## Cómo trabajar

1. Escribe páginas completas y autocontenidas: un `index.html` con CSS y JS dentro, o con archivos aparte en rutas relativas (`css/`, `js/`, `img/`).
2. Usa la identidad de PRA2MEDIA: fondo negro, rojo #FF0000 a naranja #FF6400 en degradado y tipografía Plus Jakarta Sans o Galano Grotesque. Todo debe verse bien en el celular.
3. Entrega los archivos listos para descargar, con el nombre exacto y la ruta donde va cada uno.
4. Publicación:
   - **Claude Code web (este repositorio):** cada push a `main` publica automáticamente el contenido del repositorio en `/ailab` (GitHub Actions, `.github/workflows/deploy.yml`, por SFTP). No hace falta ningún acceso al servidor: las credenciales están como secretos de GitHub. Después del push, revisa que la acción termine en verde y que la página cargue.
   - **Claude web (chat):** no puede conectarse al servidor. Entrega los archivos para descargar y Roberto los sube con Claude Code en su computadora («sube esto a ailab»).
   - No pidas host, usuario, contraseña ni claves SSH: no se necesitan.
5. Archivos que no se publican: `.git`, `.github`, `CLAUDE.md`, `README.md`.

## Reglas

- No escribas contraseñas, tokens ni datos de acceso en el chat ni en los archivos.
- No toques reporte.pra2media.com ni la carpeta `/reportes`: es otro proyecto, el de los dashboards de clientes.
- Antes de reemplazar `index.html`, avisa que se sobrescribe la página actual.
