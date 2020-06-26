import fs from 'fs';
import http from 'http';
import path from 'path';

import cspParser from 'content-security-policy-parser';
import express from 'express';
import request, { SuperTest, Test } from 'supertest';
import { RequestWithCookies } from 'universal-cookie-express';
import Cookies from 'universal-cookie';

import {
  ANALYTICS_DEBUG_PATH,
  ANALYTICS_PATH,
  DEFAULT_HOST,
  DEFAULT_PORT,
  STATIC_PATH,
  ServerEnvVars,
  createServer,
  injectAuthenticationToken,
} from '.';

describe(__filename, () => {
  describe('injectAuthenticationToken', () => {
    it('returns HTML with the token in it', () => {
      const token = '123';

      const req = {
        universalCookies: {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          get: (name: string) => token,
        } as Cookies,
      } as RequestWithCookies;
      const env = {
        REACT_APP_AUTH_TOKEN_PLACEHOLDER: '__PLACEHOLDER__',
      };
      const html = `<div data-token="${env.REACT_APP_AUTH_TOKEN_PLACEHOLDER}">`;

      const htmlWithToken = injectAuthenticationToken(
        req,
        html,
        env as ServerEnvVars,
      );

      expect(htmlWithToken).toEqual(`<div data-token="${token}">`);
    });

    it('avoids HTML injections', () => {
      const token = '<script>';

      const req = {
        universalCookies: {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          get: (name: string) => token,
        } as Cookies,
      } as RequestWithCookies;
      const env = { REACT_APP_AUTH_TOKEN_PLACEHOLDER: '__PLACEHOLDER__' };
      const html = `<div data-token="${env.REACT_APP_AUTH_TOKEN_PLACEHOLDER}">`;

      const htmlWithToken = injectAuthenticationToken(
        req,
        html,
        env as ServerEnvVars,
      );

      expect(htmlWithToken).toEqual(`<div data-token="\\u003cscript>">`);
    });
  });

  describe('createServer', () => {
    const fixturesPath = path.join(__dirname, 'fixtures');

    describe('NODE_ENV=production', () => {
      const prodEnv = {
        NODE_ENV: 'production',
        REACT_APP_ANALYTICS_HOST: 'https://www.google-analytics.com',
        REACT_APP_REVIEWERS_HOST: 'https://reviewers.addons-dev.allizom.org',
      };

      it('configures the host and port with default values', () => {
        const app = createServer({
          env: prodEnv as ServerEnvVars,
          rootPath: fixturesPath,
        });

        expect(app.get('host')).toEqual(DEFAULT_HOST);
        expect(app.get('port')).toEqual(DEFAULT_PORT);
      });

      it('configures the host and port with environment variables', () => {
        const host = '0.0.0.0';
        const port = 4000;
        const env = {
          ...prodEnv,
          PORT: port,
          SERVER_HOST: host,
        } as ServerEnvVars;
        const app = createServer({ env, rootPath: fixturesPath });

        expect(app.get('host')).toEqual(host);
        expect(app.get('port')).toEqual(port);
      });

      it('creates an Express server', async () => {
        const server = request(
          createServer({
            env: prodEnv as ServerEnvVars,
            rootPath: fixturesPath,
          }),
        );

        const response = await server.get('/');

        expect(response.text).toContain('It Works.');
        expect(response.header).toHaveProperty(
          'cache-control',
          'private, no-store',
        );
      });

      it('serves the index.html content to all routes', async () => {
        const server = request(
          createServer({
            env: prodEnv as ServerEnvVars,
            rootPath: fixturesPath,
          }),
        );

        const response = await server.get('/foo-bar');

        expect(response.text).toContain('It Works.');
      });

      it('sets production CSP and security headers', async () => {
        const fakeEnv = {
          ...prodEnv,
          PUBLIC_URL: 'https://code-manager.addons.cdn.mozilla.net',
          REACT_APP_API_HOST: 'https://addons-dev.allizom.org',
        };

        const server = request(
          createServer({
            env: fakeEnv as ServerEnvVars,
            rootPath: fixturesPath,
          }),
        );

        const response = await server.get('/');

        expect(response.status).toEqual(200);
        expect(response.header).toHaveProperty('content-security-policy');

        const policy = cspParser(response.header['content-security-policy']);
        expect(policy['default-src']).toEqual(["'none'"]);
        expect(policy['connect-src']).toEqual([
          fakeEnv.REACT_APP_API_HOST,
          fakeEnv.REACT_APP_ANALYTICS_HOST,
        ]);
        expect(policy['base-uri']).toEqual(["'self'"]);
        expect(policy['form-action']).toEqual(["'none'"]);
        expect(policy['frame-ancestors']).toEqual(["'none'"]);
        expect(policy['frame-src']).toEqual(["'none'"]);
        expect(policy['font-src']).toEqual(["'none'"]);
        expect(policy['img-src']).toEqual([
          `${fakeEnv.PUBLIC_URL}${STATIC_PATH}`,
          `${fakeEnv.REACT_APP_REVIEWERS_HOST}/en-US/reviewers/download-git-file/`,
        ]);
        expect(policy['manifest-src']).toEqual(["'none'"]);
        expect(policy['media-src']).toEqual(["'none'"]);
        expect(policy['object-src']).toEqual(["'none'"]);
        expect(policy['script-src']).toEqual([
          `${fakeEnv.PUBLIC_URL}${STATIC_PATH}`,
          `${fakeEnv.REACT_APP_ANALYTICS_HOST}${ANALYTICS_PATH}`,
        ]);
        expect(policy['style-src']).toEqual([
          `${fakeEnv.PUBLIC_URL}${STATIC_PATH}`,
        ]);
        expect(policy['worker-src']).toEqual(["'none'"]);
        expect(policy['report-uri']).toEqual([
          `${fakeEnv.REACT_APP_API_HOST}/__cspreport__`,
        ]);

        expect(response.header['referrer-policy']).toEqual('no-referrer');
        expect(response.header['strict-transport-security']).toEqual(
          'max-age=31536000',
        );
        expect(response.header['x-content-type-options']).toEqual('nosniff');
        expect(response.header['x-frame-options']).toEqual('DENY');
        expect(response.header['x-xss-protection']).toEqual('1; mode=block');

        const staticResponse = await server.get('/favicon.ico');

        expect(staticResponse.status).toEqual(200);
        expect(staticResponse.header).toHaveProperty('content-security-policy');
        const staticPolicy = cspParser(
          staticResponse.header['content-security-policy'],
        );
        // Static directives.
        expect(staticPolicy['default-src']).toEqual(["'none'"]);
        expect(staticPolicy['base-uri']).toEqual(["'none'"]);
        expect(staticPolicy['form-action']).toEqual(["'none'"]);
        expect(staticPolicy['object-src']).toEqual(["'none'"]);
        expect(staticPolicy['report-uri']).toEqual([
          `${fakeEnv.REACT_APP_API_HOST}/__cspreport__`,
        ]);

        // Everything else, that shouldn't be set for statics.
        expect(staticPolicy['frame-ancestors']).toEqual(undefined);
        expect(staticPolicy['frame-src']).toEqual(undefined);
        expect(staticPolicy['font-src']).toEqual(undefined);
        expect(staticPolicy['img-src']).toEqual(undefined);
        expect(staticPolicy['manifest-src']).toEqual(undefined);
        expect(staticPolicy['media-src']).toEqual(undefined);
        expect(staticPolicy['script-src']).toEqual(undefined);
        expect(staticPolicy['style-src']).toEqual(undefined);
        expect(staticPolicy['worker-src']).toEqual(undefined);
      });

      it('exposes a default no-op CSP report endpoint', async () => {
        const server = request(
          createServer({
            env: prodEnv as ServerEnvVars,
            rootPath: fixturesPath,
          }),
        );

        const cspReportResponse = await server.post('/__cspreport__');
        expect(cspReportResponse.status).toEqual(200);
      });

      it('adds the sentry host to connect-src in production when REACT_APP_SENTRY_DSN is set', async () => {
        const fakeEnv = {
          ...prodEnv,
          REACT_APP_SENTRY_DSN: 'https://token@sentry.prod.mozaws.net/425',
        };

        const server = request(
          createServer({
            env: fakeEnv as ServerEnvVars,
            rootPath: fixturesPath,
          }),
        );

        const response = await server.get('/');
        expect(response.status).toEqual(200);
        const policy = cspParser(response.header['content-security-policy']);
        expect(policy['connect-src']).toContain(
          'https://sentry.prod.mozaws.net',
        );
      });

      it('does not add the sentry host to connect-src when REACT_APP_SENTRY_DSN is unset', async () => {
        const server = request(
          createServer({
            env: prodEnv as ServerEnvVars,
            rootPath: fixturesPath,
          }),
        );

        const response = await server.get('/');
        expect(response.status).toEqual(200);
        const policy = cspParser(response.header['content-security-policy']);
        expect(policy['connect-src']).toEqual([
          "'none'",
          prodEnv.REACT_APP_ANALYTICS_HOST,
        ]);
      });

      it('throws an error when REACT_APP_SENTRY_DSN is invalid', async () => {
        const fakeEnv = {
          ...prodEnv,
          REACT_APP_SENTRY_DSN: 'invalid',
        };

        expect(() => {
          request(
            createServer({
              env: fakeEnv as ServerEnvVars,
              rootPath: fixturesPath,
            }),
          );
        }).toThrow(/could not parse host or protocol/);
      });

      it('throws an error when REACT_APP_SENTRY_DSN is not a string', async () => {
        const fakeEnv = {
          ...prodEnv,
          REACT_APP_SENTRY_DSN: 123,
        };

        expect(() => {
          request(
            createServer({
              // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
              // @ts-ignore
              env: fakeEnv,
              rootPath: fixturesPath,
            }),
          );
        }).toThrow(/argument must be of type string/);
      });

      it('tightens connnect-src if API host is unset', async () => {
        const server = request(
          createServer({
            env: prodEnv as ServerEnvVars,
            rootPath: fixturesPath,
          }),
        );

        const response = await server.get('/');
        expect(response.status).toEqual(200);
        const policy = cspParser(response.header['content-security-policy']);
        expect(policy['connect-src']).toEqual([
          "'none'",
          prodEnv.REACT_APP_ANALYTICS_HOST,
        ]);
      });

      it('tightens style-src, script-src and img-src if CDN URL is unset', async () => {
        const server = request(
          createServer({
            env: prodEnv as ServerEnvVars,
            rootPath: fixturesPath,
          }),
        );

        const response = await server.get('/');
        expect(response.status).toEqual(200);
        const policy = cspParser(response.header['content-security-policy']);
        expect(policy['img-src']).toEqual([
          "'none'",
          `${prodEnv.REACT_APP_REVIEWERS_HOST}/en-US/reviewers/download-git-file/`,
        ]);
        expect(policy['script-src']).toEqual([
          "'none'",
          `${prodEnv.REACT_APP_ANALYTICS_HOST}${ANALYTICS_PATH}`,
        ]);
        expect(policy['style-src']).toEqual(["'none'"]);
      });

      it('sets style-src, script-src and img-src to "self" when CDN URL is "/"', async () => {
        const env = {
          ...prodEnv,
          PUBLIC_URL: '/',
        } as ServerEnvVars;

        const server = request(createServer({ env, rootPath: fixturesPath }));

        const response = await server.get('/');
        expect(response.status).toEqual(200);
        const policy = cspParser(response.header['content-security-policy']);
        expect(policy['img-src']).toEqual([
          "'self'",
          `${env.REACT_APP_REVIEWERS_HOST}/en-US/reviewers/download-git-file/`,
        ]);
        expect(policy['script-src']).toEqual([
          "'self'",
          `${prodEnv.REACT_APP_ANALYTICS_HOST}${ANALYTICS_PATH}`,
        ]);
        expect(policy['style-src']).toEqual(["'self'"]);
      });

      it('calls injectAuthenticationToken() and returns its output', async () => {
        const expectedHTML = 'content with auth token';

        const _injectAuthenticationToken = jest.fn();
        _injectAuthenticationToken.mockReturnValue(expectedHTML);

        const server = request(
          createServer({
            env: prodEnv as ServerEnvVars,
            rootPath: fixturesPath,
            _injectAuthenticationToken,
          }),
        );

        const response = await server.get('/');

        expect(_injectAuthenticationToken).toHaveBeenCalled();
        expect(response.text).toContain(expectedHTML);
      });

      describe('with REACT_APP_USE_INSECURE_PROXY=true', () => {
        const apiPort = '5678';
        const apiResponseBody = 'API response body';
        const reviewersPort = '9876';
        const reviewersResponseBody = 'Reviewers response body';
        const prodEnvWithInsecureProxy = {
          ...prodEnv,
          REACT_APP_USE_INSECURE_PROXY: 'true',
          REACT_APP_API_HOST: `http://localhost:${apiPort}`,
          REACT_APP_REVIEWERS_HOST: `http://localhost:${reviewersPort}`,
        };

        let apiApp: express.Application;
        let reviewersApp: express.Application;
        let fakeApiServer: http.Server;
        let fakeReviewersServer: http.Server;
        let server: SuperTest<Test>;

        beforeEach(() => {
          server = request(
            createServer({
              env: prodEnvWithInsecureProxy as ServerEnvVars,
              rootPath: fixturesPath,
            }),
          );

          // This Express app is used to simulate the API service.
          apiApp = express();
          // We create a handler to configure a response without cookies.
          apiApp.get('/api/no-cookie', (req, res) => {
            res.send(apiResponseBody);
          });
          // This is a catch-all handler for all other requests.
          apiApp.get('*', (req, res) => {
            res.cookie('auth_token', 'secret', {
              // Cookies returned by the API are usually secure.
              secure: true,
            });
            res.send(apiResponseBody);
          });

          fakeApiServer = apiApp.listen(apiPort);
          fakeApiServer.on('error', (error) => {
            // eslint-disable-next-line no-console
            console.error('proxy error', error);
          });

          // This Express app is used to simulate the reviewers service.
          reviewersApp = express();
          reviewersApp.get('*', (req, res) => {
            res.send(reviewersResponseBody);
          });

          fakeReviewersServer = reviewersApp.listen(reviewersPort);
          fakeReviewersServer.on('error', (error) => {
            // eslint-disable-next-line no-console
            console.error('proxy error', error);
          });
        });

        afterEach(() => {
          fakeApiServer.close();
          fakeReviewersServer.close();
        });

        it('forwards all the /api calls to the REACT_APP_API_HOST server', async () => {
          const response = await server.get('/api/foo');

          expect(response.text).toEqual(apiResponseBody);
        });

        it('removes the secure attribute of cookies sent by the API', async () => {
          const response = await server.get('/api/');

          expect(response.header).toHaveProperty('set-cookie');
          expect(response.header['set-cookie']).toEqual([
            'auth_token=secret; Path=/',
          ]);
        });

        it('does not forward requests that are not API requests', async () => {
          const response = await server.get('/foo');

          expect(response.text).not.toEqual(apiResponseBody);
        });

        it('does not modify the cookies when there is no cookie sent by the API', async () => {
          const response = await server.get('/api/no-cookie');

          expect(response.header).not.toHaveProperty('set-cookie');
        });

        // The Browse/Compare APIs return a `download_url` field with the URL
        // to download the content of the selected file.
        it('forwards the download URLs to the REACT_APP_REVIEWERS_HOST server', async () => {
          const response = await server.get(
            '/en-US/reviewers/download-git-file/1532144/manifest.json/',
          );

          expect(response.text).toEqual(reviewersResponseBody);
        });

        it('relaxes connect-src for insecure proxying', async () => {
          const response = await server.get('/');
          expect(response.status).toEqual(200);
          expect(response.header).toHaveProperty('content-security-policy');

          const policy = cspParser(response.header['content-security-policy']);
          expect(policy['connect-src']).toEqual([
            "'self'",
            prodEnv.REACT_APP_ANALYTICS_HOST,
          ]);
        });

        it('uses a relative path for the CSP report URI', async () => {
          const response = await server.get('/');

          const policy = cspParser(response.header['content-security-policy']);
          expect(policy['report-uri']).toEqual(['/__cspreport__']);
        });
      });

      it('exposes the content of version.json', async () => {
        const server = request(
          createServer({
            env: prodEnv as ServerEnvVars,
            rootPath: fixturesPath,
          }),
        );

        const response = await server.get('/__version__');

        expect(response.status).toEqual(200);
        expect(response.header).toHaveProperty(
          'content-type',
          'application/json; charset=UTF-8',
        );

        const content = fs.readFileSync(
          path.join(fixturesPath, 'version.json'),
          {
            encoding: 'utf8',
          },
        );
        expect(response.text).toEqual(content);
      });

      it.each(['/__heartbeat__', '/__lbheartbeat__'])(
        'exposes a "%s" endpoint for ops',
        async (endpoint) => {
          const server = request(
            createServer({
              env: prodEnv as ServerEnvVars,
              rootPath: fixturesPath,
            }),
          );

          const response = await server.get(endpoint);

          expect(response.status).toEqual(200);
          expect(response.text).toEqual('ok');
        },
      );
    });

    describe('NODE_ENV=development', () => {
      // This is meant to simulate the create-react-app dev server application.
      let fakeCreateReactAppServerApp: express.Application;
      // This is the actual HTTP server instance, which is needed to close it
      // after each test case.
      let fakeCreateReactAppServer: http.Server;

      const devEnv = {
        NODE_ENV: 'development',
        REACT_APP_CRA_PORT: 60123,
        REACT_APP_ANALYTICS_HOST: 'https://www.google-analytics.com',
      };

      beforeEach(() => {
        fakeCreateReactAppServerApp = express();
        fakeCreateReactAppServer = fakeCreateReactAppServerApp.listen(
          devEnv.REACT_APP_CRA_PORT,
        );
        fakeCreateReactAppServer.on('error', (error) => {
          // eslint-disable-next-line no-console
          console.error('proxy error', error);
        });
      });

      afterEach(() => {
        fakeCreateReactAppServer.close();
      });

      it('creates an Express server that acts as a proxy for the CRA server', async () => {
        const content = 'Hello, I am the create-react-app server';
        fakeCreateReactAppServerApp.get('/*', (req, res) => res.send(content));

        const server = request(
          createServer({
            env: devEnv as ServerEnvVars,
            rootPath: fixturesPath,
          }),
        );

        const response = await server.get('/');

        expect(response.text).toContain(content);
        expect(response.header).toHaveProperty(
          'cache-control',
          'private, no-store',
        );
      });

      it('calls injectAuthenticationToken() and returns its output', async () => {
        const expectedHTML = 'content with auth token';

        const _injectAuthenticationToken = jest.fn();
        _injectAuthenticationToken.mockReturnValue(expectedHTML);

        const server = request(
          createServer({
            env: devEnv as ServerEnvVars,
            rootPath: fixturesPath,
            _injectAuthenticationToken,
          }),
        );

        const response = await server.get('/');

        expect(_injectAuthenticationToken).toHaveBeenCalled();
        expect(response.text).toContain(expectedHTML);
      });

      it('does not configure the `cache-control` header of non-HTML proxy responses', async () => {
        const content = { foo: 'bar' };
        fakeCreateReactAppServerApp.get('/*', (req, res) => res.json(content));

        const server = request(
          createServer({
            env: devEnv as ServerEnvVars,
            rootPath: fixturesPath,
          }),
        );

        const response = await server.get('/');

        expect(response.text).toContain(JSON.stringify(content));
        expect(response.header).not.toHaveProperty(
          'cache-control',
          'private, no-store',
        );
      });

      it('does not call injectAuthenticationToken() for non-HTML proxy responses', async () => {
        const content = { foo: 'bar' };
        fakeCreateReactAppServerApp.get('/*', (req, res) => res.json(content));

        const _injectAuthenticationToken = jest.fn();
        _injectAuthenticationToken.mockReturnValue('this is unexpected');

        const server = request(
          createServer({
            env: devEnv as ServerEnvVars,
            rootPath: fixturesPath,
            _injectAuthenticationToken,
          }),
        );

        const response = await server.get('/');

        expect(_injectAuthenticationToken).not.toHaveBeenCalled();
        expect(response.text).toContain(JSON.stringify(content));
      });

      it('relaxes img-src for local dev', async () => {
        const content = '<h1>It works!</h1>';
        fakeCreateReactAppServerApp.get('/*', (req, res) => res.send(content));

        const fakeEnv = {
          ...devEnv,
          REACT_APP_REVIEWERS_HOST: 'https://reviewers.addons-dev.allizom.org',
        };

        const server = request(
          createServer({
            env: fakeEnv as ServerEnvVars,
            rootPath: fixturesPath,
          }),
        );

        const response = await server.get('/');
        expect(response.status).toEqual(200);
        expect(response.header).toHaveProperty('content-security-policy');

        const policy = cspParser(response.header['content-security-policy']);
        expect(policy['img-src']).toEqual([
          "'none'",
          `${fakeEnv.REACT_APP_REVIEWERS_HOST}/en-US/reviewers/download-git-file/`,
          "'self'",
        ]);
      });

      it('relaxes script-src for local dev', async () => {
        const content = '<h1>It works!</h1>';
        fakeCreateReactAppServerApp.get('/*', (req, res) => res.send(content));

        const server = request(
          createServer({
            env: devEnv as ServerEnvVars,
            rootPath: fixturesPath,
          }),
        );

        const response = await server.get('/');
        expect(response.status).toEqual(200);
        expect(response.header).toHaveProperty('content-security-policy');

        const policy = cspParser(response.header['content-security-policy']);
        expect(policy['script-src']).toEqual([
          "'self'",
          "'unsafe-inline'",
          `${devEnv.REACT_APP_ANALYTICS_HOST}${ANALYTICS_PATH}`,
        ]);
      });

      it('uses debug analytics path when REACT_APP_GA_DEBUG_MODE is true', async () => {
        const content = '<h1>It works!</h1>';
        fakeCreateReactAppServerApp.get('/*', (req, res) => res.send(content));

        const server = request(
          createServer({
            env: {
              ...devEnv,
              REACT_APP_GA_DEBUG_MODE: 'true',
            } as ServerEnvVars,
            rootPath: fixturesPath,
          }),
        );

        const response = await server.get('/');
        expect(response.status).toEqual(200);
        expect(response.header).toHaveProperty('content-security-policy');

        const policy = cspParser(response.header['content-security-policy']);
        expect(policy['script-src']).toEqual([
          "'self'",
          "'unsafe-inline'",
          `${devEnv.REACT_APP_ANALYTICS_HOST}${ANALYTICS_DEBUG_PATH}`,
        ]);
      });

      it('relaxes style-src for local dev', async () => {
        const content = '<h1>It works!</h1>';
        fakeCreateReactAppServerApp.get('/*', (req, res) => res.send(content));

        const server = request(
          createServer({
            env: devEnv as ServerEnvVars,
            rootPath: fixturesPath,
          }),
        );

        const response = await server.get('/');
        expect(response.status).toEqual(200);
        expect(response.header).toHaveProperty('content-security-policy');

        const policy = cspParser(response.header['content-security-policy']);
        expect(policy['style-src']).toEqual(["'self'", "'unsafe-inline'"]);
      });

      it('relaxes connect-src for local dev', async () => {
        const content = '<h1>It works!</h1>';
        fakeCreateReactAppServerApp.get('/*', (req, res) => res.send(content));

        const server = request(
          createServer({
            env: devEnv as ServerEnvVars,
            rootPath: fixturesPath,
          }),
        );

        const response = await server.get('/');
        expect(response.status).toEqual(200);
        expect(response.header).toHaveProperty('content-security-policy');

        const policy = cspParser(response.header['content-security-policy']);
        expect(policy['connect-src']).toEqual([
          "'self'",
          devEnv.REACT_APP_ANALYTICS_HOST,
        ]);
      });

      it('adds the sentry host to connect-src in development when REACT_APP_SENTRY_DSN is set', async () => {
        const content = '<h1>It works!</h1>';
        fakeCreateReactAppServerApp.get('/*', (req, res) => res.send(content));

        const fakeEnv = {
          ...devEnv,
          REACT_APP_SENTRY_DSN: 'https://token@sentry.prod.mozaws.net/425',
        };

        const server = request(
          createServer({
            env: fakeEnv as ServerEnvVars,
            rootPath: fixturesPath,
          }),
        );

        const response = await server.get('/');
        expect(response.status).toEqual(200);

        const policy = cspParser(response.header['content-security-policy']);
        expect(policy['connect-src']).toContain(
          'https://sentry.prod.mozaws.net',
        );
      });

      it('serves the favicon.ico file', async () => {
        const server = request(
          createServer({
            env: devEnv as ServerEnvVars,
            rootPath: fixturesPath,
          }),
        );

        const response = await server.get(`${STATIC_PATH}favicon.ico`);
        expect(response.status).toEqual(200);
        // `icon\n` is the string written in `fixtures/public/favicon.ico`.
        expect(response.body).toEqual(Buffer.from('icon\n'));
      });
    });
  });
});
