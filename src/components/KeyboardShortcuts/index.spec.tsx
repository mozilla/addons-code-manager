import * as React from 'react';
import { Store } from 'redux';

import configureStore from '../../configureStore';
import { RelativePathPosition } from '../../reducers/fileTree';
import { actions as versionActions } from '../../reducers/versions';
import {
  CreateKeydownEventParams,
  createKeydownEvent,
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

      const store = configureStore();
      const dispatch = spyOn(store, 'dispatch');
      const fakeThunk = createFakeThunk();
      const _goToRelativeFile = fakeThunk.createThunk;

      renderAndTriggerKeyEvent(
        { key: key as string },
        {
          _goToRelativeFile,
          currentPath,
          pathList,
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

  it.each(['e', 'o'])('dispatches expandTree when "%s" is pressed', (key) => {
    const versionId = 123;

    const store = configureStore();
    const dispatch = spyOn(store, 'dispatch');

    renderAndTriggerKeyEvent(
      { key: key as string },
      {
        store,
        versionId,
      },
    );

    expect(dispatch).toHaveBeenCalledWith(
      versionActions.expandTree({ versionId }),
    );
  });

  it('dispatches collapseTree when "c" is pressed', () => {
    const versionId = 123;

    const store = configureStore();
    const dispatch = spyOn(store, 'dispatch');

    renderAndTriggerKeyEvent(
      { key: 'c' },
      {
        store,
        versionId,
      },
    );

    expect(dispatch).toHaveBeenCalledWith(
      versionActions.collapseTree({ versionId }),
    );
  });

  it.each(['altKey', 'ctrlKey', 'metaKey', 'shiftKey'])(
    'does not dispatch when %s modifies the key',
    (modififierKey) => {
      const store = configureStore();
      const dispatch = spyOn(store, 'dispatch');

      renderAndTriggerKeyEvent(
        { key: 'k', [modififierKey]: true },
        {
          store,
        },
      );

      expect(dispatch).not.toHaveBeenCalled();
    },
  );
});
