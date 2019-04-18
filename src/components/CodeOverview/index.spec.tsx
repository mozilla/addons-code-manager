import * as React from 'react';
import { Location } from 'history';
import { Link } from 'react-router-dom';
import { ShallowWrapper } from 'enzyme';
import debounce from 'lodash.debounce';

import { createInternalVersion } from '../../reducers/versions';
import { getCodeLineAnchor } from '../CodeView/utils';
import CodeLineShapes from '../CodeLineShapes';
import { generateLineShapes } from '../CodeLineShapes/utils';
import LinterProvider, { LinterProviderInfo } from '../LinterProvider';
import {
  createContextWithFakeRouter,
  createFakeLocation,
  fakeVersion,
  shallowUntilTarget,
  simulateLinterProvider,
} from '../../test-helpers';

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
    // This is stub replacement for debounce that behaves the same but
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

  it('can set the overview height', () => {
    const { root, instance } = renderWithInstance();

    // Set a height that will be overwritten.
    root.setState({ overviewHeight: 200 });

    const fakeRef = {
      current: {
        ...document.createElement('div'),
        clientHeight: 400,
      },
    };
    instance.setOverviewHeight(fakeRef);

    expect(root.state('overviewHeight')).toEqual(fakeRef.current.clientHeight);
  });

  it('only sets the overview height for defined refs', () => {
    const { root, instance } = renderWithInstance();

    const overviewHeight = 200;
    root.setState({ overviewHeight });

    instance.setOverviewHeight(undefined);

    // Make sure no new height was set.
    expect(root.state('overviewHeight')).toEqual(overviewHeight);
  });

  it('only sets the overview height for active refs', () => {
    const { root, instance } = renderWithInstance();

    const overviewHeight = 200;
    root.setState({ overviewHeight });

    // Set an inactive ref.
    instance.setOverviewHeight(React.createRef());

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
    root.setState({ overviewHeight: null });

    const innerRoot = renderWithLinterProvider({ root });
    expect(innerRoot.find(CodeLineShapes)).toHaveLength(0);
  });

  it('renders links for a code line', () => {
    const contentLines = [
      'function logMessage(message) {',
      '  console.log(message);',
      '}',
    ];

    const location = createFakeLocation();
    const root = render({ content: contentLines.join('\n'), location });
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

  it('renders links for an empty line', () => {
    const contentLines = ['// Example code comment'];

    const location = createFakeLocation();
    const root = render({ content: contentLines.join('\n'), location });
    root.setState({ overviewHeight: 400 });

    const innerRoot = renderWithLinterProvider({ root });

    // Check the first empty line.
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
    const contentLines = [
      'function logMessage(message) {',
      '  console.log(message);',
      '}',
    ];
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

  it('renders CodeLineShapes for groups of lines that fit', () => {
    // Create a 200 line file.
    const contentLines = new Array(200)
      .fill('')
      .map((i) => `// This is line ${i + 1} of the code`);

    const root = render({ content: contentLines.join('\n') });
    root.setState({ overviewHeight: 100 });

    const innerRoot = renderWithLinterProvider({ root });

    const lineShapes = innerRoot.find(CodeLineShapes);

    // Expect the lines to be distributed via lodash.chunk()

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
});
