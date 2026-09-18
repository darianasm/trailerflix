const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3008;
const trailerflixPath = process.env.TRAILERFLIX_JSON_PATH || './database/trailerflix.json';

const jsonPath = path.resolve(__dirname, trailerflixPath);
const jsonData = fs.readFileSync(jsonPath, 'utf-8');
const TRAILERFLIX = JSON.parse(jsonData);

app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({
    mensaje: 'Bienvenido a la API de TrailerFlix',
    totalRegistros: Array.isArray(TRAILERFLIX) ? TRAILERFLIX.length : 0,
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
