import log from 'loglevel';
import * as React from 'react';
import { connect } from 'react-redux';
import { ListGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import makeClassName from 'classnames';

import { ApplicationState } from '../../reducers';
import { ConnectedReduxProps } from '../../configureStore';
import { gettext } from '../../utils';
import { TreefoldRenderPropsForFileTree } from '../FileTree';
import LinterProvider, { LinterProviderInfo } from '../LinterProvider';
import { selectFilePathHasComments } from '../../reducers/comments';
import {
  EntryStatusMap,
  Version,
  actions as versionsActions,
  getMostRelevantEntryStatus,
  getVersionInfo,
  getEntryStatusMap,
} from '../../reducers/versions';
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
  createNodeRef?: () => React.RefObject<HTMLDivElement> | null;
  onSelect: (id: string) => void;
  versionId: number;
  comparedToVersionId: number | null;
};

type PropsFromState = {
  entryStatusMap: EntryStatusMap;
  hasComments: boolean;
  version: Version;
};

type Props = PublicProps & PropsFromState & ConnectedReduxProps;

type MessageType = LinterMessage['type'];

export const findMostSevereTypeForPath = (
  linterMessageMap: LinterMessageMap,
  targetPath: string,
  { _findMostSevereType = findMostSevereType } = {},
): MessageType | null => {
  const allMessages = Object.keys(linterMessageMap.byPath).reduce(
    (messages: LinterMessage[], path: string) => {
      if (!path.startsWith(targetPath)) {
        return messages;
      }

      const map = linterMessageMap.byPath[path];
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
  const m = linterMessageMap.byPath[path];

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

export class FileTreeNodeBase<TreeNodeType> extends React.Component<Props> {
  private scrollIntoViewIfNeeded: ScrollIntoViewIfNeeded;

  private nodeRef: React.RefObject<HTMLDivElement> | null = this.props
    .createNodeRef
    ? this.props.createNodeRef()
    : React.createRef();

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
    const { dispatch, node, version } = this.props;

    if (this.isSelected() && version.visibleSelectedPath !== node.id) {
      if (this.nodeRef && this.nodeRef.current) {
        this.nodeRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
        dispatch(
          versionsActions.setVisibleSelectedPath({
            path: node.id,
            versionId: version.id,
          }),
        );
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
      hasComments,
      getToggleProps,
      hasChildNodes,
      isExpanded,
      isFolder,
      level,
      node,
      onSelect,
      renderChildNodes,
      version,
      entryStatusMap,
    } = this.props;
    const hasLinterMessages =
      messageMap &&
      Object.keys(messageMap.byPath).some((path) => path.startsWith(node.id));

    const nodeIcons = [];
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

      nodeIcons.push(
        <FontAwesomeIcon
          fixedWidth
          key="linter-icon"
          icon={getIconForType(linterType)}
          title={title}
        />,
      );
    }

    if (hasComments) {
      nodeIcons.push(
        <FontAwesomeIcon
          fixedWidth
          key="comments-icon"
          flip="horizontal"
          icon={['fas', 'comment-alt']}
          size="1x"
          title={
            isFolder
              ? gettext('This directory contains files with comments')
              : gettext('This file has comments')
          }
        />,
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

    const adjustedLevel = level + 1;
    const entryStatus = getMostRelevantEntryStatus({
      entryStatusMap,
      version,
      path: node.id,
    });

    const ItemElement = (props = {}) => {
      return <div ref={this.nodeRef} {...props} />;
    };

    const entryWasDeleted = entryStatus && entryStatus === 'D';
    const entryWasModified = entryStatus && entryStatus === 'M';
    const entryWasAdded = entryStatus && entryStatus === 'A';

    let nodeTitle = gettext(`View ${node.name}`);
    if (entryWasDeleted) {
      nodeTitle = gettext(`${nodeTitle} (deleted)`);
    } else if (entryWasModified) {
      nodeTitle = gettext(`${nodeTitle} (modified)`);
    } else if (entryWasAdded) {
      nodeTitle = gettext(`${nodeTitle} (added)`);
    }

    return (
      <>
        <ListGroup.Item as={ItemElement} {...listGroupItemProps}>
          <span
            className={makeClassName(styles.nodeItem, {
              [styles.wasDeleted]: entryWasDeleted,
              [styles.wasModified]: entryWasModified,
              [styles.wasAdded]: entryWasAdded,
            })}
            style={{ paddingLeft: `${adjustedLevel * 10}px` }}
          >
            <span className={styles.folderAndFileIcons}>
              {isFolder ? (
                <FontAwesomeIcon
                  fixedWidth
                  icon={isExpanded ? 'folder-open' : 'folder'}
                />
              ) : (
                <FontAwesomeIcon fixedWidth icon="file" />
              )}
            </span>
            <span title={nodeTitle} className={styles.nodeName}>
              {node.name}
            </span>
            {nodeIcons.length > 0 ? (
              <span className={styles.nodeIcons}>{nodeIcons}</span>
            ) : null}
          </span>
        </ListGroup.Item>

        {isExpanded &&
          (hasChildNodes ? (
            renderChildNodes()
          ) : (
            <ListGroup.Item
              className={makeClassName(styles.node, styles.emptyNodeDirectory)}
              style={{ paddingLeft: `${(adjustedLevel + 2) * 20}px` }}
            >
              {gettext('This folder is empty')}
            </ListGroup.Item>
          ))}
      </>
    );
  };

  render() {
    const { version } = this.props;

    return (
      <LinterProvider version={version} selectedPath={version.selectedPath}>
        {(info: LinterProviderInfo) => this.renderWithLinterInfo(info)}
      </LinterProvider>
    );
  }
}

const mapStateToProps = (
  state: ApplicationState,
  ownProps: PublicProps,
): PropsFromState => {
  const { node, versionId, comparedToVersionId } = ownProps;
  const { versions } = state;
  const version = getVersionInfo(versions, versionId);
  const entryStatusMap =
    getEntryStatusMap({
      versions,
      versionId,
      comparedToVersionId,
    }) || {};

  if (!version) {
    // TODO: support loading version objects as needed.
    // https://github.com/mozilla/addons-code-manager/issues/754
    throw new Error(`No version exists in state for version ID ${versionId}`);
  }

  return {
    entryStatusMap,
    hasComments: selectFilePathHasComments({
      comments: state.comments,
      path: node.id,
      versionId,
    }),
    version,
  };
};

export default connect(mapStateToProps)(FileTreeNodeBase);
