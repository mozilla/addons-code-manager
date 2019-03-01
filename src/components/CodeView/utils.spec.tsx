import { RefractorNode } from 'refractor';
import makeClassName from 'classnames';

import { mapWithDepth, mapChild, getLines } from './utils';

describe(__filename, () => {
  describe('getLines', () => {
    it('splits a content into lines', () => {
      const lines = ['foo', 'bar'];
      const content = lines.join('\n');

      expect(getLines(content)).toEqual(lines);
    });

    it('supports Windows line endings', () => {
      const lines = ['foo', 'bar'];
      const content = `${lines.join('\r\n')}`;

      expect(getLines(content)).toEqual(lines);
    });
  });

  describe('map functions', () => {
    const createChild = ({
      children,
      properties,
      tagName,
      type = '',
      value = '',
    }: Partial<RefractorNode>): RefractorNode => {
      return {
        children,
        properties,
        tagName,
        type,
        value,
      };
    };

    describe('mapChild', () => {
      it('creates a React element from a child with a tagName and a className', () => {
        const depth = 0;
        const i = 0;
        const className = 'some-css-class';
        const tagName = 'a';
        const child = createChild({ tagName, properties: { className } });

        const element = mapChild(child, i, depth);

        expect(element).toHaveProperty('key', `code-child-${depth}-${i}`);
        expect(element).toHaveProperty('type', tagName);
        expect(element).toHaveProperty('props.className', className);
      });

      it('creates a React element with strictly positive depth and index', () => {
        const depth = 2;
        const i = 4;
        const tagName = 'a';
        const child = createChild({ tagName });

        const element = mapChild(child, i, depth);

        expect(element).toHaveProperty('key', `code-child-${depth}-${i}`);
      });

      it('creates a React element from a child with a tagName and empty properties', () => {
        const depth = 0;
        const i = 0;
        const tagName = 'a';
        const child = createChild({ tagName, properties: {} });

        const element = mapChild(child, i, depth);

        expect(element).toHaveProperty('props.className', '');
      });

      it('creates a React element from a child with a tagName only', () => {
        const depth = 0;
        const i = 0;
        const tagName = 'a';
        const child = createChild({ tagName, properties: undefined });

        const element = mapChild(child, i, depth);

        expect(element).toHaveProperty('props.className', '');
      });

      it('creates a React element from a child with multiple class names', () => {
        const depth = 0;
        const i = 0;
        const className = ['some-css-class', 'some-other-css'];
        const tagName = 'a';
        const child = createChild({ tagName, properties: { className } });

        const element = mapChild(child, i, depth);

        expect(element).toHaveProperty(
          'props.className',
          makeClassName(className),
        );
      });

      it('create a React element embedding a child from a child with children', () => {
        const depth = 2;
        const i = 3;
        const tagName = 'a';
        const className = 'child-css-class';
        const children = [
          createChild({ tagName, properties: { className } }),
          createChild({ tagName, properties: { className } }),
        ];

        const child = createChild({ tagName, children });

        const element = mapChild(child, i, depth);

        expect(element).toHaveProperty('key', `code-child-${depth}-${i}`);
        expect(element).toHaveProperty('props.children');

        const { props } = element as React.ReactElement;

        expect(props.children).toHaveLength(2);
        props.children.forEach((el: React.ReactElement, index: number) => {
          expect(el).toHaveProperty('key', `code-child-${depth + 1}-${index}`);
          expect(el).toHaveProperty('props.className', className);
        });
      });

      it('returns the value of the child when it has no tagName', () => {
        const depth = 0;
        const i = 0;
        const value = 'some value';
        const child = createChild({ tagName: undefined, value });

        const element = mapChild(child, i, depth);

        expect(element).toEqual(value);
      });
    });

    describe('mapWithDepth', () => {
      it('returns a function that calls mapChild() with a fixed depth', () => {
        const child = createChild({ tagName: 'a' });
        const depth = 123;
        const index = 2;

        const _mapChild = jest.fn();

        const func = mapWithDepth(depth, _mapChild);
        func(child, index);

        expect(_mapChild).toHaveBeenCalledWith(child, index, depth);
      });
    });
  });
});
