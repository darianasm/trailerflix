require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { leerTrailerflix, guardarTrailerflix } = require('./database/trailerflix.manager');

const app = express();
const PORT = process.env.PORT || 3008;

let CATALOGO = [];

app.use(bodyParser.json());

app.use((req, res, next) => {
  CATALOGO = leerTrailerflix();
  next();
});

function leerTrailerflix() {
  try {
    const peliculas = fs.readFileSync('trailerflix.json', 'utf-8');
    const catalogo = JSON.parse(peliculas);
    return catalogo;
  } catch (error) {
    console.error('Error al leer el archivo trailerflix.json:', error.message);
    return [];
  }
}

// 1. Función genérica de búsqueda
function buscarEnCatalogo(propiedad, datoABuscar) {
  const termino = datoABuscar.toLowerCase();

  return CATALOGO.filter(item => {
    const valorPropiedad = item[propiedad];
    
    if (!valorPropiedad) return false;

    if (Array.isArray(valorPropiedad)) {
      return valorPropiedad.some(elemento => 
        elemento.toLowerCase().includes(termino)
      );
    }

    return valorPropiedad.toLowerCase().includes(termino);
  });
}

app.get('/', (req, res) => {
  res.status(200).json({
    mensaje: 'Bienvenido a la API de TrailerFlix',
    totalRegistros: CATALOGO.length,
  });
});

app.get('/catalogo', (req, res) => {
  let catalogoOrdenado = [...CATALOGO].sort((a, b) =>
    a.title.localeCompare(b.title)
  );
  res.render('catalogo', {
    titulo: 'Catálogo de Películas',
    catalogo: catalogoOrdenado,
  });
});

app.get('/catalogo/titulo/:title', (req, res) => {
  const titulosEncontrados = buscarEnCatalogo("title", req.params.title);

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

// app.get('/categoria/:cat', (req, res) => {});
/*
Para el endpoint /categoria/:cat utiliza también .filter() y retorna todos los resultados encontrados.
(Aquí son dos posibles valores solamente)
*/


app.get('/reparto/:act', (req, res) => {
  const datosAux = buscarEnCatalogo("reparto", req.params.act);
  const datosEncontrados = datosAux.map(pelicula => ({
    titulo: pelicula.title,
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
  const idBuscado = req.params.id;

  const peliculaEncontrada = CATALOGO.find(item => item.id == idBuscado);

  if (peliculaEncontrada) {
    const resultado = {
      id: peliculaEncontrada.id,
      titulo: peliculaEncontrada.title, 
      trailer: peliculaEncontrada?.trailer || null 
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
/*
Para el endpoint /trailer/:id debes retornar las propiedades “id”, “titulo”, “trailer”. (cuidado, porque
no todas las películas/series poseen la propiedad tráiler, por lo tanto debes aplicar el operador de
acceso condicional {objeto?.trailer})
*/

app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});