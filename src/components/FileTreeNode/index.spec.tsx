import * as React from 'react';
import { shallow } from 'enzyme';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from './styles.module.scss';

import FileTreeNode from '.';

describe(__filename, () => {
  const fakeGetToggleProps = () => ({
    onClick: jest.fn(),
    onKeyDown: jest.fn(),
    role: 'button',
    tabIndex: 0,
  });

  const getTreefoldRenderProps = ({
    getToggleProps = fakeGetToggleProps,
    hasChildNodes = false,
    id = 'root',
    isExpanded = false,
    isFolder = true,
    name = 'root',
    renderChildNodes = jest.fn(),
    onSelect = jest.fn(),
  } = {}) => {
    return {
      node: {
        id,
        name,
      },
      getToggleProps,
      hasChildNodes,
      isExpanded,
      isFolder,
      level: 0,
      renderChildNodes,
      onSelect,
    };
  };

  const render = (props = {}) => {
    const allProps = {
      ...getTreefoldRenderProps(),
      ...props,
    };

    return shallow(<FileTreeNode {...allProps} />);
  };

  it('renders a simple directory node', () => {
    const name = 'simple directory node';
    const getToggleProps = jest.fn();
    const renderProps = getTreefoldRenderProps({
      name,
      isFolder: true,
      getToggleProps,
    });

    const root = render(renderProps);

    expect(root.find(`.${styles.node}`)).toHaveLength(1);
    expect(root.find(`.${styles.node}`)).toIncludeText(name);

    expect(root.find(`.${styles.directoryNode}`)).toHaveLength(1);

    expect(root.find(FontAwesomeIcon)).toHaveLength(1);
    expect(root.find(FontAwesomeIcon)).toHaveProp('icon', 'folder');

    expect(getToggleProps).toHaveBeenCalled();
  });

  it('renders a simple node', () => {
    const name = 'simple node';
    const renderProps = getTreefoldRenderProps({ name, isFolder: false });

    const root = render(renderProps);

    expect(root.find(`.${styles.node}`)).toHaveLength(1);
    expect(root.find(`.${styles.node}`)).toIncludeText(name);

    expect(root.find(`.${styles.directoryNode}`)).toHaveLength(0);

    expect(root.find(FontAwesomeIcon)).toHaveLength(1);
    expect(root.find(FontAwesomeIcon)).toHaveProp('icon', 'file');
  });

  it('sets an onClick handler to a simple node', () => {
    const onSelect = jest.fn();
    const id = 'some-node-id';
    const renderProps = getTreefoldRenderProps({
      id,
      onSelect,
      isFolder: false,
    });

    const root = render(renderProps);

    expect(root.find(`.${styles.node}`)).toHaveProp('onClick');

    root.find(`.${styles.node}`).simulate('click');

    expect(onSelect).toHaveBeenCalledWith(id);
  });

  it('uses the onClick handler of the toggle props for a directory node', () => {
    const onSelect = jest.fn();
    const getToggleProps = fakeGetToggleProps();
    const renderProps = getTreefoldRenderProps({
      getToggleProps: () => getToggleProps,
      onSelect,
      isFolder: true,
    });

    const root = render(renderProps);

    expect(root.find(`.${styles.node}`)).toHaveProp('onClick');

    root.find(`.${styles.node}`).simulate('click');

    expect(onSelect).not.toHaveBeenCalled();
    expect(getToggleProps.onClick).toHaveBeenCalled();
  });

  it('renders an expanded node', () => {
    const renderProps = getTreefoldRenderProps({
      isFolder: true,
      isExpanded: true,
    });

    const root = render(renderProps);

    expect(root.find(`.${styles.directoryNode}`)).toHaveLength(1);

    expect(root.find(FontAwesomeIcon)).toHaveLength(1);
    expect(root.find(FontAwesomeIcon)).toHaveProp('icon', 'folder-open');
  });

  it('displays a message when a folder is empty', () => {
    const renderProps = getTreefoldRenderProps({
      isFolder: true,
      isExpanded: true,
      hasChildNodes: false,
    });

    const root = render(renderProps);

    expect(root.find(`.${styles.emptyNodeDirectory}`)).toHaveLength(1);
    expect(root.find(`.${styles.emptyNodeDirectory}`)).toIncludeText(
      'This folder is empty',
    );
  });

  it('does not call a function to render the child nodes of an expanded node when it has no child nodes', () => {
    const renderChildNodes = jest.fn();
    const renderProps = getTreefoldRenderProps({
      isFolder: true,
      isExpanded: true,
      hasChildNodes: false,
      renderChildNodes,
    });

    render(renderProps);

    expect(renderChildNodes).not.toHaveBeenCalled();
  });

  it('calls a function to render the child nodes of an expanded node when it has child nodes', () => {
    const renderChildNodes = jest.fn();
    const renderProps = getTreefoldRenderProps({
      isFolder: true,
      isExpanded: true,
      hasChildNodes: true,
      renderChildNodes,
    });

    render(renderProps);

    expect(renderChildNodes).toHaveBeenCalled();
  });
});
