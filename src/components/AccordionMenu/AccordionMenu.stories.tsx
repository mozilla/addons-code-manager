import React from 'react';
import { Meta } from '@storybook/react';

import FullscreenGrid, { Header } from '../FullscreenGrid';
import ContentShell from '../FullscreenGrid/ContentShell';
import {
  generateParagraphs,
  loremIpsum,
  renderWithStoreAndRouter,
} from '../../storybook-utils';

import AccordionMenu, { AccordionItem } from '.';

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

export default {
  title: 'Components/AccordionMenu',
  component: AccordionMenu,
} as Meta;

export const LongContent = () => {
  return render(
    <AccordionMenu>
      <AccordionItem title="Files">{makeText()}</AccordionItem>
      <AccordionItem alwaysExpanded title="Current File Information">
        {makeText()}
      </AccordionItem>
      <AccordionItem title="Keyboard Shortcuts">{makeText()}</AccordionItem>
      <AccordionItem title="Help">{makeText()}</AccordionItem>
      <AccordionItem title="About">{makeText()}</AccordionItem>
    </AccordionMenu>,
  );
};

export const ShortContent = () => {
  return render(
    <AccordionMenu>
      <AccordionItem title="Files">Example of short content</AccordionItem>
      <AccordionItem alwaysExpanded title="Current File Information">
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
};

export const ExpandedByDefault = () => {
  return render(
    <AccordionMenu>
      <AccordionItem expandedByDefault title="Files">
        {makeText()}
      </AccordionItem>
      <AccordionItem alwaysExpanded title="Current File Information">
        {makeText()}
      </AccordionItem>
      <AccordionItem title="Keyboard Shortcuts">{makeText()}</AccordionItem>
      <AccordionItem title="Help">{makeText()}</AccordionItem>
      <AccordionItem title="About">{makeText()}</AccordionItem>
    </AccordionMenu>,
  );
};
