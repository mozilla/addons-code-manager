import React from 'react';
import { storiesOf } from '@storybook/react';

import ContentShell from '../src/components/FullscreenGrid/ContentShell';
import FullscreenGrid, { Header } from '../src/components/FullscreenGrid';
import {
  generateParagraphs,
  renderWithStoreAndRouter,
  rootAttributeParams,
} from './utils';

const getParams = () => rootAttributeParams({ fullscreen: true });

const renderInGrid = (content: JSX.Element) => {
  return renderWithStoreAndRouter(
    <FullscreenGrid>
      <Header className="FullscreenGridStory-Header">
        <div className="FullscreenGridStory-placeholder">Header</div>
      </Header>
      {content}
    </FullscreenGrid>,
  );
};

storiesOf('FullscreenGrid', module)
  .add(
    'default',
    () => {
      return renderInGrid(
        <ContentShell
          altSidePanel={
            <div className="FullscreenGridStory-placeholder">altSidePanel</div>
          }
          altSidePanelClass="FullscreenGridStory-altSidePanel"
          className="FullscreenGridStory-content"
          mainSidePanel={
            <div className="FullscreenGridStory-placeholder">mainSidePanel</div>
          }
          mainSidePanelClass="FullscreenGridStory-mainSidePanel"
        >
          <div className="FullscreenGridStory-placeholder">Content</div>
        </ContentShell>,
      );
    },
    getParams(),
  )
  .add(
    'long content',
    () => {
      const someText = generateParagraphs(10);

      return renderInGrid(
        <ContentShell altSidePanel={someText} mainSidePanel={someText}>
          {someText}
        </ContentShell>,
      );
    },
    getParams(),
  );
