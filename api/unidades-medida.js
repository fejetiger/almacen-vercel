const pool = require('./_db');

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const [rows] = await pool.query(
        'SELECT id, clave, nombre FROM unidades_medida ORDER BY id DESC'
      );
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { clave, nombre } = req.body || {};

      if (!clave || !nombre) {
        return res.status(400).json({ error: 'Clave y nombre son obligatorios' });
      }

      const [result] = await pool.query(
        'INSERT INTO unidades_medida (clave, nombre) VALUES (?, ?)',
        [clave, nombre]
      );

      return res.status(201).json({
        id: result.insertId,
        clave,
        nombre
      });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};