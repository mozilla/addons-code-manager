import log from 'loglevel';
import Raven from 'raven-js';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';

export type ClientEnvVars = {
  NODE_ENV: string;
  REACT_APP_SENTRY_DSN: string;
};

type ConfigureApplicationParams = {
  _Raven?: typeof Raven;
  _log?: typeof log;
  env?: ClientEnvVars;
};

const configureApplication = ({
  _Raven = Raven,
  _log = log,
  env = (process.env as any) as ClientEnvVars,
}: ConfigureApplicationParams = {}) => {
  if (env.NODE_ENV === 'production') {
    // The second parameter prevents the log level to be persisted in a cookie
    // or localStorage.
    _log.setLevel(log.levels.INFO, false);
  } else {
    _log.setLevel(log.levels.DEBUG, false);
  }

  if (env.REACT_APP_SENTRY_DSN) {
    _Raven
      .config(env.REACT_APP_SENTRY_DSN, {
        logger: 'client',
      })
      .install();
  }

  // Import all the "free solid FontAwesome" icons
  library.add(fas);
};

export default configureApplication;
