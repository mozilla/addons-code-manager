import log from 'loglevel';
import Raven from 'raven-js';

import configureApplication, { ClientEnvVars } from './configureApplication';

describe(__filename, () => {
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
      const _Raven = {
        ...Raven,
        config: jest.fn().mockReturnThis(),
        install: jest.fn(),
      };

      configureApplication({ _Raven, env: env as ClientEnvVars });

      expect(_Raven.config).toHaveBeenCalledWith(env.REACT_APP_SENTRY_DSN, {
        logger: 'client',
      });
      expect(_Raven.install).toHaveBeenCalled();
    });

    it('does not configure Sentry when there is no DSN set', () => {
      const env = {};
      const _Raven = {
        ...Raven,
        config: jest.fn().mockReturnThis(),
        install: jest.fn(),
      };

      configureApplication({ _Raven, env: env as ClientEnvVars });

      expect(_Raven.config).not.toHaveBeenCalled();
      expect(_Raven.install).not.toHaveBeenCalled();
    });
  });
});
