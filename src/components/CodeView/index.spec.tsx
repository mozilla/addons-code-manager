import queryString from 'query-string';
import * as React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Location } from 'history';
import { mount } from 'enzyme';
import { Store } from 'redux';

import configureStore from '../../configureStore';
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
  createContextWithFakeRouter,
  createFakeExternalLinterResult,
  createFakeLocation,
  fakeExternalLinterMessage,
  fakeVersion,
  shallowUntilTarget,
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

  const getProps = (otherProps = {}) => {
    return {
      content: 'some content',
      linterMessagesByLine: undefined,
      mimeType: 'mime/type',
      version: createInternalVersion(fakeVersion),
      ...otherProps,
    };
  };

  const render = ({
    location = createFakeLocation(),
    ...otherProps
  }: RenderParams = {}) => {
    return shallowUntilTarget(
      <CodeView {...getProps(otherProps)} />,
      CodeViewBase,
      {
        shallowOptions: createContextWithFakeRouter({ location }),
      },
    );
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

  const renderWithMount = ({
    location = createFakeLocation(),
    store = configureStore(),
    ...otherProps
  }: RenderParams = {}) => {
    const options = createContextWithFakeRouter({ location });
    return mount(<CodeView {...getProps(otherProps)} />, {
      ...options,
      childContextTypes: {
        ...options.childContextTypes,
        store: PropTypes.object.isRequired,
      },
      context: {
        ...options.context,
        store,
      },
    });
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
    const root = renderWithLinterProvider({ mimeType });

    expect(root.find(`.${styles.CodeView}`)).toHaveLength(1);
    expect(root.find(`.${styles.lineNumber}`)).toHaveLength(1);
    expect(root.find(`.${styles.code}`)).toHaveLength(1);
    expect(root.find(`.${styles.highlightedCode}`)).toHaveLength(1);
    expect(root.find('.language-text')).toHaveLength(1);
  });

  it('renders highlighted code when language is supported', () => {
    const content = '{ "foo": "bar" }';
    const mimeType = 'application/json';
    const root = renderWithLinterProvider({ mimeType, content });

    expect(root.find(`.${styles.lineNumber}`)).toHaveLength(1);
    expect(root.find(`.${styles.code}`)).toHaveLength(1);
    expect(root.find(`.${styles.highlightedCode}`)).toHaveLength(1);

    expect(root.find('.language-json')).toHaveLength(1);
    expect(root.find('.language-json')).toHaveProp(
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

  it('renders multiple lines of code', () => {
    const contentLines = ['{', '"foo":"bar"', '"some": "other-value"', '}'];
    const content = contentLines.join('\n');

    const mimeType = 'application/json';
    const root = renderWithLinterProvider({ mimeType, content });

    expect(root.find(`.${styles.lineNumber}`)).toHaveLength(
      contentLines.length,
    );
    expect(root.find(`.${styles.code}`)).toHaveLength(contentLines.length);
  });

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
    const root = renderWithLinterProvider({ content: 'single line', location });

    expect(root.find(`.${styles.lineNumber}`)).toHaveLength(1);
    expect(root.find(`.${styles.lineNumber}`).find(Link)).toHaveLength(1);
    expect(root.find(`.${styles.lineNumber}`).find(Link)).toHaveProp('to', {
      ...location,
      hash: getCodeLineAnchor(1),
    });
    // This is an anchor on the table row. This is a bit confusing here because
    // `#` refers to the ID (CSS) selector and not the hash. The ID value is
    // `I1`.
    expect(root.find(`#${getCodeLineAnchorID(1)}`)).toHaveLength(1);
  });

  it('calls _scrollToSelectedLine() when rendering a selected line', () => {
    const selectedLine = 2;
    const lines = ['first', 'second'];
    const content = lines.join('\n');
    const location = createFakeLocation({
      hash: getCodeLineAnchor(selectedLine),
    });
    const _scrollToSelectedLine = jest.fn();

    // We need `mount()` because `ref` is only used in a DOM environment.
    const root = renderWithMount({ _scrollToSelectedLine, content, location });

    expect(_scrollToSelectedLine).toHaveBeenCalledWith(
      root.find(`#${getCodeLineAnchorID(selectedLine)}`).getDOMNode(),
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
    const root = render({ version });

    const provider = root.find(LinterProvider);
    expect(provider).toHaveProp('versionId', version.id);
    expect(provider).toHaveProp('validationURL', version.validationURL);
    expect(provider).toHaveProp('selectedPath', version.selectedPath);
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
