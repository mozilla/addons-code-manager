import * as React from 'react';
import { shallow } from 'enzyme';

import styles from './styles.module.scss';

import Commentable, { PublicProps } from '.';

describe(__filename, () => {
  const render = (moreProps: Partial<PublicProps> = {}) => {
    return shallow(<Commentable as="span" {...moreProps} />);
  };

  it('passes through configuration of a custom component', () => {
    const hostElement = 'div';
    const className = 'example-class';
    const id = 'example-id';

    const root = render({ as: hostElement, className, id });

    expect(root.type()).toEqual(hostElement);
    expect(root).toHaveClassName(className);
    expect(root).toHaveProp('id', id);
  });

  it('is classified as commentable', () => {
    const root = render();

    expect(root).toHaveClassName(styles.commentable);
  });

  it('renders children', () => {
    const className = 'child-class';
    const children = <div className={className} />;
    const root = render({ children });

    expect(root.find(`.${className}`)).toHaveLength(1);
  });
});
