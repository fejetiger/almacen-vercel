const pool = require('./_db');

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const [rows] = await pool.query(
        'SELECT id, nombre, descripcion FROM conceptos ORDER BY id DESC'
      );
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { nombre, descripcion } = req.body || {};

      if (!nombre) {
        return res.status(400).json({ error: 'El nombre es obligatorio' });
      }

      const [result] = await pool.query(
        'INSERT INTO conceptos (nombre, descripcion) VALUES (?, ?)',
        [nombre, descripcion || null]
      );

      return res.status(201).json({
        id: result.insertId,
        nombre,
        descripcion: descripcion || null
      });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};