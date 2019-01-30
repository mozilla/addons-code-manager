import packageJson from '../package.json';

type KeyValue = { [key: string]: string };

describe(__filename, () => {
  const skipDevDeps = ['prettier'];

  Object.keys(packageJson.devDependencies).forEach((key) => {
    it(`should have devDependencies[${key}] version prefixed with "^"`, () => {
      if (!skipDevDeps.includes(key)) {
        expect((packageJson.devDependencies as KeyValue)[key]).toEqual(
          expect.stringMatching(/^(\^|git)/),
        );
      }
    });
  });

  Object.keys(packageJson.dependencies).forEach((key) => {
    it(`should have dependencies[${key}] version prefixed with a number`, () => {
      expect((packageJson.dependencies as KeyValue)[key]).toEqual(
        expect.stringMatching(/^\d/),
      );
    });
  });
});
