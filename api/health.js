const pool = require('./_db');

module.exports = async (req, res) => {
  try {
    await pool.query('SELECT 1 AS ok');
    res.status(200).json({ ok: true, message: 'Conexión correcta con TiDB' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};