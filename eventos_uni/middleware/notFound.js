function notFoundHandler(req, res, next) {
    res.status(404).render('notFound', { title: 'Página no encontrada' });
  }
  
  module.exports = notFoundHandler;