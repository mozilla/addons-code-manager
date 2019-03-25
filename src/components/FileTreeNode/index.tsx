import * as React from 'react';
import { ListGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import makeClassName from 'classnames';

import { gettext } from '../../utils';
import { TreefoldRenderPropsForFileTree } from '../FileTree';
import LinterProvider, { LinterProviderInfo } from '../LinterProvider';
import { Version } from '../../reducers/versions';
import { LinterMessage, LinterMessageMap } from '../../reducers/linter';
import styles from './styles.module.scss';

export type PublicProps = TreefoldRenderPropsForFileTree & {
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

export const LINTER_KNOWN_LIBRARY_CODE = 'KNOWN_LIBRARY';

export const isKnownLibrary = (
  linterMessageMap: LinterMessageMap,
  path: string,
): boolean => {
  if (!linterMessageMap[path]) {
    return false;
  }

  const m = linterMessageMap[path];

  // This is useful to make sure we do not miss linter messages if
  // `LinterMessageMap` is updated with new maps of messages.
  const allowedKeys = ['global', 'byLine'];
  Object.keys(m).forEach((key) => {
    if (!allowedKeys.includes(key)) {
      throw new Error(`Unexpected key "${key}" found.`);
    }
  });

  if (m.global.length > 1 || Object.keys(m.byLine).length > 0) {
    return false;
  }

  return m.global[0].code.includes(LINTER_KNOWN_LIBRARY_CODE);
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
    case 'known-library':
      return 'check-circle';
    default:
      return 'info-circle';
  }
};

class FileTreeNodeBase<TreeNodeType> extends React.Component<PublicProps> {
  renderWithLinterInfo = ({ messageMap }: LinterProviderInfo) => {
    const {
      getToggleProps,
      hasChildNodes,
      isExpanded,
      isFolder,
      level,
      node,
      onSelect,
      renderChildNodes,
      version,
    } = this.props;

    const hasLinterMessages =
      messageMap &&
      Object.keys(messageMap).some((path) => path.startsWith(node.id));

    let nodeIcons = null;
    let linterType = null;
    if (messageMap && hasLinterMessages) {
      let title;
      if (isKnownLibrary(messageMap, node.id)) {
        linterType = 'known-library';
        title = gettext('This is a known library');
      } else {
        linterType = findMostSevereTypeForPath(messageMap, node.id);
        title = getTitleForType(linterType, isFolder);
      }

      nodeIcons = (
        <span className={styles.nodeIcons}>
          <FontAwesomeIcon icon={getIconForType(linterType)} title={title} />
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
        [styles.isKnownLibrary]: linterType === 'known-library',
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
  };

  render() {
    const { version } = this.props;

    return (
      <LinterProvider version={version}>
        {/*
          props.children needs be an anonymous function so that the
          shallow prop check in connect(LinterProvider) will always think
          there is a new value for props.children.

          Without a new value, LinterProvider will not re-render its
          children often enough. For example, the uncontrolled ListGroup
          components (which could be nested recursively) need to
          re-render when their internal state changes.
        */}
        {(info: LinterProviderInfo) => this.renderWithLinterInfo(info)}
      </LinterProvider>
    );
  }
}

export default FileTreeNodeBase;
