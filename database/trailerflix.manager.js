require('dotenv').config();
const fs = require('node:fs');

const leerTrailerflix = () => {
  const ruta = process.env.TRAILERFLIX_JSON_PATH || './database/trailerflix.json';
  return JSON.parse(fs.readFileSync(ruta, 'utf-8'));
};

const guardarTrailerflix = (arrayRegistros) => {
  const ruta = process.env.TRAILERFLIX_JSON_PATH || './database/trailerflix.json';
  fs.writeFileSync(ruta, JSON.stringify(arrayRegistros, null, 2), 'utf-8');
};

module.exports = { leerTrailerflix, guardarTrailerflix };