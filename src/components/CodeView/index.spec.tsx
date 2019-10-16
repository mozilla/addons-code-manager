import queryString from 'query-string';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { Location } from 'history';
import { Store } from 'redux';

import refractor from '../../refractor';
import FadableContent from '../FadableContent';
import LinterMessage from '../LinterMessage';
import LinterProvider, { LinterProviderInfo } from '../LinterProvider';
import GlobalLinterMessages from '../GlobalLinterMessages';
import SlowPageAlert from '../SlowPageAlert';
import { ExternalLinterMessage, getMessageMap } from '../../reducers/linter';
import { createInternalVersion } from '../../reducers/versions';
import { getCodeLineAnchor, getCodeLineAnchorID, mapWithDepth } from './utils';
import { allowSlowPagesParam, getLanguageFromMimeType } from '../../utils';
import {
  SimulateCommentListParams,
  SimulateCommentableParams,
  createContextWithFakeRouter,
  createFakeExternalLinterResult,
  createFakeLocation,
  fakeExternalLinterMessage,
  fakeVersion,
  shallowUntilTarget,
  simulateCommentList,
  simulateCommentable,
  simulateLinterProvider,
} from '../../test-helpers';
import styles from './styles.module.scss';

import CodeView, {
  CodeViewBase,
  DefaultProps,
  PublicProps,
  scrollToSelectedLine,
} from '.';

describe(__filename, () => {
  type RenderParams = Partial<PublicProps> &
    Partial<DefaultProps> & {
      location?: Location<{}>;
      store?: Store;
    };

  const createGlobalExternalMessage = (props = {}) => {
    return {
      ...fakeExternalLinterMessage,
      ...props,
      // When a message isn't associated with a line, it's global.
      column: null,
      line: null,
    };
  };

  const render = ({
    location = createFakeLocation(),
    ...otherProps
  }: RenderParams = {}) => {
    const props = {
      content: 'some content',
      linterMessagesByLine: undefined,
      mimeType: 'mime/type',
      selectedPath: 'selected.path',
      version: createInternalVersion(fakeVersion),
      ...otherProps,
    };
    return shallowUntilTarget(<CodeView {...props} />, CodeViewBase, {
      shallowOptions: createContextWithFakeRouter({ location }),
    });
  };

  type RenderWithLinterProviderParams = Partial<LinterProviderInfo> &
    RenderParams;

  const renderWithLinterProvider = ({
    messageMap = undefined,
    messagesAreLoading = false,
    selectedMessageMap = undefined,
    ...renderParams
  }: RenderWithLinterProviderParams = {}) => {
    const root = render(renderParams);

    return simulateLinterProvider(root, {
      messageMap,
      messagesAreLoading,
      selectedMessageMap,
    });
  };

  const simulateCommentableLine = ({
    addCommentButton,
    ...props
  }: Pick<SimulateCommentableParams, 'addCommentButton'> &
    Partial<RenderWithLinterProviderParams> = {}) => {
    const provider = renderWithLinterProvider(props);
    return {
      ...simulateCommentable({ addCommentButton, root: provider }),
      provider,
    };
  };

  const simulateInlineCommentList = ({
    commentList,
    ...props
  }: Pick<SimulateCommentListParams, 'commentList'> &
    Partial<RenderWithLinterProviderParams> = {}) => {
    const provider = renderWithLinterProvider(props);
    return {
      ...simulateCommentList({ commentList, root: provider }),
      provider,
    };
  };

  type RenderWithMessagesParams = RenderParams & {
    messages: Partial<ExternalLinterMessage>[];
  };

  const renderWithMessages = ({
    messages,
    ...props
  }: RenderWithMessagesParams) => {
    const file = 'scripts/content.js';
    const map = getMessageMap(
      createFakeExternalLinterResult({
        messages: messages.map((msg) => {
          return { ...msg, file };
        }),
      }),
    );

    const contentLines = [
      'function getName() {',
      '  document.querySelector("#name")',
      '}',
    ];

    const selectedMessageMap = map.byPath[file];

    const root = renderWithLinterProvider({
      messageMap: map,
      selectedMessageMap,
      content: contentLines.join('\n'),
      ...props,
    });

    return { root, selectedMessageMap };
  };

  const renderSlowLoadingCode = ({
    _slowLoadingLineCount = 3,
    contentLineCount,
    content = new Array(
      contentLineCount !== undefined
        ? contentLineCount
        : // Simulate a long file (which will load slowly) by exceeding the
          // line limit.
          _slowLoadingLineCount + 1,
    )
      .fill('// example code')
      .join('\n'),
    ...moreProps
  }: RenderParams & { contentLineCount?: number } = {}) => {
    return renderWithLinterProvider({
      _slowLoadingLineCount,
      content,
      ...moreProps,
    });
  };

  it('renders plain text code when mime type is not supported', () => {
    const mimeType = 'mime/type';
    const { provider, renderContent } = simulateCommentableLine({
      mimeType,
    });
    const line = renderContent();

    expect(provider.find(`.${styles.CodeView}`)).toHaveLength(1);
    expect(line.find(`.${styles.lineNumber}`)).toHaveLength(1);
    expect(line.find(`.${styles.code}`)).toHaveLength(1);
    expect(line.find(`.${styles.highlightedCode}`)).toHaveLength(1);
    expect(line.find('.language-text')).toHaveLength(1);
  });

  it('renders highlighted code when language is supported', () => {
    const content = '{ "foo": "bar" }';
    const mimeType = 'application/json';
    const { renderContent } = simulateCommentableLine({
      mimeType,
      content,
    });
    const line = renderContent();

    expect(line.find(`.${styles.lineNumber}`)).toHaveLength(1);
    expect(line.find(`.${styles.code}`)).toHaveLength(1);
    expect(line.find(`.${styles.highlightedCode}`)).toHaveLength(1);

    expect(line.find('.language-json')).toHaveLength(1);
    expect(line.find('.language-json')).toHaveProp(
      'children',
      refractor
        .highlight(content, getLanguageFromMimeType(mimeType))
        .map(mapWithDepth(0)),
    );
  });

  it('handles empty content', () => {
    const root = renderWithLinterProvider({ content: '' });

    expect(root.find(`.${styles.tableBody}`)).toHaveProp('children', []);
  });

  const contentLines = ['{', '"foo":"bar"', '"some": "other-value"', '}'];

  it.each(contentLines.map((value, index) => index))(
    'renders a multiline example at index %s',
    (index) => {
      const content = contentLines.join('\n');

      const { shell, renderContent } = simulateCommentableLine({
        mimeType: 'application/json',
        content,
      });

      const line = renderContent(shell.at(index));
      expect(line.find(`.${styles.lineNumber}`)).toHaveLength(1);
      expect(line.find(`.${styles.code}`)).toHaveLength(1);
    },
  );

  it('renders an HTML ID for each line', () => {
    const root = renderWithLinterProvider({ content: 'line 1\nline 2' });

    expect(root.find(`.${styles.line}`)).toHaveLength(2);
    expect(root.find(`.${styles.line}`).at(0)).toHaveProp(
      'id',
      getCodeLineAnchorID(1),
    );
    expect(root.find(`.${styles.line}`).at(1)).toHaveProp(
      'id',
      getCodeLineAnchorID(2),
    );
  });

  it('marks a row as selected', () => {
    const selectedLine = 2;
    const location = createFakeLocation({
      hash: getCodeLineAnchor(selectedLine),
    });

    const root = renderWithLinterProvider({
      content: 'line 1\nline 2',
      location,
    });

    expect(root.find(`.${styles.selectedLine}`)).toHaveLength(1);
    expect(root.find(`.${styles.selectedLine}`)).toHaveProp(
      'id',
      getCodeLineAnchorID(selectedLine),
    );
  });

  it('renders a link for each line number', () => {
    const location = createFakeLocation();
    const { renderContent, shell } = simulateCommentableLine({
      content: 'single line',
      location,
    });

    const line = renderContent();

    expect(line.find(`.${styles.lineNumber}`)).toHaveLength(1);
    expect(line.find(`.${styles.lineNumber}`).find(Link)).toHaveLength(1);
    expect(line.find(`.${styles.lineNumber}`).find(Link)).toHaveProp('to', {
      ...location,
      hash: getCodeLineAnchor(1),
    });
    expect(shell).toHaveProp('id', getCodeLineAnchorID(1));
  });

  it('passes a _scrollToSelectedLine() ref when rendering a selected line', () => {
    const selectedLine = 2;
    const lines = ['first', 'second'];
    const content = lines.join('\n');
    const location = createFakeLocation({
      // This causes the corresponding line to be selected.
      hash: getCodeLineAnchor(selectedLine),
    });
    const _scrollToSelectedLine = jest.fn();

    const { shell } = simulateCommentableLine({
      _scrollToSelectedLine,
      content,
      location,
    });

    expect(shell.at(0)).toHaveProp('shellRef', undefined);

    expect(shell.at(selectedLine - 1)).toHaveProp(
      'shellRef',
      _scrollToSelectedLine,
    );
    expect(shell.at(selectedLine - 1)).toHaveProp(
      'id',
      getCodeLineAnchorID(selectedLine),
    );
  });

  it('renders a LinterMessage on a line', () => {
    const line = 2;

    const { root, selectedMessageMap } = renderWithMessages({
      messages: [{ line }],
    });

    const message = root.find(`#line-${line}-messages`).find(LinterMessage);

    expect(message).toHaveLength(1);
    expect(message).toHaveProp('message', selectedMessageMap.byLine[line][0]);
  });

  it('renders multiple LinterMessage components on one line', () => {
    const line = 2;

    const { root, selectedMessageMap } = renderWithMessages({
      messages: [{ line, uid: 'first' }, { line, uid: 'second' }],
    });

    const message = root.find(`#line-${line}-messages`).find(LinterMessage);

    expect(message).toHaveLength(2);

    const messagesAtLine = selectedMessageMap.byLine[line];
    expect(message.at(0)).toHaveProp('message', messagesAtLine[0]);
    expect(message.at(1)).toHaveProp('message', messagesAtLine[1]);
  });

  it('renders LinterMessage components on multiple lines', () => {
    const { root, selectedMessageMap } = renderWithMessages({
      messages: [{ line: 2, uid: 'first' }, { line: 3, uid: 'second' }],
    });

    expect(root.find('#line-2-messages').find(LinterMessage)).toHaveProp(
      'message',
      selectedMessageMap.byLine[2][0],
    );

    expect(root.find('#line-3-messages').find(LinterMessage)).toHaveProp(
      'message',
      selectedMessageMap.byLine[3][0],
    );
  });

  it('configures LinterProvider', () => {
    const version = createInternalVersion(fakeVersion);
    const selectedPath = 'sel.file';
    const root = render({ selectedPath, version });

    const provider = root.find(LinterProvider);
    expect(provider).toHaveProp('versionId', version.id);
    expect(provider).toHaveProp('validationURL', version.validationURL);
    expect(provider).toHaveProp('selectedPath', selectedPath);
  });

  it('renders a global LinterMessage', () => {
    const uid = 'some-global-message-id';
    const externalMessage = createGlobalExternalMessage({ uid });

    const { root } = renderWithMessages({
      messages: [externalMessage],
    });

    const globalLinterMessages = root.find(GlobalLinterMessages);
    expect(globalLinterMessages).toHaveLength(1);
    expect(globalLinterMessages).toHaveProp('messages', [
      expect.objectContaining({ uid }),
    ]);
  });

  it('renders all global LinterMessage components', () => {
    const firstUid = 'first-uid';
    const secondUid = 'second-uid';

    const { root } = renderWithMessages({
      messages: [
        createGlobalExternalMessage({ uid: firstUid }),
        createGlobalExternalMessage({ uid: secondUid }),
      ],
    });

    const globalLinterMessages = root.find(GlobalLinterMessages);
    expect(globalLinterMessages).toHaveLength(1);
    expect(globalLinterMessages).toHaveProp('messages', [
      expect.objectContaining({ uid: firstUid }),
      expect.objectContaining({ uid: secondUid }),
    ]);
  });

  it('renders a containerRef at GlobalLinterMessages component, if line 0 is selected', () => {
    const firstUid = 'first-uid';
    const secondUid = 'second-uid';
    const id = getCodeLineAnchorID(0);
    const location = createFakeLocation({ hash: `#${id}` });

    const { root } = renderWithMessages({
      location,
      messages: [
        createGlobalExternalMessage({ uid: firstUid }),
        createGlobalExternalMessage({ uid: secondUid }),
      ],
    });

    expect(root.find(GlobalLinterMessages).props().containerRef).toBeTruthy();
  });

  it('does not render a containerRef at GlobalLinterMessages component, if line 0 is not selected', () => {
    const location = createFakeLocation({ hash: '#I1' });

    const { root } = renderWithMessages({
      location,
      messages: [createGlobalExternalMessage()],
    });

    expect(root.find(GlobalLinterMessages)).toHaveProp(
      'containerRef',
      undefined,
    );
  });

  it('does not render messages at GlobalLinterMessages component, if there are no global messages', () => {
    const id = getCodeLineAnchorID(0);
    const location = createFakeLocation({ hash: `#${id}` });

    const { root } = renderWithMessages({
      location,
      messages: [{ line: 1 }],
    });

    expect(root.find(GlobalLinterMessages)).toHaveProp('messages', []);
  });

  it('trims the code when too long', () => {
    const _slowLoadingLineCount = 2;
    const root = renderSlowLoadingCode({ _slowLoadingLineCount });

    const fadable = root.find(FadableContent);
    expect(fadable).toHaveProp('fade', true);

    expect(fadable.find(`.${styles.line}`)).toHaveLength(_slowLoadingLineCount);

    // Show the warning twice: top and bottom.
    expect(root.find(SlowPageAlert)).toHaveLength(2);
  });

  it('does not trim code when slow pages are allowed', () => {
    const contentLineCount = 3;
    const location = createFakeLocation({
      search: queryString.stringify({ [allowSlowPagesParam]: true }),
    });
    const root = renderSlowLoadingCode({
      _slowLoadingLineCount: contentLineCount - 1,
      contentLineCount,
      location,
    });

    const fadable = root.find(FadableContent);
    expect(fadable).toHaveProp('fade', false);

    expect(fadable.find(`.${styles.line}`)).toHaveLength(contentLineCount);

    // The warning should only be shown once, at the top.
    expect(root.find(SlowPageAlert)).toHaveLength(1);
  });

  it('configures SlowPageAlert', () => {
    const location = createFakeLocation();
    const root = renderSlowLoadingCode({ location });

    const message = root.find(SlowPageAlert).at(0);

    expect(message).toHaveProp('location', location);

    expect(message).toHaveProp('getMessage');
    expect(message).toHaveProp('getLinkText');

    const getMessage = message.prop('getMessage');
    const getLinkText = message.prop('getLinkText');

    // Pass in allowSlowPages=true|false to test messaging.

    expect(getMessage(true)).toEqual('This file is loading slowly.');
    expect(getMessage(false)).toEqual(
      'This file has been shortened to load faster.',
    );

    expect(getLinkText(true)).toEqual('View a shortened file.');
    expect(getLinkText(false)).toEqual('View the original file.');
  });

  describe('add comment button', () => {
    it('renders an add comment button on each line', () => {
      const AddComment = () => <button type="button">Add</button>;

      const { shell, renderContent } = simulateCommentableLine({
        addCommentButton: <AddComment />,
        content: 'first line \nsecond line',
        enableCommenting: true,
      });

      const line1 = renderContent(shell.at(0));
      expect(line1.find(AddComment)).toHaveLength(1);

      const line2 = renderContent(shell.at(1));
      expect(line2.find(AddComment)).toHaveLength(1);
    });

    it('does not render add comment buttons when the feature is disabled', () => {
      const AddComment = () => <button type="button">Add</button>;

      const { shell, renderContent } = simulateCommentableLine({
        addCommentButton: <AddComment />,
        content: 'single line of code',
        enableCommenting: false,
      });

      expect(renderContent(shell.at(0)).find(AddComment)).toHaveLength(0);
    });
  });

  describe('comment list', () => {
    it('renders a comment list', () => {
      const version = createInternalVersion(fakeVersion);
      const selectedPath = 'sel1.file';
      const { shell } = simulateInlineCommentList({
        content: 'single line of code',
        enableCommenting: true,
        selectedPath,
        version,
      });

      expect(shell).toHaveProp('addonId', version.addon.id);
      expect(shell).toHaveProp('fileName', selectedPath);
      expect(shell).toHaveProp('line', 1);
      expect(shell).toHaveProp('versionId', version.id);
    });

    it('does not render a comment list when the feature is disabled', () => {
      const { shell } = simulateInlineCommentList({
        enableCommenting: false,
      });

      expect(shell).toHaveLength(0);
    });

    it('renders comment list content for each line', () => {
      const CommentListResult = () => <div />;

      const { shell, renderContent } = simulateInlineCommentList({
        commentList: <CommentListResult />,
        content: 'first line \nsecond line',
        enableCommenting: true,
      });

      const line1Shell = shell.at(0);
      expect(line1Shell).toHaveProp('line', 1);

      const line1 = renderContent(line1Shell);
      expect(line1.find(CommentListResult)).toHaveLength(1);

      const line2Shell = shell.at(1);
      expect(line2Shell).toHaveProp('line', 2);

      const line2 = renderContent(line2Shell);
      expect(line2.find(CommentListResult)).toHaveLength(1);
    });
  });

  describe('scrollToSelectedLine', () => {
    it('calls scrollIntoView() when the element is not null', () => {
      const element = {
        // Create a HTMLTableRowElement that we can override.
        ...document.createElement('tr'),
        scrollIntoView: jest.fn(),
      };

      scrollToSelectedLine(element);

      expect(element.scrollIntoView).toHaveBeenCalled();
    });

    it('does not break when the element is null', () => {
      const element = null;

      scrollToSelectedLine(element);
    });
  });
});
