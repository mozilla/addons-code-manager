import log from 'loglevel';
import * as Sentry from '@sentry/browser';

import configureApplication, { ClientEnvVars } from './configureApplication';

describe(__filename, () => {
  const createFakeSentry = () => {
    return {
      ...Sentry,
      configureScope: jest.fn(),
      init: jest.fn(),
    };
  };

  describe('configureApplication', () => {
    it('sets the log level to DEBUG when not production', () => {
      const env = {
        NODE_ENV: 'development',
      };
      const _log = {
        ...log,
        setLevel: jest.fn(),
      };

      configureApplication({ _log, env: env as ClientEnvVars });

      expect(_log.setLevel).toHaveBeenCalledWith(log.levels.DEBUG, false);
    });

    it('sets the log level to INFO in production', () => {
      const env = {
        NODE_ENV: 'production',
      };
      const _log = {
        ...log,
        setLevel: jest.fn(),
      };

      configureApplication({ _log, env: env as ClientEnvVars });

      expect(_log.setLevel).toHaveBeenCalledWith(log.levels.INFO, false);
    });

    it('configures Sentry if a DSN is set', () => {
      const env = {
        REACT_APP_SENTRY_DSN: 'a-sentry-dsn',
      };
      const _Sentry = createFakeSentry();

      configureApplication({ _Sentry, env: env as ClientEnvVars });

      expect(_Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: env.REACT_APP_SENTRY_DSN,
        }),
      );
      expect(_Sentry.configureScope).toHaveBeenCalled();
    });

    it('does not configure Sentry when there is no DSN set', () => {
      const env = {};
      const _Sentry = createFakeSentry();

      configureApplication({ _Sentry, env: env as ClientEnvVars });

      expect(_Sentry.init).not.toHaveBeenCalled();
    });
  });
});
