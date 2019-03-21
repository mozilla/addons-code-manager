import * as React from 'react';
import { TreefoldRenderProps } from 'react-treefold';
import { ListGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import makeClassName from 'classnames';

import { gettext } from '../../utils';
import { TreeNode } from '../FileTree';
import { Version } from '../../reducers/versions';
import { LinterMessage, LinterMessageMap } from '../../reducers/linter';
import styles from './styles.module.scss';

export type PublicProps = TreefoldRenderProps<TreeNode> & {
  linterMessages: LinterMessageMap | void;
  onSelect: (id: string) => void;
  version: Version;
};

type MessageType = LinterMessage['type'];

export const findMostSevereTypeForPath = (
  linterMessageMap: LinterMessageMap,
  targetPath: string,
): MessageType | null => {
  const allTypes = Object.keys(linterMessageMap).reduce(
    (types, path: string) => {
      if (!path.startsWith(targetPath)) {
        return types;
      }

      const map = linterMessageMap[path];
      types.push(...map.global.map((message) => message.type));

      Object.keys(map.byLine).forEach((key) => {
        types.push(...map.byLine[parseInt(key, 10)].map((m) => m.type));
      });

      return types;
    },
    [] as LinterMessage['type'][],
  );

  const orderedTypes: MessageType[] = ['error', 'warning', 'notice'];
  for (const type of orderedTypes) {
    if (allTypes.includes(type)) {
      return type;
    }
  }

  return null;
};

const getTitleForType = (type: string | null, isFolder: boolean) => {
  switch (type) {
    case 'error':
      return isFolder
        ? gettext('This folder contains files with linter errors')
        : gettext('This file contains linter errors');
    case 'warning':
      return isFolder
        ? gettext('This folder contains files with linter warnings')
        : gettext('This file contains linter warnings');
    default:
      return isFolder
        ? gettext('This folder contains files with linter notices')
        : gettext('This file contains linter notices');
  }
};

const getIconForType = (type: string | null) => {
  switch (type) {
    case 'error':
      return 'times-circle';
    case 'warning':
      return 'exclamation-triangle';
    default:
      return 'info-circle';
  }
};

class FileTreeNodeBase<TreeNodeType> extends React.Component<PublicProps> {
  render() {
    const {
      getToggleProps,
      hasChildNodes,
      isExpanded,
      isFolder,
      level,
      linterMessages,
      node,
      onSelect,
      renderChildNodes,
      version,
    } = this.props;

    const hasLinterMessages =
      linterMessages &&
      Object.keys(linterMessages).some((path) => path.startsWith(node.id));

    let nodeIcons = null;
    let linterType = null;
    if (linterMessages && hasLinterMessages) {
      linterType = findMostSevereTypeForPath(linterMessages, node.id);

      nodeIcons = (
        <span className={styles.nodeIcons}>
          <FontAwesomeIcon
            icon={getIconForType(linterType)}
            title={getTitleForType(linterType, isFolder)}
          />
        </span>
      );
    }

    let listGroupItemProps = {
      className: makeClassName(styles.node, {
        [styles.directoryNode]: isFolder,
        [styles.selected]: version.selectedPath === node.id,
        [styles.hasLinterMessages]: hasLinterMessages,
        [styles.hasLinterErrors]: linterType === 'error',
        [styles.hasLinterWarnings]: linterType === 'warning',
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
          <span
            className={styles.nodeItem}
            style={{ paddingLeft: `${level * 12}px` }}
          >
            {isFolder ? (
              <FontAwesomeIcon icon={isExpanded ? 'folder-open' : 'folder'} />
            ) : (
              <FontAwesomeIcon icon="file" />
            )}
            <span className={styles.nodeName}>{node.name}</span>
            {nodeIcons}
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
