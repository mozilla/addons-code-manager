const path = require('path');

const chalk = require('chalk');

const { createServer } = require('../src/server');

// Load environment configuration.
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
require('react-scripts/config/env');

const app = createServer({
  env: process.env,
  rootPath: path.join(__dirname, '..'),
});

app.listen(app.get('port'), () => {
  if (process.env.NODE_ENV === 'production') {
    console.log(
      'The node server is listening on port %d in %s mode',
      app.get('port'),
      app.get('env'),
    );
  } else {
    console.log('\n' + '#'.repeat(70) + '\n');
    console.log(chalk.green('  MOZILLA/ADDONS-CODE-MANAGER\n'));
    console.log(
      `  This project is running at ${chalk.yellow(
        'http://localhost:%d/',
      )} in %s`,
      app.get('port'),
      app.get('env'),
    );
    console.log(
      '  mode, please use this URL and not the URL given by Create React',
    );
    console.log(
      `  App (below). ${chalk.yellow('You must use port %d')} (and not ${
        process.env.REACT_APP_CRA_PORT
      }).`,
      app.get('port'),
    );
    console.log('');
    console.log('  Press CTRL-c to stop');
    console.log('  Press CTRL-a-? for stmux help');
    console.log('\n' + '#'.repeat(70) + '\n');
  }
});
