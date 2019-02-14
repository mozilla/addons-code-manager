/* eslint @typescript-eslint/no-object-literal-type-assertion: 0 */
import http from 'http';
import path from 'path';

import express from 'express';
import request from 'supertest';
import { RequestWithCookies } from 'universal-cookie-express';
import Cookies from 'universal-cookie';

import { ServerEnvVars, createServer, injectAuthenticationToken } from '.';

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
    const rootPath = path.join(__dirname, 'fixtures');

    describe('NODE_ENV=production', () => {
      const prodEnv = {
        NODE_ENV: 'production',
      };

      it('creates an Express server', async () => {
        const server = request(
          createServer({ env: prodEnv as ServerEnvVars, rootPath }),
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
          createServer({ env: prodEnv as ServerEnvVars, rootPath }),
        );

        const response = await server.get('/foo-bar');

        expect(response.text).toContain('It Works.');
      });

      it('calls injectAuthenticationToken() and returns its output', async () => {
        const expectedHTML = 'content with auth token';

        const _injectAuthenticationToken = jest.fn();
        _injectAuthenticationToken.mockReturnValue(expectedHTML);

        const server = request(
          createServer({
            env: prodEnv as ServerEnvVars,
            rootPath,
            _injectAuthenticationToken,
          }),
        );

        const response = await server.get('/');

        expect(_injectAuthenticationToken).toHaveBeenCalled();
        expect(response.text).toContain(expectedHTML);
      });
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
          createServer({ env: devEnv as ServerEnvVars, rootPath }),
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
            rootPath,
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
          createServer({ env: devEnv as ServerEnvVars, rootPath }),
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
            rootPath,
            _injectAuthenticationToken,
          }),
        );

        const response = await server.get('/');

        expect(_injectAuthenticationToken).not.toHaveBeenCalled();
        expect(response.text).toContain(JSON.stringify(content));
      });
    });
  });
});
