const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 4000),
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  ssl: process.env.DB_SSL === 'true'
    ? { minVersion: 'TLSv1.2', rejectUnauthorized: true }
    : undefined
});

async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

app.get('/api/health', async (req, res) => {
  try {
    await query('SELECT 1 AS ok');
    res.json({ ok: true, message: 'Conexión correcta con TiDB' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/api/conceptos', async (req, res) => {
  try {
    const rows = await query(
      'SELECT id, nombre, descripcion FROM conceptos ORDER BY id DESC'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/conceptos', async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    const result = await query(
      'INSERT INTO conceptos (nombre, descripcion) VALUES (?, ?)',
      [nombre, descripcion || null]
    );

    res.status(201).json({
      id: result.insertId,
      nombre,
      descripcion: descripcion || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/destinos', async (req, res) => {
  try {
    const rows = await query(
      'SELECT id, nombre, ubicacion, responsable FROM destinos ORDER BY id DESC'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/destinos', async (req, res) => {
  try {
    const { nombre, ubicacion, responsable } = req.body;
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    const result = await query(
      'INSERT INTO destinos (nombre, ubicacion, responsable) VALUES (?, ?, ?)',
      [nombre, ubicacion || null, responsable || null]
    );

    res.status(201).json({
      id: result.insertId,
      nombre,
      ubicacion: ubicacion || null,
      responsable: responsable || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/unidades-medida', async (req, res) => {
  try {
    const rows = await query(
      'SELECT id, clave, nombre FROM unidades_medida ORDER BY id DESC'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/unidades-medida', async (req, res) => {
  try {
    const { clave, nombre } = req.body;
    if (!clave || !nombre) {
      return res.status(400).json({ error: 'Clave y nombre son obligatorios' });
    }

    const result = await query(
      'INSERT INTO unidades_medida (clave, nombre) VALUES (?, ?)',
      [clave, nombre]
    );

    res.status(201).json({
      id: result.insertId,
      clave,
      nombre
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/productos', async (req, res) => {
  try {
    const rows = await query(`
      SELECT 
        p.id,
        p.nombre,
        p.sku,
        p.precio,
        u.nombre AS unidad
      FROM productos p
      INNER JOIN unidades_medida u ON u.id = p.unidad_medida_id
      ORDER BY p.id DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/productos', async (req, res) => {
  try {
    const { nombre, sku, precio, unidad_medida_id } = req.body;

    if (!nombre || !sku || !precio || !unidad_medida_id) {
      return res.status(400).json({
        error: 'Nombre, SKU, precio y unidad de medida son obligatorios'
      });
    }

    const result = await query(
      'INSERT INTO productos (nombre, sku, precio, unidad_medida_id) VALUES (?, ?, ?, ?)',
      [nombre, sku, precio, unidad_medida_id]
    );

    res.status(201).json({
      id: result.insertId,
      nombre,
      sku,
      precio,
      unidad_medida_id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}