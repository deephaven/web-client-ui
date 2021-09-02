const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = app => {
  app.use(
    createProxyMiddleware({
      target: 'http://localhost:10000',
      ws: true,
    })
  );
};
