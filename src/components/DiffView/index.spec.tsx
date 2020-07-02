/* eslint-disable @typescript-eslint/camelcase */
import queryString from 'query-string';
import React from 'react';
import { Alert } from 'react-bootstrap';
import * as ReactDiffView from 'react-diff-view';
import { ShallowWrapper, shallow } from 'enzyme';
import { History, Location } from 'history';

import basicDiff from './fixtures/basicDiff';
import multipleDiff from './fixtures/multipleDiff';
import diffWithDeletions from './fixtures/diffWithDeletions';
import Commentable from '../Commentable';
import CommentList from '../CommentList';
import FadableContent from '../FadableContent';
import LinterMessage from '../LinterMessage';
import LinterProvider, { LinterProviderInfo } from '../LinterProvider';
import GlobalLinterMessages from '../GlobalLinterMessages';
import SlowPageAlert from '../SlowPageAlert';
import {
  TRIMMED_CHAR_COUNT,
  getLanguageFromMimeType,
  getAllHunkChanges,
} from '../../utils';
import {
  ExternalChange,
  ExternalHunk,
  ScrollTarget,
  changeTypes,
  createInternalDiff,
  createInternalHunk,
  createInternalVersion,
} from '../../reducers/versions';
import {
  createContextWithFakeRouter,
  createFakeHistory,
  createFakeLinterMessagesByPath,
  createFakeLocation,
  fakeChangeInfo,
  fakeExternalDiff,
  fakeTokens,
  fakeVersionWithContent,
  getInstance,
  nextUniqueId,
  shallowUntilTarget,
  simulateCommentable,
  simulateCommentList,
  simulateLinterProvider,
} from '../../test-helpers';
import styles from './styles.module.scss';

import DiffView, {
  DefaultProps,
  DiffViewBase,
  PublicProps,
  addedChange,
  changeCanBeCommentedUpon,
  getChangeCharCount,
  trimHunkChars,
} from '.';

describe(__filename, () => {
  type RenderParams = { history?: History; location?: Location } & Partial<
    PublicProps & DefaultProps
  >;

  const render = ({
    _codeCanBeHighlighted = jest.fn(),
    enableCommenting = true,
    history = createFakeHistory(),
    location = createFakeLocation(),
    ...props
  }: RenderParams = {}) => {
    const shallowOptions = createContextWithFakeRouter({ history, location });

    return shallowUntilTarget(
      <DiffView
        _codeCanBeHighlighted={_codeCanBeHighlighted}
        diff={ReactDiffView.parseDiff(basicDiff)[0]}
        enableCommenting={enableCommenting}
        isMinified={false}
        mimeType="text/plain"
        version={createInternalVersion(fakeVersionWithContent)}
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
  ): ReactDiffView.WidgetMap => {
    const root = renderWithLinterProvider(params);

    const diffView = root.find(ReactDiffView.Diff);
    expect(diffView).toHaveProp('widgets');

    const widgets = diffView.prop('widgets');
    if (!widgets) {
      throw new Error('The widgets prop was falsy');
    }

    return widgets;
  };

  const renderWidget = (
    hunks: ReactDiffView.Hunks,
    widgets: ReactDiffView.WidgetMap,
    line: number,
  ) => {
    const result = getAllHunkChanges(hunks).filter(
      (change) => change.lineNumber === line,
    );
    if (result.length !== 1) {
      throw new Error(`Could not find a change at line ${line}`);
    }

    const key = ReactDiffView.getChangeKey(result[0]);
    return shallow(<div>{widgets[key]}</div>);
  };

  const getWidgetNodes = (widgets: ReactDiffView.WidgetMap) => {
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
  ): ReactDiffView.HunkInfo => {
    return createInternalHunk(createHunkWithChanges(changes));
  };

  const createDiffWithHunks = (hunks: ExternalHunk[]) => {
    const diff = createInternalDiff({
      ...fakeExternalDiff,
      hunks,
    });
    if (!diff) {
      throw new Error('The diff was unexpectedly empty');
    }
    return diff;
  };

  it('renders with no differences', () => {
    const root = renderWithLinterProvider({ diff: null });

    expect(root.find(ReactDiffView.Diff)).toHaveLength(0);
    expect(root.find(`.${styles.header}`)).toHaveLength(1);
    expect(root.find(`.${styles.noDiffs}`)).toIncludeText('No differences');
  });

  it('defaults the viewType to unified', () => {
    const root = renderWithLinterProvider();

    expect(root.find(ReactDiffView.Diff)).toHaveProp('viewType', 'unified');
  });

  it('renders with a specified viewType', () => {
    const viewType = 'split';
    const root = renderWithLinterProvider({ viewType });

    expect(root.find(ReactDiffView.Diff)).toHaveProp('viewType', viewType);
  });

  it('passes parsed diff information to DiffView', () => {
    const diff = ReactDiffView.parseDiff(basicDiff)[0];
    const root = renderWithLinterProvider({ diff });

    expect(root.find(ReactDiffView.Diff)).toHaveProp('diffType', diff.type);
    expect(root.find(ReactDiffView.Diff)).toHaveProp('hunks', diff.hunks);
  });

  it('renders a header with diff stats', () => {
    const root = renderWithLinterProvider();

    expect(root.find(`.${styles.header}`)).toHaveLength(1);
    expect(root.find(`.${styles.stats}`)).toHaveLength(1);
    expect(root.find(`.${styles.stats}`)).toIncludeText('+++ 2--- 0');
  });

  it('renders a header with diff stats for multiple hunks', () => {
    const root = renderWithLinterProvider({
      diff: ReactDiffView.parseDiff(diffWithDeletions)[0],
    });

    expect(root.find(`.${styles.header}`)).toHaveLength(1);
    expect(root.find(`.${styles.stats}`)).toHaveLength(1);
    expect(root.find(`.${styles.stats}`)).toIncludeText('+++ 24--- 4');
  });

  it('renders hunks with separators', () => {
    const diff = ReactDiffView.parseDiff(diffWithDeletions)[0];
    const root = renderWithLinterProvider({ diff });

    // Simulate the interface of <Diff />
    const children = root.find(ReactDiffView.Diff).prop('children');
    const diffWrapper = shallow(<div>{children(diff.hunks)}</div>);

    expect(diffWrapper.find(`.${styles.hunk}`)).toHaveLength(diff.hunks.length);
    expect(diffWrapper.find(`.${styles.hunkSeparator}`)).toHaveLength(
      // There are less separators than hunks.
      diff.hunks.length - 1,
    );
  });

  it('tokenizes the hunks to add syntax highlighting', () => {
    const diff = ReactDiffView.parseDiff(multipleDiff)[0];
    const mimeType = 'application/javascript';
    const _codeCanBeHighlighted = jest.fn().mockReturnValue(true);
    const _tokenize = jest.fn();

    renderWithLinterProvider({
      _codeCanBeHighlighted,
      _tokenize,
      diff,
      mimeType,
    });

    expect(_tokenize).toHaveBeenCalledWith(diff.hunks, {
      highlight: true,
      language: getLanguageFromMimeType(mimeType),
      refractor: expect.any(Object),
    });
  });

  it('does not tokenize the hunks to add syntax highlighting if the diff has been trimmed', () => {
    const _codeCanBeHighlighted = jest.fn().mockReturnValue(true);
    const _codeShouldBeTrimmed = jest.fn().mockReturnValue(true);
    const _tokenize = jest.fn();

    renderWithLinterProvider({
      _codeCanBeHighlighted,
      _codeShouldBeTrimmed,
      _tokenize,
      // A minified file will be trimmed by default.
      isMinified: true,
    });

    expect(_tokenize).not.toHaveBeenCalled();
  });

  it('resets tokens to undefined if they seem invalid', () => {
    const _codeCanBeHighlighted = jest.fn().mockReturnValue(true);
    const _codeShouldBeTrimmed = jest.fn().mockReturnValue(false);
    const _tokenize = (jest.spyOn(
      ReactDiffView,
      'tokenize',
    ) as unknown) as typeof ReactDiffView.tokenize;
    // This creates a hunk with just the line that is added via the trimmer.
    // It is the undefined line numbers that cause tokenize to fail.
    const hunk = {
      ...createHunkWithChanges([
        {
          content: 'any content',
          new_line_number: undefined,
          old_line_number: undefined,
        },
      ]),
    };
    const diff = createDiffWithHunks([hunk]);

    const root = renderWithLinterProvider({
      _codeCanBeHighlighted,
      _codeShouldBeTrimmed,
      _tokenize,
      diff,
    });

    expect(_tokenize).toHaveBeenCalled();
    // If this assertion starts to fail, check what is returned by `tokenize`
    // for the truncated code used in this case. At this point we are expecting
    // an empty array in place of the token, but that implementation detail
    // could change.
    expect(root.find(ReactDiffView.Diff)).toHaveProp('tokens', undefined);
  });

  it('does not reset tokens to undefined for a single line of code', () => {
    const _codeCanBeHighlighted = jest.fn().mockReturnValue(true);
    const _codeShouldBeTrimmed = jest.fn().mockReturnValue(false);
    const _tokenize = (jest.spyOn(
      ReactDiffView,
      'tokenize',
    ) as unknown) as typeof ReactDiffView.tokenize;
    const code =
      '<!DOCTYPE html><html><head></head><body><script src="/src/manifest.js"></body></html>';
    const diff = createDiffWithHunks([
      createHunkWithChanges([{ content: code }]),
    ]);

    const root = renderWithLinterProvider({
      _codeCanBeHighlighted,
      _codeShouldBeTrimmed,
      _tokenize,
      diff,
    });

    expect(_tokenize).toHaveBeenCalled();
    expect(root.find(ReactDiffView.Diff)).not.toHaveProp('tokens', undefined);
  });

  it('configures anchors/links on each line number', () => {
    const root = renderWithLinterProvider();

    expect(root.find(ReactDiffView.Diff)).toHaveProp('gutterType', 'anchor');
    // More info about the `getChangeKey()` function here: https://github.com/otakustay/react-diff-view/tree/6aa5399c52392e19f7f8fbe4af17b374b4339862#key-of-change
    expect(root.find(ReactDiffView.Diff)).toHaveProp(
      'generateAnchorID',
      ReactDiffView.getChangeKey,
    );
  });

  it('passes a selected change from the location hash to the Diff component', () => {
    // The value is usually generated by `getChangeKey()`.
    const selectedChange = 'I1';
    const location = createFakeLocation({ hash: `#${selectedChange}` });

    const root = renderWithLinterProvider({ location });

    expect(root.find(ReactDiffView.Diff)).toHaveProp('selectedChanges', [
      selectedChange,
    ]);
  });

  it('passes an empty list of selected changes when location hash is empty', () => {
    const location = createFakeLocation({ hash: '' });

    const root = renderWithLinterProvider({ location });

    expect(root.find(ReactDiffView.Diff)).toHaveProp('selectedChanges', []);
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

    root.setProps({ diff: ReactDiffView.parseDiff(basicDiff)[0] });

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

    root.setProps({ diff: ReactDiffView.parseDiff(basicDiff)[0] });

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
      ...fakeVersionWithContent,
      id: fakeVersionWithContent.id + 1,
    });
    const root = render({ version });

    const provider = root.find(LinterProvider);
    expect(provider).toHaveProp('versionId', version.id);
    expect(provider).toHaveProp('validationURL', version.validationURL);
    expect(provider).toHaveProp('selectedPath', version.selectedPath);
  });

  it('configures base Profiler', () => {
    const _sendPerfTiming = jest.fn();
    const root = render({ _sendPerfTiming });
    const instance = getInstance<DiffViewBase>(root);
    const { onRenderProfiler } = instance;
    const actualDuration = 19;
    const id = 'some-id';
    const phase = 'mount';

    const profiler = root.find('#DiffView-Render');
    expect(profiler).toHaveProp('onRender', onRenderProfiler);

    onRenderProfiler(id, phase, actualDuration);
    expect(_sendPerfTiming).toHaveBeenCalledWith({ actualDuration, id });
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

    const diff = ReactDiffView.parseDiff(diffWithDeletions)[0];
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

  it('renders just the right amount of widgets with messages', () => {
    const firstLine = nextUniqueId();
    const secondLine = nextUniqueId();
    const thirdLine = nextUniqueId();
    const lines = [firstLine, secondLine, thirdLine];
    const externalMessages = [
      { line: firstLine, uid: 'first' },
      { line: secondLine, uid: 'second' },
    ];
    const version = createInternalVersion({
      ...fakeVersionWithContent,
      id: nextUniqueId(),
    });
    const diff = createDiffWithHunks([
      createHunkWithChanges([
        { type: 'insert', new_line_number: firstLine },
        { type: 'insert', new_line_number: secondLine },
        { type: 'insert', new_line_number: thirdLine },
      ]),
    ]);
    const widgets = renderAndGetWidgets({
      diff,
      selectedMessageMap: createFakeLinterMessagesByPath({
        messages: externalMessages,
      }),
      version,
    });

    // We should have one widget per line.
    expect(getWidgetNodes(widgets).length).toEqual(lines.length);

    // We should have one widget with a message per message.
    const widgetsWithMessages = lines.filter(
      (line) =>
        renderWidget(diff.hunks, widgets, line).find(LinterMessage).length,
    );
    expect(widgetsWithMessages.length).toEqual(externalMessages.length);
  });

  it('renders multiple inline messages on the same line', () => {
    const line = 9;
    const externalMessages = [
      { line, uid: 'first' },
      { line, uid: 'second' },
    ];

    const diff = ReactDiffView.parseDiff(diffWithDeletions)[0];
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

  it.each([
    changeTypes.deleteEofnl,
    changeTypes.insertEofnl,
    changeTypes.normalEofnl,
  ])('does not render a widget for %s changes', (type) => {
    const line = nextUniqueId();
    const externalMessages = [{ line, uid: 'first' }];
    const version = createInternalVersion({
      ...fakeVersionWithContent,
      id: nextUniqueId(),
    });
    const diff = createDiffWithHunks([
      createHunkWithChanges([{ type, new_line_number: line }]),
    ]);
    const widgets = renderAndGetWidgets({
      diff,
      selectedMessageMap: createFakeLinterMessagesByPath({
        messages: externalMessages,
      }),
      version,
    });

    expect(getWidgetNodes(widgets).length).toEqual(0);
  });

  describe('comment list', () => {
    it('renders inline comments for commentable lines', () => {
      const CommentListResult = () => <div />;
      const lineNumber = nextUniqueId();
      const version = createInternalVersion({
        ...fakeVersionWithContent,
        id: nextUniqueId(),
      });
      const diff = createDiffWithHunks([
        createHunkWithChanges([
          { new_line_number: lineNumber, old_line_number: lineNumber },
        ]),
      ]);

      const widgets = renderAndGetWidgets({
        diff,
        version,
      });

      const widget = renderWidget(diff.hunks, widgets, lineNumber);

      const { renderContent } = simulateCommentList({
        commentList: <CommentListResult />,
        root: widget,
      });
      const commentWidget = renderContent();
      expect(commentWidget.find(CommentListResult)).toHaveLength(1);

      const commentList = widget.find(CommentList);
      expect(commentList).toHaveProp('addonId', version.addon.id);
      expect(commentList).toHaveProp('fileName', version.selectedPath);
      expect(commentList).toHaveProp('line', lineNumber);
      expect(commentList).toHaveProp('versionId', version.id);
    });

    it('can render a comment and a message for a line', () => {
      const line = nextUniqueId();
      const diff = createDiffWithHunks([
        createHunkWithChanges([
          { new_line_number: line, old_line_number: line },
        ]),
      ]);
      const externalMessages = [{ line, uid: 'message-uid' }];

      const widgets = renderAndGetWidgets({
        diff,
        selectedMessageMap: createFakeLinterMessagesByPath({
          messages: externalMessages,
          path: diff.oldPath,
        }),
      });

      const widget = renderWidget(diff.hunks, widgets, line);

      expect(widget.find(CommentList)).toHaveLength(1);
      expect(widget.find(LinterMessage)).toHaveLength(1);
    });

    it('does not render inline comments for uncommentable lines', () => {
      const _changeCanBeCommentedUpon = jest.fn().mockReturnValue(false);
      const lineNumber = nextUniqueId();
      const version = createInternalVersion({
        ...fakeVersionWithContent,
        id: nextUniqueId(),
      });
      const diff = createDiffWithHunks([
        createHunkWithChanges([
          { new_line_number: lineNumber, old_line_number: lineNumber },
        ]),
      ]);
      const widgets = renderAndGetWidgets({
        _changeCanBeCommentedUpon,
        diff,
        version,
      });

      const widget = renderWidget(diff.hunks, widgets, lineNumber);
      expect(widget.find(CommentList)).toHaveLength(0);
    });

    it('does not render inline comments when the feature is disabled', () => {
      const line = nextUniqueId();
      const version = createInternalVersion({
        ...fakeVersionWithContent,
        id: nextUniqueId(),
      });
      const diff = createDiffWithHunks([
        createHunkWithChanges([
          { new_line_number: line, old_line_number: line },
        ]),
      ]);
      const widgets = renderAndGetWidgets({
        diff,
        enableCommenting: false,
        version,
      });

      const widget = renderWidget(diff.hunks, widgets, line);
      expect(widget.find(CommentList)).toHaveLength(0);
    });
  });

  it('enables syntax highlighting for diffs when possible', () => {
    const _tokenize = jest.fn().mockReturnValue(fakeTokens);
    const root = renderWithLinterProvider({
      _codeCanBeHighlighted: jest.fn(() => true),
      _tokenize,
      diff: createDiffWithHunks([
        createHunkWithChanges([{ content: '// example content' }]),
      ]),
    });

    const diff = root.find(ReactDiffView.Diff);
    expect(diff).toHaveProp('tokens');
    expect(diff.prop('tokens')).toBeDefined();
    expect(_tokenize).toHaveBeenCalled();
    expect(root.find(`.${styles.highlightingDisabled}`)).toHaveLength(0);
  });

  it('disables syntax highlighting when it is not possible', () => {
    const _tokenize = jest.fn();
    const root = renderWithLinterProvider({
      _codeCanBeHighlighted: jest.fn(() => false),
      _tokenize,
      diff: createDiffWithHunks([
        createHunkWithChanges([{ content: '// pretend this is a long line' }]),
      ]),
    });

    expect(root.find(ReactDiffView.Diff)).toHaveProp('tokens', undefined);
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

  it('checks whether code should be trimmed', () => {
    const _codeShouldBeTrimmed = jest.fn();
    const _trimmedCharCount = 10;
    const _slowLoadingLineCount = 10;

    const changeLength = 5;
    const change1 = { content: 'a'.repeat(changeLength) };
    const change2 = { content: 'b'.repeat(changeLength) };
    const diff = createDiffWithHunks([
      createHunkWithChanges([change1, change2]),
    ]);

    renderWithLinterProvider({
      _codeShouldBeTrimmed,
      _trimmedCharCount,
      _slowLoadingLineCount,
      diff,
      isMinified: true,
    });

    expect(_codeShouldBeTrimmed).toHaveBeenCalledWith({
      codeCharLength: changeLength * 2,
      codeLineLength: 2,
      isMinified: true,
      trimmedCharCount: _trimmedCharCount,
      slowLoadingLineCount: _slowLoadingLineCount,
    });
  });

  it('trims files when needed', () => {
    const _codeShouldBeTrimmed = jest.fn().mockReturnValue(true);
    const _trimHunkChars = jest
      .fn()
      .mockReturnValue([createHunkWithChanges([{}])]);

    const root = renderWithLinterProvider({
      _codeShouldBeTrimmed,
      _trimHunkChars,
      isMinified: true,
    });

    expect(_codeShouldBeTrimmed).toHaveBeenCalled();
    expect(_trimHunkChars).toHaveBeenCalled();

    const fadableShell = root.find(FadableContent);
    expect(fadableShell).toHaveProp('fade', true);

    const message = root.find(SlowPageAlert);
    // There should be a warning at the top and bottom.
    expect(message).toHaveLength(2);
  });

  it('does not trim non-minified files by default', () => {
    const _codeShouldBeTrimmed = jest.fn().mockReturnValue(true);
    const _trimHunkChars = jest.fn();

    const root = renderWithLinterProvider({
      _codeShouldBeTrimmed,
      _trimHunkChars,
      isMinified: false,
    });

    expect(_codeShouldBeTrimmed).toHaveBeenCalled();
    expect(_trimHunkChars).not.toHaveBeenCalled();

    expect(root.find(FadableContent)).toHaveProp('fade', false);

    const message = root.find(SlowPageAlert);
    // There should only be a warning at the top (which enables trimming).
    expect(message).toHaveLength(1);
  });

  it('configures SlowPageAlert', () => {
    const _codeShouldBeTrimmed = jest.fn().mockReturnValue(true);
    const _trimHunkChars = jest
      .fn()
      .mockReturnValue([createHunkWithChanges([{}])]);

    const root = renderWithLinterProvider({
      _codeShouldBeTrimmed,
      _trimHunkChars,
      isMinified: false,
    });

    const message = root.find(SlowPageAlert).at(0);

    expect(message).toHaveProp('allowSlowPagesByDefault', true);

    expect(message).toHaveProp('getMessage');
    const getMessage = message.prop('getMessage');

    expect(message).toHaveProp('getLinkText');
    const getLinkText = message.prop('getLinkText');

    // Pass in allowSlowPages=true|false to test messaging.

    expect(getMessage(true)).toEqual('This diff may load slowly.');
    expect(getMessage(false)).toEqual(
      'This diff was shortened to load faster.',
    );

    expect(getLinkText(true)).toEqual('Shorten the diff.');
    expect(getLinkText(false)).toEqual('Show the original diff.');
  });

  describe('getChangeCharCount', () => {
    const changeCharCount = 5;

    it('returns the count of characters in all changes in a single hunk', () => {
      const change1 = { content: 'a'.repeat(changeCharCount) };
      const change2 = { content: 'b'.repeat(changeCharCount) };
      const change3 = { content: 'c'.repeat(changeCharCount) };

      const hunks = [
        createInternalHunkWithChanges([change1, change2, change3]),
      ];

      expect(getChangeCharCount(hunks)).toEqual(changeCharCount * 3);
    });

    it('returns the count of characters in all changes in multiple hunks', () => {
      const hunks = [
        createInternalHunkWithChanges([
          { content: 'a'.repeat(changeCharCount) },
        ]),
        createInternalHunkWithChanges([
          { content: 'b'.repeat(changeCharCount) },
        ]),
      ];

      expect(getChangeCharCount(hunks)).toEqual(changeCharCount * 2);
    });
  });

  describe('trimHunkChars', () => {
    const changeCharCount = 5;

    it('defaults _trimmedCharCount to TRIMMED_CHAR_COUNT', () => {
      const change = {
        content: 'a'.repeat(TRIMMED_CHAR_COUNT + 10),
      };
      const hunk = createInternalHunkWithChanges([change]);

      const trimmed = trimHunkChars({ hunks: [hunk] });
      expect(trimmed[0].changes[0].content.length).toEqual(TRIMMED_CHAR_COUNT);
    });

    describe('for a single hunk', () => {
      it('does not trim when not necessary', () => {
        const hunks = [
          createInternalHunkWithChanges([
            { content: 'a'.repeat(changeCharCount) },
          ]),
        ];

        expect(
          trimHunkChars({ _trimmedCharCount: changeCharCount, hunks }),
        ).toEqual(hunks);
      });

      it('trims chars when there are too many', () => {
        const hunk = createInternalHunkWithChanges([
          { content: 'a'.repeat(changeCharCount * 2) },
        ]);

        const trimmed = trimHunkChars({
          hunks: [hunk],
          _trimmedCharCount: changeCharCount,
        });
        expect(getAllHunkChanges(trimmed)).toHaveLength(2);
        expect(trimmed[0].changes[0]).toEqual({
          ...hunk.changes[0],
          content: hunk.changes[0].content.substring(0, changeCharCount),
        });
        expect(trimmed[0].changes[1]).toEqual(addedChange);
      });
    });

    describe('for multiple hunks', () => {
      it('does not trim when not necessary', () => {
        const hunks = [
          createInternalHunkWithChanges([
            { content: 'a'.repeat(changeCharCount) },
          ]),
          createInternalHunkWithChanges([
            { content: 'b'.repeat(changeCharCount) },
          ]),
        ];

        expect(
          trimHunkChars({ _trimmedCharCount: changeCharCount * 2, hunks }),
        ).toEqual(hunks);
      });

      it('trims chars when there are too many', () => {
        const hunk1 = createInternalHunkWithChanges([
          { content: 'a'.repeat(changeCharCount) },
        ]);
        const hunk2 = createInternalHunkWithChanges([
          { content: 'b'.repeat(changeCharCount * 2) },
        ]);

        const trimmed = trimHunkChars({
          hunks: [hunk1, hunk2],
          _trimmedCharCount: changeCharCount * 2,
        });
        expect(getAllHunkChanges(trimmed)).toHaveLength(3);
        expect(trimmed[0].changes[0]).toEqual(hunk1.changes[0]);
        expect(trimmed[1].changes[0]).toEqual({
          ...hunk1.changes[0],
          content: hunk2.changes[0].content.substring(0, changeCharCount),
        });
        expect(trimmed[1].changes[1]).toEqual(addedChange);
      });
    });
  });

  describe('renderGutter', () => {
    const _renderGutter = ({
      _changeCanBeCommentedUpon = jest.fn().mockReturnValue(true),
      change = fakeChangeInfo,
      defaultGutter = <div />,
      enableCommenting = true,
      renderDefault = jest.fn(),
      side = 'new',
      version = createInternalVersion(fakeVersionWithContent),
      wrapInAnchor = jest.fn().mockReturnValue(defaultGutter),
    }: Partial<ReactDiffView.RenderGutterParams> &
      RenderParams & {
        defaultGutter?: React.ReactElement;
      } = {}) => {
      const diff = createDiffWithHunks([
        createHunkWithChanges([{ content: change.content }]),
      ]);

      const root = renderWithLinterProvider({
        _changeCanBeCommentedUpon,
        diff,
        enableCommenting,
        version,
      });
      const { renderGutter } = root.find(ReactDiffView.Diff).props();
      if (renderGutter) {
        const params: ReactDiffView.RenderGutterParams = {
          change,
          renderDefault,
          inHoverState: false,
          side,
          wrapInAnchor,
        };
        return shallow(<div>{renderGutter(params)}</div>);
      }
      throw new Error('renderGutter was undefined, but it should not be');
    };

    it('adds a commentable div to the gutter for a change that can be commented upon', () => {
      const change = fakeChangeInfo;
      const className = 'test-class';
      const defaultGutter = <div className={className} />;
      const renderDefault = jest.fn();
      const version = createInternalVersion(fakeVersionWithContent);
      const wrapInAnchor = jest.fn().mockReturnValue(defaultGutter);
      const gutter = _renderGutter({
        change,
        renderDefault,
        version,
        wrapInAnchor,
      });

      const commentableDiv = gutter.find(Commentable);

      expect(commentableDiv).toHaveLength(1);
      expect(commentableDiv).toHaveProp('line', change.lineNumber);
      expect(commentableDiv).toHaveProp('fileName', version.selectedPath);
      expect(commentableDiv).toHaveProp('versionId', version.id);

      expect(renderDefault).toHaveBeenCalled();
      expect(wrapInAnchor).toHaveBeenCalled();
    });

    it('passes expected children to the commentable div', () => {
      const AddComment = () => <button type="button">Add</button>;
      const className = 'test-class';
      const defaultGutter = <div className={className} />;
      const gutter = _renderGutter({
        defaultGutter,
      });

      const { renderContent } = simulateCommentable({
        addCommentButton: <AddComment />,
        root: gutter,
      });
      const commentableChildren = renderContent();

      expect(commentableChildren.find(`.${className}`)).toHaveLength(1);
      expect(commentableChildren.find(AddComment)).toHaveLength(1);
    });

    it('does not change the gutter when the feature is turned off', () => {
      const className = 'test-class';
      const defaultGutter = <div className={className} />;
      const gutter = _renderGutter({ defaultGutter, enableCommenting: false });

      expect(gutter.find(Commentable)).toHaveLength(0);
      expect(gutter.find(`.${className}`)).toHaveLength(1);
    });

    it('does not change the gutter when the change cannot be commented upon', () => {
      const _changeCanBeCommentedUpon = jest.fn().mockReturnValue(false);
      const className = 'test-class';
      const defaultGutter = <div className={className} />;
      const gutter = _renderGutter({
        _changeCanBeCommentedUpon,
        defaultGutter,
      });

      expect(gutter.find(Commentable)).toHaveLength(0);
      expect(gutter.find(`.${className}`)).toHaveLength(1);
    });

    it('does not change the gutter when lineNumber is falsey', () => {
      const className = 'test-class';
      const defaultGutter = <div className={className} />;
      const change = { ...fakeChangeInfo, lineNumber: undefined };
      const gutter = _renderGutter({
        change,
        defaultGutter,
      });

      expect(gutter.find(Commentable)).toHaveLength(0);
      expect(gutter.find(`.${className}`)).toHaveLength(1);
    });

    it('does not change the gutter when side is not "new"', () => {
      const className = 'test-class';
      const defaultGutter = <div className={className} />;
      const gutter = _renderGutter({
        defaultGutter,
        side: 'old',
      });

      expect(gutter.find(Commentable)).toHaveLength(0);
      expect(gutter.find(`.${className}`)).toHaveLength(1);
    });
  });

  describe('changeCanBeCommentedUpon', () => {
    it.each([changeTypes.insert, changeTypes.normal])(
      'returns true for a(n) %s change',
      (type) => {
        const change = {
          ...fakeChangeInfo,
          type,
        };

        expect(changeCanBeCommentedUpon(change)).toEqual(true);
      },
    );

    it.each([
      changeTypes.delete,
      changeTypes.deleteEofnl,
      changeTypes.insertEofnl,
      changeTypes.normalEofnl,
    ])('returns false for a(n) %s change', (type) => {
      const change = {
        ...fakeChangeInfo,
        type,
      };

      expect(changeCanBeCommentedUpon(change)).toEqual(false);
    });
  });
});
