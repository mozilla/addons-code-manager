import * as React from 'react';
import { mount, shallow } from 'enzyme';
import { Store } from 'redux';

import configureStore from '../../configureStore';
import AddComment from './AddComment';
import styles from './styles.module.scss';

import Commentable, { PublicProps } from '.';

describe(__filename, () => {
  const getRenderProps = ({
    as = 'span',
    children = () => <div />,
    fileName = null,
    line = null,
    versionId = 1,
    ...moreProps
  }: Partial<PublicProps> = {}) => {
    return { as, children, fileName, line, versionId, ...moreProps };
  };

  const render = (moreProps: Partial<PublicProps> = {}) => {
    return shallow(<Commentable {...getRenderProps(moreProps)} />);
  };

  const renderWithMount = ({
    store = configureStore(),
    ...moreProps
  }: { store?: Store } & Partial<PublicProps> = {}) => {
    return mount(<Commentable {...getRenderProps(moreProps)} />, {
      context: { store },
    });
  };

  it('lets you configure the custom element', () => {
    const customElement = 'div';
    const className = 'example-class';
    const id = 'example-id';

    const root = render({ as: customElement, className, id });

    expect(root.type()).toEqual(customElement);
    expect(root).toHaveClassName(className);
    expect(root).toHaveProp('id', id);
  });

  it('is classified as commentable', () => {
    const root = render();

    // This is important because it is instantiating a custom component.
    expect(root).toHaveClassName(styles.commentable);
  });

  it('renders children', () => {
    const className = 'child-class';
    const root = render({
      children: (addComment) => (
        <>
          {addComment}
          <div className={className} />
        </>
      ),
    });

    expect(root.find(`.${className}`)).toHaveLength(1);
  });

  it('renders AddComment', () => {
    const addCommentClassName = 'ExampleClass';
    const fileName = 'manifest.json';
    const line = 432;
    const versionId = 1;
    const root = render({
      addCommentClassName,
      children: (addComment) => addComment,
      fileName,
      line,
      versionId,
    });

    const button = root.find(AddComment);
    expect(button).toHaveProp('fileName', fileName);
    expect(button).toHaveProp('line', line);
    expect(button).toHaveProp('versionId', versionId);
    expect(button).toHaveClassName(addCommentClassName);
  });

  it('can add a ref to the outer DOM node', () => {
    const shellRef = jest.fn();

    // We need `mount()` because `ref` is only used in a DOM environment.
    const root = renderWithMount({ shellRef });

    expect(shellRef).toHaveBeenCalledWith(root.getDOMNode());
  });
});
