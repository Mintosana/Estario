export function notFoundMiddleware(req, res) {
  res.status(404).json({
    message: "Ruta nu a fost gasita.",
    errors: []
  });
}
