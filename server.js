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

app.get('/', (req, res) => {
  res.status(200).json({
    mensaje: 'Bienvenido a la API de TrailerFlix',
    totalRegistros: CATALOGO.length,
  });
});

// app.get('/trailerflix', (req, res) => {});

// app.get('/trailerflix/:id', (req, res) => {});

// app.post('/trailerflix', (req, res) => {});

// app.put('/trailerflix/:id', (req, res) => {});

// app.delete('/trailerflix/:id', (req, res) => {});

app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});