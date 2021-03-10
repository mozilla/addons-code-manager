import makeClassName from 'classnames';
import React from 'react';
import { Meta } from '@storybook/react';

import ContentShell from './ContentShell';
import {
  generateParagraphs,
  renderWithStoreAndRouter,
} from '../../storybook-utils';

import FullscreenGrid, { Header } from '.';

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

export default {
  title: 'Components/FullscreenGrid',
  component: FullscreenGrid,
} as Meta;

export const DefaultView = () => {
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
};

export const LongContent = () => {
  const someText = generateParagraphs(10);

  return renderInGrid(
    <ContentShell altSidePanel={someText} mainSidePanel={someText}>
      {someText}
    </ContentShell>,
  );
};

export const TopContent = () => {
  return renderInGrid(
    <ContentShell
      topContent={
        <div
          className={makeClassName(
            'FullscreenGridStory-placeholder',
            'FullscreenGridStory-topContent',
          )}
        >
          Example of top content
        </div>
      }
    />,
  );
};
