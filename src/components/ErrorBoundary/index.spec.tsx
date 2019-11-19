import { mount } from 'enzyme';
import * as React from 'react';

import { createFakeLogger } from '../../test-helpers';
import styles from './styles.module.scss';

import ErrorBoundary, { Props, State } from '.';

describe(__filename, () => {
  const CustomComponent = ({
    children = <div />,
  }: {
    children?: JSX.Element;
  }) => children;

  type RenderParams = Partial<Props>;

  const render = ({
    _log = createFakeLogger(),
    children = <div />,
  }: RenderParams = {}) => {
    return mount(
      <ErrorBoundary _log={_log}>
        <CustomComponent>{children}</CustomComponent>
      </ErrorBoundary>,
    );
  };

  it('renders children if there is no error', () => {
    const className = 'some-class-name';
    const children = <div className={className}>A child to be rendered</div>;
    const root = render({ children });

    expect(root.find(`.${className}`)).toHaveLength(1);
  });

  it('renders an error page if there is an error', () => {
    const className = 'some-class-name';
    const children = <div className={className}>A child to be rendered</div>;
    const root = render({ children });

    const error = new Error('test');

    root.find(CustomComponent).simulateError(error);

    const state = root.state() as State;
    const expectedErrorInfo = state.errorInfo as React.ErrorInfo;

    expect(root.find(`.${className}`)).toHaveLength(0);
    expect(root.find(`.${styles.errorDetails}`)).toHaveLength(1);
    expect(root.find(`.${styles.errorText}`)).toHaveText(error.toString());
    expect(root.find(`.${styles.componentStack}`)).toHaveText(
      expectedErrorInfo.componentStack,
    );
  });

  it('logs an error if there is an error', () => {
    const _log = createFakeLogger();
    const root = render({ _log });

    const error = new Error('test');

    root.find(CustomComponent).simulateError(error);
    expect(_log.error).toHaveBeenCalled();
  });
});
