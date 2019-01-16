# addons-code-manager

This is a web application to manage add-on source code, such as reviewing code for add-ons submitted to https://addons.mozilla.org

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Requirements

- You need [Node](https://nodejs.org/) 8 which is the current [LTS](https://github.com/nodejs/LTS) (long term support) release.
- You need [yarn](https://yarnpkg.com/en/) to manage dependencies and run commands.

## Getting started

- type `yarn` to install everything
- type `yarn start` to launch a development server

More commands are documented below.

## Available Commands

In the project directory, you can run:

### `yarn start`

This runs the app in the development mode.

Open [http://localhost:3000](http://localhost:3000) to view it in the browser. The page will reload if you make edits. You will also see any lint errors in the console.

### `yarn test`

This launches the test runner in the interactive watch mode.

See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn build`

This builds the app for production to the `build` folder.

It correctly bundles React in production mode and optimizes the build for the best performance. The build is minified and the filenames include the hashes. Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `yarn typecheck`

This checks for TypeScript errors in all files, including test files.

You'd think that `build` does this but it does not check test files.
See [create-react-app issue 6170](https://github.com/facebook/create-react-app/issues/6170).

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
