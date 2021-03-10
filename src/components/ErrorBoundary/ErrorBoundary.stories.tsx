import React from 'react';
import { Meta } from '@storybook/react';

import ErrorBoundary from '.';

const render = (children: JSX.Element) => {
  return <ErrorBoundary>{children}</ErrorBoundary>;
};

export default {
  title: 'Components/ErrorBoundary',
  component: ErrorBoundary,
} as Meta;

export const WithError = () => {
  return render(<div>{new Error('Test Error')}</div>);
};

export const WithoutError = () => {
  return render(<div>This is error-less content</div>);
};
