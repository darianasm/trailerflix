require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { leerTrailerflix, guardarTrailerflix } = require('./database/trailerflix.manager');

const app = express();
const PORT = process.env.PORT || 3008;

app.set('view engine', 'ejs');
app.locals.version = require('./package.json').version;

let CATALOGO = [];

app.use(bodyParser.json());

app.use((req, res, next) => {
  CATALOGO = leerTrailerflix();
  next();
});


// ---------------------------------------------------------------------------
// funciones compartidas
// ---------------------------------------------------------------------------

// 1. Normaliza texto: minúsculas y sin tildes, para comparar "Pelicula" con "Película"
function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// 2. Función genérica de búsqueda
function buscarEnCatalogo(propiedad, datoABuscar) {
  const termino = normalizar(datoABuscar);

  return CATALOGO.filter(item => {
    const valorPropiedad = item[propiedad];

    if (!valorPropiedad) return false;

    if (Array.isArray(valorPropiedad)) {
      return valorPropiedad.some(elemento =>
        normalizar(elemento).includes(termino)
      );
    }

    return normalizar(valorPropiedad).includes(termino);
  });
}

// 3. Render común de las búsquedas: 200 con resultados, 404 si no hay ninguno
function responderBusqueda(res, { resumen, ruta, json, termino, resultados }) {
  res
    .status(resultados.length > 0 ? 200 : 404)
    .render('resultados', { titulo: resumen, resumen, ruta, json, termino, resultados });
}


// ---------------------------------------------------------------------------
// Inicio
// ---------------------------------------------------------------------------

app.get('/', (req, res) => {
  res.render('inicio', { titulo: 'Inicio', total: CATALOGO.length });
});


// ---------------------------------------------------------------------------
// GET /catalogo -- lista completa de películas y series
// ---------------------------------------------------------------------------

app.get('/catalogo', (req, res) => {
  res.render('catalogo', {
    titulo: 'Catálogo',
    total: CATALOGO.length,
    resultados: CATALOGO
  });
});

app.get('/api/catalogo', (req, res) => {
  res.status(200).json(CATALOGO);
});


// ---------------------------------------------------------------------------
// GET /titulo/:title -- búsqueda de títulos que contengan el texto ingresado
// ---------------------------------------------------------------------------

function consultarPorTitulo(termino) {
  const resultados = buscarEnCatalogo('titulo', termino);

  console.log(
    resultados.length > 0
      ? `Se encontraron ${resultados.length} títulos que contengan: ${termino}`
      : `No se encontraron títulos que contengan: ${termino}`
  );

  return resultados;
}

app.get('/titulo/:title', (req, res) => {
  const termino = req.params.title;

  responderBusqueda(res, {
    resumen: `Títulos que contienen "${termino}"`,
    ruta: '/titulo/:title',
    json: `/api/titulo/${encodeURIComponent(termino)}`,
    termino,
    resultados: consultarPorTitulo(termino)
  });
});

app.get('/api/titulo/:title', (req, res) => {
  const termino = req.params.title;
  const titulosEncontrados = consultarPorTitulo(termino);

  if (titulosEncontrados.length > 0) {
    return res.json(titulosEncontrados);
  }

  return res.status(404).json({
    mensaje: `No se encontraron títulos que contengan: ${termino}`
  });
});


// ---------------------------------------------------------------------------
// GET /categoria/:cat -- búsqueda de películas y series por categoría
// ---------------------------------------------------------------------------

function consultarPorCategoria(termino) {
  const resultados = buscarEnCatalogo('categoria', termino);

  console.log(
    resultados.length > 0
      ? `Se encontraron ${resultados.length} resultados para la categoría: ${termino}`
      : `No se encontraron resultados para la categoría: ${termino}`
  );

  return resultados;
}

app.get('/categoria/:cat', (req, res) => {
  const termino = req.params.cat;

  responderBusqueda(res, {
    resumen: `Categoría: ${termino}`,
    ruta: '/categoria/:cat',
    json: `/api/categoria/${encodeURIComponent(termino)}`,
    termino,
    resultados: consultarPorCategoria(termino)
  });
});

app.get('/api/categoria/:cat', (req, res) => {
  const categoriaBuscada = req.params.cat;
  const resultados = consultarPorCategoria(categoriaBuscada);

  if (resultados.length > 0) {
    return res.json(resultados);
  }

  return res.status(404).json({
    mensaje: `No se encontraron resultados para la categoría: ${categoriaBuscada}`
  });
});


// ---------------------------------------------------------------------------
// GET /reparto/:act -- búsqueda de películas y series por actor/actriz
// ---------------------------------------------------------------------------

function consultarPorReparto(termino) {
  const resultados = buscarEnCatalogo('reparto', termino).map(pelicula => ({
    titulo: pelicula.titulo,
    reparto: pelicula.reparto
  }));

  console.log(
    resultados.length > 0
      ? `Se encontraron ${resultados.length} títulos que contengan: ${termino}`
      : `No se encontraron títulos que contengan: ${termino}`
  );

  return resultados;
}

app.get('/reparto/:act', (req, res) => {
  const termino = req.params.act;

  responderBusqueda(res, {
    resumen: `Reparto: ${termino}`,
    ruta: '/reparto/:act',
    json: `/api/reparto/${encodeURIComponent(termino)}`,
    termino,
    resultados: consultarPorReparto(termino)
  });
});

app.get('/api/reparto/:act', (req, res) => {
  const termino = req.params.act;
  const datosEncontrados = consultarPorReparto(termino);

  if (datosEncontrados.length > 0) {
    return res.json(datosEncontrados);
  }

  return res.status(404).json({
    mensaje: `No se encontraron títulos que contengan: ${termino}`
  });
});


// ---------------------------------------------------------------------------
// GET /trailer/:id -- búsqueda de tráiler por ID
// ---------------------------------------------------------------------------

function consultarPorId(id) {
  const item = CATALOGO.find(pelicula => pelicula.id === Number(id));

  console.log(
    item
      ? `Se encontró la información para el ID: ${id}`
      : `No se encontró ningún elemento con el ID: ${id}`
  );

  return item || null;
}

app.get('/trailer/:id', (req, res) => {
  const item = consultarPorId(req.params.id);

  res.status(item ? 200 : 404).render('trailer', {
    titulo: item ? item.titulo : 'Tráiler no encontrado',
    ruta: '/trailer/:id',
    json: `/api/trailer/${encodeURIComponent(req.params.id)}`,
    id: req.params.id,
    item
  });
});

app.get('/api/trailer/:id', (req, res) => {
  const idBuscado = Number(req.params.id);
  const peliculaEncontrada = consultarPorId(idBuscado);

  if (peliculaEncontrada) {
    return res.json({
      id: peliculaEncontrada.id,
      titulo: peliculaEncontrada.titulo,
      trailer: peliculaEncontrada?.trailer || `El trailer no se encuentra disponible para esta película/serie.`
    });
  }

  return res.status(404).json({
    mensaje: `No se encontró ningún elemento con el ID: ${idBuscado}`
  });
});


// ---------------------------------------------------------------------------
// Ruta no encontrada: JSON bajo /api, HTML para navegadores en el resto
// ---------------------------------------------------------------------------

app.use((req, res) => {
  if (!req.path.startsWith('/api') && req.accepts('html')) {
    return res.status(404).render('error', { titulo: 'Página no encontrada' });
  }

  res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
