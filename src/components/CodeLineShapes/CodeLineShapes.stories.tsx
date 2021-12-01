import * as React from 'react';
import { Meta } from '@storybook/react';

import { generateLineShapes } from './utils';

import CodeLineShapes from '.';

const exampleCode = `\
browser.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {
    console.log(
      'Background: got message:',
      message,
      'from:',
      sender,
    );
  }
);
`.trim();

const buildAndRender = ({
  code = exampleCode,
  maxLineLength = 40,
}: { code?: string; maxLineLength?: number } = {}) => {
  const fileLines = code.split('\n');
  const allLineShapes = generateLineShapes(fileLines, { maxLineLength });

  const codeParts: React.ReactNode[] = [];
  const shapeParts: React.ReactNode[] = [];

  fileLines.forEach((line, lineIndex) => {
    codeParts.push(
      <div key={line} className="CodeLineShapesStory-actualCode">
        <pre>{line.replace('\n', '')}</pre>
      </div>,
    );
    shapeParts.push(
      <div key={line} className="CodeLineShapesStory-lineShape">
        <CodeLineShapes lineShapes={allLineShapes[lineIndex]} />
      </div>,
    );
  });

  const style = { width: `${maxLineLength * 10}px` };

  return (
    <div className="CodeLineShapesStory">
      <div className="CodeLineShapesStory-panel" style={style}>
        {codeParts}
      </div>
      <div className="CodeLineShapesStory-panel" style={style}>
        {shapeParts}
      </div>
    </div>
  );
};

export default {
  title: 'Components/CodeLineShapes',
  component: CodeLineShapes,
} as Meta;

export const SingleLineOfCode = () => {
  return buildAndRender({
    code: '"use strict;"',
    maxLineLength: 30,
  });
};

export const FortyCharacterWindow = () => {
  return buildAndRender({ maxLineLength: 40 });
};

export const TwentyCharacterWindow = () => {
  return buildAndRender({ maxLineLength: 20 });
};
