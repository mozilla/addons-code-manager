const fs = require('fs');
const path = require('path');

const express = require('express');
const proxy = require('http-proxy-middleware');
const cookiesMiddleware = require('universal-cookie-express');

// Load environment configuration.
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
require('react-scripts/config/env');

// Create an express server.
const app = express();

// Express configuration.
app.set('port', process.env.PORT || 3000);
app.disable('x-powered-by');
app.use(cookiesMiddleware());

// This function injects the authentication token into the HTML sent to the
// browser (`index.html`). The token is stored into a HttpOnly cookie.
const injectAuthenticationToken = (req, html) => {
  // Try to retrieve the authentication cookie, which contains the token.
  const authToken = req.universalCookies.get(
    process.env.REACT_APP_AUTHENTICATION_COOKIE,
  );

  // Replace the placeholder in the `index.html` file with the token.
  return html.replace(
    `"${process.env.REACT_APP_AUTH_TOKEN_PLACEHOLDER}"`,
    JSON.stringify(authToken || '').replace(/</g, '\\u003c'),
  );
};

// We use a proxy to forward API requests to REACT_APP_API_HOST (i.e. the
// AMO/addons-server API). This is useful for local development.
if (process.env.REACT_APP_REQUIRE_PROXY === 'true') {
  app.use(
    proxy('/api', {
      target: process.env.REACT_APP_API_HOST,
      autoRewrite: true,
      changeOrigin: true,
      cookieDomainRewrite: '',
      protocolRewrite: 'http',
      secure: false,
      onProxyRes: (proxyResponse) => {
        // We make cookies unsecure because local development uses http and not
        // https. Without this change, the server code would not be able to read
        // the cookie that stores the authentication token.
        if (proxyResponse.headers['set-cookie']) {
          const cookies = proxyResponse.headers['set-cookie'].map((cookie) =>
            cookie.replace(/;\s*?(Secure)/i, ''),
          );
          proxyResponse.headers['set-cookie'] = cookies;
        }
      },
    }),
  );
}

if (process.env.NODE_ENV === 'production') {
  // In production mode, we use a simple node server that serves all the static
  // files, including the `index.html` file in which we inject the
  // authentication token.

  const indexHtml = fs.readFileSync(
    path.join(__dirname, '..', 'build', 'index.html'),
    'utf8',
  );

  // Serve all the static files but `index.html`.
  app.use(
    express.static(path.join(__dirname, '..', 'build'), { index: false }),
  );

  // This handles all the incoming requests.
  app.get('/*', (req, res) => {
    const html = injectAuthenticationToken(req, indexHtml);

    res.set('cache-control', 'private, no-store');
    res.send(html);
  });
} else {
  // In development mode, we create a proxy to forward all the requests to the
  // Create-React-App application. When the `index.html` is sent back to the
  // client, we inject the authentication token. This setup allows us to use CRA
  // as usual (in dev mode) and the same authentication mechanism used in
  // production mode.

  const modifyResponse = require('http-proxy-response-rewrite');

  app.use(
    proxy('/', {
      target: 'http://localhost:3100',
      // We need WebSocket for Hot Module Reload (HMR).
      ws: true,
      onProxyRes: (proxyResponse, req, res) => {
        if (req.url === '/') {
          proxyResponse.headers['cache-control'] = 'private, no-store';

          modifyResponse(
            res,
            proxyResponse.headers['content-encoding'],
            (body) => injectAuthenticationToken(req, body),
          );
        }
      },
    }),
  );
}

app.listen(app.get('port'), () => {
  console.log(
    '\nApp is running at http://localhost:%d/ in %s mode',
    app.get('port'),
    app.get('env'),
  );
  console.log('Press CTRL-C to stop\n');
});
