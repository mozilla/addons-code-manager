import React from 'react';
import { Meta } from '@storybook/react';

import configureStore from '../../configureStore';
import CodeView from '../CodeView';
import { createInternalVersion } from '../../reducers/versions';
import jsSample from '../../stories/fixtures/js-sample';
import { fakeVersionWithContent } from '../../test-helpers';
import {
  generateParagraphs,
  renderWithStoreAndRouter,
} from '../../storybook-utils';

import FadableContent from '.';

const renderWithContent = (content: JSX.Element) => {
  return renderWithStoreAndRouter(
    <div className="FadableContent-shell">
      <FadableContent fade>{content}</FadableContent>
    </div>,
    { store: configureStore() },
  );
};

export default {
  title: 'Components/FadableContent',
  component: FadableContent,
} as Meta;

export const FadingOutCode = () => {
  return renderWithContent(
    <CodeView
      content={jsSample}
      isMinified={false}
      mimeType="application/javascript"
      version={createInternalVersion(fakeVersionWithContent)}
    />,
  );
};

export const FadingOutText = () => {
  return renderWithContent(<>{generateParagraphs(6)}</>);
};
