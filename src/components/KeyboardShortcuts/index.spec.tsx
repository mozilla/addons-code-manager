import * as React from 'react';
import { Store } from 'redux';

import configureStore from '../../configureStore';
import { RelativePathPosition } from '../../reducers/fileTree';
import { actions as versionActions } from '../../reducers/versions';
import {
  createFakeKeyboardEvent,
  createFakeThunk,
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
  type RenderParams = {
    store?: Store;
  } & Partial<PublicProps & DefaultProps>;

  const render = ({
    currentPath = 'file1.js',
    pathList = ['file1.js'],
    store = configureStore(),
    versionId = 123,
    ...moreProps
  }: RenderParams = {}) => {
    const props = {
      _goToRelativeFile: jest.fn(),
      currentPath,
      pathList,
      versionId,
      ...moreProps,
    };

    return shallowUntilTarget(
      <KeyboardShortcuts {...props} />,
      KeyboardShortcutsBase,
      {
        shallowOptions: { context: { store } },
      },
    );
  };

  it('renders a list of keyboard shortcuts', () => {
    const root = render();

    expect(root.find(`.${styles.KeyboardShortcuts}`)).toHaveLength(1);
  });

  it('binds and unbinds keydown to the listener', () => {
    document.addEventListener = jest.fn();
    document.removeEventListener = jest.fn();

    const root = render();
    const { keydownListener } = root.instance() as KeyboardShortcutsBase;

    expect(document.addEventListener).toHaveBeenCalledWith(
      'keydown',
      keydownListener,
    );

    root.unmount();

    expect(document.removeEventListener).toHaveBeenCalledWith(
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

      const store = configureStore();
      const dispatch = spyOn(store, 'dispatch');
      const fakeThunk = createFakeThunk();
      const _goToRelativeFile = fakeThunk.createThunk;

      const root = render({
        _goToRelativeFile,
        currentPath,
        pathList,
        store,
        versionId,
      });

      const { keydownListener } = root.instance() as KeyboardShortcutsBase;

      // TS cannot seem to figure out that `key` is a string.
      // @ts-ignore
      const event = createFakeKeyboardEvent({ key }) as KeyboardEvent;

      keydownListener(event);

      expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
      expect(_goToRelativeFile).toHaveBeenCalledWith({
        currentPath,
        pathList,
        position,
        versionId,
      });
    },
  );

  it('dispatches expandTree when "e" is pressed', () => {
    const versionId = 123;

    const store = configureStore();
    const dispatch = spyOn(store, 'dispatch');

    const root = render({
      store,
      versionId,
    });

    const { keydownListener } = root.instance() as KeyboardShortcutsBase;

    const event = createFakeKeyboardEvent({ key: 'e' }) as KeyboardEvent;

    keydownListener(event);

    expect(dispatch).toHaveBeenCalledWith(
      versionActions.expandTree({ versionId }),
    );
  });

  it('dispatches collapseTree when "c" is pressed', () => {
    const versionId = 123;

    const store = configureStore();
    const dispatch = spyOn(store, 'dispatch');

    const root = render({
      store,
      versionId,
    });

    const { keydownListener } = root.instance() as KeyboardShortcutsBase;

    const event = createFakeKeyboardEvent({ key: 'c' }) as KeyboardEvent;

    keydownListener(event);

    expect(dispatch).toHaveBeenCalledWith(
      versionActions.collapseTree({ versionId }),
    );
  });

  it.each(['altKey', 'ctrlKey', 'metaKey', 'shiftKey'])(
    'does not dispatch when %s modifies the key',
    (modififierKey) => {
      const store = configureStore();
      const dispatch = spyOn(store, 'dispatch');

      const root = render({ store });

      const { keydownListener } = root.instance() as KeyboardShortcutsBase;

      const event = createFakeKeyboardEvent({
        key: 'k',
        [modififierKey]: true,
      }) as KeyboardEvent;

      keydownListener(event);

      expect(dispatch).not.toHaveBeenCalled();
    },
  );
});
