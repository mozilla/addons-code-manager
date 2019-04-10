import * as React from 'react';
import { RefractorNode } from 'refractor';
import makeClassName from 'classnames';

export const mapChild = (
  child: RefractorNode,
  i: number,
  depth: number,
): React.ReactElement | string => {
  if (child.tagName) {
    const className = makeClassName(
      child.properties && child.properties.className,
    );

    return React.createElement(
      child.tagName,
      {
        key: `code-child-${depth}-${i}`,
        ...child.properties,
        className,
      },
      // eslint-disable-next-line no-use-before-define, @typescript-eslint/no-use-before-define
      child.children && child.children.map(mapWithDepth(depth + 1)),
    );
  }

  return child.value;
};

export const mapWithDepth = (depth: number, _mapChild = mapChild) => {
  return (child: RefractorNode, i: number) => {
    return _mapChild(child, i, depth);
  };
};

export const getLines = (content: string) => {
  return content.replace('\r\n', '\n').split('\n');
};

/*
 * This gets an ID (for a DOM element) representing a line of code.
 */
export const getCodeLineAnchorID = (line: number) => {
  return `L${line}`;
};

/*
 * This gets an anchor HREF to a line of code.
 */
export const getCodeLineAnchor = (line: number) => {
  return `#${getCodeLineAnchorID(line)}`;
};
