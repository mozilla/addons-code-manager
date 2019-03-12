import * as React from 'react';
import { Link } from 'react-router-dom';
import { Location } from 'history';
import { mount } from 'enzyme';

import refractor from '../../refractor';
import LinterMessage from '../LinterMessage';
import {
  LinterMessage as LinterMessageType,
  getMessageMap,
} from '../../reducers/linter';
import { mapWithDepth } from './utils';
import { getLanguageFromMimeType } from '../../utils';
import {
  createContextWithFakeRouter,
  createFakeExternalLinterResult,
  createFakeLocation,
  shallowUntilTarget,
} from '../../test-helpers';
import styles from './styles.module.scss';

import CodeView, { CodeViewBase, PublicProps, scrollToSelectedLine } from '.';

describe(__filename, () => {
  type RenderParams = Partial<PublicProps> & {
    location?: Location<{}>;
  };

  const getProps = (otherProps = {}) => {
    return {
      content: 'some content',
      linterMessagesByLine: undefined,
      mimeType: 'mime/type',
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

  const renderWithMount = ({
    location = createFakeLocation(),
    ...otherProps
  }: RenderParams = {}) => {
    return mount(
      <CodeView {...getProps(otherProps)} />,
      createContextWithFakeRouter({ location }),
    );
  };

  const renderWithMessages = ({
    file,
    messages,
    ...props
  }: {
    file: string;
    messages: Partial<LinterMessageType>[];
    props?: RenderParams;
  }) => {
    const map = getMessageMap(
      createFakeExternalLinterResult({
        messages: messages.map((msg) => {
          if (msg.file !== file) {
            throw new Error(
              `message uid:${msg.uid} has file "${
                msg.file
              }" but needs to have "${file}"`,
            );
          }
          return msg;
        }),
      }),
    );

    const contentLines = [
      'function getName() {',
      '  document.querySelector("#name")',
      '}',
    ];

    const root = render({
      linterMessagesByLine: map[file].byLine,
      content: contentLines.join('\n'),
      ...props,
    });

    return { root, map };
  };

  it('renders plain text code when mime type is not supported', () => {
    const mimeType = 'mime/type';
    const root = render({ mimeType });

    expect(root.find(`.${styles.CodeView}`)).toHaveLength(1);
    expect(root.find(`.${styles.lineNumber}`)).toHaveLength(1);
    expect(root.find(`.${styles.code}`)).toHaveLength(1);
    expect(root.find(`.${styles.highlightedCode}`)).toHaveLength(1);
    expect(root.find('.language-text')).toHaveLength(1);
  });

  it('renders highlighted code when language is supported', () => {
    const content = '{ "foo": "bar" }';
    const mimeType = 'application/json';
    const root = render({ mimeType, content });

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
    const content = '';
    const mimeType = 'text/css';
    const root = render({ mimeType, content });

    expect(root.find('.language-css')).toHaveProp('children', content);
  });

  it('renders multiple lines of code', () => {
    const contentLines = ['{', '"foo":"bar"', '"some": "other-value"', '}'];
    const content = contentLines.join('\n');

    const mimeType = 'application/json';
    const root = render({ mimeType, content });

    expect(root.find(`.${styles.lineNumber}`)).toHaveLength(
      contentLines.length,
    );
    expect(root.find(`.${styles.code}`)).toHaveLength(contentLines.length);
  });

  it('renders an HTML ID for each line', () => {
    const root = render({ content: 'line 1\nline 2' });

    expect(root.find(`.${styles.line}`)).toHaveLength(2);
    expect(root.find(`.${styles.line}`).at(0)).toHaveProp('id', 'L1');
    expect(root.find(`.${styles.line}`).at(1)).toHaveProp('id', 'L2');
  });

  it('marks a row as selected', () => {
    const selectedLine = 2;
    const location = createFakeLocation({ hash: `#L${selectedLine}` });

    const root = render({ content: 'line 1\nline 2', location });

    expect(root.find(`.${styles.selectedLine}`)).toHaveLength(1);
    expect(root.find(`.${styles.selectedLine}`)).toHaveProp(
      'id',
      `L${selectedLine}`,
    );
  });

  it('renders a link for each line number', () => {
    const root = render({ content: 'single line' });

    expect(root.find(`.${styles.lineNumber}`)).toHaveLength(1);
    expect(root.find(`.${styles.lineNumber}`).find(Link)).toHaveLength(1);
    expect(root.find(`.${styles.lineNumber}`).find(Link)).toHaveProp(
      'to',
      '#L1',
    );
    // This is an anchor on the table row. This is a bit confusing here because
    // `#` refers to the ID (CSS) selector and not the hash. The ID value is
    // `L1`.
    expect(root.find('#L1')).toHaveLength(1);
  });

  it('calls _scrollToSelectedLine() when rendering a selected line', () => {
    const selectedLine = 2;
    const lines = ['first', 'second'];
    const content = lines.join('\n');
    const location = createFakeLocation({ hash: `#L${selectedLine}` });
    const _scrollToSelectedLine = jest.fn();

    // We need `mount()` because `ref` is only used in a DOM environment.
    const root = renderWithMount({ _scrollToSelectedLine, content, location });

    expect(_scrollToSelectedLine).toHaveBeenCalledWith(
      root.find(`#L${selectedLine}`).getDOMNode(),
    );
  });

  it('renders a LinterMessage on a line', () => {
    const line = 2;
    const file = 'scripts/content.js';

    const { map, root } = renderWithMessages({
      file,
      messages: [{ file, line }],
    });

    const message = root.find(`#line-${line}-messages`).find(LinterMessage);

    expect(message).toHaveLength(1);
    expect(message).toHaveProp('message', map[file].byLine[line][0]);
  });

  it('renders multiple LinterMessage components on one line', () => {
    const line = 2;
    const file = 'scripts/content.js';

    const { map, root } = renderWithMessages({
      file,
      messages: [{ file, line, uid: 'first' }, { file, line, uid: 'second' }],
    });

    const message = root.find(`#line-${line}-messages`).find(LinterMessage);

    expect(message).toHaveLength(2);

    const messagesAtLine = map[file].byLine[line];
    expect(message.at(0)).toHaveProp('message', messagesAtLine[0]);
    expect(message.at(1)).toHaveProp('message', messagesAtLine[1]);
  });

  it('renders LinterMessage components on multiple lines', () => {
    const file = 'scripts/content.js';

    const { map, root } = renderWithMessages({
      file,
      messages: [
        { file, line: 2, uid: 'first' },
        { file, line: 3, uid: 'second' },
      ],
    });

    expect(root.find('#line-2-messages').find(LinterMessage)).toHaveProp(
      'message',
      map[file].byLine[2][0],
    );

    expect(root.find('#line-3-messages').find(LinterMessage)).toHaveProp(
      'message',
      map[file].byLine[3][0],
    );
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
