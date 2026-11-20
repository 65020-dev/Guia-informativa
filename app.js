const URL_VERSIONES = "https://ddragon.leagueoflegends.com/api/versions.json";
const URL_BASE_CDN = "https://ddragon.leagueoflegends.com/cdn";
const URL_ICONOS_ROL = "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions";
const URL_CDRAGON_CAMPEONES = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champions";
const URL_VIDEOS_HABILIDAD = "https://d28xe8vt774jo5.cloudfront.net";

const LOTE_CAMPEONES_MOVIL = 12;
const mediaMovil = window.matchMedia("(max-width: 900px)");

let versionActual = "";
let listaCampeones = [];
let listaObjetos = [];
let ramasRunas = [];
let claseSeleccionada = "All";
let categoriaObjetoSeleccionada = "All";
let limiteCampeonesMovil = LOTE_CAMPEONES_MOVIL;

const badgeParche = document.getElementById("badge-parche");
const contenedorDetalleRol = document.getElementById("detalle-rol");
const botonesRol = document.querySelectorAll("[data-rol]");

const contenedorCampeones = document.getElementById("lista-campeones");
const estadoCampeones = document.getElementById("estado-campeones");
const buscadorCampeon = document.getElementById("buscador-campeon");
const botonesClase = document.querySelectorAll("[data-clase]");
const botonMasCampeones = document.getElementById("boton-mas-campeones");

const contenedorObjetos = document.getElementById("lista-objetos");
const estadoObjetos = document.getElementById("estado-objetos");
const buscadorObjeto = document.getElementById("buscador-objeto");
const botonesCategoriaObjeto = document.querySelectorAll("[data-categoria-item]");

const selectorRamasRunas = document.getElementById("selector-ramas-runas");
const contenedorRunas = document.getElementById("detalle-runas");
const contenedorHechizos = document.getElementById("lista-hechizos");

const modalCampeon = document.getElementById("modal-campeon");
const modalCuerpo = document.getElementById("modal-cuerpo");
const botonCerrarModal = document.getElementById("cerrar-modal");
const botonMenu = document.getElementById("boton-menu");
const barraLateral = document.getElementById("barra-lateral");

const informacionRoles = {
    top: {
        titulo: "Carril Superior (TOP)",
        icono: `${URL_ICONOS_ROL}/icon-position-top.png`,
        descripcion: "Normalmente se suele pelear 1v1 de manera constante; es una línea más tranquila que las demás, pero a la vez más solitaria. Aquí suelen elegirse luchadores y tanques.",
        consejo: "Consejo: Lo mejor casi siempre es llevar Teletransportación para llegar rápido a las teamfights."
    },
    jungla: {
        titulo: "Jungla",
        icono: `${URL_ICONOS_ROL}/icon-position-jungle.png`,
        descripcion: "A diferencia de las líneas, la jungla tiene monstruos neutrales que puedes matar cuando tú lo decidas, lo que te permite hacer emboscadas a otras líneas para dar ventaja a tu equipo.",
        consejo: "Consejo: Aprende a usar y timear el Smite porque es el recurso que tiene tu equipo para asegurar objetivos."
    },
    mid: {
        titulo: "Carril Central (MID)",
        icono: `${URL_ICONOS_ROL}/icon-position-middle.png`,
        descripcion: "El mid es el centro de la partida. Es la línea más corta y permite rotar rápido hacia el resto del mapa. Aquí se suelen elegir magos y asesinos.",
        consejo: "Consejo: Rota siempre que puedas, pero jamás olvides limpiar tu oleada antes de moverte a cualquier parte del mapa."
    },
    adc: {
        titulo: "Tirador (ADC - CARRIL INFERIOR)",
        icono: `${URL_ICONOS_ROL}/icon-position-bottom.png`,
        descripcion: "Aunque su objetivo no es llevarse todas las kills, el ADC es la fuente principal de daño en las peleas de equipo. Ten en cuenta que son campeones muy fáciles de matar.",
        consejo: "Consejo: Aprende a posicionarte al rango máximo de tus ataques y jamás te expongas a los enemigos."
    },
    soporte: {
        titulo: "Soporte (CARRIL INFERIOR)",
        icono: `${URL_ICONOS_ROL}/icon-position-utility.png`,
        descripcion: "Aunque empiece al lado del tirador en fase de líneas, el support es de todo el equipo; tu objetivo principal es controlar la visión del mapa con tus wards.",
        consejo: "Consejo: Aunque no tenga un indicador de daño, no menosprecies el valor de la visión; la ventaja que proporciona es enorme y muchas veces suele ganar peleas enteras."
    }
};

function limpiarTextoHtml(texto) {
    return (texto || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function cerrarModal() {
    modalCampeon.classList.add("oculto");
    const videoActivo = modalCuerpo.querySelector("video");
    if (videoActivo) {
        videoActivo.pause();
        videoActivo.removeAttribute("src");
        videoActivo.load();
    }
}

function mostrarRol(claveRol) {
    const rol = informacionRoles[claveRol];
    if (!rol) return;

    contenedorDetalleRol.innerHTML = "";

    const cabecera = document.createElement("div");
    cabecera.className = "panel-rol-cabecera";

    const icono = document.createElement("img");
    icono.src = rol.icono;
    icono.alt = `Icono de ${rol.titulo}`;

    const titulo = document.createElement("h3");
    titulo.textContent = rol.titulo;

    cabecera.append(icono, titulo);

    const descripcion = document.createElement("p");
    descripcion.textContent = rol.descripcion;

    const consejo = document.createElement("p");
    consejo.className = "consejo-rol";
    consejo.textContent = rol.consejo;

    contenedorDetalleRol.append(cabecera, descripcion, consejo);

    botonesRol.forEach((boton) => {
        const activo = boton.dataset.rol === claveRol;
        boton.classList.toggle("activo", activo);
        boton.setAttribute("aria-pressed", activo);
    });
}

function renderizarCampeones() {
    const texto = buscadorCampeon.value.trim().toLowerCase();

    const filtrados = listaCampeones.filter((campeon) => {
        const coincideClase = claseSeleccionada === "All" || campeon.tags.includes(claseSeleccionada);
        const coincideNombre = campeon.name.toLowerCase().includes(texto);
        return coincideClase && coincideNombre;
    });

    const esMovil = mediaMovil.matches;
    const visibles = esMovil ? filtrados.slice(0, limiteCampeonesMovil) : filtrados;

    contenedorCampeones.innerHTML = "";
    estadoCampeones.textContent = `Mostrando ${visibles.length} de ${filtrados.length} campeones.`;

    visibles.forEach((campeon) => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "tarjeta-campeon";
        tarjeta.tabIndex = 0;

        const imagen = document.createElement("img");
        imagen.src = `${URL_BASE_CDN}/${versionActual}/img/champion/${campeon.image.full}`;
        imagen.alt = campeon.name;
        imagen.loading = "lazy";

        const nombre = document.createElement("h3");
        nombre.textContent = campeon.name;

        const titulo = document.createElement("p");
        titulo.textContent = campeon.title;

        tarjeta.append(imagen, nombre, titulo);
        tarjeta.addEventListener("click", () => abrirDetalleCampeon(campeon.id));
        tarjeta.addEventListener("keydown", (evento) => {
            if (evento.key === "Enter") abrirDetalleCampeon(campeon.id);
        });

        contenedorCampeones.appendChild(tarjeta);
    });

    const restantes = filtrados.length - visibles.length;
    if (esMovil && restantes > 0) {
        botonMasCampeones.textContent = `Mostrar más campeones (${restantes} restantes)`;
        botonMasCampeones.classList.remove("oculto");
    } else {
        botonMasCampeones.classList.add("oculto");
    }
}

async function obtenerVideosHabilidades(claveNumerica) {
    try {
        const respuesta = await fetch(`${URL_CDRAGON_CAMPEONES}/${claveNumerica}.json`);
        if (!respuesta.ok) return { pasiva: null, hechizos: [] };

        const datos = await respuesta.json();
        const construirUrl = (ruta) => (ruta && ruta.trim() ? `${URL_VIDEOS_HABILIDAD}/${ruta}` : null);

        const pasiva = datos.passive ? construirUrl(datos.passive.abilityVideoPath) : null;
        const hechizos = Array.isArray(datos.spells)
            ? datos.spells.map((s) => construirUrl(s.abilityVideoPath))
            : [];

        return { pasiva, hechizos };
    } catch (error) {
        return { pasiva: null, hechizos: [] };
    }
}

async function abrirDetalleCampeon(idCampeon) {
    modalCampeon.classList.remove("oculto");
    modalCuerpo.textContent = "Cargando información del campeón...";

    try {
        const respuesta = await fetch(`${URL_BASE_CDN}/${versionActual}/data/es_MX/champion/${idCampeon}.json`);
        if (!respuesta.ok) throw new Error("Error al cargar el campeón");

        const datos = await respuesta.json();
        const campeon = datos.data[idCampeon];

        const videos = await obtenerVideosHabilidades(campeon.key);

        modalCuerpo.innerHTML = "";

        const splash = document.createElement("img");
        splash.className = "splash-campeon";
        splash.src = `${URL_BASE_CDN}/img/champion/splash/${idCampeon}_0.jpg`;
        splash.alt = `Arte oficial de ${campeon.name}`;

        const titulo = document.createElement("h2");
        titulo.id = "modal-titulo";
        titulo.className = "titulo-modal";
        titulo.textContent = campeon.name;

        const subtitulo = document.createElement("p");
        subtitulo.className = "subtitulo-modal";
        subtitulo.textContent = campeon.title;

        const lore = document.createElement("p");
        lore.className = "lore-modal";
        lore.textContent = campeon.lore;

        const visorVideo = document.createElement("div");
        visorVideo.className = "visor-video-habilidad oculto";

        const reproductor = document.createElement("video");
        reproductor.className = "video-demostracion";
        reproductor.autoplay = true;
        reproductor.loop = true;
        reproductor.muted = true;
        reproductor.playsInline = true;

        reproductor.addEventListener("error", () => {
            visorVideo.classList.add("oculto");
        });

        visorVideo.appendChild(reproductor);

        const listaHabilidades = document.createElement("div");
        listaHabilidades.className = "lista-habilidades";

        const activarClip = (urlVideo, elementoTarjeta) => {
            if (!urlVideo) return;

            listaHabilidades.querySelectorAll(".habilidad-item").forEach((el) => el.classList.remove("activa"));
            elementoTarjeta.classList.add("activa");

            reproductor.src = urlVideo;
            visorVideo.classList.remove("oculto");
            reproductor.play().catch(() => {});
        };

        const habilidades = [
            {
                titulo: `Pasiva: ${campeon.passive.name}`,
                descripcion: campeon.passive.description,
                imagen: `${URL_BASE_CDN}/${versionActual}/img/passive/${campeon.passive.image.full}`,
                video: videos.pasiva
            },
            ...campeon.spells.map((hechizo, indice) => ({
                titulo: `${["Q", "W", "E", "R"][indice]}: ${hechizo.name}`,
                descripcion: hechizo.description,
                imagen: `${URL_BASE_CDN}/${versionActual}/img/spell/${hechizo.image.full}`,
                video: videos.hechizos[indice] || null
            }))
        ];

        let primerElementoConVideo = null;
        let primerVideoUrl = null;

        habilidades.forEach((hab) => {
            const item = crearElementoHabilidad(hab.titulo, hab.descripcion, hab.imagen, Boolean(hab.video));

            if (hab.video) {
                item.tabIndex = 0;
                item.addEventListener("click", () => activarClip(hab.video, item));
                item.addEventListener("keydown", (evento) => {
                    if (evento.key === "Enter") activarClip(hab.video, item);
                });

                if (!primerElementoConVideo) {
                    primerElementoConVideo = item;
                    primerVideoUrl = hab.video;
                }
            }

            listaHabilidades.appendChild(item);
        });

        modalCuerpo.append(splash, titulo, subtitulo, lore);

        if (primerVideoUrl) {
            modalCuerpo.appendChild(visorVideo);
            activarClip(primerVideoUrl, primerElementoConVideo);
        }

        modalCuerpo.appendChild(listaHabilidades);
    } catch (error) {
        modalCuerpo.textContent = "No se pudo cargar el detalle del campeón.";
    }
}

function crearElementoHabilidad(nombre, descripcion, urlImagen, tieneVideo) {
    const contenedor = document.createElement("div");
    contenedor.className = tieneVideo ? "habilidad-item con-video" : "habilidad-item";

    const icono = document.createElement("img");
    icono.src = urlImagen;
    icono.alt = nombre;

    const bloqueTexto = document.createElement("div");
    const titulo = document.createElement("h4");
    titulo.textContent = nombre;

    const parrafo = document.createElement("p");
    parrafo.textContent = limpiarTextoHtml(descripcion);

    bloqueTexto.append(titulo, parrafo);
    contenedor.append(icono, bloqueTexto);
    return contenedor;
}

async function cargarObjetos() {
    try {
        const respuesta = await fetch(`${URL_BASE_CDN}/${versionActual}/data/es_MX/item.json`);
        if (!respuesta.ok) throw new Error("Error al cargar objetos");

        const datos = await respuesta.json();
        const nombresVistos = new Set();

        listaObjetos = Object.values(datos.data).filter((item) => {
            const enGrieta = item.maps && item.maps["11"] === true;
            const comprable = item.gold && item.gold.purchasable === true;
            const esRelevante = item.gold.total >= 2000 || (item.tags && item.tags.includes("Boots"));
            const sinDuplicar = !nombresVistos.has(item.name);

            if (enGrieta && comprable && esRelevante && sinDuplicar) {
                nombresVistos.add(item.name);
                return true;
            }
            return false;
        });

        renderizarObjetos();
    } catch (error) {
        estadoObjetos.textContent = "No se pudieron cargar los objetos de la tienda.";
    }
}

function construirContenidoObjeto(descripcionHtml) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(descripcionHtml || "", "text/html");

    let listaStats = null;
    const nodoStats = doc.querySelector("stats");

    if (nodoStats) {
        listaStats = document.createElement("ul");
        listaStats.className = "objeto-stats";

        const lineas = nodoStats.innerHTML.split(/<br\s*\/?>/i);
        lineas.forEach((linea) => {
            const textoLimpio = linea.trim();
            if (!textoLimpio) return;

            const li = document.createElement("li");
            const frag = parser.parseFromString(textoLimpio, "text/html").body;

            frag.childNodes.forEach((nodo) => {
                if (nodo.nodeName === "ATTENTION") {
                    const span = document.createElement("span");
                    span.className = "stat-valor";
                    span.textContent = nodo.textContent;
                    li.appendChild(span);
                } else {
                    li.appendChild(document.createTextNode(nodo.textContent));
                }
            });

            listaStats.appendChild(li);
        });

        nodoStats.remove();
    }

    const textoRestante = doc.body.textContent.trim();
    let bloquePasiva = null;

    if (textoRestante) {
        bloquePasiva = document.createElement("div");
        bloquePasiva.className = "objeto-pasiva";

        const recorrerNodos = (nodoOrigen, destino) => {
            nodoOrigen.childNodes.forEach((hijo) => {
                if (hijo.nodeType === Node.TEXT_NODE) {
                    destino.appendChild(document.createTextNode(hijo.textContent));
                } else if (hijo.nodeName === "BR") {
                    destino.appendChild(document.createElement("br"));
                } else if (hijo.nodeName === "PASSIVE" || hijo.nodeName === "ACTIVE" || hijo.nodeName === "KEYWORDMAJOR") {
                    const span = document.createElement("span");
                    span.className = "etiqueta-pasiva";
                    span.textContent = hijo.textContent;
                    destino.appendChild(span);
                } else if (hijo.nodeName === "STATUS" || hijo.nodeName === "SCALEAD" || hijo.nodeName === "SCALEAP") {
                    const span = document.createElement("span");
                    span.className = "etiqueta-estado";
                    span.textContent = hijo.textContent;
                    destino.appendChild(span);
                } else {
                    recorrerNodos(hijo, destino);
                }
            });
        };

        recorrerNodos(doc.body, bloquePasiva);
    }

    return { listaStats, bloquePasiva };
}

function renderizarObjetos() {
    const texto = buscadorObjeto.value.trim().toLowerCase();

    const filtrados = listaObjetos.filter((item) => {
        const tags = item.tags || [];
        const coincideCategoria =
            categoriaObjetoSeleccionada === "All" ||
            tags.includes(categoriaObjetoSeleccionada) ||
            (categoriaObjetoSeleccionada === "Armor" && (tags.includes("Health") || tags.includes("SpellBlock")));
        const coincideNombre = item.name.toLowerCase().includes(texto);
        return coincideCategoria && coincideNombre;
    });

    const visibles = filtrados.slice(0, 24);
    contenedorObjetos.innerHTML = "";
    estadoObjetos.textContent = `Mostrando ${visibles.length} de ${filtrados.length} objetos encontrados.`;

    visibles.forEach((item) => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "tarjeta-objeto";

        const cabecera = document.createElement("div");
        cabecera.className = "objeto-cabecera";

        const icono = document.createElement("img");
        icono.src = `${URL_BASE_CDN}/${versionActual}/img/item/${item.image.full}`;
        icono.alt = item.name;
        icono.loading = "lazy";

        const infoCabecera = document.createElement("div");

        const titulo = document.createElement("h3");
        titulo.textContent = item.name;

        const precio = document.createElement("span");
        precio.className = "precio-objeto";
        precio.textContent = `🪙 ${item.gold.total} de oro`;

        infoCabecera.append(titulo, precio);
        cabecera.append(icono, infoCabecera);
        tarjeta.appendChild(cabecera);

        const { listaStats, bloquePasiva } = construirContenidoObjeto(item.description);
        if (listaStats) tarjeta.appendChild(listaStats);
        if (bloquePasiva) tarjeta.appendChild(bloquePasiva);

        contenedorObjetos.appendChild(tarjeta);
    });
}

async function cargarRunas() {
    try {
        const respuesta = await fetch(`${URL_BASE_CDN}/${versionActual}/data/es_MX/runesReforged.json`);
        if (!respuesta.ok) throw new Error("Error al cargar runas");

        ramasRunas = await respuesta.json();
        selectorRamasRunas.innerHTML = "";

        ramasRunas.forEach((rama, indice) => {
            const boton = document.createElement("button");
            boton.className = indice === 0 ? "boton-filtro activo" : "boton-filtro";

            const icono = document.createElement("img");
            icono.src = `${URL_BASE_CDN}/img/${rama.icon}`;
            icono.alt = "";

            const texto = document.createElement("span");
            texto.textContent = rama.name;

            boton.append(icono, texto);
            boton.addEventListener("click", () => {
                selectorRamasRunas.querySelectorAll("button").forEach((b) => b.classList.remove("activo"));
                boton.classList.add("activo");
                mostrarRunasClave(rama);
            });

            selectorRamasRunas.appendChild(boton);
        });

        if (ramasRunas.length > 0) {
            mostrarRunasClave(ramasRunas[0]);
        }
    } catch (error) {
        contenedorRunas.textContent = "No se pudieron cargar las runas reforjadas.";
    }
}

function mostrarRunasClave(rama) {
    contenedorRunas.innerHTML = "";
    const runasClave = rama.slots[0].runes;

    runasClave.forEach((runa) => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "tarjeta-runa";

        const icono = document.createElement("img");
        icono.src = `${URL_BASE_CDN}/img/${runa.icon}`;
        icono.alt = runa.name;

        const contenido = document.createElement("div");

        const titulo = document.createElement("h3");
        titulo.textContent = runa.name;

        const descripcion = document.createElement("p");
        descripcion.textContent = limpiarTextoHtml(runa.shortDesc);

        contenido.append(titulo, descripcion);
        tarjeta.append(icono, contenido);
        contenedorRunas.appendChild(tarjeta);
    });
}

async function cargarHechizosInvocador() {
    try {
        const respuesta = await fetch(`${URL_BASE_CDN}/${versionActual}/data/es_MX/summoner.json`);
        if (!respuesta.ok) throw new Error("Error al cargar hechizos");

        const datos = await respuesta.json();
        const hechizos = Object.values(datos.data).filter((h) => h.modes.includes("CLASSIC"));

        contenedorHechizos.innerHTML = "";

        hechizos.forEach((hechizo) => {
            const tarjeta = document.createElement("article");
            tarjeta.className = "tarjeta-hechizo";

            const icono = document.createElement("img");
            icono.src = `${URL_BASE_CDN}/${versionActual}/img/spell/${hechizo.image.full}`;
            icono.alt = hechizo.name;

            const contenido = document.createElement("div");
            const titulo = document.createElement("h3");
            titulo.textContent = hechizo.name;

            const descripcion = document.createElement("p");
            descripcion.textContent = hechizo.description;

            contenido.append(titulo, descripcion);
            tarjeta.append(icono, contenido);
            contenedorHechizos.appendChild(tarjeta);
        });
    } catch (error) {
        contenedorHechizos.textContent = "No se pudieron cargar los hechizos de invocador.";
    }
}

async function inicializarAplicacion() {
    mostrarRol("top");

    try {
        const respVersion = await fetch(URL_VERSIONES);
        const versiones = await respVersion.json();
        versionActual = versiones[0];

        badgeParche.textContent = `Parche ${versionActual}`;

        const respCampeones = await fetch(`${URL_BASE_CDN}/${versionActual}/data/es_MX/champion.json`);
        const datosCampeones = await respCampeones.json();

        listaCampeones = Object.values(datosCampeones.data);
        renderizarCampeones();

        cargarObjetos();
        cargarRunas();
        cargarHechizosInvocador();
    } catch (error) {
        badgeParche.textContent = "Sin conexión";
        estadoCampeones.textContent = "Error al conectar con la API de Riot Games.";
    }
}

botonesRol.forEach((boton) => {
    boton.addEventListener("click", () => mostrarRol(boton.dataset.rol));
});

botonesClase.forEach((boton) => {
    boton.addEventListener("click", () => {
        claseSeleccionada = boton.dataset.clase;
        limiteCampeonesMovil = LOTE_CAMPEONES_MOVIL;
        botonesClase.forEach((b) => b.classList.toggle("activo", b === boton));
        renderizarCampeones();
    });
});

buscadorCampeon.addEventListener("input", () => {
    limiteCampeonesMovil = LOTE_CAMPEONES_MOVIL;
    renderizarCampeones();
});

botonMasCampeones.addEventListener("click", () => {
    limiteCampeonesMovil += LOTE_CAMPEONES_MOVIL;
    renderizarCampeones();
});

mediaMovil.addEventListener("change", () => {
    limiteCampeonesMovil = LOTE_CAMPEONES_MOVIL;
    renderizarCampeones();
});

botonesCategoriaObjeto.forEach((boton) => {
    boton.addEventListener("click", () => {
        categoriaObjetoSeleccionada = boton.dataset.categoriaItem;
        botonesCategoriaObjeto.forEach((b) => b.classList.toggle("activo", b === boton));
        renderizarObjetos();
    });
});

buscadorObjeto.addEventListener("input", renderizarObjetos);

botonCerrarModal.addEventListener("click", cerrarModal);
modalCampeon.addEventListener("click", (evento) => {
    if (evento.target === modalCampeon) cerrarModal();
});

document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && !modalCampeon.classList.contains("oculto")) {
        cerrarModal();
    }
});

botonMenu.addEventListener("click", () => {
    const abierta = barraLateral.classList.toggle("abierta");
    botonMenu.setAttribute("aria-expanded", abierta);
});

document.querySelectorAll(".menu-lateral a").forEach((enlace) => {
    enlace.addEventListener("click", () => {
        barraLateral.classList.remove("abierta");
        botonMenu.setAttribute("aria-expanded", "false");
    });
});

inicializarAplicacion();
