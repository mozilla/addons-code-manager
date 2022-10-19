import * as React from 'react';

import { LineShapes, Token } from './utils';
import styles from './styles.module.scss';

export type PublicProps = {
  isChange?: boolean;
  lineShapes: LineShapes;
};

type Props = PublicProps;

const CodeLineShapes = ({ isChange, lineShapes }: Props) => {
  return (
    <>
      {lineShapes.tokens.map((shape, shapeIndex) => {
        let className;
        if (shape.token === Token.whitespace) {
          className = styles.whitespace;
        } else if (isChange) {
          className = styles.change;
        } else {
          className = styles.code;
        }

        return (
          <div
            key={[
              String(lineShapes.line),
              String(shapeIndex),
              String(shape.percentOfWidth),
              className,
            ].join(':')}
            className={className}
            style={{ width: `${shape.percentOfWidth}%` }}
          />
        );
      })}
    </>
  );
};

export default CodeLineShapes;
