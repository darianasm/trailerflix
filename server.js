require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('node:path');
const { leerTrailerflix, guardarTrailerflix } = require('./database/trailerflix.manager');

const app = express();
const PORT = process.env.PORT || 3008;

let CATALOGO = [];

app.use(bodyParser.json());

app.use((req, res, next) => {
  CATALOGO = leerTrailerflix();
  next();
});


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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'inicio.html'));
});

app.get('/catalogo', (req, res) => {
  res.status(200).json(CATALOGO);
});

app.get('/titulo/:title', (req, res) => {
  const titulosEncontrados = buscarEnCatalogo("titulo", req.params.title);

  if (titulosEncontrados.length > 0) {
    console.log(`Se encontraron ${titulosEncontrados.length} títulos que contengan: ${req.params.title}`);
    return res.json(titulosEncontrados);
  } else {
    console.log(`No se encontraron títulos que contengan: ${req.params.title}`);
    return res.status(404).json({ 
      mensaje: `No se encontraron títulos que contengan: ${req.params.title}` 
    });
  }
});

app.get('/categoria/:cat', (req, res) => {
  const categoriaBuscada = req.params.cat;
  const resultados = buscarEnCatalogo("categoria", categoriaBuscada);

  if (resultados.length > 0) {
    console.log(`Se encontraron ${resultados.length} resultados para la categoría: ${categoriaBuscada}`);
    return res.json(resultados);
  } else {
    console.log(`No se encontraron resultados para la categoría: ${categoriaBuscada}`);
    return res.status(404).json({ 
      mensaje: `No se encontraron resultados para la categoría: ${categoriaBuscada}` 
    });
  }
});

app.get('/reparto/:act', (req, res) => {
  const datosAux = buscarEnCatalogo("reparto", req.params.act);
  const datosEncontrados = datosAux.map(pelicula => ({
    titulo: pelicula.titulo,
    reparto: pelicula.reparto
  }));

  if (datosEncontrados.length > 0) {
    console.log(`Se encontraron ${datosEncontrados.length} títulos que contengan: ${req.params.act}`);
    return res.json(datosEncontrados);
  } else {
    console.log(`No se encontraron títulos que contengan: ${req.params.act}`);
    return res.status(404).json({ 
      mensaje: `No se encontraron títulos que contengan: ${req.params.act}` 
    });
  }
});


app.get('/trailer/:id', (req, res) => {
  const idBuscado = Number(req.params.id);

  const peliculaEncontrada = CATALOGO.find(item => item.id === idBuscado);

  if (peliculaEncontrada) {
    const resultado = {
      id: peliculaEncontrada.id,
      titulo: peliculaEncontrada.titulo,
      trailer: peliculaEncontrada?.trailer || `El trailer no se encuentra disponible para esta película/serie.`
    };

    console.log(`Se encontró la información para el ID: ${idBuscado}`);
    return res.json(resultado);
  } else {
    console.log(`No se encontró ningún elemento con el ID: ${idBuscado}`);
    return res.status(404).json({ 
      mensaje: `No se encontró ningún elemento con el ID: ${idBuscado}` 
    });
  }
});

app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});