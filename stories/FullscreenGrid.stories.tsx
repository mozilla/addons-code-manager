import React from 'react';
import { storiesOf } from '@storybook/react';

import FullscreenGrid, {
  Header,
  ContentShell,
} from '../src/components/FullscreenGrid';
import { generateParagraphs, rootAttributeParams } from './utils';

const getParams = () => rootAttributeParams({ fullscreen: true });

storiesOf('FullscreenGrid', module)
  .add(
    'default',
    () => {
      return (
        <FullscreenGrid>
          <Header className="FullscreenGridStory-Header">Header</Header>
          <ContentShell
            altSidePanel="altSidePanel"
            altSidePanelClass="FullscreenGridStory-altSidePanel"
            className="FullscreenGridStory-content"
            mainSidePanel="mainSidePanel"
            mainSidePanelClass="FullscreenGridStory-mainSidePanel"
          >
            Content
          </ContentShell>
        </FullscreenGrid>
      );
    },
    getParams(),
  )
  .add(
    'long content',
    () => {
      const someText = generateParagraphs(10);

      return (
        <FullscreenGrid>
          <Header className="FullscreenGridStory-Header">Header</Header>
          <ContentShell altSidePanel={someText} mainSidePanel={someText}>
            {someText}
          </ContentShell>
        </FullscreenGrid>
      );
    },
    getParams(),
  );
