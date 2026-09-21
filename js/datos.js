// Datos de ejemplo del marketplace.
// La primera vez que se abre el sitio se copian al localStorage,
// despues todo se lee y se guarda desde ahi (asi el admin y los tatuadores pueden editar).

const ESTILOS = ["Realismo", "Tradicional", "Blackwork", "Neotradicional", "Minimalista"];

const CIUDADES = ["Santiago", "Valparaíso", "Viña del Mar", "Concepción", "Temuco"];

// Una sesion no puede pasar de estas horas (regla de la solicitud de cita)
const MAX_HORAS = 8;

// Cada tatuador es un "perfil publicado".
//   precio      = precio por hora (CLP)
//   cupos       = sesiones que le quedan disponibles este mes
//   cuposCriticos = si los cupos son iguales o menores a este numero se muestra una alerta
const TATUADORES_INICIALES = [
    {
        codigo: "TAT001",
        nombre: "Camila Rojas",
        descripcion: "Especialista en ojos, retratos y flores hiperrealistas en blanco y negro. Más de 8 años tatuando. Trabaja con cita previa y diseño personalizado.",
        precio: 35000,
        cupos: 6,
        cuposCriticos: 2,
        estilo: "Realismo",
        ciudad: "Santiago",
        estudio: "Tinta Negra Studio",
        imagen: "img/tat-camila-1.svg"
    },
    {
        codigo: "TAT002",
        nombre: "Matías Fuentes",
        descripcion: "Blackwork geométrico y mandalas de gran formato. Le gustan las piezas que ocupan brazo o espalda completa.",
        precio: 28000,
        cupos: 8,
        cuposCriticos: 3,
        estilo: "Blackwork",
        ciudad: "Valparaíso",
        estudio: "Aguja de Plata",
        imagen: "img/tat-matias-1.svg"
    },
    {
        codigo: "TAT003",
        nombre: "Javiera Soto",
        descripcion: "Tradicional americano: calaveras, dagas y corazones con líneas gruesas y colores sólidos. Tiene flash listo para tatuar el mismo día.",
        precio: 30000,
        cupos: 5,
        cuposCriticos: 2,
        estilo: "Tradicional",
        ciudad: "Santiago",
        estudio: "Tinta Negra Studio",
        imagen: "img/tat-javiera-1.svg"
    },
    {
        codigo: "TAT004",
        nombre: "Diego Araya",
        descripcion: "Neotradicional con mucho color: mariposas, flores y animales. Mezcla líneas tradicionales con sombreados suaves.",
        precio: 32000,
        cupos: 3,
        cuposCriticos: 3,
        estilo: "Neotradicional",
        ciudad: "Concepción",
        estudio: "Estudio Sur",
        imagen: "img/tat-diego-1.svg"
    },
    {
        codigo: "TAT005",
        nombre: "Francisca Lagos",
        descripcion: "Minimalismo de línea fina: paisajes, olas y flores pequeñas. Ideal para un primer tatuaje.",
        precio: 25000,
        cupos: 10,
        cuposCriticos: 3,
        estilo: "Minimalista",
        ciudad: "Viña del Mar",
        estudio: "Línea Fina",
        imagen: "img/tat-francisca-1.svg"
    },
    {
        codigo: "TAT006",
        nombre: "Nicolás Pérez",
        descripcion: "Realismo con brújulas, relojes y elementos náuticos. Sus sesiones son largas, así que agenda con anticipación.",
        precio: 38000,
        cupos: 0,
        cuposCriticos: 2,
        estilo: "Realismo",
        ciudad: "Concepción",
        estudio: "Estudio Sur",
        imagen: "img/tat-nicolas-1.svg"
    },
    {
        codigo: "TAT007",
        nombre: "Valentina Muñoz",
        descripcion: "Blackwork con serpientes, lunas y simbología. Trabaja de forma independiente y viaja a convenciones.",
        precio: 27000,
        cupos: 7,
        cuposCriticos: 2,
        estilo: "Blackwork",
        ciudad: "Santiago",
        estudio: "Independiente",
        imagen: "img/tat-valentina-1.svg"
    },
    {
        codigo: "TAT008",
        nombre: "Sebastián Vera",
        descripcion: "Tradicional marinero: anclas, calaveras y corazones. Le gusta que el cliente traiga su idea y armarla juntos.",
        precio: 26000,
        cupos: 4,
        cuposCriticos: 2,
        estilo: "Tradicional",
        ciudad: "Temuco",
        estudio: "Ink Sur",
        imagen: "img/tat-sebastian-1.svg"
    },
    {
        codigo: "TAT009",
        nombre: "Antonia Reyes",
        descripcion: "Neotradicional con daga y rosas. Piezas coloridas y llamativas para brazos y piernas.",
        precio: 31000,
        cupos: 2,
        cuposCriticos: 3,
        estilo: "Neotradicional",
        ciudad: "Valparaíso",
        estudio: "Aguja de Plata",
        imagen: "img/tat-antonia-1.svg"
    },
    {
        codigo: "TAT010",
        nombre: "Benjamín Castro",
        descripcion: "Minimalista con olas, montañas y lunas. Tatuajes pequeños y delicados, con sesiones cortas.",
        precio: 22000,
        cupos: 9,
        cuposCriticos: 3,
        estilo: "Minimalista",
        ciudad: "Santiago",
        estudio: "Independiente",
        imagen: "img/tat-benjamin-1.svg"
    },
    {
        codigo: "TAT011",
        nombre: "Constanza Díaz",
        descripcion: "Realismo floral y retratos de mascotas. Trabaja con fotos de referencia que trae el cliente.",
        precio: 36000,
        cupos: 5,
        cuposCriticos: 2,
        estilo: "Realismo",
        ciudad: "Viña del Mar",
        estudio: "Línea Fina",
        imagen: "img/tat-constanza-1.svg"
    },
    {
        codigo: "TAT012",
        nombre: "Tomás Herrera",
        descripcion: "Tradicional clásico: dagas, anclas y calaveras. Especialista en cubrir tatuajes antiguos.",
        precio: 29000,
        cupos: 6,
        cuposCriticos: 2,
        estilo: "Tradicional",
        ciudad: "Concepción",
        estudio: "Estudio Sur",
        imagen: "img/tat-tomas-1.svg"
    }
];

// Usuarios de prueba (una cuenta por cada tipo de usuario).
// El tatuador tiene "codigoTatuador": es el perfil que puede editar.
const USUARIOS_INICIALES = [
    {
        run: "111111111",
        nombre: "Andrea",
        apellidos: "Torres Molina",
        correo: "admin@duoc.cl",
        password: "admin123",
        telefono: "",
        fechaNacimiento: "1990-05-14",
        tipo: "Administrador",
        codigoTatuador: "",
        region: "Región Metropolitana de Santiago",
        comuna: "Providencia",
        direccion: "Av. Providencia 1234, depto 45"
    },
    {
        run: "123456785",
        nombre: "Camila",
        apellidos: "Rojas Muñoz",
        correo: "tatuador@duoc.cl",
        password: "tatuador1",
        telefono: "",
        fechaNacimiento: "1994-08-03",
        tipo: "Tatuador",
        codigoTatuador: "TAT001",
        region: "Región Metropolitana de Santiago",
        comuna: "Santiago",
        direccion: "Calle Lastarria 320"
    },
    {
        run: "222222222",
        nombre: "Sofía",
        apellidos: "Araya Lagos",
        correo: "cliente@gmail.com",
        password: "cliente1",
        telefono: "912345678",
        fechaNacimiento: "1999-11-02",
        tipo: "Cliente",
        codigoTatuador: "",
        region: "Región de Valparaíso",
        comuna: "Viña del Mar",
        direccion: "Los Pinos 890"
    }
];

const TIPOS_USUARIO = ["Administrador", "Cliente", "Tatuador"];

// Cupones de descuento de la solicitud (codigo: porcentaje)
const CUPONES = {
    PRIMERA10: 10
};

// Solicitudes de ejemplo para que el panel no se vea vacio.
// estado: Pendiente, Aceptada o Rechazada
const SOLICITUDES_INICIALES = [
    {
        id: 1001,
        fecha: "2026-09-14",
        correo: "cliente@gmail.com",
        cliente: "Sofía Araya Lagos",
        codigoTatuador: "TAT001",
        tatuador: "Camila Rojas",
        precioHora: 35000,
        horas: 3,
        comentario: "Quiero un ojo realista en el antebrazo.",
        subtotal: 105000,
        descuento: 0,
        total: 105000,
        estado: "Aceptada"
    },
    {
        id: 1002,
        fecha: "2026-09-18",
        correo: "cliente@gmail.com",
        cliente: "Sofía Araya Lagos",
        codigoTatuador: "TAT001",
        tatuador: "Camila Rojas",
        precioHora: 35000,
        horas: 2,
        comentario: "Una rosa pequeña en el tobillo.",
        subtotal: 70000,
        descuento: 7000,
        total: 63000,
        estado: "Pendiente"
    },
    {
        id: 1003,
        fecha: "2026-09-19",
        correo: "cliente@gmail.com",
        cliente: "Sofía Araya Lagos",
        codigoTatuador: "TAT003",
        tatuador: "Javiera Soto",
        precioHora: 30000,
        horas: 2,
        comentario: "",
        subtotal: 60000,
        descuento: 0,
        total: 60000,
        estado: "Pendiente"
    }
];

// Regiones y comunas (se usan en los formularios de usuario)
const REGIONES = [
    { nombre: "Región de Arica y Parinacota", comunas: ["Arica", "Camarones", "Putre", "General Lagos"] },
    { nombre: "Región de Tarapacá", comunas: ["Iquique", "Alto Hospicio", "Pozo Almonte", "Pica"] },
    { nombre: "Región de Antofagasta", comunas: ["Antofagasta", "Calama", "Mejillones", "Tocopilla"] },
    { nombre: "Región de Atacama", comunas: ["Copiapó", "Caldera", "Vallenar", "Chañaral"] },
    { nombre: "Región de Coquimbo", comunas: ["La Serena", "Coquimbo", "Ovalle", "Illapel"] },
    { nombre: "Región de Valparaíso", comunas: ["Valparaíso", "Viña del Mar", "Quilpué", "Villa Alemana", "San Antonio"] },
    { nombre: "Región Metropolitana de Santiago", comunas: ["Santiago", "Providencia", "Las Condes", "Ñuñoa", "Maipú", "Puente Alto", "La Florida"] },
    { nombre: "Región del Libertador General Bernardo O'Higgins", comunas: ["Rancagua", "San Fernando", "Rengo", "Machalí"] },
    { nombre: "Región del Maule", comunas: ["Talca", "Curicó", "Linares", "Longaví", "Constitución"] },
    { nombre: "Región de Ñuble", comunas: ["Chillán", "San Carlos", "Bulnes", "Quillón"] },
    { nombre: "Región del Biobío", comunas: ["Concepción", "Talcahuano", "Los Ángeles", "Coronel", "Chiguayante"] },
    { nombre: "Región de La Araucanía", comunas: ["Temuco", "Villarrica", "Pucón", "Angol"] },
    { nombre: "Región de Los Ríos", comunas: ["Valdivia", "La Unión", "Río Bueno"] },
    { nombre: "Región de Los Lagos", comunas: ["Puerto Montt", "Osorno", "Castro", "Puerto Varas"] },
    { nombre: "Región de Aysén del General Carlos Ibáñez del Campo", comunas: ["Coyhaique", "Puerto Aysén", "Chile Chico"] },
    { nombre: "Región de Magallanes y de la Antártica Chilena", comunas: ["Punta Arenas", "Puerto Natales", "Porvenir"] }
];
