const pool = require('./_db');

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const [rows] = await pool.query(`
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
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { nombre, sku, precio, unidad_medida_id } = req.body || {};

      if (!nombre || !sku || !precio || !unidad_medida_id) {
        return res.status(400).json({
          error: 'Nombre, SKU, precio y unidad de medida son obligatorios'
        });
      }

      const [result] = await pool.query(
        'INSERT INTO productos (nombre, sku, precio, unidad_medida_id) VALUES (?, ?, ?, ?)',
        [nombre, sku, precio, unidad_medida_id]
      );

      return res.status(201).json({
        id: result.insertId,
        nombre,
        sku,
        precio,
        unidad_medida_id
      });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};