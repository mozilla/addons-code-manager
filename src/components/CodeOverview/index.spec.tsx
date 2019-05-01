import * as React from 'react';
import { Location } from 'history';
import { Link } from 'react-router-dom';
import { ShallowWrapper } from 'enzyme';
import debounce from 'lodash.debounce';

import { ExternalLinterMessage, getMessageMap } from '../../reducers/linter';
import { createInternalVersion } from '../../reducers/versions';
import { getCodeLineAnchor } from '../CodeView/utils';
import CodeLineShapes from '../CodeLineShapes';
import { AllLineShapes, generateLineShapes } from '../CodeLineShapes/utils';
import LinterProvider, { LinterProviderInfo } from '../LinterProvider';
import {
  createContextWithFakeRouter,
  createFakeExternalLinterResult,
  createFakeLocation,
  createFakeRef,
  fakeVersion,
  shallowUntilTarget,
  simulateLinterProvider,
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
      version: createInternalVersion(fakeVersion),
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
      instance: root.instance() as CodeOverviewBase,
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

  const renderWithMessages = ({
    contentLines = generateFileLines({ count: 10 }),
    messages,
    overviewHeight = 400,
    ...props
  }: {
    contentLines?: string[];
    messages: Partial<ExternalLinterMessage>[];
    overviewHeight?: number;
  } & RenderParams) => {
    const file = 'scripts/content.js';
    const map = getMessageMap(
      createFakeExternalLinterResult({
        messages: messages.map((msg) => {
          return { ...msg, file };
        }),
      }),
    );

    const selectedMessageMap = map[file];

    const root = render({ ...props, content: contentLines.join('\n') });
    root.setState({ overviewHeight });

    const innerRoot = renderWithLinterProvider({
      messageMap: map,
      selectedMessageMap,
      root,
    });

    return { innerRoot, root, selectedMessageMap };
  };

  it('configures LinterProvider', () => {
    const version = createInternalVersion(fakeVersion);
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

  it('only sets the overview height for defined refs', () => {
    const { root, instance } = renderWithInstance({
      createOverviewRef: () => null,
    });

    const overviewHeight = 200;
    root.setState({ overviewHeight });

    instance.setOverviewHeight();

    // Make sure no new height was set.
    expect(root.state('overviewHeight')).toEqual(overviewHeight);
  });

  it('only sets the overview height for active refs', () => {
    const { root, instance } = renderWithInstance({
      // Set an inactive ref.
      createOverviewRef: () => React.createRef(),
    });

    const overviewHeight = 200;
    root.setState({ overviewHeight });

    instance.setOverviewHeight();

    // Make sure no new height was set.
    expect(root.state('overviewHeight')).toEqual(overviewHeight);
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
    const root = render({
      content: generateFileLines({ count: 3 }).join('\n'),
      location,
    });
    root.setState({ overviewHeight: 400 });

    const innerRoot = renderWithLinterProvider({ root });

    const line = 3;
    const link = innerRoot.find(Link).at(line - 1);

    expect(link).toHaveProp('to', {
      ...location,
      hash: getCodeLineAnchor(line),
    });

    expect(link).toHaveProp('title', `Jump to line ${line}`);
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

    const { innerRoot } = renderWithMessages({
      // Create a file with 6 lines.
      contentLines: generateFileLines({ count: 6 }),
      // Make a grid of height 2 so that each row will contain 3 lines.
      overviewHeight: 2,
      // Put a linter message on line 5 and line 6.
      messages: [{ line: firstLineWithMsg }, { line: 6 }],
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

  it('sets link styles', () => {
    const rowHeight = 10;
    const rowTopPadding = 2;

    const root = render({
      rowHeight,
      rowTopPadding,
      content: generateFileLines({ count: 3 }).join('\n'),
    });
    root.setState({ overviewHeight: 400 });

    const innerRoot = renderWithLinterProvider({ root });

    const link1 = innerRoot.find(Link).at(0);

    expect(link1).toHaveStyle('height', `${rowHeight}px`);
    // The first line should not have top padding.
    expect(link1).toHaveStyle('paddingTop', undefined);

    const link2 = innerRoot.find(Link).at(1);

    expect(link2).toHaveStyle('height', `${rowHeight}px`);
    expect(link2).toHaveStyle('paddingTop', `${rowTopPadding}px`);

    const link3 = innerRoot.find(Link).at(2);

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
    const root = render({ content: contentLines.join('\n'), location });
    root.setState({ overviewHeight: 400 });

    const innerRoot = renderWithLinterProvider({ root });

    // Lines 2 and beyond will be empty. Check the first empty line.
    const link = innerRoot.find(Link).at(1);

    expect(link).toHaveProp('to', {
      ...location,
      hash: '#',
    });

    expect(link).toHaveProp('title', '');
  });

  it('handles empty content', () => {
    const content = '';
    const allLineShapes = generateLineShapes([content]);

    const root = render({ content });
    root.setState({ overviewHeight: 400 });

    const innerRoot = renderWithLinterProvider({ root });

    const lineShapes = innerRoot.find(CodeLineShapes);
    expect(lineShapes.at(0)).toHaveProp('lineShapes', allLineShapes[0]);
    expect(lineShapes).toHaveLength(1);
  });

  it('renders CodeLineShapes for all lines', () => {
    const contentLines = generateFileLines({ count: 3 });
    const allLineShapes = generateLineShapes(contentLines);

    const root = render({ content: contentLines.join('\n') });
    root.setState({ overviewHeight: 400 });

    const innerRoot = renderWithLinterProvider({ root });

    const lineShapes = innerRoot.find(CodeLineShapes);

    expect(lineShapes.at(0)).toHaveProp('lineShapes', allLineShapes[0]);
    expect(lineShapes.at(1)).toHaveProp('lineShapes', allLineShapes[1]);
    expect(lineShapes.at(2)).toHaveProp('lineShapes', allLineShapes[2]);

    expect(lineShapes).toHaveLength(3);
  });

  it('renders CodeLineShapes for groups of lines that fit into the grid', () => {
    const contentLines = generateFileLines({ count: 200 });

    const root = render({ content: contentLines.join('\n') });
    root.setState({ overviewHeight: 100 });

    const innerRoot = renderWithLinterProvider({ root });

    const lineShapes = innerRoot.find(CodeLineShapes);

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

  it('does not render global linter messages', () => {
    const { innerRoot } = renderWithMessages({
      messages: [
        {
          description: 'This third party library is banned',
          line: null,
        },
      ],
    });

    expect(innerRoot.find(`.${styles.linterMessage}`)).toHaveLength(0);
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
