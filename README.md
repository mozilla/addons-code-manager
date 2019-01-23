# addons-code-manager

This is a web application to manage add-on source code, such as reviewing code for add-ons submitted to https://addons.mozilla.org

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Requirements

- You need [Node](https://nodejs.org/) 8 which is the current [LTS](https://github.com/nodejs/LTS) (long term support) release.
- You need [yarn](https://yarnpkg.com/en/) to manage dependencies and run commands.

## Getting started

- Type `yarn` to install everything
- Type `yarn start` to launch a development server
- Type `yarn test` to launch the interactive test suite

All available commands are documented below.

## Prettier

We use [Prettier][] to automatically format our JavaScript code and stop all the on-going debates over styles. As a developer, you have to run it (with `yarn prettier-dev`) before submitting a Pull Request.

## TypeScript

All code is written in [TypeScript][]. Currently, errors in test files won't be reported until you try to submit a pull request. Because of this, consider [configuring your editor](https://github.com/Microsoft/TypeScript/wiki/TypeScript-Editor-Support) for error reporting.

## SASS

All CSS is written with the [SASS](https://sass-lang.com/) pre-processor.

## Available Commands

In the project directory, you can run the following commands. There are a few commands not mentioned here (see `package.json`) but those are only used by internal processes.

### `yarn build`

This builds the app for production to the `build` folder.

It correctly bundles React in production mode and optimizes the build for the best performance. The build is minified and the filenames include the hashes. Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `yarn eject`

This runs the [eject](https://facebook.github.io/create-react-app/docs/available-scripts#npm-run-eject) command. Hopefully we won't ever need this 😭

### `yarn prettier`

This runs [Prettier][] to automatically format the entire codebase.

### `yarn prettier-dev`

This runs [Prettier][] on only your changed files. This is intended for development.

### `yarn start`

This runs the app in the development mode.

Open [http://localhost:3000](http://localhost:3000) to view it in the browser. The page will reload if you make edits. You will also see any lint errors in the console.

### `yarn test`

This launches [Jest](https://jestjs.io/) in the interactive watch mode.

See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn type-coverage`

This will check how much of the codebase is protect by safe static types and fail if it's below the configured threshold.

### `yarn typecheck`

This checks for [TypeScript][] errors in all files, including test files.

You'd think that `build` does this but it does not check test files. See [create-react-app issue 5626](https://github.com/facebook/create-react-app/issues/5626).

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

[prettier]: https://prettier.io/
[typescript]: https://www.typescriptlang.org/
