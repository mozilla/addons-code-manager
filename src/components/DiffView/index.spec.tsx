/* eslint-disable @typescript-eslint/camelcase */
import React from 'react';
import {
  Diff,
  Hunks,
  WidgetMap,
  parseDiff,
  getChangeKey,
} from 'react-diff-view';
import { Store } from 'redux';
import { shallow } from 'enzyme';
import { Location } from 'history';

import basicDiff from './fixtures/basicDiff';
import multipleDiff from './fixtures/multipleDiff';
import diffWithDeletions from './fixtures/diffWithDeletions';
import LinterMessage from '../LinterMessage';
import configureStore from '../../configureStore';
import { getLanguageFromMimeType } from '../../utils';
import {
  ExternalLinterMessage,
  actions as linterActions,
} from '../../reducers/linter';
import { createInternalVersion } from '../../reducers/versions';
import {
  createContextWithFakeRouter,
  createFakeExternalLinterResult,
  createFakeLocation,
  fakeVersion,
  fakeVersionEntry,
  fakeVersionFile,
  shallowUntilTarget,
  simulateLinterProvider,
} from '../../test-helpers';
import styles from './styles.module.scss';

import DiffView, {
  DiffViewBase,
  DefaultProps,
  PublicProps,
  getAllHunkChanges,
} from '.';

describe(__filename, () => {
  type RenderParams = { store?: Store; location?: Location } & Partial<
    PublicProps & DefaultProps
  >;

  const render = ({
    location = createFakeLocation(),
    store = configureStore(),
    version = createInternalVersion(fakeVersion),
    ...props
  }: RenderParams = {}) => {
    const contextWithRouter = createContextWithFakeRouter({ location });

    const rootWithProvider = shallowUntilTarget(
      <DiffView
        diffs={parseDiff(basicDiff)}
        mimeType="text/plain"
        version={version}
        {...props}
      />,
      DiffViewBase,
      {
        shallowOptions: {
          ...contextWithRouter,
          context: {
            ...contextWithRouter.context,
            store,
          },
        },
      },
    );

    return simulateLinterProvider(rootWithProvider, { store, version });
  };

  const _loadLinterResult = ({
    messages,
    path = 'lib/react.js',
    store,
  }: {
    messages: Partial<ExternalLinterMessage>[];
    path?: string;
    store: Store;
  }) => {
    const version = createInternalVersion({
      ...fakeVersion,
      file: {
        ...fakeVersionFile,
        entries: { [path]: { ...fakeVersionEntry, path } },
        selected_file: path,
      },
    });

    const linterResult = createFakeExternalLinterResult({
      messages: messages.map((msg) => {
        return { ...msg, file: path };
      }),
    });

    store.dispatch(
      linterActions.loadLinterResult({
        versionId: version.id,
        result: linterResult,
      }),
    );

    return { linterResult, version };
  };

  const renderAndGetWidgets = (params: RenderParams = {}): WidgetMap => {
    const root = render(params);

    const diffView = root.find(Diff);
    expect(diffView).toHaveProp('widgets');

    const widgets = diffView.prop('widgets');
    if (!widgets) {
      throw new Error('The widgets prop was falsy');
    }

    return widgets;
  };

  const renderWidget = (hunks: Hunks, widgets: WidgetMap, line: number) => {
    const result = getAllHunkChanges(hunks).filter(
      (change) => change.lineNumber === line,
    );
    if (result.length !== 1) {
      throw new Error(`Could not find a change at line ${line}`);
    }

    const key = getChangeKey(result[0]);
    return shallow(<div>{widgets[key]}</div>);
  };

  const getWidgetNodes = (widgets: WidgetMap) => {
    // Return a list of truthy React nodes in arbitrary order.
    return Object.values(widgets).filter(Boolean);
  };

  it('renders with no differences', () => {
    const root = render({ diffs: [] });

    expect(root.find(Diff)).toHaveLength(0);
    expect(root.find(`.${styles.header}`)).toHaveLength(1);
    expect(root.find(`.${styles.noDiffs}`)).toIncludeText('No differences');
  });

  it('defaults the viewType to unified', () => {
    const root = render();

    expect(root.find(Diff)).toHaveProp('viewType', 'unified');
  });

  it('renders with a specified viewType', () => {
    const viewType = 'split';
    const root = render({ viewType });

    expect(root.find(Diff)).toHaveProp('viewType', viewType);
  });

  it('passes parsed diff information to DiffView', () => {
    const diffs = parseDiff(basicDiff);
    const root = render({ diffs });

    expect(diffs).toHaveLength(1);
    expect(root.find(Diff)).toHaveProp('diffType', diffs[0].type);
    expect(root.find(Diff)).toHaveProp('hunks', diffs[0].hunks);
  });

  it('creates multiple Diff instances when there are multiple files in the diff', () => {
    const diffs = parseDiff(multipleDiff);
    const root = render({ diffs });

    expect(root.find(Diff)).toHaveLength(diffs.length);
    diffs.forEach((diff, index) => {
      expect(root.find(Diff).at(index)).toHaveProp('diffType', diff.type);
      expect(root.find(Diff).at(index)).toHaveProp('hunks', diff.hunks);
    });
  });

  it('renders a header with diff stats', () => {
    const root = render();

    expect(root.find(`.${styles.header}`)).toHaveLength(1);
    expect(root.find(`.${styles.stats}`)).toHaveLength(1);
    expect(root.find(`.${styles.stats}`)).toIncludeText('+++ 2--- 0');
  });

  it('renders a header with diff stats for multiple hunks', () => {
    const root = render({ diffs: parseDiff(diffWithDeletions) });

    expect(root.find(`.${styles.header}`)).toHaveLength(1);
    expect(root.find(`.${styles.stats}`)).toHaveLength(1);
    expect(root.find(`.${styles.stats}`)).toIncludeText('+++ 24--- 4');
  });

  it('renders hunks with separators', () => {
    const diffs = parseDiff(diffWithDeletions);
    const root = render({ diffs });

    // Simulate the interface of <Diff />
    const children = root.find(Diff).prop('children');
    const diff = shallow(<div>{children(diffs[0].hunks)}</div>);

    expect(diff.find(`.${styles.hunk}`)).toHaveLength(diffs[0].hunks.length);
    expect(diff.find(`.${styles.hunkSeparator}`)).toHaveLength(
      // There are less separators than hunks.
      diffs[0].hunks.length - 1,
    );
  });

  it('tokenizes the hunks to add syntax highlighting', () => {
    const diffs = parseDiff(multipleDiff);
    const mimeType = 'application/javascript';
    const _tokenize = jest.fn();

    render({ _tokenize, diffs, mimeType });

    diffs.forEach((diff) => {
      expect(_tokenize).toHaveBeenCalledWith(diff.hunks, {
        highlight: true,
        language: getLanguageFromMimeType(mimeType),
        refractor: expect.any(Object),
      });
    });
    expect(_tokenize).toHaveBeenCalledTimes(diffs.length);
  });

  it('configures anchors/links on each line number', () => {
    const root = render();

    expect(root.find(Diff)).toHaveProp('gutterType', 'anchor');
    // More info about the `getChangeKey()` function here: https://github.com/otakustay/react-diff-view/tree/6aa5399c52392e19f7f8fbe4af17b374b4339862#key-of-change
    expect(root.find(Diff)).toHaveProp('generateAnchorID', getChangeKey);
  });

  it('passes a selected change from the location hash to the Diff component', () => {
    // The value is usually generated by `getChangeKey()`.
    const selectedChange = 'I1';
    const location = createFakeLocation({ hash: `#${selectedChange}` });

    const root = render({ location });

    expect(root.find(Diff)).toHaveProp('selectedChanges', [selectedChange]);
  });

  it('passes an empty list of selected changes when location hash is empty', () => {
    const location = createFakeLocation({ hash: '' });

    const root = render({ location });

    expect(root.find(Diff)).toHaveProp('selectedChanges', []);
  });

  it('tries to find the selected line element on mount', () => {
    const _document = {
      ...document,
      querySelector: jest.fn(),
    };
    const location = createFakeLocation({ hash: '#some-hash' });

    render({ _document, location });

    expect(_document.querySelector).toHaveBeenCalledWith(location.hash);
  });

  it('does not try to find the selected line element on mount when hash is empty', () => {
    const _document = {
      ...document,
      querySelector: jest.fn(),
    };
    const location = createFakeLocation({ hash: '' });

    render({ _document, location });

    expect(_document.querySelector).not.toHaveBeenCalled();
  });

  it('calls scrollIntoView() on the element that corresponds to the location hash', () => {
    const element = {
      scrollIntoView: jest.fn(),
    };
    const _document = {
      ...document,
      querySelector: jest.fn().mockReturnValue(element),
    };
    const location = createFakeLocation({ hash: '#I1' });

    render({ _document, location });

    expect(element.scrollIntoView).toHaveBeenCalled();
  });

  it('renders global messages', () => {
    const store = configureStore();

    const globalMessageUid1 = 'first';
    const globalMessageUid2 = 'second';

    const { version } = _loadLinterResult({
      store,
      messages: [
        { line: null, uid: globalMessageUid1 },
        { line: null, uid: globalMessageUid2 },
      ],
    });

    const root = render({ store, version });

    const messages = root.find(LinterMessage);
    expect(messages).toHaveLength(2);
    expect(messages.at(0)).toHaveProp(
      'message',
      expect.objectContaining({
        uid: globalMessageUid1,
      }),
    );
    expect(messages.at(1)).toHaveProp(
      'message',
      expect.objectContaining({
        uid: globalMessageUid2,
      }),
    );
  });

  it('renders multiple inline messages', () => {
    const store = configureStore();

    const externalMessages = [
      // Add a message to line 9 in the first hunk.
      { line: 9, uid: 'first' },
      // Add a message to line 23 in the second hunk.
      { line: 23, uid: 'second' },
    ];

    const { version } = _loadLinterResult({
      store,
      messages: externalMessages,
    });

    const diffs = parseDiff(diffWithDeletions);
    const widgets = renderAndGetWidgets({ diffs, store, version });

    const { hunks } = diffs[0];

    const firstWidget = renderWidget(hunks, widgets, externalMessages[0].line);
    expect(firstWidget.find(LinterMessage)).toHaveLength(1);
    expect(firstWidget.find(LinterMessage)).toHaveProp(
      'message',
      expect.objectContaining({
        uid: externalMessages[0].uid,
      }),
    );

    const secondWidget = renderWidget(hunks, widgets, externalMessages[1].line);
    expect(secondWidget.find(LinterMessage)).toHaveLength(1);
    expect(secondWidget.find(LinterMessage)).toHaveProp(
      'message',
      expect.objectContaining({
        uid: externalMessages[1].uid,
      }),
    );
  });

  it('renders just the right amount of widgets', () => {
    const store = configureStore();

    const externalMessages = [
      { line: 1, uid: 'first' },
      { line: 2, uid: 'second' },
    ];

    const { version } = _loadLinterResult({
      store,
      messages: externalMessages,
    });

    const widgets = renderAndGetWidgets({
      diffs: parseDiff(diffWithDeletions),
      store,
      version,
    });

    // As a sanity check on how the widgets are mapped,
    // make sure we have truthy React nodes for exactly the same
    // number of lines containing messages.
    expect(getWidgetNodes(widgets).length).toEqual(externalMessages.length);
  });

  it('renders multiple inline messages on the same line', () => {
    const store = configureStore();

    const line = 9;
    const externalMessages = [{ line, uid: 'first' }, { line, uid: 'second' }];

    const { version } = _loadLinterResult({
      store,
      messages: externalMessages,
    });

    const diffs = parseDiff(diffWithDeletions);
    const widgets = renderAndGetWidgets({ diffs, store, version });

    const { hunks } = diffs[0];

    const root = renderWidget(hunks, widgets, line);
    const messages = root.find(LinterMessage);

    expect(messages).toHaveLength(2);
    expect(messages.at(0)).toHaveProp(
      'message',
      expect.objectContaining({
        uid: externalMessages[0].uid,
      }),
    );
    expect(messages.at(1)).toHaveProp(
      'message',
      expect.objectContaining({
        uid: externalMessages[1].uid,
      }),
    );
  });

  it('does not render widgets without linter messages', () => {
    const widgets = renderAndGetWidgets({
      diffs: parseDiff(diffWithDeletions),
      version: createInternalVersion(fakeVersion),
    });
    expect(getWidgetNodes(widgets).length).toEqual(0);
  });

  describe('getAllHunkChanges', () => {
    it('returns a flattened list of all changes', () => {
      const diffs = parseDiff(diffWithDeletions);
      const changes = getAllHunkChanges(diffs[0].hunks);

      // Check a line from the first hunk:
      expect(changes.filter((c) => c.lineNumber === 2)[0].content).toEqual(
        "import { Diff, DiffProps, parseDiff } from 'react-diff-view';",
      );
      // Check a line from the second hunk:
      expect(changes.filter((c) => c.lineNumber === 24)[0].content).toEqual(
        '    console.log({ hunk });',
      );
      // Check a line from the third hunk:
      expect(changes.filter((c) => c.lineNumber === 50)[0].content).toEqual(
        '          </Diff>',
      );
    });
  });
});
