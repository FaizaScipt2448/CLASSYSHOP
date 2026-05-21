const success = (res, data, meta = {}, status = 200) =>
  res.status(status).json({ success: true, data, meta });

const error = (res, message, code = 'ERROR', status = 400) =>
  res.status(status).json({ success: false, error: { code, message } });

module.exports = { success, error };
