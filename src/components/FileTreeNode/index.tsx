import * as React from 'react';
import { TreefoldRenderProps } from 'react-treefold';
import { ListGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import makeClassName from 'classnames';

import { gettext } from '../../utils';
import { TreeNode } from '../FileTree';
import styles from './styles.module.scss';

export type PublicProps = TreefoldRenderProps<TreeNode> & {
  onSelect: (id: string) => void;
};

class FileTreeNodeBase<TreeNodeType> extends React.Component<PublicProps> {
  render() {
    const {
      node,
      level,
      isFolder,
      isExpanded,
      getToggleProps,
      hasChildNodes,
      renderChildNodes,
      onSelect,
    } = this.props;

    let listGroupItemProps = {
      className: makeClassName(styles.node, {
        [styles.directoryNode]: isFolder,
      }),
      onClick: () => onSelect(node.id),
    };

    if (isFolder) {
      listGroupItemProps = {
        ...listGroupItemProps,
        ...getToggleProps(),
      };
    }

    return (
      <React.Fragment>
        <ListGroup.Item {...listGroupItemProps}>
          <span style={{ paddingLeft: `${level * 20}px` }}>
            {isFolder ? (
              <React.Fragment>
                <FontAwesomeIcon icon={isExpanded ? 'folder-open' : 'folder'} />
                &nbsp;{node.name}
              </React.Fragment>
            ) : (
              <React.Fragment>
                <FontAwesomeIcon icon="file" />
                &nbsp;{node.name}
              </React.Fragment>
            )}
          </span>
        </ListGroup.Item>

        {isExpanded &&
          (hasChildNodes ? (
            renderChildNodes()
          ) : (
            <ListGroup.Item
              className={makeClassName(styles.node, styles.emptyNodeDirectory)}
              style={{ paddingLeft: `${(level + 2) * 20}px` }}
            >
              {gettext('This folder is empty')}
            </ListGroup.Item>
          ))}
      </React.Fragment>
    );
  }
}

export default FileTreeNodeBase;
