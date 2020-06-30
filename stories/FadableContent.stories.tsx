import React from 'react';
import { storiesOf } from '@storybook/react';

import configureStore from '../src/configureStore';
import CodeView from '../src/components/CodeView';
import FadableContent from '../src/components/FadableContent';
import { createInternalVersion } from '../src/reducers/versions';
import { fakeVersionWithContent } from '../src/test-helpers';
import { JS_SAMPLE } from './CodeView.stories';
import { generateParagraphs, renderWithStoreAndRouter } from './utils';

const renderWithContent = (content: JSX.Element) => {
  return renderWithStoreAndRouter(
    <div className="FadableContent-shell">
      <FadableContent fade>{content}</FadableContent>
    </div>,
    { store: configureStore() },
  );
};

storiesOf('FadableContent', module)
  .add('fading out code', () => {
    return renderWithContent(
      <CodeView
        content={JS_SAMPLE}
        isMinified={false}
        mimeType="application/javascript"
        version={createInternalVersion(fakeVersionWithContent)}
      />,
    );
  })
  .add('fading out text', () => {
    return renderWithContent(
      <React.Fragment>{generateParagraphs(6)}</React.Fragment>,
    );
  });
