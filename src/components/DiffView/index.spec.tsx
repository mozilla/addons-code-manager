/* eslint-disable @typescript-eslint/camelcase */
import queryString from 'query-string';
import React from 'react';
import { Alert } from 'react-bootstrap';
import {
  Diff,
  HunkInfo,
  Hunks,
  WidgetMap,
  parseDiff,
  getChangeKey,
  tokenize,
} from 'react-diff-view';
import { ShallowWrapper, shallow } from 'enzyme';
import { History, Location } from 'history';

import basicDiff from './fixtures/basicDiff';
import multipleDiff from './fixtures/multipleDiff';
import diffWithDeletions from './fixtures/diffWithDeletions';
import FadableContent from '../FadableContent';
import LinterMessage from '../LinterMessage';
import LinterProvider, { LinterProviderInfo } from '../LinterProvider';
import GlobalLinterMessages from '../GlobalLinterMessages';
import SlowPageAlert from '../SlowPageAlert';
import { allowSlowPagesParam, getLanguageFromMimeType } from '../../utils';
import {
  ExternalChange,
  ExternalHunk,
  ScrollTarget,
  createInternalDiff,
  createInternalHunk,
  createInternalVersion,
} from '../../reducers/versions';
import {
  createContextWithFakeRouter,
  createFakeHistory,
  createFakeLinterMessagesByPath,
  createFakeLocation,
  fakeExternalDiff,
  fakeVersion,
  shallowUntilTarget,
  simulateLinterProvider,
} from '../../test-helpers';
import styles from './styles.module.scss';

import DiffView, {
  DefaultProps,
  DiffViewBase,
  PublicProps,
  diffCanBeHighlighted,
  getAllHunkChanges,
  trimHunkChanges,
} from '.';

describe(__filename, () => {
  type RenderParams = { history?: History; location?: Location } & Partial<
    PublicProps & DefaultProps
  >;

  const render = ({
    history = createFakeHistory(),
    location = createFakeLocation(),
    selectedPath = 'selected.path',
    ...props
  }: RenderParams = {}) => {
    const shallowOptions = createContextWithFakeRouter({ history, location });

    return shallowUntilTarget(
      <DiffView
        diff={parseDiff(basicDiff)[0]}
        mimeType="text/plain"
        selectedPath={selectedPath}
        version={createInternalVersion(fakeVersion)}
        {...props}
      />,
      DiffViewBase,
      { shallowOptions },
    );
  };

  type RenderWithLinterProviderParams = Partial<LinterProviderInfo> &
    RenderParams;

  const renderWithLinterProvider = ({
    messageMap = undefined,
    messagesAreLoading = false,
    selectedMessageMap = undefined,
    ...renderParams
  }: RenderWithLinterProviderParams = {}): ShallowWrapper => {
    const root = render(renderParams);

    return simulateLinterProvider(root, {
      messageMap,
      messagesAreLoading,
      selectedMessageMap,
    });
  };

  const renderAndGetWidgets = (
    params: RenderWithLinterProviderParams = {},
  ): WidgetMap => {
    const root = renderWithLinterProvider(params);

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

  const createHunkWithChanges = (
    changes: Partial<ExternalChange>[],
  ): ExternalHunk => {
    return {
      ...fakeExternalDiff.hunks[0],
      changes: changes.map((change) => {
        return {
          ...fakeExternalDiff.hunks[0].changes[0],
          ...change,
        };
      }),
    };
  };

  const createInternalHunkWithChanges = (
    changes: Partial<ExternalChange>[],
  ): HunkInfo => {
    return createInternalHunk(createHunkWithChanges(changes));
  };

  const createDiffWithHunks = (hunks: ExternalHunk[]) => {
    const baseVersionId = 1;
    const headVersionId = 2;
    const version = {
      ...fakeVersion,
      id: headVersionId,
      file: {
        ...fakeVersion.file,
        diff: {
          ...fakeExternalDiff,
          hunks,
        },
      },
    };
    const diff = createInternalDiff({
      baseVersionId,
      headVersionId,
      version,
    });
    if (!diff) {
      throw new Error('The diff was unexpectedly empty');
    }
    return diff;
  };

  it('renders with no differences', () => {
    const root = renderWithLinterProvider({ diff: null });

    expect(root.find(Diff)).toHaveLength(0);
    expect(root.find(`.${styles.header}`)).toHaveLength(1);
    expect(root.find(`.${styles.noDiffs}`)).toIncludeText('No differences');
  });

  it('defaults the viewType to unified', () => {
    const root = renderWithLinterProvider();

    expect(root.find(Diff)).toHaveProp('viewType', 'unified');
  });

  it('renders with a specified viewType', () => {
    const viewType = 'split';
    const root = renderWithLinterProvider({ viewType });

    expect(root.find(Diff)).toHaveProp('viewType', viewType);
  });

  it('passes parsed diff information to DiffView', () => {
    const diff = parseDiff(basicDiff)[0];
    const root = renderWithLinterProvider({ diff });

    expect(root.find(Diff)).toHaveProp('diffType', diff.type);
    expect(root.find(Diff)).toHaveProp('hunks', diff.hunks);
  });

  it('renders a header with diff stats', () => {
    const root = renderWithLinterProvider();

    expect(root.find(`.${styles.header}`)).toHaveLength(1);
    expect(root.find(`.${styles.stats}`)).toHaveLength(1);
    expect(root.find(`.${styles.stats}`)).toIncludeText('+++ 2--- 0');
  });

  it('renders a header with diff stats for multiple hunks', () => {
    const root = renderWithLinterProvider({
      diff: parseDiff(diffWithDeletions)[0],
    });

    expect(root.find(`.${styles.header}`)).toHaveLength(1);
    expect(root.find(`.${styles.stats}`)).toHaveLength(1);
    expect(root.find(`.${styles.stats}`)).toIncludeText('+++ 24--- 4');
  });

  it('renders hunks with separators', () => {
    const diff = parseDiff(diffWithDeletions)[0];
    const root = renderWithLinterProvider({ diff });

    // Simulate the interface of <Diff />
    const children = root.find(Diff).prop('children');
    const diffWrapper = shallow(<div>{children(diff.hunks)}</div>);

    expect(diffWrapper.find(`.${styles.hunk}`)).toHaveLength(diff.hunks.length);
    expect(diffWrapper.find(`.${styles.hunkSeparator}`)).toHaveLength(
      // There are less separators than hunks.
      diff.hunks.length - 1,
    );
  });

  it('tokenizes the hunks to add syntax highlighting', () => {
    const diff = parseDiff(multipleDiff)[0];
    const mimeType = 'application/javascript';
    const _tokenize = jest.fn();

    renderWithLinterProvider({ _tokenize, diff, mimeType });

    expect(_tokenize).toHaveBeenCalledWith(diff.hunks, {
      highlight: true,
      language: getLanguageFromMimeType(mimeType),
      refractor: expect.any(Object),
    });
  });

  it('configures anchors/links on each line number', () => {
    const root = renderWithLinterProvider();

    expect(root.find(Diff)).toHaveProp('gutterType', 'anchor');
    // More info about the `getChangeKey()` function here: https://github.com/otakustay/react-diff-view/tree/6aa5399c52392e19f7f8fbe4af17b374b4339862#key-of-change
    expect(root.find(Diff)).toHaveProp('generateAnchorID', getChangeKey);
  });

  it('passes a selected change from the location hash to the Diff component', () => {
    // The value is usually generated by `getChangeKey()`.
    const selectedChange = 'I1';
    const location = createFakeLocation({ hash: `#${selectedChange}` });

    const root = renderWithLinterProvider({ location });

    expect(root.find(Diff)).toHaveProp('selectedChanges', [selectedChange]);
  });

  it('passes an empty list of selected changes when location hash is empty', () => {
    const location = createFakeLocation({ hash: '' });

    const root = renderWithLinterProvider({ location });

    expect(root.find(Diff)).toHaveProp('selectedChanges', []);
  });

  it('tries to find the selected line element on mount', () => {
    const _document = {
      ...document,
      querySelector: jest.fn(),
    };
    const location = createFakeLocation({ hash: '#some-hash' });

    renderWithLinterProvider({ _document, location });

    expect(_document.querySelector).toHaveBeenCalledWith(location.hash);
  });

  it('tries to find the selected line element on update', () => {
    const _document = {
      ...document,
      querySelector: jest.fn(),
    };
    const location = createFakeLocation({ hash: '#some-hash' });

    const root = render({ _document });
    root.setProps({ location });

    expect(_document.querySelector).toHaveBeenCalledWith(location.hash);
  });

  it('calls history.push to navigate to the first diff when scrollTo is "first"', () => {
    const firstDiffAnchor = 'D5';
    const _getRelativeDiffAnchor = jest.fn().mockReturnValue(firstDiffAnchor);
    const location = createFakeLocation({
      search: queryString.stringify({ scrollTo: ScrollTarget.firstDiff }),
    });
    const history = createFakeHistory({ location });

    const queryParams = queryString.parse(location.search);
    const newParams = { ...queryParams, scrollTo: undefined };

    const newLocation = {
      ...location,
      hash: `#${firstDiffAnchor}`,
      search: queryString.stringify(newParams),
    };

    renderWithLinterProvider({ _getRelativeDiffAnchor, history, location });

    expect(history.push).toHaveBeenCalledWith(newLocation);
  });

  it('calls history.push to navigate to the last diff when scrollTo is "last"', () => {
    const lastDiffAnchor = 'D5';
    const _getDiffAnchors = jest
      .fn()
      .mockReturnValue(['D1', 'D2', lastDiffAnchor]);
    const location = createFakeLocation({
      search: queryString.stringify({ scrollTo: ScrollTarget.lastDiff }),
    });
    const history = createFakeHistory({ location });

    const queryParams = queryString.parse(location.search);
    const newParams = { ...queryParams };

    delete newParams.scrollTo;
    const newLocation = {
      ...location,
      hash: `#${lastDiffAnchor}`,
      search: queryString.stringify(newParams),
    };

    renderWithLinterProvider({ _getDiffAnchors, history, location });

    expect(history.push).toHaveBeenCalledWith(newLocation);
  });

  it('calls history.push on update to navigate to the first diff when scrollTo is "first"', () => {
    const firstDiffAnchor = 'D5';
    const _getRelativeDiffAnchor = jest.fn().mockReturnValue(firstDiffAnchor);
    const location = createFakeLocation({
      search: queryString.stringify({ scrollTo: ScrollTarget.firstDiff }),
    });
    const history = createFakeHistory({ location });

    const queryParams = queryString.parse(location.search);
    const newParams = { ...queryParams };

    delete newParams.scrollTo;
    const newLocation = {
      ...location,
      hash: `#${firstDiffAnchor}`,
      search: queryString.stringify(newParams),
    };

    const root = render({
      _getRelativeDiffAnchor,
      diff: null,
      history,
      location,
    });

    expect(history.push).not.toHaveBeenCalled();

    root.setProps({ diff: parseDiff(basicDiff)[0] });

    expect(history.push).toHaveBeenCalledWith(newLocation);
  });

  it('calls history.push on update to navigate to the last diff when scrollTo is "last"', () => {
    const lastDiffAnchor = 'D5';
    const _getDiffAnchors = jest
      .fn()
      .mockReturnValue(['D1', 'D2', lastDiffAnchor]);
    const location = createFakeLocation({
      search: queryString.stringify({ scrollTo: ScrollTarget.lastDiff }),
    });
    const history = createFakeHistory({ location });

    const queryParams = queryString.parse(location.search);
    const newParams = { ...queryParams };

    delete newParams.scrollTo;
    const newLocation = {
      ...location,
      hash: `#${lastDiffAnchor}`,
      search: queryString.stringify(newParams),
    };

    const root = render({
      _getDiffAnchors,
      diff: null,
      history,
      location,
    });

    expect(history.push).not.toHaveBeenCalled();

    root.setProps({ diff: parseDiff(basicDiff)[0] });

    expect(history.push).toHaveBeenCalledWith(newLocation);
  });

  it('does not call history.push to navigate to the first diff when there is no diff', () => {
    const _getRelativeDiffAnchor = jest.fn().mockReturnValue('some-anchor');
    const location = createFakeLocation({
      search: queryString.stringify({ scrollTo: ScrollTarget.firstDiff }),
    });
    const history = createFakeHistory({ location });

    renderWithLinterProvider({
      _getRelativeDiffAnchor,
      diff: null,
      history,
      location,
    });

    expect(history.push).not.toHaveBeenCalled();
  });

  it('does not call history.push to navigate to a diff when scrollTo query param is falsey', () => {
    const _getRelativeDiffAnchor = jest.fn().mockReturnValue('some-anchor');
    const location = createFakeLocation();
    const history = createFakeHistory({ location });

    renderWithLinterProvider({
      _getRelativeDiffAnchor,
      history,
      location,
    });

    expect(history.push).not.toHaveBeenCalled();
  });

  it('does not call history.push to navigate to the first diff when there are no diff anchors', () => {
    const _getRelativeDiffAnchor = jest.fn().mockReturnValue(null);
    const location = createFakeLocation({
      search: queryString.stringify({ scrollTo: ScrollTarget.firstDiff }),
    });
    const history = createFakeHistory({ location });

    renderWithLinterProvider({
      _getRelativeDiffAnchor,
      history,
      location,
    });

    expect(history.push).not.toHaveBeenCalled();
  });

  it('does not call history.push to navigate to the last diff when there are no diff anchors', () => {
    const _getDiffAnchors = jest.fn().mockReturnValue([]);
    const location = createFakeLocation({
      search: queryString.stringify({ scrollTo: ScrollTarget.lastDiff }),
    });
    const history = createFakeHistory({ location });

    renderWithLinterProvider({
      _getDiffAnchors,
      history,
      location,
    });

    expect(history.push).not.toHaveBeenCalled();
  });

  it('does not try to find the selected line element on mount when hash is empty', () => {
    const _document = {
      ...document,
      querySelector: jest.fn(),
    };
    const location = createFakeLocation({ hash: '' });

    renderWithLinterProvider({ _document, location });

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

    renderWithLinterProvider({ _document, location });

    expect(element.scrollIntoView).toHaveBeenCalled();
  });

  it('configures LinterProvider', () => {
    const version = createInternalVersion({
      ...fakeVersion,
      id: fakeVersion.id + 1,
    });
    const selectedPath = 'sel.file';
    const root = render({ selectedPath, version });

    const provider = root.find(LinterProvider);
    expect(provider).toHaveProp('versionId', version.id);
    expect(provider).toHaveProp('validationURL', version.validationURL);
    expect(provider).toHaveProp('selectedPath', selectedPath);
  });

  it('renders global messages', () => {
    const globalMessageUid1 = 'first';
    const globalMessageUid2 = 'second';

    const root = renderWithLinterProvider({
      selectedMessageMap: createFakeLinterMessagesByPath({
        messages: [
          { line: null, uid: globalMessageUid1 },
          { line: null, uid: globalMessageUid2 },
        ],
      }),
    });

    const globalMessages = root.find(GlobalLinterMessages);
    expect(globalMessages).toHaveLength(1);
    expect(globalMessages).toHaveProp('messages', [
      expect.objectContaining({ uid: globalMessageUid1 }),
      expect.objectContaining({ uid: globalMessageUid2 }),
    ]);
  });

  it('renders multiple inline messages', () => {
    const externalMessages = [
      // Add a message to line 9 in the first hunk.
      { line: 9, uid: 'first' },
      // Add a message to line 23 in the second hunk.
      { line: 23, uid: 'second' },
    ];

    const diff = parseDiff(diffWithDeletions)[0];
    const widgets = renderAndGetWidgets({
      diff,
      selectedMessageMap: createFakeLinterMessagesByPath({
        messages: externalMessages,
      }),
    });

    const { hunks } = diff;

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
    const externalMessages = [
      { line: 1, uid: 'first' },
      { line: 2, uid: 'second' },
    ];

    const widgets = renderAndGetWidgets({
      diff: parseDiff(diffWithDeletions)[0],
      selectedMessageMap: createFakeLinterMessagesByPath({
        messages: externalMessages,
      }),
    });

    // As a sanity check on how the widgets are mapped,
    // make sure we have truthy React nodes for exactly the same
    // number of lines containing messages.
    expect(getWidgetNodes(widgets).length).toEqual(externalMessages.length);
  });

  it('renders multiple inline messages on the same line', () => {
    const line = 9;
    const externalMessages = [{ line, uid: 'first' }, { line, uid: 'second' }];

    const diff = parseDiff(diffWithDeletions)[0];
    const widgets = renderAndGetWidgets({
      diff,
      selectedMessageMap: createFakeLinterMessagesByPath({
        messages: externalMessages,
      }),
    });

    const { hunks } = diff;

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
      diff: parseDiff(diffWithDeletions)[0],
      selectedMessageMap: null,
    });
    expect(getWidgetNodes(widgets).length).toEqual(0);
  });

  it('enables syntax highlighting for diffs when possible', () => {
    const _tokenize = jest.fn(tokenize);
    const root = renderWithLinterProvider({
      _diffCanBeHighlighted: jest.fn(() => true),
      _tokenize,
      diff: createDiffWithHunks([
        createHunkWithChanges([{ content: '// example content' }]),
      ]),
    });

    const diff = root.find(Diff);
    expect(diff).toHaveProp('tokens');
    expect(diff.prop('tokens')).toBeDefined();
    expect(_tokenize).toHaveBeenCalled();
    expect(root.find(`.${styles.highlightingDisabled}`)).toHaveLength(0);
  });

  it('disables syntax highlighting when it is not possible', () => {
    const _tokenize = jest.fn(tokenize);
    const root = renderWithLinterProvider({
      _diffCanBeHighlighted: jest.fn(() => false),
      _tokenize,
      diff: createDiffWithHunks([
        createHunkWithChanges([{ content: '// pretend this is a long line' }]),
      ]),
    });

    expect(root.find(Diff)).toHaveProp('tokens', undefined);
    expect(_tokenize).not.toHaveBeenCalled();

    const message = root.find(Alert);
    expect(message).toHaveLength(1);
    expect(message).toHaveText(
      'Syntax highlighting was disabled for performance',
    );
  });

  it('does not show a message about disabled highlighting without a diff', () => {
    const root = renderWithLinterProvider({ diff: null });

    expect(root.find(`.${styles.highlightingDisabled}`)).toHaveLength(0);
  });

  it('trims, fades, and warns about diffs too large to display', () => {
    const change1 = { content: '// example 1' };
    const change2 = { content: '// example 2' };
    const change3 = { content: '// example 3' };

    const diff = createDiffWithHunks([
      createHunkWithChanges([change1]),
      createHunkWithChanges([change2, change3]),
    ]);

    const root = renderWithLinterProvider({ diff, _slowDiffChangeCount: 2 });

    const fadableShell = root.find(FadableContent);
    expect(fadableShell).toHaveProp('fade', true);

    const diffView = fadableShell.find(Diff);
    expect(diffView).toHaveProp(
      'hunks',
      createDiffWithHunks([
        createHunkWithChanges([change1]),
        createHunkWithChanges([change2]),
      ]).hunks,
    );

    const message = root.find(SlowPageAlert);
    // There should be a warning at the top and bottom.
    expect(message).toHaveLength(2);
  });

  it('lets you override diff trimming', () => {
    const change1 = { content: '// example 1' };
    const change2 = { content: '// example 2' };
    const change3 = { content: '// example 3' };

    const diff = createDiffWithHunks([
      createHunkWithChanges([change1]),
      createHunkWithChanges([change2, change3]),
    ]);

    const location = createFakeLocation({
      search: queryString.stringify({ [allowSlowPagesParam]: true }),
    });
    const root = renderWithLinterProvider({
      diff,
      location,
      _slowDiffChangeCount: 2,
    });

    expect(root.find(FadableContent)).toHaveProp('fade', false);

    const diffView = root.find(Diff);
    expect(diffView).toHaveProp('hunks', diff.hunks);

    const message = root.find(SlowPageAlert);
    // There should only be one warning at the top.
    expect(message).toHaveLength(1);
  });

  it('configures SlowPageAlert', () => {
    const diff = createDiffWithHunks([
      createHunkWithChanges([
        { content: '// example 1' },
        { content: '// example 2' },
      ]),
    ]);

    const location = createFakeLocation();
    const root = renderWithLinterProvider({
      diff,
      location,
      _slowDiffChangeCount: 1,
    });

    const message = root.find(SlowPageAlert).at(0);

    expect(message).toHaveProp('location', location);

    expect(message).toHaveProp('getMessage');
    const getMessage = message.prop('getMessage');

    expect(message).toHaveProp('getLinkText');
    const getLinkText = message.prop('getLinkText');

    // Pass in allowSlowPages=true|false to test messaging.

    expect(getMessage(true)).toEqual('This diff will load slowly.');
    expect(getMessage(false)).toEqual(
      'This diff was shortened to load faster.',
    );

    expect(getLinkText(true)).toEqual('Shorten the diff.');
    expect(getLinkText(false)).toEqual('Show the original diff.');
  });

  describe('getAllHunkChanges', () => {
    it('returns a flattened list of all changes', () => {
      const diff = parseDiff(diffWithDeletions)[0];
      const changes = getAllHunkChanges(diff.hunks);

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

  describe('diffCanBeHighlighted', () => {
    it('returns true for a diff with short line lengths', () => {
      expect(
        diffCanBeHighlighted(
          createDiffWithHunks([
            createHunkWithChanges([{ content: '// example of short line' }]),
            createHunkWithChanges([
              { content: '// example of short line' },
              { content: '// example of short line' },
            ]),
          ]),
          { wideLineLength: 80 },
        ),
      ).toEqual(true);
    });

    it('returns false for a diff with wide line lengths', () => {
      const wideLine = '// example of a really wide line';
      expect(
        diffCanBeHighlighted(
          createDiffWithHunks([
            createHunkWithChanges([{ content: '// short line' }]),
            createHunkWithChanges([
              { content: '// short line' },
              { content: wideLine },
            ]),
          ]),
          { wideLineLength: wideLine.length - 1 },
        ),
      ).toEqual(false);
    });

    it('returns true for a diff with a low line count', () => {
      const highLineCount = 8;
      expect(
        diffCanBeHighlighted(
          createDiffWithHunks([
            createHunkWithChanges(
              new Array(highLineCount - 1).fill({
                content: '// example content',
              }),
            ),
          ]),
          { highLineCount },
        ),
      ).toEqual(true);
    });

    it('returns false for a diff with a high line count', () => {
      expect(
        diffCanBeHighlighted(
          createDiffWithHunks([
            createHunkWithChanges([
              { content: '// example content' },
              { content: '// example content' },
              { content: '// example content' },
              { content: '// example content' },
            ]),
            createHunkWithChanges([{ content: '// example content' }]),
          ]),
          { highLineCount: 4 },
        ),
      ).toEqual(false);
    });
  });

  describe('trimHunkChanges', () => {
    it('does not trim when not necessary', () => {
      const hunks = [
        createInternalHunkWithChanges([{ content: '// example content 1' }]),
        createInternalHunkWithChanges([{ content: '// example content 2' }]),
      ];

      expect(trimHunkChanges(hunks, { maxLength: 2 })).toEqual(hunks);
    });

    it('trims the hunk changes when too long', () => {
      const hunk1 = createInternalHunkWithChanges([
        { content: '// example content 1' },
      ]);
      const hunk2 = createInternalHunkWithChanges([
        { content: '// example content 2' },
      ]);
      const hunk3 = createInternalHunkWithChanges([
        { content: '// example content 3' },
      ]);

      const hunks = [hunk1, hunk2, hunk3];

      const trimmed = trimHunkChanges(hunks, { maxLength: 2 });
      expect(getAllHunkChanges(trimmed)).toHaveLength(2);

      expect(trimmed[0].changes[0].content).toEqual(hunk1.changes[0].content);
      expect(trimmed[1].changes[0].content).toEqual(hunk2.changes[0].content);
    });

    it('slices the last change set when trimming', () => {
      const change1 = { content: '// example content 1' };
      const change2 = { content: '// example content 2' };
      const change3 = { content: '// example content 3' };
      const change4 = { content: '// example content 4' };

      const hunks = [
        createInternalHunkWithChanges([change1]),
        createInternalHunkWithChanges([change2, change3, change4]),
      ];

      const trimmed = trimHunkChanges(hunks, { maxLength: 3 });

      expect(trimmed[1].changes).toEqual(
        createInternalHunkWithChanges([change2, change3]).changes,
      );
    });
  });
});
