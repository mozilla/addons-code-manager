import React from 'react';
import { storiesOf } from '@storybook/react';

import FullscreenGrid, {
  Header,
  NavPanel,
  AltPanel,
  ContentPanel,
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

const getParams = () => rootAttributeParams({ fullscreenByDefault: true });

storiesOf('FullscreenGrid', module)
  .add(
    'default',
    () => {
      return (
        <FullscreenGrid>
          <Header className="FullscreenGridStory-Header">Header</Header>
          <NavPanel className="FullscreenGridStory-NavPanel">NavPanel</NavPanel>
          <ContentPanel className="FullscreenGridStory-ContentPanel">
            ContentPanel
          </ContentPanel>
          <AltPanel className="FullscreenGridStory-AltPanel">AltPanel</AltPanel>
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
          <NavPanel>{someText}</NavPanel>
          <ContentPanel>{someText}</ContentPanel>
          <AltPanel>{someText}</AltPanel>
        </FullscreenGrid>
      );
    },
    getParams(),
  );
