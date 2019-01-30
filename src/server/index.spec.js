/* eslint amo/only-tsx-files: 0 */
import path from 'path';

import request from 'supertest';

import { createServer, injectAuthenticationToken } from '.';

describe(__filename, () => {
  describe('injectAuthenticationToken', () => {
    it('returns HTML with the token in it', () => {
      const token = '123';

      const req = {
        universalCookies: {
          get: () => token,
        },
      };
      const env = { REACT_APP_AUTH_TOKEN_PLACEHOLDER: '__PLACEHOLDER__' };
      const html = `<div data-token="${env.REACT_APP_AUTH_TOKEN_PLACEHOLDER}">`;

      const htmlWithToken = injectAuthenticationToken(req, html, env);

      expect(htmlWithToken).toEqual(`<div data-token="${token}">`);
    });

    it('avoids HTML injections', () => {
      const token = '<script>';

      const req = {
        universalCookies: {
          get: () => token,
        },
      };
      const env = { REACT_APP_AUTH_TOKEN_PLACEHOLDER: '__PLACEHOLDER__' };
      const html = `<div data-token="${env.REACT_APP_AUTH_TOKEN_PLACEHOLDER}">`;

      const htmlWithToken = injectAuthenticationToken(req, html, env);

      expect(htmlWithToken).toEqual(`<div data-token="\\u003cscript>">`);
    });
  });

  describe('createServer', () => {
    const rootPath = path.join(__dirname, 'fixtures');

    describe('NODE_ENV=production', () => {
      const env = {
        NODE_ENV: 'production',
      };

      it('creates an Express server', async () => {
        const server = request(createServer({ env, rootPath }));

        const response = await server.get('/');

        expect(response.text).toContain('It Works.');
        expect(response.header).toHaveProperty(
          'cache-control',
          'private, no-store',
        );
      });

      it('serves the index.html content to all routes', async () => {
        const server = request(createServer({ env, rootPath }));

        const response = await server.get('/foo-bar');

        expect(response.text).toContain('It Works.');
      });

      it('calls injectAuthenticationToken() and returns its output', async () => {
        const expectedHTML = 'content with auth token';

        const _injectAuthenticationToken = jest.fn();
        _injectAuthenticationToken.mockReturnValue(expectedHTML);

        const server = request(
          createServer({ env, rootPath, _injectAuthenticationToken }),
        );

        const response = await server.get('/');

        expect(_injectAuthenticationToken).toHaveBeenCalled();
        expect(response.text).toContain(expectedHTML);
      });
    });
  });
});
