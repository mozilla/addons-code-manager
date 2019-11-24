import React from 'react';
import { storiesOf } from '@storybook/react';

import ContentShell from '../../src/components/FullscreenGrid/ContentShell';
import FullscreenGrid, { Header } from '../../src/components/FullscreenGrid';
import AccordionMenu, { AccordionItem } from '../../src/components/AccordionMenu';
import {
  generateParagraphs,
  loremIpsum,
  renderWithStoreAndRouter,
  rootAttributeParams,
} from '../utils';

const getParams = () => rootAttributeParams({ fullscreen: true });

const loremIpsumWords = loremIpsum.split(' ');

// Make paragraphs of text that will look a little different
// from the paragraphs of other menu items.
const makeText = () => {
  const text = loremIpsumWords.map(
    () =>
      loremIpsumWords[Math.floor(Math.random() * (loremIpsumWords.length - 1))],
  );
  return generateParagraphs(10, { text: text.join(' ') });
};

const render = (children: JSX.Element) => {
  return renderWithStoreAndRouter(
    <FullscreenGrid>
      <Header />
      <ContentShell
        mainSidePanel={children}
        className="AccordionMenuStory-ContentShell"
        mainSidePanelIsBorderless
      >
        This page was intentionally left blank
      </ContentShell>
    </FullscreenGrid>,
  );
};

storiesOf('AccordionMenu', module)
  .add(
    'long content',
    () => {
      return render(
        <AccordionMenu>
          <AccordionItem title="Files">{makeText()}</AccordionItem>
          <AccordionItem title="Information">{makeText()}</AccordionItem>
          <AccordionItem title="Keyboard Shortcuts">{makeText()}</AccordionItem>
          <AccordionItem title="Help">{makeText()}</AccordionItem>
          <AccordionItem title="About">{makeText()}</AccordionItem>
        </AccordionMenu>,
      );
    },
    getParams(),
  )
  .add(
    'short content',
    () => {
      return render(
        <AccordionMenu>
          <AccordionItem title="Files">Example of short content</AccordionItem>
          <AccordionItem title="Information">
            Another example of short content
          </AccordionItem>
          <AccordionItem title="Keyboard Shortcuts">
            A different example of short content
          </AccordionItem>
          <AccordionItem title="Help">
            Yet another example of short content
          </AccordionItem>
          <AccordionItem title="About">Short content is short</AccordionItem>
        </AccordionMenu>,
      );
    },
    getParams(),
  )
  .add(
    'expanded by default',
    () => {
      return render(
        <AccordionMenu>
          <AccordionItem expandedByDefault title="Files">
            {makeText()}
          </AccordionItem>
          <AccordionItem title="Information">{makeText()}</AccordionItem>
          <AccordionItem title="Keyboard Shortcuts">{makeText()}</AccordionItem>
          <AccordionItem title="Help">{makeText()}</AccordionItem>
          <AccordionItem title="About">{makeText()}</AccordionItem>
        </AccordionMenu>,
      );
    },
    getParams(),
  );
