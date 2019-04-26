import React from 'react';
import { storiesOf } from '@storybook/react';

import FullscreenGrid, {
  Header,
  ContentShell,
} from '../src/components/FullscreenGrid';
import { rootAttributeParams } from './utils';

const loremIpsum = `
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat
non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
`;

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
      const someText = new Array(10)
        .fill(loremIpsum)
        // eslint-disable-next-line react/no-array-index-key
        .map((p, i) => <p key={i}>{p}</p>);

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
