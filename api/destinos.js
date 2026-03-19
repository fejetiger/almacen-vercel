const pool = require('./_db');

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const [rows] = await pool.query(
        'SELECT id, nombre, ubicacion, responsable FROM destinos ORDER BY id DESC'
      );
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { nombre, ubicacion, responsable } = req.body || {};

      if (!nombre) {
        return res.status(400).json({ error: 'El nombre es obligatorio' });
      }

      const [result] = await pool.query(
        'INSERT INTO destinos (nombre, ubicacion, responsable) VALUES (?, ?, ?)',
        [nombre, ubicacion || null, responsable || null]
      );

      return res.status(201).json({
        id: result.insertId,
        nombre,
        ubicacion: ubicacion || null,
        responsable: responsable || null
      });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};