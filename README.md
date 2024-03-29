# addons-code-manager

[![CircleCI](https://circleci.com/gh/mozilla/addons-code-manager.svg?style=svg)](https://circleci.com/gh/mozilla/addons-code-manager) [![codecov](https://codecov.io/gh/mozilla/addons-code-manager/branch/master/graph/badge.svg)](https://codecov.io/gh/mozilla/addons-code-manager)

This is a web application to manage add-on source code, such as reviewing code for add-ons submitted to https://addons.mozilla.org. This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Requirements

- You need [Node](https://nodejs.org/) 16 which is the current [LTS](https://github.com/nodejs/LTS) (long term support) release.
- You need [yarn](https://yarnpkg.com/en/) to manage dependencies and run commands.

## Getting started

- Clone this repository
- Type `yarn` to install everything
- Type `yarn dev` to launch the test suite, development servers, and all other development processes in [stmux][]. Open [http://localhost:3000](http://localhost:3000) to view the development site. **Press CTRL-a-? for help**.

All available commands are documented below.

Read [our contributing guidelines](.github/CONTRIBUTING.md) to get started on your first patch.

## Prettier

We use [Prettier][] to automatically format our JavaScript code and stop all the on-going debates over styles. As a developer, you have to run it (with `yarn prettier-dev`) before submitting a Pull Request.

## TypeScript

All code is written in [TypeScript][]. Currently, errors in test files won't be reported until you try to submit a pull request. Because of this, consider [configuring your editor](https://github.com/Microsoft/TypeScript/wiki/TypeScript-Editor-Support) for error reporting.

## CSS

All styles are written in the [SASS](https://sass-lang.com/) pre-processor language as [css modules](https://github.com/css-modules/css-modules).

Example: for a component like `StarIcon/index.tsx`, you'd create its module as `StarIcon/styles.module.scss`. You would import it at the top and reference it as a module. As an example, here is a simple stylesheet:

```css
.container {
  padding: 12px;
}
```

You would reference this CSS class in your component like this:

```js
import * as React from 'react';

import styles from './styles.module.scss';

const StarIcon = () => {
  return <div className={styles.container} />;
};

export default StarIcon;
```

## Storybook

We use [storybook](https://storybook.js.org/) to visualize the look and feel of our React components. Our Storybook is deployed on GitHub Pages: https://mozilla.github.io/addons-code-manager/.

Launch the development server like this:

```
yarn storybook
```

When developing a new component, always add a story for it. If you were creating a component like `src/components/StarIcon/index.tsx` then you'd put its story in `stories/StarIcon.stories.tsx`. The storybook server will automatically load files having the `.stories.tsx` suffix in this directory.

To update our Storybook, checkout `gh-pages` branch, run `yarn storybook-build`, commit and push the result to that branch.

## Configuration

You can configure the app by defining environment variables in `.env` files, the standard way to [configure Create React App](https://facebook.github.io/create-react-app/docs/adding-custom-environment-variables#adding-development-environment-variables-in-env), but read on below because **there are some differences**.

- How to override an environment variable for local development
  - Define it in `.env.common-local`. **This differs** from how Create React App wants you to do it. If you put an environment variable in `.env.local`, it will get erased because we are generating this file when the app starts.
- How to define a new environment variable
  - Add it to `.env` with the `REACT_APP_` prefix.
- How to override an environment variable for a hosted site
  - Define the variable in the [corresponding puppet config file](https://github.com/mozilla-services/cloudops-deployment/tree/master/projects/addons-code-manager/puppet/yaml/type). To define a variable for `code.addons-dev.allizom.org`, for example, you'd update `amo.code_manager.dev.yaml`. Adding a variable to `.env.dev` **will do nothing** since that only affects the `yarn dev` command.

## Profiling performance

Here are some tips for solving performance problems in addition to what's already in the [official docs](https://reactjs.org/docs/optimizing-performance.html).

- First, ask yourself if there is a real performance problem. If you need to simulate a slow CPU in the profiler just to see anything dramatic, it might be too early to start profiling!
- Try to profile against a production build, if possible, with something like `yarn start-local-dev`. The overhead of a development build could be misleading.
- If you want to see execution timing grouped by React component, you will need a development build.
- Use Chrome so you can get React integration, if needed. This is a [helpful guide](https://calibreapp.com/blog/react-performance-profiling-optimization/) for looking at the execution of React components in the _User Timing_ section.
- When a React component is taking a long time to render and you don't see any other components underneath it, it's time to switch away from the _User Timing_ tab of the profiler to the _Main_ tab so you can look at actual function executions. Clicking on a function will give you information about its source.
- You can try using the [React devtool extension](https://reactjs.org/docs/optimizing-performance.html#profiling-components-with-the-devtools-profiler) for profiling but it doesn't provide a great timeline so it's hard to visualize overall slowness.

## Setting up VSCode

If you want to use [VSCode](https://code.visualstudio.com/) to develop Code Manager, some manual configuration is required. This is due to a [security ~~feature~~ bug](https://github.com/microsoft/vscode/issues/30069#issuecomment-312732928) that prevents automatically applying a local config file.

- Make sure you've installed all dependencies as documented.
- Open the root folder in VSCode.
- Open any TypeScript file and click the TypeScript version number from the bottom status bar. Choose the option _Use Workspace Version_ to make sure you are developing with the correct version of TypeScript.

## All Available Commands

In the project directory, you can run the following commands. There are a few commands not mentioned here (see `package.json`) but those are only used by internal processes.

### `yarn build`

This builds the app for production to the `build` folder.

It correctly bundles React in production mode and optimizes the build for the best performance. The build is minified and the filenames include the hashes. Your app is ready to be deployed!

Note: for this project, we use a node server (see `scripts/server.js`).

### `yarn dev`

This runs all development processes in a single column using [stmux][]. Open [http://localhost:3000](http://localhost:3000) to view the development site. **Press CTRL-a-? for help**.

### `yarn dev-2col`

This runs all development processes in two columns using [stmux][]. Open [http://localhost:3000](http://localhost:3000) to view the development site. **Press CTRL-a-? for help**.

### `yarn dev-servers`

This starts all development servers using [stmux][], connected to the [-dev AMO API](https://addons-server.readthedocs.io/).

Open [http://localhost:3000](http://localhost:3000) to view it in the browser. **Press CTRL-a-? for help**.

### `yarn eject`

This runs the [eject](https://facebook.github.io/create-react-app/docs/available-scripts#npm-run-eject) command. Hopefully we won't ever need this 😭

### `yarn eslint`

This runs [ESLint][] to discover problems within our codebase without executing it. ESLint also enforces some patterns and practices.

### `yarn lint`

This runs all the _lint_ commands at once.

### `yarn olympia`

A prerequisite to run this command is to [install addons-server locally](https://addons-server.readthedocs.io/en/latest/topics/install/index.html).

This runs all development processes in a single column using [stmux][]. Open [http://olympia.test:5000](http://olympia.test:5000) to view the development site. **Press CTRL-a-? for help**. The application is configured to use a [local AMO API](https://addons-server.readthedocs.io/).

Known issue: it is possible to login/logout but the login process will redirect you to the AMO frontend (http://olympia.test) instead of http://olympia.test:5000. You will have to manually go to code-manager, after that there should be no other authentication problem.

### `yarn prettier`

This runs [Prettier][] to automatically format the entire codebase.

### `yarn prettier-dev`

This runs [Prettier][] on only your changed files. This is intended for development.

### `yarn stage`

This runs all development processes in a single column using [stmux][]. Open [http://localhost:3000](http://localhost:3000) to view the development site. **Press CTRL-a-? for help**. The application is configured to use the [stage AMO API](https://addons-server.readthedocs.io/).

### `yarn start-local-dev`

This builds the app for production to the `build` folder (see `yarn build` command), configured with the [-dev AMO API](https://addons-server.readthedocs.io/). It also starts a production server that serves the application (configured for local usage).

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `yarn start-local-prod`

This builds the app for production to the `build` folder (see `yarn build` command), configured with the [production AMO API](https://addons-server.readthedocs.io/). It also starts a production server that serves the application (configured for local usage).

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

:warning: It is currently not possible to authenticate users.

### `yarn start-local-stage`

This builds the app for production to the `build` folder (see `yarn build` command), configured with the [stage AMO API](https://addons-server.readthedocs.io/). It also starts a production server that serves the application (configured for local usage).

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

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
[stmux]: https://github.com/rse/stmux
[eslint]: https://eslint.org/
