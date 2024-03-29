/* eslint-disable no-console */
import fs from 'fs';
import http from 'http';
import path from 'path';

import express from 'express';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cookiesMiddleware, {
  RequestWithCookies,
} from 'universal-cookie-express';

import { getApiHost } from '../api';

export const DEFAULT_HOST = 'localhost';
export const DEFAULT_PORT = 3000;
export const STATIC_PATH = '/static/';
export const ANALYTICS_PATH = '/analytics.js';
export const ANALYTICS_DEBUG_PATH = '/analytics_debug.js';

export type ServerEnvVars = {
  NODE_ENV: string;
  PORT: number;
  PUBLIC_URL: string;
  REACT_APP_API_HOST: string;
  REACT_APP_AUTHENTICATION_COOKIE: string;
  REACT_APP_USER_AUTH_SESSION_ID_PLACEHOLDER: string;
  REACT_APP_CRA_PORT: number;
  REACT_APP_REVIEWERS_HOST: string;
  REACT_APP_ANALYTICS_HOST: string;
  REACT_APP_GA_DEBUG_MODE: string;
  REACT_APP_USE_INSECURE_PROXY: string;
  SERVER_HOST: string;
};

// This function injects the authentication token into the HTML sent to the
// browser (`index.html`). The token is stored into a HttpOnly cookie.
export const injectAuthenticationToken = (
  req: RequestWithCookies,
  html: string,
  env: ServerEnvVars,
): string => {
  // Try to retrieve the authentication cookie, which contains the token.
  const userAuthSessionId = req.universalCookies.get(
    env.REACT_APP_AUTHENTICATION_COOKIE,
  );

  // Replace the placeholder in the `index.html` file with the token.
  return html.replace(
    `"${env.REACT_APP_USER_AUTH_SESSION_ID_PLACEHOLDER}"`,
    JSON.stringify(userAuthSessionId || '').replace(/</g, '\\u003c'),
  );
};

type CreateServerParams = {
  _injectAuthenticationToken?: typeof injectAuthenticationToken;
  env: ServerEnvVars;
  rootPath: string;
};

export const createServer = ({
  env,
  rootPath,
  _injectAuthenticationToken = injectAuthenticationToken,
}: CreateServerParams) => {
  const useInsecureProxy = env.REACT_APP_USE_INSECURE_PROXY === 'true';
  const isProduction = env.NODE_ENV === 'production';
  const analyticsHost = env.REACT_APP_ANALYTICS_HOST;
  const analyticsPath =
    !isProduction && env.REACT_APP_GA_DEBUG_MODE === 'true'
      ? ANALYTICS_DEBUG_PATH
      : ANALYTICS_PATH;

  const reportUri = `${getApiHost({
    apiHost: env.REACT_APP_API_HOST,
    useInsecureProxy,
  })}/__cspreport__`;
  // This CSP is a tight default. This CSP should be on all requests that
  // aren't serving a document. This CSP should be set with statics.
  const baseCSP = {
    defaultSrc: ["'none'"],
    baseUri: ["'none'"],
    formAction: ["'none'"],
    objectSrc: ["'none'"],
    reportUri,
  };

  let staticSrc = "'none'";
  if (env.PUBLIC_URL) {
    staticSrc =
      // When PUBLIC_URL is set to `/` (for local dev), we serve the statics
      // locally hence "'self'".
      env.PUBLIC_URL === '/' ? "'self'" : `${env.PUBLIC_URL}${STATIC_PATH}`;
  }

  const connectSrc = [
    // While using the proxy or while in development, relax connect-src.
    // Otherwise, use the API host or 'none'.
    useInsecureProxy || !isProduction
      ? "'self'"
      : env.REACT_APP_API_HOST || "'none'",
    analyticsHost,
  ];

  // This config sets the non-static CSP for deployed instances.
  const prodCSP = {
    defaultSrc: ["'none'"],
    childSrc: ["'none'"],
    connectSrc,
    baseUri: ["'self'"],
    fontSrc: ["'none'"],
    formAction: ["'none'"],
    frameAncestors: ["'none'"],
    frameSrc: ["'none'"],
    imgSrc: [
      staticSrc,
      `${env.REACT_APP_REVIEWERS_HOST}/en-US/reviewers/download-git-file/`,
    ],
    manifestSrc: ["'none'"],
    mediaSrc: ["'none'"],
    objectSrc: ["'none'"],
    scriptSrc: [staticSrc, `${analyticsHost}${analyticsPath}`],
    styleSrc: [staticSrc],
    workerSrc: ["'none'"],
    reportUri,
  };

  // Create an express server.
  const app = express();

  // Setup the default CSP that will be used if not overridden elsewhere.
  app.use(
    helmet.contentSecurityPolicy({
      directives: baseCSP,
    }),
  );

  // Set other security headers.
  app.use(helmet.frameguard({ action: 'deny' }));
  app.use(
    helmet.hsts({
      includeSubDomains: false,
      maxAge: 31536000, // 1 year in seconds
    }),
  );
  app.use(helmet.noSniff());
  app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));
  app.use(helmet.xssFilter());

  // Express configuration.
  app.set('host', env.SERVER_HOST || DEFAULT_HOST);
  app.set('port', env.PORT || DEFAULT_PORT);
  app.disable('x-powered-by');
  app.use(cookiesMiddleware());

  // We use a proxy to forward API requests to REACT_APP_API_HOST (i.e. the
  // AMO/addons-server API). This is useful for local development.
  if (useInsecureProxy) {
    if (isProduction) {
      console.warn(`Using an insecure proxy with NODE_ENV=production is risky`);
    }

    app.use(
      createProxyMiddleware(['/api/**'], {
        target: env.REACT_APP_API_HOST,
        autoRewrite: true,
        changeOrigin: true,
        cookieDomainRewrite: '',
        protocolRewrite: 'http',
        secure: false,
        onProxyRes: (proxyResponse: http.IncomingMessage) => {
          // We make cookies unsecure because local development uses http and
          // not https. Without this change, the server code would not be able
          // to read the cookie that stores the authentication token.
          if (proxyResponse.headers['set-cookie']) {
            const cookies = proxyResponse.headers['set-cookie'].map(
              (cookie: string) => cookie.replace(/;\s*?(Secure)/i, ''),
            );
            // eslint-disable-next-line no-param-reassign
            proxyResponse.headers['set-cookie'] = cookies;
          }
        },
      }),
    );

    app.use(
      createProxyMiddleware(['/**/reviewers/download-git-file/**/'], {
        target: env.REACT_APP_REVIEWERS_HOST,
        autoRewrite: true,
        changeOrigin: true,
        cookieDomainRewrite: '',
        protocolRewrite: 'http',
        secure: false,
      }),
    );
  }

  // Return 200 for csp reports - this will need to be overridden when deployed.
  app.post('/__cspreport__', (req, res) => res.status(200).end('ok'));

  app.get('/__version__', (req, res) => {
    const versionFile = path.join(rootPath, 'version.json');

    return res.sendFile(versionFile);
  });

  app.get(['/__heartbeat__', '/__lbheartbeat__'], (req, res) => {
    return res.status(200).end('ok');
  });

  if (isProduction) {
    // In production mode, we use a simple node server that serves all the
    // static files, including the `index.html` file in which we inject the
    // authentication token.

    const indexHtml = fs.readFileSync(
      path.join(rootPath, 'build', 'index.html'),
      'utf8',
    );

    // Serve all the static files but `index.html`.
    app.use(express.static(path.join(rootPath, 'build'), { index: false }));

    // This configures the main CSP for deployed instances.
    app.use(
      helmet.contentSecurityPolicy({
        directives: prodCSP,
      }),
    );

    // This handles all the incoming requests.
    app.get('/*', (req: express.Request, res: express.Response) => {
      const html = _injectAuthenticationToken(
        req as RequestWithCookies,
        indexHtml,
        env,
      );

      res.set('cache-control', 'private, no-store');
      res.send(html);
    });
  } else {
    // In development mode, we create a proxy to forward all the requests to
    // the Create-React-App application. When the `index.html` is sent back to
    // the client, we inject the authentication token. This setup allows us to
    // use CRA as usual (in dev mode) and the same authentication mechanism
    // used in production mode.

    // This sets the development CSP that works with webpack and devtools.
    app.use(
      helmet.contentSecurityPolicy({
        directives: {
          ...prodCSP,
          imgSrc: [...prodCSP.imgSrc, "'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            `${analyticsHost}${analyticsPath}`,
          ],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      }),
    );

    // In production, this file will be uploaded in the `/static/` directory
    // and the `index.html` uses this directory, so we need this route to serve
    // this file in development.
    app.get(`${STATIC_PATH}favicon.ico`, (req, res) => {
      return res.sendFile(path.join(rootPath, 'public', 'favicon.ico'));
    });

    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    const zlib = require('zlib');

    app.use(
      createProxyMiddleware('/', {
        target: `http://localhost:${env.REACT_APP_CRA_PORT}`,
        // We need WebSocket for Hot Module Reload (HMR).
        ws: true,
        // This means we handle the response in `onProxyRes()`.
        selfHandleResponse: true,
        onProxyRes: (
          proxyResponse: http.IncomingMessage,
          req: http.IncomingMessage,
          res: http.ServerResponse,
        ) => {
          const bodyChunks: Buffer[] = [];
          proxyResponse.on('data', (chunk) => {
            bodyChunks.push(chunk);
          });

          proxyResponse.on('end', () => {
            res.statusCode = proxyResponse.statusCode || 200;

            Object.keys(proxyResponse.headers).forEach((key) => {
              res.setHeader(key, proxyResponse.headers[key] || '');
            });

            const contentType = proxyResponse.headers['content-type'] || '';
            const contentEncoding =
              proxyResponse.headers['content-encoding'] || '';

            let body;
            if (contentEncoding.includes('gzip')) {
              body = zlib
                .gunzipSync(Buffer.concat(bodyChunks))
                .toString('utf8');
            } else {
              body = Buffer.concat(bodyChunks).toString('utf8');
            }

            if (contentType.includes('text/html')) {
              res.setHeader('cache-control', 'private, no-store');
              body = _injectAuthenticationToken(
                req as http.IncomingMessage & RequestWithCookies,
                body,
                env,
              );
            }

            if (contentEncoding.includes('gzip')) {
              res.setHeader('content-encoding', 'identity');
            } else {
              res.setHeader('content-length', body.length);
            }

            res.end(body);
          });
        },
      }),
    );
  }

  return app;
};
