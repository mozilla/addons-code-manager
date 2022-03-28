import log from 'loglevel';

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
  });
});
