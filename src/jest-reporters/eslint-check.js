/* eslint-disable no-console */
/* eslint-disable amo/only-tsx-files */
/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line import/no-extraneous-dependencies
const { ESLint } = require('eslint');

const { getChangedFiles } = require('./utils');

const NO_ESLINT_ENV_VAR = 'NO_ESLINT';

class EslintCheckReporter {
  constructor() {
    this.eslint = new ESLint();
    this.eslintOutput = null;
  }

  isDisabled() {
    return process.env[NO_ESLINT_ENV_VAR] === '1';
  }

  async onRunStart() {
    if (this.isDisabled()) {
      return;
    }
    const files = await getChangedFiles();

    if (!files) {
      throw new Error(`Failed to retrieve files in the eslint check reporter.`);
    }

    const results = await this.eslint.lintFiles(files);
    const errorCount = results.reduce((p, c) => p + c.errorCount, 0);
    const warningCount = results.reduce((p, c) => p + c.warningCount, 0);

    if (errorCount === 0 && warningCount === 0) {
      // All good.
      this.eslintOutput = null;
    } else {
      const formatter = await this.eslint.loadFormatter();
      this.eslintOutput = formatter.format(results);
    }
  }

  getLastError() {
    if (this.isDisabled()) {
      return undefined;
    }

    console.log('');
    if (this.eslintOutput) {
      console.log(this.eslintOutput);
      console.log(
        `Set ${NO_ESLINT_ENV_VAR}=1 in the environment to disable eslint checks`,
      );
      return new Error('eslint errors');
    }
    console.log('Eslint: no errors 💄 ✨');

    return undefined;
  }
}

module.exports = EslintCheckReporter;
