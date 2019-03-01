import * as React from 'react';
import { RefractorNode } from 'refractor';
import makeClassName from 'classnames';

const mapChild = (
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

export const mapWithDepth = (depth: number) => {
  return (child: RefractorNode, i: number) => {
    return mapChild(child, i, depth);
  };
};

export const getLines = (content: string) => {
  return content.replace('\r\n', '\n').split('\n');
};
