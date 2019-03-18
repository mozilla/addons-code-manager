import * as React from 'react';
import { connect } from 'react-redux';
import {
  Decoration,
  Diff,
  DiffInfo,
  DiffProps,
  Hunk,
  HunkInfo,
  getChangeKey,
  tokenize,
} from 'react-diff-view';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import makeClassName from 'classnames';

import { ApplicationState, ConnectedReduxProps } from '../../configureStore';
import LinterMessage from '../LinterMessage';
import refractor from '../../refractor';
import {
  LinterMessagesByPath,
  fetchLinterMessages,
  selectMessageMap,
} from '../../reducers/linter';
import { Version } from '../../reducers/versions';
import { getLanguageFromMimeType, gettext } from '../../utils';
import styles from './styles.module.scss';
import 'react-diff-view/style/index.css';

type LoadData = () => void;

export type PublicProps = {
  _loadData?: LoadData;
  diffs: DiffInfo[];
  mimeType: string;
  version: Version;
};

export type DefaultProps = {
  _document: typeof document;
  _fetchLinterMessages: typeof fetchLinterMessages;
  _tokenize: typeof tokenize;
  viewType: DiffProps['viewType'];
};

type PropsFromState = {
  linterMessages: LinterMessagesByPath | null | void;
  linterMessagesAreLoading: boolean;
};

export type RouterProps = RouteComponentProps<{}>;

export type Props = PublicProps &
  DefaultProps &
  PropsFromState &
  RouterProps &
  ConnectedReduxProps;

export class DiffViewBase extends React.Component<Props> {
  loadData: LoadData;

  static defaultProps: DefaultProps = {
    _document: document,
    _fetchLinterMessages: fetchLinterMessages,
    _tokenize: tokenize,
    viewType: 'unified',
  };

  constructor(props: Props) {
    super(props);
    this.loadData = props._loadData || this._loadData;
  }

  componentDidMount() {
    const { _document, location } = this.props;
    this.loadData();

    if (!location.hash.length) {
      return;
    }

    const element = _document.querySelector(location.hash);

    if (element) {
      element.scrollIntoView();
    }
  }

  componentDidUpdate() {
    this.loadData();
  }

  _loadData = () => {
    const {
      _fetchLinterMessages,
      dispatch,
      version,
      linterMessages,
      linterMessagesAreLoading,
    } = this.props;

    if (linterMessages === undefined && !linterMessagesAreLoading) {
      dispatch(
        _fetchLinterMessages({
          versionId: version.id,
          url: version.validationURL,
        }),
      );
    }
  };

  renderHeader({ hunks }: DiffInfo) {
    const { additions, deletions } = hunks.reduce(
      (acc, hunk) => {
        return {
          additions:
            acc.additions +
            hunk.changes.filter((change) => change.isInsert).length,
          deletions:
            acc.deletions +
            hunk.changes.filter((change) => change.isDelete).length,
        };
      },
      { additions: 0, deletions: 0 },
    );

    return (
      <div className={styles.header}>
        <div className={styles.stats}>
          <span className={styles.statsAdditions}>{`+++ ${additions}`}</span>
          <span className={styles.statsDeletions}>{`--- ${deletions}`}</span>
        </div>
      </div>
    );
  }

  renderHunk = (hunk: HunkInfo, index: number) => {
    const components = [
      <Hunk key={`hunk-${hunk.content}`} hunk={hunk} className={styles.hunk} />,
    ];

    // We don't want to display a separator above the first hunk because it
    // would add the separator between the diff header and the hunk.
    if (index > 0) {
      components.unshift(
        <Decoration key={`decoration-${hunk.content}`}>
          <div className={styles.hunkSeparator}>...</div>
        </Decoration>,
      );
    }

    return components;
  };

  renderHunks = (hunks: HunkInfo[]) => {
    return hunks.map(this.renderHunk);
  };

  render() {
    const {
      _tokenize,
      diffs,
      linterMessages,
      mimeType,
      viewType,
      location,
    } = this.props;

    const options = {
      highlight: true,
      language: getLanguageFromMimeType(mimeType),
      refractor,
    };

    const selectedChanges =
      // Remove the `#` if `location.hash` is defined
      location.hash.length > 2 ? [location.hash.substring(1)] : [];

    return (
      <div className={styles.DiffView}>
        {diffs.length === 0 && (
          <React.Fragment>
            <div className={styles.header} />
            <div className={makeClassName(styles.diff, styles.noDiffs)}>
              {gettext('No differences')}
            </div>
          </React.Fragment>
        )}

        {linterMessages &&
          linterMessages.global.map((message) => {
            return <LinterMessage key={message.uid} message={message} />;
          })}

        {diffs.map((diff) => {
          const { oldRevision, newRevision, hunks, type } = diff;

          return (
            <React.Fragment key={`${oldRevision}-${newRevision}`}>
              {this.renderHeader(diff)}

              <Diff
                className={styles.diff}
                diffType={type}
                hunks={hunks}
                tokens={_tokenize(hunks, options)}
                viewType={viewType}
                gutterType="anchor"
                generateAnchorID={getChangeKey}
                selectedChanges={selectedChanges}
              >
                {this.renderHunks}
              </Diff>
            </React.Fragment>
          );
        })}
      </div>
    );
  }
}

const mapStateToProps = (
  state: ApplicationState,
  ownProps: PublicProps,
): PropsFromState => {
  const { version } = ownProps;

  let linterMessages;
  const map = selectMessageMap(state.linter, version.id);
  if (map) {
    linterMessages = map[version.selectedPath]
      ? map[version.selectedPath]
      : // No messages exist for this path.
        null;
  }

  return {
    linterMessages,
    linterMessagesAreLoading: state.linter.isLoading,
  };
};

export default withRouter<PublicProps & Partial<DefaultProps> & RouterProps>(
  connect(mapStateToProps)(DiffViewBase),
) as React.ComponentType<PublicProps & Partial<DefaultProps>>;
