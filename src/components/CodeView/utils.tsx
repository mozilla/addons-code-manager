import * as React from 'react';
import { RefractorNode } from 'refractor';
import makeClassName from 'classnames';

const mapChild = (
  child: RefractorNode,
  i: number,
  depth: number,
): React.ReactElement | string => {
  if (child.tagName) {
    // @ts-ignore
    const className = makeClassName(child.properties.className);

    return React.createElement(
      child.tagName,
      Object.assign({ key: `code-child-${depth}-${i}` }, child.properties, {
        className,
      }),
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

export const getLanguage = (mimeType: string) => {
  switch (mimeType) {
    case 'application/javascript':
    case 'text/javascript':
      return 'js';
    case 'application/json':
      return 'json';
    case 'application/xml':
      return 'xml';
    case 'text/css':
      return 'css';
    case 'text/html':
      return 'html';
    default:
      return 'text';
  }
};

export const getLines = (content: string) => {
  return content.replace('\r\n', '\n').split('\n');
};
