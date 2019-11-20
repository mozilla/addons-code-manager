import React from 'react';
import { storiesOf } from '@storybook/react';

import ErrorBoundary from '../src/components/ErrorBoundary';

const render = (children: JSX.Element) => {
  return <ErrorBoundary>{children}</ErrorBoundary>;
};

storiesOf('ErrorBoundary', module)
  .add('with error', () => {
    return render(<div>{new Error('Test Error')}</div>);
  })
  .add('without error', () => {
    return render(<div>This is error-less content</div>);
  });
