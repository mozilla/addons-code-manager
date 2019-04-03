import configureStore from './configureStore';

describe(__filename, () => {
  it('registers all the reducers', () => {
    const store = configureStore();

    expect(Object.keys(store.getState())).toEqual([
      'api',
      'errors',
      'fileTree',
      'linter',
      'users',
      'versions',
    ]);
  });
});
