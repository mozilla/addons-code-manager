import log from 'loglevel';
import { config, library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import '@fortawesome/fontawesome-svg-core/styles.css';
// This is a polyfill.
import 'focus-visible';

export type ClientEnvVars = {
  NODE_ENV: string;
};

type ConfigureApplicationParams = {
  _log?: typeof log;
  env?: ClientEnvVars;
};

const configureApplication = ({
  _log = log,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  env = process.env as any as ClientEnvVars,
}: ConfigureApplicationParams = {}) => {
  if (env.NODE_ENV === 'production') {
    // The second parameter prevents the log level to be persisted in a cookie
    // or localStorage.
    _log.setLevel(log.levels.INFO, false);
  } else {
    _log.setLevel(log.levels.DEBUG, false);
  }

  // Turn off inline CSS injection for CSP. Must be before all other
  // fontawesome API calls.
  config.autoAddCss = false;

  // Import all the FontAwesome icons.
  library.add(fas, far);
};

export default configureApplication;
