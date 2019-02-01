import path from 'path';
import chalk from 'chalk';

import { ServerEnvVars, createServer } from '../src/server';

// Load environment configuration.
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
require('react-scripts/config/env');

const app = createServer({
  // This is risky but also expected because `process.env` is only defined at
  // runtime.
  env: (process.env as any) as ServerEnvVars,
  rootPath: path.join(__dirname, '..'),
});

const printDivider = () => {
  console.log('\n' + '#'.repeat(60) + '\n');
};

app.listen(app.get('port'), () => {
  if (process.env.NODE_ENV === 'production') {
    console.log(
      'The node server is listening on port %d in %s mode',
      app.get('port'),
      app.get('env'),
    );
  } else {
    printDivider();
    console.log(chalk.green('  MOZILLA/ADDONS-CODE-MANAGER\n'));
    console.log(
      `  This project is running at ${chalk.yellow('http://localhost:%d/')}`,
      app.get('port'),
    );
    console.log(
      '  in %s mode. Please use this URL and not the URL ',
      app.get('env'),
    );
    console.log(
      `  given by Create React App. ${chalk.yellow(
        'You must use port %d',
      )}, not ${process.env.REACT_APP_CRA_PORT}.`,
      app.get('port'),
    );
    console.log('');
    console.log('  Press CTRL-c to stop');
    console.log('  Press CTRL-a-? for stmux help');
    printDivider();
  }
});
