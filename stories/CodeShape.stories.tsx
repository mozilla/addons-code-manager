import * as React from 'react';
import { storiesOf } from '@storybook/react';

import CodeShape from '../src/components/CodeShape';
import { generateLineShapes } from '../src/components/CodeShape/utils';

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
      <div key={line} className="CodeShapeStory-actualCode">
        <pre>{line.replace('\n', '')}</pre>
      </div>,
    );
    shapeParts.push(
      <div key={line} className="CodeShapeStory-lineShape">
        <CodeShape lineShapes={allLineShapes[lineIndex]} />
      </div>,
    );
  });

  const style = { width: `${maxLineLength * 10}px` };

  return (
    <div className="CodeShapeStory">
      <div className="CodeShapeStory-panel" style={style}>
        {codeParts}
      </div>
      <div className="CodeShapeStory-panel" style={style}>
        {shapeParts}
      </div>
    </div>
  );
};

storiesOf('CodeShape', module).addWithChapters('all variants', {
  chapters: [
    {
      sections: [
        {
          title: 'Single line of code',
          sectionFn: () =>
            buildAndRender({
              code: '"use strict;"',
              maxLineLength: 30,
            }),
        },
        {
          title: '40 Character window',
          sectionFn: () => buildAndRender({ maxLineLength: 40 }),
        },
        {
          title: '20 Character window',
          sectionFn: () => buildAndRender({ maxLineLength: 20 }),
        },
      ],
    },
  ],
});
