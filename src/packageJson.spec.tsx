import packageJson from '../package.json';

describe(__filename, () => {
  const skipDevDeps = [
    // There is a conflict between CRA and Storybook, see:
    // https://github.com/mozilla/addons-code-manager/issues/91
    'babel-loader',
    // Prettier recommends to pin the version to avoid unreviewed changes.
    'prettier',
    // See: https://github.com/mozilla/addons-code-manager/issues/339
    'babel-preset-react-app',
  ];

  it.each(Object.keys(packageJson.dependencies))(
    `should have dependencies[%s] version prefixed with a number`,
    (key: string) => {
      expect(packageJson.dependencies).toHaveProperty(
        [key],
        expect.stringMatching(/^\d/),
      );
    },
  );

  it.each(Object.keys(packageJson.devDependencies))(
    `should have devDependencies[%s] version prefixed with "^"`,
    (key: string) => {
      if (!skipDevDeps.includes(key)) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(packageJson.devDependencies).toHaveProperty(
          [key],
          expect.stringMatching(/^(\^|git)/),
        );
      }
    },
  );
});
