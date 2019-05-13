import { History } from 'history';
import queryString from 'query-string';
import * as React from 'react';
import { Store } from 'redux';

import configureStore from '../../configureStore';
import {
  actions as fileTreeActions,
  RelativePathPosition,
} from '../../reducers/fileTree';
import {
  actions as versionsActions,
  createInternalVersion,
  getCompareInfo,
  CompareInfo,
} from '../../reducers/versions';
import {
  CreateKeydownEventParams,
  createContextWithFakeRouter,
  createKeydownEvent,
  createFakeHistory,
  createFakeLocation,
  createFakeThunk,
  fakeVersion,
  fakeVersionEntry,
  fakeVersionWithDiff,
  shallowUntilTarget,
  spyOn,
} from '../../test-helpers';
import styles from './styles.module.scss';

import KeyboardShortcuts, {
  DefaultProps,
  PublicProps,
  KeyboardShortcutsBase,
} from '.';

describe(__filename, () => {
  type GetRouteParamsParams = {
    addonId?: number;
    baseVersionId?: number;
    headVersionId?: number;
  };

  const getRouteParams = ({
    addonId = 9999,
    baseVersionId = 1,
    headVersionId = 1000,
  }: GetRouteParamsParams = {}) => {
    return {
      addonId: String(addonId),
      baseVersionId: String(baseVersionId),
      headVersionId: String(headVersionId),
    };
  };

  const createFakeRouteComponentProps = ({
    history = createFakeHistory(),
    params = getRouteParams(),
  } = {}) => {
    return {
      history,
      location: history.location,
      match: {
        params,
        isExact: true,
        path: '/some-path',
        url: '/some-url',
      },
    };
  };

  type RenderParams = {
    addonId?: string;
    baseVersionId?: string;
    headVersionId?: string;
    history?: History;
    store?: Store;
  } & Partial<PublicProps & DefaultProps>;

  const configureStoreWithFileTree = ({
    pathList = ['file1.js'],
    store = configureStore(),
    versionId = 321,
  } = {}) => {
    store.dispatch(
      fileTreeActions.buildTree({
        version: createInternalVersion({
          ...fakeVersion,
          id: versionId,
          file: {
            ...fakeVersion.file,
            entries: pathList.reduce((pathMap, path: string) => {
              return {
                ...pathMap,
                [path]: {
                  ...fakeVersionEntry,
                  filename: path,
                  path,
                },
              };
            }, {}),
          },
        }),
      }),
    );

    return store;
  };

  const render = ({
    addonId = '999',
    baseVersionId = '1',
    currentPath = 'file1.js',
    headVersionId = '2',
    history = createFakeHistory(),
    store,
    versionId = 1235,
    ...moreProps
  }: RenderParams = {}) => {
    const props = {
      ...createFakeRouteComponentProps({
        history,
        params: { addonId, baseVersionId, headVersionId },
      }),
      currentPath,
      versionId,
      ...moreProps,
    };

    const contextWithRouter = createContextWithFakeRouter({
      history,
      match: props.match,
    });
    const context = {
      ...contextWithRouter,
      context: {
        ...contextWithRouter.context,
        store: store || configureStoreWithFileTree({ versionId }),
      },
    };

    return shallowUntilTarget(
      <KeyboardShortcuts {...props} />,
      KeyboardShortcutsBase,
      {
        shallowOptions: { ...context },
      },
    );
  };

  const renderAndTriggerKeyEvent = (
    eventProps: CreateKeydownEventParams = { key: '' },
    renderProps: Partial<RenderParams>,
  ) => {
    const root = render(renderProps);

    const { keydownListener } = root.instance() as KeyboardShortcutsBase;

    const event = createKeydownEvent(eventProps);

    keydownListener(event);
  };

  it('renders a list of keyboard shortcuts', () => {
    const root = render();

    expect(root.find(`.${styles.KeyboardShortcuts}`)).toHaveLength(1);
  });

  it('binds and unbinds keydown to the listener', () => {
    const createFakeDocument = (): Partial<Document> => {
      return {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
    };
    const _document = createFakeDocument() as Document;

    const root = render({ _document });
    const { keydownListener } = root.instance() as KeyboardShortcutsBase;

    expect(_document.addEventListener).toHaveBeenCalledWith(
      'keydown',
      keydownListener,
    );

    root.unmount();

    expect(_document.removeEventListener).toHaveBeenCalledWith(
      'keydown',
      keydownListener,
    );
  });

  it.each([
    ['previous', 'k', RelativePathPosition.previous],
    ['next', 'j', RelativePathPosition.next],
  ])(
    'dispatches goToRelativeFile with %s when "%s" is pressed',
    (direction, key, position) => {
      const currentPath = 'file1.js';
      const pathList = [currentPath];
      const versionId = 123;

      const store = configureStoreWithFileTree({ versionId, pathList });
      const dispatch = spyOn(store, 'dispatch');
      const fakeThunk = createFakeThunk();
      const _goToRelativeFile = fakeThunk.createThunk;

      renderAndTriggerKeyEvent(
        { key: key as string },
        {
          _goToRelativeFile,
          currentPath,
          store,
          versionId,
        },
      );

      expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
      expect(_goToRelativeFile).toHaveBeenCalledWith({
        currentPath,
        pathList,
        position,
        versionId,
      });
    },
  );

  it.each([
    ['previous', 'p', RelativePathPosition.previous],
    ['next', 'n', RelativePathPosition.next],
  ])(
    'dispatches goToRelativeDiff with %s when "%s" is pressed',
    (direction, key, position) => {
      const addonId = 1;
      const baseVersionId = 2;
      const currentPath = fakeVersionWithDiff.file.selected_file;
      const hash = '#D1';
      const headVersionId = 3;
      const pathList = [currentPath];
      const versionId = headVersionId;
      const version = {
        ...fakeVersionWithDiff,
        id: headVersionId,
        file: {
          ...fakeVersionWithDiff.file,
          // eslint-disable-next-line @typescript-eslint/camelcase
          selected_file: currentPath,
        },
      };
      const history = createFakeHistory({
        location: createFakeLocation({
          search: queryString.stringify({ path: currentPath }),
          hash,
        }),
      });

      const store = configureStoreWithFileTree({ versionId, pathList });
      store.dispatch(versionsActions.loadVersionInfo({ version }));
      store.dispatch(
        versionsActions.loadDiff({
          addonId,
          baseVersionId,
          headVersionId,
          path: currentPath,
          version,
        }),
      );

      const compareInfo = getCompareInfo(
        store.getState().versions,
        addonId,
        baseVersionId,
        headVersionId,
        currentPath,
      ) as CompareInfo;

      const dispatch = spyOn(store, 'dispatch');
      const fakeThunk = createFakeThunk();
      const _goToRelativeDiff = fakeThunk.createThunk;

      renderAndTriggerKeyEvent(
        { key: key as string },
        {
          _goToRelativeDiff,
          ...getRouteParams({
            addonId,
            baseVersionId,
            headVersionId,
          }),
          currentPath,
          history,
          store,
          versionId,
        },
      );

      expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
      expect(_goToRelativeDiff).toHaveBeenCalledWith({
        currentAnchor: hash.replace(/^#/, ''),
        diff: compareInfo.diff,
        pathList,
        position,
        versionId,
      });
    },
  );

  it.each(['p', 'n'])(
    'does not dispatch goToRelativeDiff when "%s" is pressed if expected match params are not present',
    (key) => {
      const addonId = 1;
      const baseVersionId = 2;
      const currentPath = fakeVersionWithDiff.file.selected_file;
      const headVersionId = 3;
      const pathList = [currentPath];
      const versionId = headVersionId;
      const version = {
        ...fakeVersionWithDiff,
        id: headVersionId,
        file: {
          ...fakeVersionWithDiff.file,
          // eslint-disable-next-line @typescript-eslint/camelcase
          selected_file: currentPath,
        },
      };
      const history = createFakeHistory({
        location: createFakeLocation({
          search: queryString.stringify({ path: currentPath }),
        }),
      });

      const store = configureStoreWithFileTree({ versionId, pathList });
      store.dispatch(versionsActions.loadVersionInfo({ version }));
      store.dispatch(
        versionsActions.loadDiff({
          addonId,
          baseVersionId,
          headVersionId,
          path: currentPath,
          version,
        }),
      );

      const dispatch = spyOn(store, 'dispatch');
      const fakeThunk = createFakeThunk();
      const _goToRelativeDiff = fakeThunk.createThunk;

      renderAndTriggerKeyEvent(
        { key: key as string },
        {
          _goToRelativeDiff,
          addonId: undefined,
          baseVersionId: undefined,
          currentPath,
          headVersionId: undefined,
          history,
          store,
          versionId,
        },
      );

      expect(dispatch).not.toHaveBeenCalledWith(fakeThunk.thunk);
    },
  );

  it.each(['p', 'n'])(
    'does not dispatch goToRelativeDiff when "%s" is pressed if the diff is not loaded',
    (key) => {
      const addonId = 1;
      const baseVersionId = 2;
      const currentPath = fakeVersionWithDiff.file.selected_file;
      const headVersionId = 3;
      const pathList = [currentPath];
      const versionId = headVersionId;
      const version = {
        ...fakeVersionWithDiff,
        id: headVersionId,
        file: {
          ...fakeVersionWithDiff.file,
          // eslint-disable-next-line @typescript-eslint/camelcase
          selected_file: currentPath,
        },
      };
      const history = createFakeHistory({
        location: createFakeLocation({
          search: queryString.stringify({ path: currentPath }),
        }),
      });

      const store = configureStoreWithFileTree({ versionId, pathList });
      store.dispatch(versionsActions.loadVersionInfo({ version }));
      store.dispatch(
        versionsActions.loadDiff({
          // Load a diff that does not match the match params.
          addonId: addonId + 1,
          baseVersionId,
          headVersionId,
          path: currentPath,
          version,
        }),
      );

      const dispatch = spyOn(store, 'dispatch');
      const fakeThunk = createFakeThunk();
      const _goToRelativeDiff = fakeThunk.createThunk;

      renderAndTriggerKeyEvent(
        { key: key as string },
        {
          _goToRelativeDiff,
          ...getRouteParams({
            addonId,
            baseVersionId,
            headVersionId,
          }),
          currentPath,
          history,
          store,
          versionId,
        },
      );

      expect(dispatch).not.toHaveBeenCalledWith(fakeThunk.thunk);
    },
  );

  it.each(['e', 'o'])('dispatches expandTree when "%s" is pressed', (key) => {
    const versionId = 123;

    const store = configureStoreWithFileTree({ versionId });
    const dispatch = spyOn(store, 'dispatch');

    renderAndTriggerKeyEvent({ key: key as string }, { store, versionId });

    expect(dispatch).toHaveBeenCalledWith(
      versionsActions.expandTree({ versionId }),
    );
  });

  it('dispatches collapseTree when "c" is pressed', () => {
    const versionId = 723;

    const store = configureStoreWithFileTree({ versionId });
    const dispatch = spyOn(store, 'dispatch');

    renderAndTriggerKeyEvent({ key: 'c' }, { store, versionId });

    expect(dispatch).toHaveBeenCalledWith(
      versionsActions.collapseTree({ versionId }),
    );
  });

  it('does not listen to keyboard events without a file tree', () => {
    // Configure an empty store, one without a file tree loaded.
    const store = configureStore();
    const dispatch = spyOn(store, 'dispatch');

    renderAndTriggerKeyEvent({ key: 'c' }, { store });

    expect(dispatch).not.toHaveBeenCalled();
  });

  it.each(['altKey', 'ctrlKey', 'metaKey', 'shiftKey'])(
    'does not dispatch when %s modifies the key',
    (modifierKey) => {
      const versionId = 432;
      const store = configureStoreWithFileTree({ versionId });
      const dispatch = spyOn(store, 'dispatch');

      renderAndTriggerKeyEvent(
        { key: 'k', [modifierKey]: true },
        { versionId, store },
      );

      expect(dispatch).not.toHaveBeenCalled();
    },
  );
});
