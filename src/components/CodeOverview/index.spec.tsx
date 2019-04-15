import * as React from 'react';
import debounce from 'lodash.debounce';
import { shallow } from 'enzyme';

import { ExternalLinterMessage, getMessageMap } from '../../reducers/linter';
import { createInternalVersion } from '../../reducers/versions';
import LinterProvider, { LinterProviderInfo } from '../LinterProvider';
import {
  createFakeExternalLinterResult,
  fakeVersion,
  simulateLinterProvider,
} from '../../test-helpers';

import CodeOverview, { DefaultProps, PublicProps } from '.';

describe(__filename, () => {
  const createFakeWindow = () => {
    return {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
  };

  type RenderParams = Partial<PublicProps & DefaultProps>;

  const render = ({
    // This is stub replacement for debounce that behaves the same but
    // without any debouncing.
    _debounce = (func) => debounce(func, 0, { leading: true }),
    ...otherProps
  }: RenderParams = {}) => {
    const props = {
      _debounce,
      _window: createFakeWindow(),
      content: 'example code content',
      version: createInternalVersion(fakeVersion),
      ...otherProps,
    };
    return shallow(<CodeOverview {...props} />);
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

  const renderWithMessages = ({
    messages,
    ...props
  }: {
    messages: Partial<ExternalLinterMessage>[];
    props?: RenderParams;
  }) => {
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

    const selectedMessageMap = map[file];

    const root = renderWithLinterProvider({
      messageMap: map,
      selectedMessageMap,
      content: contentLines.join('\n'),
      ...props,
    });

    return { root, selectedMessageMap };
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

    const root = render({ _window });
    const {
      resetOverviewHeight,
      waitAndSetNewOverviewHeight,
    } = root.instance() as CodeOverview;

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
    const root = render();
    const instance = root.instance() as CodeOverview;

    // Simulate setting an arbitrary height;
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

  it('only sets overview height for active refs', () => {
    const root = render();
    const instance = root.instance() as CodeOverview;

    // Simulate setting an arbitrary height;
    const overviewHeight = 200;
    root.setState({ overviewHeight });

    instance.setOverviewHeight(undefined);

    // Make sure no new height was set.
    expect(root.state('overviewHeight')).toEqual(overviewHeight);
  });

  it('can reset the overview height', () => {
    const root = render();
    const instance = root.instance() as CodeOverview;

    // Simulate setting an arbitrary height;
    root.setState({ overviewHeight: 200 });

    instance.resetOverviewHeight();

    expect(root.state('overviewHeight')).toEqual(null);
  });
});
