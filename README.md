# Tatuadores Malditos - Marketplace de tatuadores (Frontend)

Proyecto de la Evaluación Parcial 1 de **Desarrollo Full Stack II (DSY1104)**, Duoc UC.

Es un marketplace donde los **tatuadores publican su perfil y sus trabajos** y los **clientes** los encuentran, filtran por estilo y ciudad, y les envían una **solicitud de cita**. Está hecho solo con **HTML5, CSS3, JavaScript y Bootstrap 5** (sin backend). Los datos (tatuadores, usuarios, solicitud, solicitudes enviadas) se guardan en el `localStorage` del navegador.

## Cómo correrlo en localhost

Hay que abrir la carpeta con un servidor local.

**Opción 1 - VS Code:** instalar la extensión *Live Server*, abrir la carpeta `tatuadores-front` y hacer clic derecho en `index.html` > *Open with Live Server*.

**Opción 2 - Python:** dentro de la carpeta correr

```
python -m http.server 5500
```

y abrir http://localhost:5500

No necesita internet: Bootstrap está incluido en la carpeta `vendor/`.

## Cuentas de prueba

| Tipo | Correo | Contraseña |
|---|---|---|
| Administrador | admin@duoc.cl | admin123 |
| Tatuador (perfil TAT001, Camila Rojas) | tatuador@duoc.cl | tatuador1 |
| Cliente | cliente@gmail.com | cliente1 |

(También aparecen en un cuadro DEV debajo del formulario de login.)

Cupón de descuento para la solicitud: `PRIMERA10` (10 %).

Para volver los datos al estado inicial se puede borrar el localStorage desde la consola del navegador: `localStorage.clear()`.

## Cómo funciona

1. El cliente explora los **tatuadores** (`tatuadores.html`), filtra por estilo, ciudad o nombre y abre un **perfil** con su galería de trabajos.
2. Agrega los tatuadores que le interesan a su **solicitud de cita** con las horas estimadas de sesión (es el "carrito" del sitio).
3. Envía la solicitud. Se crea **una solicitud por tatuador**, con estado *Pendiente*, y a cada tatuador se le descuenta 1 **cupo** (las sesiones que le quedan disponibles ese mes).
4. El tatuador entra a su panel, ve las solicitudes que le llegaron y las **acepta o rechaza** (si rechaza, el cupo vuelve). El cliente ve el estado en **Mis solicitudes**.

## Páginas

**Públicas**

- `index.html` - Home (menú con logo y solicitud, hero, tatuadores destacados, cómo funciona, estilos, video y sección para tatuadores)
- `tatuadores.html` - Lista de tatuadores con filtros por estilo, ciudad, solo con cupos y buscador
- `tatuador-detalle.html?codigo=TAT001` - Perfil de un tatuador con galería de trabajos
- `solicitud.html` - Solicitud de cita (horas, cupón, comentario y envío)
- `mis-solicitudes.html` - Estado de las solicitudes enviadas (solo clientes)
- `registro.html` y `login.html`
- `nosotros.html`, `blogs.html` (+ `blog-detalle-1.html` y `blog-detalle-2.html`) y `contacto.html`

**Panel (`admin/`)** - requiere iniciar sesión

- `admin/index.html` - Home del panel (menú vertical, resumen y alerta de cupos críticos)
- `admin/tatuadores.html` y `admin/tatuador-form.html` - Mantenedor de tatuadores (y "Mi perfil" para cada tatuador)
- `admin/usuarios.html` y `admin/usuario-form.html` - Mantenedor de usuarios
- `admin/solicitudes.html` - Lista y detalle de solicitudes, con aceptar y rechazar

## Tipos de usuario

- **Administrador:** acceso total.
- **Tatuador:** edita **su propio** perfil (bio, precio, cupos, estilo, ciudad, foto), ve la lista de tatuadores y las solicitudes que le llegan a él, y las responde. Es el equivalente al "vendedor" de la pauta del curso.
- **Cliente:** busca tatuadores, envía solicitudes y ve el estado de las suyas. No entra al panel.

## Estructura de carpetas

```
tatuadores-front/
  index.html, tatuadores.html, ...     páginas públicas
  admin/                               páginas del panel
  css/estilos.css                      hoja de estilos externa (la usan todas las páginas)
  js/
    datos.js                           arreglos de tatuadores, usuarios, regiones y comunas
    almacen.js                         funciones para leer y guardar en localStorage
    sesion.js                          inicio de sesión y permisos por tipo de usuario
    solicitud.js                       lógica de la solicitud de cita (el carrito)
    validaciones.js                    validaciones de formularios con JavaScript
    form-usuario.js                    formulario de usuario (registro y admin)
    login.js, contacto.js, registro.js formularios de cada página
    tienda.js                          home, tatuadores, perfil, solicitud y mis solicitudes
    admin.js                           panel
  img/                                 imágenes (SVG)
  video/                               video del home
  vendor/                              Bootstrap 5 (copia local)
```

## Validaciones de formularios (JavaScript)

Todas se hacen en `js/validaciones.js` y muestran el mensaje debajo de cada campo con las clases de Bootstrap. Se validan al salir del campo y en tiempo real mientras se escribe.

- **Correo:** obligatorio, máximo 100 caracteres y solo `@duoc.cl`, `@profesor.duoc.cl` o `@gmail.com`. Sugiere una corrección si el dominio tiene un error de tipeo (por ejemplo `gmial.com`).
- **Contraseña:** obligatoria, entre 4 y 10 caracteres.
- **RUN:** sin puntos ni guion, entre 7 y 9 caracteres, con dígito verificador correcto.
- **Usuario:** nombre (máx. 50), apellidos (máx. 100), dirección (máx. 300), región y comuna dependientes, fecha de nacimiento y teléfono opcionales. Si el tipo es Tatuador, se elige el perfil asociado.
- **Tatuador:** código (mínimo 3), nombre artístico (máx. 100), descripción opcional (máx. 500), precio por hora (mínimo 0, admite decimales), cupos (entero, mínimo 0), cupos críticos opcionales (con alerta), estilo y ciudad obligatorios, estudio opcional.
- **Solicitud:** comentario opcional (máx. 500) y cupón (mensaje si está vacío o no existe).
- **Contacto:** nombre (máx. 100), correo y comentario obligatorio (máx. 500).

## Limitaciones (es solo el frontend)

- Los permisos por tipo de usuario se controlan con JavaScript en el navegador. En un sistema real los tendría que validar un servidor.
- Las contraseñas quedan guardadas en el localStorage. En un sistema real no se guardarían así.
- No hay pagos: la solicitud de cita solo registra la intención y el total es una estimación.
- Por ahora los perfiles de tatuadores los crea el administrador (los tatuadores no se registran solos).

## Integrantes

- Lucas Olguín
- Brandon Bocaz
