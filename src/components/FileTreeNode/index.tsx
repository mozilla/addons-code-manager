import log from 'loglevel';
import * as React from 'react';
import { ListGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import makeClassName from 'classnames';

import { gettext } from '../../utils';
import { TreefoldRenderPropsForFileTree } from '../FileTree';
import LinterProvider, { LinterProviderInfo } from '../LinterProvider';
import { Version } from '../../reducers/versions';
import {
  LinterMessage,
  LinterMessageMap,
  findMostSevereType,
  getMessagesForPath,
} from '../../reducers/linter';
import styles from './styles.module.scss';

type ScrollIntoViewIfNeeded = () => void;

export type PublicProps = TreefoldRenderPropsForFileTree & {
  _scrollIntoViewIfNeeded?: ScrollIntoViewIfNeeded;
  onSelect: (id: string) => void;
  version: Version;
};

export type DefaultProps = {
  createNodeRef: () => React.RefObject<HTMLDivElement> | null;
};

type Props = PublicProps & DefaultProps;

type MessageType = LinterMessage['type'];

export const findMostSevereTypeForPath = (
  linterMessageMap: LinterMessageMap,
  targetPath: string,
  { _findMostSevereType = findMostSevereType } = {},
): MessageType | null => {
  const allMessages = Object.keys(linterMessageMap).reduce(
    (messages: LinterMessage[], path: string) => {
      if (!path.startsWith(targetPath)) {
        return messages;
      }

      const map = linterMessageMap[path];
      messages.push(...map.global);

      Object.keys(map.byLine).forEach((key) => {
        messages.push(...map.byLine[parseInt(key, 10)]);
      });

      return messages;
    },
    [],
  );

  if (!allMessages.length) {
    return null;
  }
  return _findMostSevereType(allMessages);
};

export const LINTER_KNOWN_LIBRARY_CODE = 'KNOWN_LIBRARY';

export const isKnownLibrary = (
  linterMessageMap: LinterMessageMap,
  path: string,
  _getMessagesForPath: typeof getMessagesForPath = getMessagesForPath,
): boolean => {
  const m = linterMessageMap[path];

  if (!m) {
    return false;
  }

  // The call to getMessagesForPath checks that the messages do not have any
  // unexpected keys.
  const messages = _getMessagesForPath(m);
  if (messages.length > 1 || messages[0].line !== null) {
    // Even though this file could be a known library, return false so that the
    // UI does not hide the file. The file should not be hidden when there are
    // multiple linter messages.
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

class FileTreeNodeBase<TreeNodeType> extends React.Component<Props> {
  static defaultProps = {
    createNodeRef: () => React.createRef(),
  };

  private scrollIntoViewIfNeeded: ScrollIntoViewIfNeeded;

  private nodeRef = this.props.createNodeRef();

  constructor(props: Props) {
    super(props);
    this.scrollIntoViewIfNeeded =
      this.props._scrollIntoViewIfNeeded || this._scrollIntoViewIfNeeded;
  }

  componentDidMount() {
    this.scrollIntoViewIfNeeded();
  }

  componentDidUpdate() {
    this.scrollIntoViewIfNeeded();
  }

  _scrollIntoViewIfNeeded = () => {
    if (this.isSelected()) {
      if (this.nodeRef && this.nodeRef.current) {
        this.nodeRef.current.scrollIntoView();
      } else {
        log.warn(`nodeRef.current was unexpectedly empty: ${this.nodeRef}`);
      }
    }
  };

  isSelected() {
    const { node, version } = this.props;
    return version.selectedPath === node.id;
  }

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
        [styles.selected]: this.isSelected(),
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

    const ItemElement = (props = {}) => {
      return <div ref={this.nodeRef} {...props} />;
    };

    return (
      <React.Fragment>
        <ListGroup.Item as={ItemElement} {...listGroupItemProps}>
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
    const { node, version } = this.props;

    return (
      <LinterProvider
        key={[node.id].concat(version.expandedPaths).join(':')}
        versionId={version.id}
        validationURL={version.validationURL}
        selectedPath={version.selectedPath}
      >
        {this.renderWithLinterInfo}
      </LinterProvider>
    );
  }
}

export default FileTreeNodeBase;
