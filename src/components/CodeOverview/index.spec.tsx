import * as React from 'react';
import { Location } from 'history';
import { Link } from 'react-router-dom';
import { ShallowWrapper } from 'enzyme';
import debounce from 'lodash.debounce';

import { ExternalLinterMessage, getMessageMap } from '../../reducers/linter';
import { createInternalVersion } from '../../reducers/versions';
import { getCodeLineAnchor, GLOBAL_LINTER_ANCHOR_ID } from '../CodeView/utils';
import CodeLineShapes from '../CodeLineShapes';
import { AllLineShapes, generateLineShapes } from '../CodeLineShapes/utils';
import LinterProvider, { LinterProviderInfo } from '../LinterProvider';
import {
  createContextWithFakeRouter,
  createFakeExternalLinterResult,
  createFakeLocation,
  createFakeRef,
  fakeVersionWithContent,
  getInstance,
  shallowUntilTarget,
  simulateLinterProvider,
  spyOn,
} from '../../test-helpers';
import styles from './styles.module.scss';

import CodeOverview, { CodeOverviewBase, Props as CodeOverviewProps } from '.';

describe(__filename, () => {
  const createFakeWindow = () => {
    return {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
  };

  type RenderParams = Partial<CodeOverviewProps> & {
    location?: Location<{}>;
  };

  const getProps = ({
    // This is a stub replacement for debounce that behaves the same but
    // without any debouncing.
    _debounce = (func) => debounce(func, 0, { leading: true }),
    ...otherProps
  }: RenderParams = {}) => {
    return {
      _debounce,
      _window: createFakeWindow(),
      content: 'example code content',
      version: createInternalVersion(fakeVersionWithContent),
      ...otherProps,
    };
  };

  const render = ({
    location = createFakeLocation(),
    ...otherProps
  }: RenderParams = {}) => {
    const props = getProps(otherProps);

    return shallowUntilTarget(<CodeOverview {...props} />, CodeOverviewBase, {
      shallowOptions: createContextWithFakeRouter({ location }),
    });
  };

  const renderWithInstance = (props = {}) => {
    const root = render(props);
    return {
      root,
      instance: getInstance<CodeOverviewBase>(root),
    };
  };

  type RenderWithLinterProviderParams = Partial<LinterProviderInfo> &
    RenderParams;

  const renderWithLinterProvider = ({
    messageMap = undefined,
    messagesAreLoading = false,
    selectedMessageMap = undefined,
    root = undefined,
    ...renderParams
  }: RenderWithLinterProviderParams & { root?: ShallowWrapper } = {}) => {
    let lazyRoot = root;
    if (!lazyRoot) {
      lazyRoot = render(renderParams);
    }

    return simulateLinterProvider(lazyRoot, {
      messageMap,
      messagesAreLoading,
      selectedMessageMap,
    });
  };

  const generateFileLines = ({ count }: { count: number }) => {
    return new Array(count)
      .fill('')
      .map((i) => `// This is line ${i + 1} of the code`);
  };

  type RenderWithMessagesParams = {
    contentLines?: string[];
    messages: Partial<ExternalLinterMessage>[];
    overviewHeight?: number;
  } & RenderParams;

  const renderWithMessages = ({
    contentLines = generateFileLines({ count: 10 }),
    messages,
    overviewHeight = 400,
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

    const selectedMessageMap = map.byPath[file];

    const root = render({ ...props, content: contentLines.join('\n') });
    root.setState({ overviewHeight });

    const innerRoot = renderWithLinterProvider({
      messageMap: map,
      selectedMessageMap,
      root,
    });

    return { innerRoot, root, selectedMessageMap };
  };

  const renderWithMessagesInNormGrid = ({
    messages,
    ...props
  }: RenderWithMessagesParams) => {
    return renderWithMessages({
      messages,
      // Normalize the grid parameters.
      // This makes line assertions easier because lines will map to rows 1:1.
      rowHeight: 1,
      overviewPadding: 0,
      rowTopPadding: 0,
      ...props,
    });
  };

  const renderWithFixedHeight = (
    props: RenderParams = {},
    { overviewHeight = 400 } = {},
  ) => {
    const root = render(props);
    root.setState({ overviewHeight });
    return renderWithLinterProvider({ root });
  };

  it('configures LinterProvider', () => {
    const version = createInternalVersion(fakeVersionWithContent);
    const root = render({ version });

    const provider = root.find(LinterProvider);
    expect(provider).toHaveProp('versionId', version.id);
    expect(provider).toHaveProp('validationURL', version.validationURL);
    expect(provider).toHaveProp('selectedPath', version.selectedPath);
  });

  it('adds and removes event listeners', () => {
    const _window = createFakeWindow();

    const { root, instance } = renderWithInstance({ _window });
    const { resetOverviewHeight, waitAndSetNewOverviewHeight } = instance;

    expect(_window.addEventListener).toHaveBeenCalledWith(
      'resize',
      resetOverviewHeight,
    );
    expect(_window.addEventListener).toHaveBeenCalledWith(
      'resize',
      waitAndSetNewOverviewHeight,
    );

    root.unmount();

    expect(_window.removeEventListener).toHaveBeenCalledWith(
      'resize',
      resetOverviewHeight,
    );
    expect(_window.removeEventListener).toHaveBeenCalledWith(
      'resize',
      waitAndSetNewOverviewHeight,
    );
  });

  it('sets the overview height on mount', () => {
    const fakeRef = createFakeRef({ clientHeight: 100 });
    const root = render({ createOverviewRef: () => fakeRef });

    expect(root.state('overviewHeight')).toEqual(fakeRef.current.clientHeight);
  });

  it('sets the overview height on update', () => {
    const initialHeight = 100;
    const fakeRef = createFakeRef({ clientHeight: initialHeight });
    const root = render({ createOverviewRef: () => fakeRef });

    const nextHeight = initialHeight + 10;
    fakeRef.current.clientHeight = nextHeight;

    root.setProps({});

    expect(root.state('overviewHeight')).toEqual(nextHeight);
  });

  it('sets the overview height in waitAndSetNewOverviewHeight', () => {
    const fakeRef = createFakeRef({ clientHeight: 100 });
    const { root, instance } = renderWithInstance({
      createOverviewRef: () => fakeRef,
    });

    // Reset the overviewHeight so it will be calculated again.
    root.setState({ overviewHeight: null });

    instance.waitAndSetNewOverviewHeight();

    expect(root.state('overviewHeight')).toEqual(fakeRef.current.clientHeight);
  });

  it('can set the overview height explicitly', () => {
    const fakeRef = createFakeRef({ clientHeight: 400 });
    const { root, instance } = renderWithInstance({
      createOverviewRef: () => fakeRef,
    });

    // Set a height that will be overwritten.
    root.setState({ overviewHeight: 200 });
    instance.setOverviewHeight();

    expect(root.state('overviewHeight')).toEqual(fakeRef.current.clientHeight);
  });

  it('does not set overview height if it has not changed', () => {
    const clientHeight = 200;
    const fakeRef = createFakeRef({ clientHeight });

    const { root, instance } = renderWithInstance({
      createOverviewRef: () => fakeRef,
    });

    root.setState({ overviewHeight: clientHeight });

    const setState = spyOn(instance, 'setState');
    instance.setOverviewHeight();

    expect(setState).not.toHaveBeenCalled();
  });

  it('can reset the overview height', () => {
    const { root, instance } = renderWithInstance();

    // Set a height that will be reset.
    root.setState({ overviewHeight: 200 });

    instance.resetOverviewHeight();

    expect(root.state('overviewHeight')).toEqual(null);
  });

  it('does not render content until the overview height is set', () => {
    const root = render({ content: '// pretend this is code' });

    const innerRoot = renderWithLinterProvider({ root });
    expect(innerRoot.find(CodeLineShapes)).toHaveLength(0);
  });

  it('renders links for a code line', () => {
    const location = createFakeLocation();
    const root = renderWithFixedHeight({
      content: generateFileLines({ count: 3 }).join('\n'),
      location,
    });

    const line = 3;
    const link = root.find(Link).at(line - 1);

    expect(link).toHaveProp('to', {
      ...location,
      hash: getCodeLineAnchor(line),
    });

    expect(link).toHaveProp('title', `Jump to line ${line}`);
  });

  it('renders links for a code line using a custom getCodeLineAnchor', () => {
    const customAnchor = 'example-anchor';
    const fakeGetCodeLineAnchor = jest.fn(() => customAnchor);

    const location = createFakeLocation();
    const root = renderWithFixedHeight({
      getCodeLineAnchor: fakeGetCodeLineAnchor,
      content: generateFileLines({ count: 3 }).join('\n'),
      location,
    });

    const line = 3;
    const lineIndex = line - 1;
    const link = root.find(Link).at(lineIndex);

    expect(link).toHaveProp(
      'to',
      expect.objectContaining({
        hash: customAnchor,
      }),
    );

    // Make sure subsequent line numbers are passed in order.
    expect(fakeGetCodeLineAnchor).toHaveBeenNthCalledWith(line, line);
    expect(fakeGetCodeLineAnchor).toHaveBeenNthCalledWith(line - 1, line - 1);
  });

  it('scrolls a linter message into view when clicking its link', () => {
    const fakeDOMNode = { scrollIntoView: jest.fn() };
    const _document = {
      ...document,
      querySelector: jest.fn().mockReturnValue(fakeDOMNode),
    };

    const root = renderWithFixedHeight({
      _document,
      content: generateFileLines({ count: 3 }).join('\n'),
    });

    const line = 3;
    root
      .find(Link)
      .at(line - 1)
      .simulate('click');

    expect(_document.querySelector).toHaveBeenCalledWith(
      getCodeLineAnchor(line),
    );
    expect(fakeDOMNode.scrollIntoView).toHaveBeenCalled();
  });

  it('handles clicking on a line when its anchor does not exist', () => {
    const _document = {
      ...document,
      // Simulate a scenario where the anchor does not exist on the page.
      querySelector: jest.fn().mockReturnValue(null),
    };

    const root = renderWithFixedHeight({
      _document,
      content: generateFileLines({ count: 3 }).join('\n'),
    });

    expect(() => root.find(Link).at(0).simulate('click')).not.toThrow();
  });

  it('links to the first line that has a linter message', () => {
    const firstLineWithMsg = 5;

    const { innerRoot } = renderWithMessages({
      // Create a file with 6 lines.
      contentLines: generateFileLines({ count: 6 }),
      // Make a grid of height 2 so that each row will contain 3 lines.
      overviewHeight: 2,
      // Put a linter message on line 5.
      messages: [{ line: firstLineWithMsg }],
      // Normalize the grid parameters.
      rowHeight: 1,
      overviewPadding: 0,
      rowTopPadding: 0,
    });

    const allLinks = innerRoot.find(Link);
    expect(allLinks).toHaveLength(2);

    const link = allLinks.at(1);

    expect(link).toHaveProp(
      'to',
      expect.objectContaining({
        hash: getCodeLineAnchor(firstLineWithMsg),
      }),
    );
  });

  it('links to the first of multiple lines containing linter messages', () => {
    const firstLineWithMsg = 5;

    const { innerRoot } = renderWithMessagesInNormGrid({
      // Create a file with 6 lines.
      contentLines: generateFileLines({ count: 6 }),
      // Make a grid of height 2 so that each row will contain 3 lines.
      overviewHeight: 2,
      // Put a linter message on line 5 and line 6.
      messages: [{ line: firstLineWithMsg }, { line: 6 }],
    });

    const allLinks = innerRoot.find(Link);
    expect(allLinks).toHaveLength(2);

    const link = allLinks.at(1);

    expect(link).toHaveProp(
      'to',
      expect.objectContaining({
        hash: getCodeLineAnchor(firstLineWithMsg),
      }),
    );
  });

  it('links to a global message on line 1', () => {
    const { innerRoot } = renderWithMessagesInNormGrid({
      contentLines: generateFileLines({ count: 1 }),
      // Add a global message.
      messages: [{ line: undefined }],
    });

    expect(innerRoot.find(Link).at(0)).toHaveProp(
      'to',
      expect.objectContaining({
        hash: getCodeLineAnchor(GLOBAL_LINTER_ANCHOR_ID),
      }),
    );
  });

  it('links to a global message even when other messages exist on line 1', () => {
    const { innerRoot } = renderWithMessagesInNormGrid({
      contentLines: generateFileLines({ count: 1 }),
      // Add a message on line 1 and a global message.
      messages: [{ line: 1 }, { line: undefined }],
    });

    expect(innerRoot.find(Link).at(0)).toHaveProp(
      'to',
      expect.objectContaining({
        hash: getCodeLineAnchor(GLOBAL_LINTER_ANCHOR_ID),
      }),
    );
  });

  it('does not link to a global message on lines other than 1', () => {
    const totalLines = 2;
    const line = 2;
    const { innerRoot } = renderWithMessagesInNormGrid({
      contentLines: generateFileLines({ count: totalLines }),
      overviewHeight: totalLines,
      // Add a global message and a line message.
      messages: [{ line: undefined }, { line }],
    });

    expect(innerRoot.find(Link).at(line - 1)).toHaveProp(
      'to',
      expect.objectContaining({
        hash: getCodeLineAnchor(line),
      }),
    );
  });

  it('sets link styles', () => {
    const rowHeight = 10;
    const rowTopPadding = 2;

    const root = renderWithFixedHeight({
      rowHeight,
      rowTopPadding,
      content: generateFileLines({ count: 3 }).join('\n'),
    });

    const link1 = root.find(Link).at(0);

    expect(link1).toHaveStyle('height', `${rowHeight}px`);
    // The first line should not have top padding.
    expect(link1).toHaveStyle('paddingTop', undefined);

    const link2 = root.find(Link).at(1);

    expect(link2).toHaveStyle('height', `${rowHeight}px`);
    expect(link2).toHaveStyle('paddingTop', `${rowTopPadding}px`);

    const link3 = root.find(Link).at(2);

    expect(link3).toHaveStyle('height', `${rowHeight}px`);
    expect(link3).toHaveStyle('paddingTop', `${rowTopPadding}px`);
  });

  it('sets overview styles', () => {
    const overviewPadding = 7;

    const root = render({
      overviewPadding,
      content: generateFileLines({ count: 3 }).join('\n'),
    });

    const innerRoot = renderWithLinterProvider({ root });

    expect(innerRoot.find(`.${styles.CodeOverview}`)).toHaveStyle(
      'padding',
      `${overviewPadding}px`,
    );
  });

  it('renders links for an empty line', () => {
    const contentLines = ['// Example code comment'];

    const location = createFakeLocation();
    const root = renderWithFixedHeight({
      content: contentLines.join('\n'),
      location,
    });

    // Lines 2 and beyond will be empty. Check the first empty line.
    const link = root.find(Link).at(1);

    expect(link).toHaveProp('to', {
      ...location,
      hash: '#',
    });

    expect(link).toHaveProp('title', '');
  });

  it('does not scroll when clicking an empty line', () => {
    const _document = { ...document, querySelector: jest.fn() };
    const root = renderWithFixedHeight({ _document, content: '' });
    const event = { preventDefault: jest.fn() };

    // Click the first empty line.
    root.find(Link).at(1).simulate('click', event);

    expect(_document.querySelector).not.toHaveBeenCalled();
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('handles empty content', () => {
    const root = renderWithFixedHeight({ content: '' });

    expect(root.find(CodeLineShapes)).toHaveLength(0);
  });

  it('renders CodeLineShapes for all lines', () => {
    const contentLines = generateFileLines({ count: 3 });
    const allLineShapes = generateLineShapes(contentLines);

    const root = renderWithFixedHeight({ content: contentLines.join('\n') });

    const lineShapes = root.find(CodeLineShapes);

    expect(lineShapes.at(0)).toHaveProp('lineShapes', allLineShapes[0]);
    expect(lineShapes.at(1)).toHaveProp('lineShapes', allLineShapes[1]);
    expect(lineShapes.at(2)).toHaveProp('lineShapes', allLineShapes[2]);

    expect(lineShapes).toHaveLength(3);
  });

  it('can render a change-styled CodeLineShapes component', () => {
    const contentLines = generateFileLines({ count: 3 });
    const allLineShapes = generateLineShapes(contentLines);

    const root = renderWithFixedHeight({
      content: contentLines.join('\n'),
      insertedLines: [2],
    });

    const lineShapes = root.find(CodeLineShapes);

    expect(lineShapes.at(0)).toHaveProp('lineShapes', allLineShapes[0]);
    expect(lineShapes.at(0)).not.toHaveProp('isChange');
    expect(lineShapes.at(1)).toHaveProp('lineShapes', allLineShapes[1]);
    expect(lineShapes.at(1)).toHaveProp('isChange', true);
    expect(lineShapes.at(2)).toHaveProp('lineShapes', allLineShapes[2]);
    expect(lineShapes.at(2)).not.toHaveProp('isChange');

    expect(lineShapes).toHaveLength(3);
  });

  it('renders a change-styled CodeLineShapes component after loading a diff', () => {
    const contentLines = generateFileLines({ count: 2 });
    const root = render({
      content: contentLines.join('\n'),
      insertedLines: [],
    });

    // This is required to allow for room for the lines of content.
    root.setState({ overviewHeight: 100 });

    let renderedRoot = renderWithLinterProvider({ root });
    let lineShapes = renderedRoot.find(CodeLineShapes);

    expect(lineShapes.at(0)).not.toHaveProp('isChange');
    expect(lineShapes.at(1)).not.toHaveProp('isChange');

    // Update insertedLines.
    root.setProps({ insertedLines: [2] });

    renderedRoot = renderWithLinterProvider({ root });
    lineShapes = renderedRoot.find(CodeLineShapes);

    expect(lineShapes.at(0)).not.toHaveProp('isChange');
    expect(lineShapes.at(1)).toHaveProp('isChange', true);
  });

  it('links to the first changed line in a block of changes', () => {
    const insertedLine = 5;
    // Create a file with 6 lines.
    const contentLines = generateFileLines({ count: 6 });

    const root = renderWithFixedHeight(
      {
        content: contentLines.join('\n'),
        insertedLines: [insertedLine],
        // Normalize the grid parameters.
        rowHeight: 1,
        overviewPadding: 0,
        rowTopPadding: 0,
      },
      // Make a grid of height 2 so that each row will contain 3 lines.
      { overviewHeight: 2 },
    );

    const allLinks = root.find(Link);
    expect(allLinks).toHaveLength(2);

    const link = allLinks.at(1);

    expect(link).toHaveProp(
      'to',
      expect.objectContaining({
        hash: getCodeLineAnchor(insertedLine),
      }),
    );
  });

  it('renders CodeLineShapes for groups of lines that fit into the grid', () => {
    const contentLines = generateFileLines({ count: 200 });

    const root = renderWithFixedHeight(
      { content: contentLines.join('\n') },
      { overviewHeight: 100 },
    );

    const lineShapes = root.find(CodeLineShapes);

    // This is a quick sanity check for the integration of
    // fitLineShapesIntoOverview(), which has more extensive tests.

    expect(lineShapes.at(0)).toHaveProp(
      'lineShapes',
      expect.objectContaining({ line: 1 }),
    );

    // Expect the second row to start at line 30.
    expect(lineShapes.at(1)).toHaveProp(
      'lineShapes',
      expect.objectContaining({ line: 30 }),
    );

    // Expect the third row to start at line 59.
    expect(lineShapes.at(2)).toHaveProp(
      'lineShapes',
      expect.objectContaining({ line: 59 }),
    );

    // Expect the last row to start at line 175.
    expect(lineShapes.at(6)).toHaveProp(
      'lineShapes',
      expect.objectContaining({ line: 175 }),
    );

    expect(lineShapes).toHaveLength(7);
  });

  it('renders an inline linter message', () => {
    const { innerRoot } = renderWithMessages({
      messages: [
        {
          description: 'eval() is unsafe',
          line: 1,
        },
      ],
    });

    expect(innerRoot.find(`.${styles.linterMessage}`)).toHaveLength(1);
  });

  it('renders global linter messages on the first line', () => {
    const { innerRoot } = renderWithMessages({
      contentLines: generateFileLines({ count: 5 }),
      messages: [
        {
          description: 'This third party library is banned',
          line: null,
        },
      ],
    });

    // Make sure only one linter message was added.
    expect(innerRoot.find(`.${styles.linterMessage}`)).toHaveLength(1);

    // Make sure only line 1 shows the global message.
    const lines = innerRoot.find(`.${styles.line}`);
    expect(lines.at(0).find(`.${styles.linterMessage}`)).toHaveLength(1);
    expect(lines.at(1).find(`.${styles.linterMessage}`)).toHaveLength(0);
  });

  it('replaces CodeLineShapes with linter messages', () => {
    const lineCount = 5;
    const messages = [{ line: 2 }, { line: 3 }];
    const { innerRoot } = renderWithMessages({
      contentLines: generateFileLines({ count: lineCount }),
      messages,
    });

    expect(innerRoot.find(CodeLineShapes)).toHaveLength(
      lineCount - messages.length,
    );
    expect(innerRoot.find(`.${styles.linterMessage}`)).toHaveLength(
      messages.length,
    );
  });

  it('replaces a linter message with a change-styled group of line shapes', () => {
    const lineCount = 5;
    const insertedLines = [2];
    const messages = [{ line: 2 }, { line: 3 }];
    const { innerRoot } = renderWithMessages({
      contentLines: generateFileLines({ count: lineCount }),
      insertedLines,
      messages,
    });

    expect(innerRoot.find(CodeLineShapes)).toHaveLength(
      lineCount - messages.length + 1,
    );
    expect(innerRoot.find(`.${styles.linterMessage}`)).toHaveLength(
      messages.length - 1,
    );
    expect(innerRoot.find(CodeLineShapes).at(1)).toHaveProp('isChange', true);
  });

  it('replaces a group of line shapes with a linter message', () => {
    const { innerRoot } = renderWithMessages({
      // Fit 8 lines of code into a 1 x 2 grid.
      contentLines: generateFileLines({ count: 8 }),
      // Put a linter message on line 7 so that it replaces the second group
      // of line shapes.
      messages: [{ line: 7 }],
      // Reset all parameters to create a 1 x 2 grid.
      rowHeight: 1,
      overviewHeight: 2,
      overviewPadding: 0,
      rowTopPadding: 0,
    });

    const links = innerRoot.find(Link);

    expect(links.at(0).childAt(0)).not.toHaveClassName(styles.linterMessage);
    expect(links.at(0).find(CodeLineShapes)).toHaveLength(1);

    expect(links.at(1).childAt(0)).toHaveClassName(styles.linterMessage);
    expect(links.at(1).find(CodeLineShapes)).toHaveLength(0);
  });

  it('uses the most severe linter message type', () => {
    const line = 1;
    const { innerRoot } = renderWithMessages({
      messages: [
        { type: 'notice', line },
        { type: 'error', line },
        { type: 'warning', line },
      ],
    });

    const message = innerRoot.find(`.${styles.linterMessage}`);

    expect(message).toHaveLength(1);
    expect(message).toHaveClassName(styles.linterError);
    expect(message).not.toHaveClassName(styles.linterNotice);
    expect(message).not.toHaveClassName(styles.linterWarning);
  });

  it('accounts for global messages when finding the most severe linter message type', () => {
    const line = 1;
    const { innerRoot } = renderWithMessages({
      messages: [
        { type: 'notice', line },
        // This will be a global message.
        { type: 'error', line: undefined },
        { type: 'warning', line },
      ],
    });

    const message = innerRoot.find(`.${styles.linterMessage}`);

    expect(message).toHaveLength(1);
    expect(message).toHaveClassName(styles.linterError);
  });

  it.each([
    ['error', styles.linterError],
    ['warning', styles.linterWarning],
    ['notice', styles.linterNotice],
  ])('converts linter type "%s" to class "%s"', (linterType, expectedClass) => {
    const { innerRoot } = renderWithMessages({
      messages: [
        { type: linterType as ExternalLinterMessage['type'], line: 1 },
      ],
    });

    expect(innerRoot.find(`.${styles.linterMessage}`)).toHaveClassName(
      expectedClass,
    );
  });

  describe('fitLineShapesIntoOverview', () => {
    const justLines = (shapes: AllLineShapes) => shapes.map((s) => s.line);

    it('requires overviewHeight', () => {
      const { instance } = renderWithInstance();

      expect(() =>
        instance.fitLineShapesIntoOverview(
          generateLineShapes(generateFileLines({ count: 2 })),
        ),
      ).toThrow(/overviewHeight must be set/);
    });

    it('does not split line shapes if they already fit', () => {
      const { instance, root } = renderWithInstance({
        overviewPadding: 0,
        rowHeight: 10,
        rowTopPadding: 0,
      });
      root.setState({ overviewHeight: 100 });

      const allLineShapes = generateLineShapes(
        generateFileLines({ count: 10 }),
      );
      const result = instance.fitLineShapesIntoOverview(allLineShapes);

      expect(result.numberOfRows).toEqual(10);
      expect(result.chunkedLineShapes.length).toEqual(allLineShapes.length);
    });

    it('splits line shapes to fit', () => {
      const { instance, root } = renderWithInstance({
        overviewPadding: 0,
        rowHeight: 1,
        rowTopPadding: 0,
      });
      root.setState({ overviewHeight: 3 });

      const allLineShapes = generateLineShapes(generateFileLines({ count: 6 }));
      const result = instance.fitLineShapesIntoOverview(allLineShapes);

      expect(result.numberOfRows).toEqual(3);
      expect(result.chunkedLineShapes.length).toEqual(3);

      expect(justLines(result.chunkedLineShapes[0])).toEqual([1, 2]);
      expect(justLines(result.chunkedLineShapes[1])).toEqual([3, 4]);
      expect(justLines(result.chunkedLineShapes[2])).toEqual([5, 6]);
    });

    it('leaves a remainder of line shapes when splitting', () => {
      const { instance, root } = renderWithInstance({
        overviewPadding: 0,
        rowHeight: 1,
        rowTopPadding: 0,
      });
      root.setState({ overviewHeight: 3 });

      const allLineShapes = generateLineShapes(generateFileLines({ count: 5 }));
      const result = instance.fitLineShapesIntoOverview(allLineShapes);

      expect(result.numberOfRows).toEqual(3);
      expect(result.chunkedLineShapes.length).toEqual(3);

      // Expect these lines to be split into pairs.
      expect(justLines(result.chunkedLineShapes[0])).toEqual([1, 2]);
      expect(justLines(result.chunkedLineShapes[1])).toEqual([3, 4]);

      // Expect the last line to have one remaining item.
      expect(justLines(result.chunkedLineShapes[2])).toEqual([5]);
    });

    it('accounts for overviewPadding', () => {
      const { instance, root } = renderWithInstance({
        overviewPadding: 1,
        rowHeight: 2,
        rowTopPadding: 0,
      });
      root.setState({ overviewHeight: 10 });

      const result = instance.fitLineShapesIntoOverview(
        generateLineShapes(generateFileLines({ count: 4 })),
      );
      expect(result.numberOfRows).toEqual(4);
    });

    it('accounts for rowTopPadding', () => {
      const { instance, root } = renderWithInstance({
        overviewPadding: 0,
        rowHeight: 2,
        rowTopPadding: 2,
      });
      root.setState({ overviewHeight: 10 });

      const result = instance.fitLineShapesIntoOverview(
        generateLineShapes(generateFileLines({ count: 4 })),
      );
      expect(result.numberOfRows).toEqual(4);
    });
  });
});
