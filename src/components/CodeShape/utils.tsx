export enum Token {
  code = 'code',
  whitespace = 'whitespace',
}

// This represents the shape of one or more tokens.
export type TokenShape = {
  count: number;
  percentOfWidth: number;
  token: Token;
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
