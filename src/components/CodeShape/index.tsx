import * as React from 'react';

import styles from './styles.module.scss';

export enum Token {
  code = 'code',
  whitespace = 'whitespace',
}

// This represents the shape of one or more tokens.
export type TokenShape = {
  count: number;
  percentOfWidth: number;
  token: Token.code | Token.whitespace;
};

// This is a collection of shapes for one line of code.
export type LineShapes = {
  line: number;
  tokens: TokenShape[];
};

// These are shape collections for all lines of code.
export type AllLineShapes = LineShapes[];

export const generateLineShapes = (
  fileLines: string[],
  {
    // This is the line length to cut the shape off at.
    maxLineLength = 40,
  } = {},
): AllLineShapes => {
  const allLineShapes: AllLineShapes = [];

  fileLines.forEach((code, lineIndex) => {
    const line = lineIndex + 1;
    const characters = code.replace('\t', ' '.repeat(2)).split('');

    const lineShapes: LineShapes = { line, tokens: [] };
    const getLastShape = () => lineShapes.tokens[lineShapes.tokens.length - 1];
    const getLastToken = () => {
      const lastShape = getLastShape();
      return lastShape ? lastShape.token : null;
    };

    for (let i = 0; i < maxLineLength; i++) {
      const char = characters[i] || ' ';
      const token = char === ' ' ? Token.whitespace : Token.code;

      if (getLastToken() !== token) {
        lineShapes.tokens.push({ token, count: 0, percentOfWidth: 0 });
      }

      const shape = getLastShape();
      shape.count += 1;
    }

    // Calculate width percentages:
    lineShapes.tokens.forEach((shape) => {
      // eslint-disable-next-line no-param-reassign
      shape.percentOfWidth = (shape.count / maxLineLength) * 100;
    });

    allLineShapes.push(lineShapes);
  });

  return allLineShapes;
};

export type PublicProps = {
  lineShapes: LineShapes;
};

type Props = PublicProps;

const CodeShape = ({ lineShapes }: Props) => {
  return (
    <React.Fragment>
      {lineShapes.tokens.map((shape) => {
        let className;
        if (shape.token === Token.whitespace) {
          className = styles.whitespace;
        } else {
          className = styles.code;
        }

        return (
          <div
            key={[
              String(lineShapes.line),
              String(shape.percentOfWidth),
              className,
            ].join(':')}
            className={className}
            style={{ width: `${shape.percentOfWidth}%` }}
          />
        );
      })}
    </React.Fragment>
  );
};

export default CodeShape;
