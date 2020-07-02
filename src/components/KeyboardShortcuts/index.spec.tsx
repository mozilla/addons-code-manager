import { Location } from 'history';
import queryString from 'query-string';
import * as React from 'react';
import { Store } from 'redux';

import configureStore from '../../configureStore';
import {
  actions as fileTreeActions,
  RelativePathPosition,
} from '../../reducers/fileTree';
import { getMessageMap } from '../../reducers/linter';
import {
  actions as versionsActions,
  createInternalVersion,
  createInternalVersionFile,
  VersionFileWithContent,
  VersionFileWithDiff,
} from '../../reducers/versions';
import { actions as fullscreenGridActions } from '../../reducers/fullscreenGrid';
import {
  CreateKeydownEventParams,
  createContextWithFakeRouter,
  createKeydownEvent,
  createFakeExternalLinterResult,
  createFakeLocation,
  createFakeThunk,
  createStoreWithVersion,
  fakeAction,
  fakeExternalLinterMessage,
  fakeVersionFileWithContent,
  fakeVersionFileWithDiff,
  fakeVersionWithContent,
  fakeVersionEntry,
  fakeVersionWithDiff,
  getInstance,
  nextUniqueId,
  shallowUntilTarget,
  spyOn,
} from '../../test-helpers';
import styles from './styles.module.scss';

import KeyboardShortcuts, {
  DefaultProps,
  PublicProps,
  KeyboardShortcutsBase,
  supportedKeys,
} from '.';

describe(__filename, () => {
  type RenderParams = {
    location?: Location<{}>;
    store?: Store;
  } & Partial<PublicProps & DefaultProps>;

  const configureStoreWithFileTree = ({
    pathList = ['file1.js'],
    versionId = 321,
    externalVersion = {
      ...fakeVersionWithContent,
      id: versionId,
      file: {
        ...fakeVersionWithContent.file,
      },
      // eslint-disable-next-line @typescript-eslint/camelcase
      file_entries: pathList.reduce((pathMap, path: string) => {
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
    store = createStoreWithVersion({ version: externalVersion }),
  }: {
    pathList?: string[];
    versionId?: number;
    externalVersion?: typeof fakeVersionWithContent;
    store?: Store;
  } = {}) => {
    store.dispatch(
      fileTreeActions.buildTree({
        comparedToVersionId: null,
        version: createInternalVersion(externalVersion),
      }),
    );

    return store;
  };

  const render = ({
    _createCodeLineAnchorGetter = jest.fn(),
    _goToRelativeDiff = jest.fn(),
    _goToRelativeFile = jest.fn().mockReturnValue(fakeAction),
    _goToRelativeMessage = jest.fn().mockReturnValue(fakeAction),
    comparedToVersionId = 1,
    currentPath = 'file1.js',
    file = null,
    location = createFakeLocation(),
    messageMap = getMessageMap(
      createFakeExternalLinterResult({ messages: [fakeExternalLinterMessage] }),
    ),
    store,
    versionId = 1235,
    ...moreProps
  }: RenderParams = {}) => {
    const props = {
      _createCodeLineAnchorGetter,
      _goToRelativeDiff,
      _goToRelativeFile,
      _goToRelativeMessage,
      comparedToVersionId,
      currentPath,
      file,
      location,
      messageMap,
      versionId,
      ...moreProps,
    };

    const contextWithRouter = createContextWithFakeRouter({ location });
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
    { event = createKeydownEvent(eventProps) } = {},
  ) => {
    const root = render(renderProps);

    const { keydownListener } = getInstance<KeyboardShortcutsBase>(root);

    keydownListener(event);
  };

  it('renders a list of keyboard shortcuts', () => {
    const root = render();

    expect(root.find(`.${styles.KeyboardShortcuts}`)).toHaveLength(1);
  });

  it('does not render a description for alias keys', () => {
    const root = render();

    const aliasKeys = Object.keys(supportedKeys).filter(
      (key) => supportedKeys[key] === null,
    );

    for (const key of aliasKeys) {
      // The expression below will look for any JSX rendered with an alias key,
      // such as a <kbd> tag.
      expect(root.find({ children: key })).toHaveLength(0);
    }
  });

  it('renders one line descriptions for keys "p"/"n" and "k"/"j" in Browse', () => {
    const root = render({
      file: createInternalVersionFile(
        fakeVersionFileWithContent,
      ) as VersionFileWithContent,
    });

    expect(root.find(`dt.${styles.hasAlias}`)).toHaveLength(2);
    expect(root.find(`dd.${styles.hasAlias}`)).toHaveLength(2);

    expect(root.find(`dt.${styles.hasAlias}`).at(0)).toHaveText('k or p');
    expect(root.find(`dt.${styles.hasAlias}`).at(1)).toHaveText('j or n');
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
    const { keydownListener } = getInstance<KeyboardShortcutsBase>(root);

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

  it('generates a getCodeLineAnchor function using _createCodeLineAnchorGetter', () => {
    const file = createInternalVersionFile(
      fakeVersionFileWithContent,
    ) as VersionFileWithContent;

    const _createCodeLineAnchorGetter = jest.fn();

    renderAndTriggerKeyEvent(
      { key: Object.keys(supportedKeys)[0] },
      {
        _createCodeLineAnchorGetter,
        file,
      },
    );

    expect(_createCodeLineAnchorGetter).toHaveBeenCalledWith(file);
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
      const currentPath = fakeVersionWithDiff.file.selected_file;
      const hash = '#D1';
      const pathList = [currentPath];
      const versionId = 123;
      const comparedToVersionId = 11;
      const file = createInternalVersionFile(
        fakeVersionFileWithDiff,
      ) as VersionFileWithDiff;
      const location = createFakeLocation({
        search: queryString.stringify({ path: currentPath }),
        hash,
      });

      const store = configureStoreWithFileTree({ versionId, pathList });

      const dispatch = spyOn(store, 'dispatch');
      const fakeThunk = createFakeThunk();
      const _goToRelativeDiff = fakeThunk.createThunk;

      renderAndTriggerKeyEvent(
        { key: key as string },
        {
          _goToRelativeDiff,
          currentPath,
          file,
          location,
          store,
          versionId,
          comparedToVersionId,
        },
      );

      expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
      expect(_goToRelativeDiff).toHaveBeenCalledWith({
        currentAnchor: hash.replace(/^#/, ''),
        diff: file.diff,
        pathList,
        position,
        versionId,
        comparedToVersionId,
      });
    },
  );

  it.each([
    ['previous', 'p', RelativePathPosition.previous],
    ['next', 'n', RelativePathPosition.next],
  ])(
    'only dispatches goToRelativeFile with %s when "%s" is pressed when in browse mode',
    (direction, key, position) => {
      const currentPath = 'file1.js';
      const pathList = [currentPath];
      const versionId = nextUniqueId();

      const store = configureStoreWithFileTree({ versionId, pathList });
      const dispatch = spyOn(store, 'dispatch');
      const fakeThunk = createFakeThunk();
      const _goToRelativeFile = fakeThunk.createThunk;

      renderAndTriggerKeyEvent(
        { key: key as string },
        {
          _goToRelativeFile,
          file: createInternalVersionFile(
            fakeVersionFileWithContent,
          ) as VersionFileWithContent,
          currentPath,
          store,
          versionId,
        },
      );

      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
      expect(_goToRelativeFile).toHaveBeenCalledWith({
        currentPath,
        pathList,
        position,
        versionId,
      });
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

  it('dispatches toggleMainSidePanel() when "h" is pressed', () => {
    const versionId = 723;

    const store = configureStoreWithFileTree({ versionId });
    const dispatch = spyOn(store, 'dispatch');

    renderAndTriggerKeyEvent({ key: 'h' }, { store, versionId });

    expect(dispatch).toHaveBeenCalledWith(
      fullscreenGridActions.toggleMainSidePanel(),
    );
  });

  it.each([
    ['previous', 'a', RelativePathPosition.previous],
    ['next', 'z', RelativePathPosition.next],
  ])(
    'dispatches goToRelativeMessage with %s when "%s" is pressed',
    (direction, key, position) => {
      const currentPath = 'file1.js';
      const messageMap = getMessageMap(
        createFakeExternalLinterResult({
          messages: [fakeExternalLinterMessage],
        }),
      );
      const messageUid = 'some-uid';
      const pathList = [currentPath];
      const versionId = 123;
      const location = createFakeLocation({
        search: queryString.stringify({ messageUid, path: currentPath }),
      });
      const getCodeLineAnchor = jest.fn();
      const _createCodeLineAnchorGetter = jest
        .fn()
        .mockReturnValue(getCodeLineAnchor);

      const store = configureStoreWithFileTree({ versionId, pathList });

      const dispatch = spyOn(store, 'dispatch');
      const fakeThunk = createFakeThunk();
      const _goToRelativeMessage = fakeThunk.createThunk;

      renderAndTriggerKeyEvent(
        { key: key as string },
        {
          _createCodeLineAnchorGetter,
          _goToRelativeMessage,
          currentPath,
          location,
          messageMap,
          store,
          versionId,
        },
      );

      expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
      expect(_goToRelativeMessage).toHaveBeenCalledWith({
        currentMessageUid: messageUid,
        currentPath,
        getCodeLineAnchor,
        messageMap,
        pathList,
        position,
        versionId,
      });
    },
  );

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

  it.each(Object.keys(supportedKeys))(
    'prevents the default event when pressing "%s"',
    (key) => {
      const event = createKeydownEvent({ key });
      const preventDefault = spyOn(event, 'preventDefault');

      renderAndTriggerKeyEvent({ key }, {}, { event });

      expect(preventDefault).toHaveBeenCalled();
    },
  );

  it('does not prevent the default event when pressing an unsupported key', () => {
    const key = '_';
    expect(Object.keys(supportedKeys)).not.toContain(key);

    const event = createKeydownEvent({ key });
    const preventDefault = spyOn(event, 'preventDefault');

    renderAndTriggerKeyEvent({ key }, {}, { event });

    expect(preventDefault).not.toHaveBeenCalled();
  });
});
