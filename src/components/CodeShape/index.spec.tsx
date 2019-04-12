import * as React from 'react';
import { shallow } from 'enzyme';

import styles from './styles.module.scss';
import { generateLineShapes } from './utils';

import CodeShape, { PublicProps as CodeShapeProps } from '.';

describe(__filename, () => {
  describe('CodeShape', () => {
    const render = (props: CodeShapeProps) => {
      return shallow(<CodeShape {...props} />);
    };

    it('renders LineShapes', () => {
      const line = '"use strict;"';
      const allLineShapes = generateLineShapes([line], {
        maxLineLength: line.length,
      });
      const lineShapes = allLineShapes[0];
      const root = render({ lineShapes });
      const shapeDivs = root.find('div');

      const first = shapeDivs.at(0);
      expect(first).toHaveClassName(styles.code);
      expect(first).toHaveProp('style', {
        width: `${lineShapes.tokens[0].percentOfWidth}%`,
      });

      const second = shapeDivs.at(1);
      expect(second).toHaveClassName(styles.whitespace);
      expect(second).toHaveProp('style', {
        width: `${lineShapes.tokens[1].percentOfWidth}%`,
      });

      const third = shapeDivs.at(2);
      expect(third).toHaveClassName(styles.code);
      expect(third).toHaveProp('style', {
        width: `${lineShapes.tokens[2].percentOfWidth}%`,
      });

      expect(shapeDivs).toHaveLength(3);
    });
  });
});
