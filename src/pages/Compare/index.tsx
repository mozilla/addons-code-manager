import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';

import { ApplicationState } from '../../reducers';
import { ConnectedReduxProps } from '../../configureStore';
import { ContentShell } from '../../components/FullscreenGrid';
import FileTree from '../../components/FileTree';
import DiffView from '../../components/DiffView';
import Loading from '../../components/Loading';
import VersionChooser from '../../components/VersionChooser';
import {
  CompareInfo,
  Version,
  fetchDiff,
  getCompareInfo,
  getVersionInfo,
  viewVersionFile,
} from '../../reducers/versions';
import { gettext, getPathFromQueryString } from '../../utils';
import styles from './styles.module.scss';

export const makeCompareInfoKey = (info: CompareInfo) => {
  const changes = [];
  for (const diff of info.diffs) {
    for (const hunk of diff.hunks) {
      for (const change of hunk.changes) {
        changes.push(change.content);
      }
    }
  }
  return changes.join(':');
};

export type PublicProps = {
  _fetchDiff: typeof fetchDiff;
  _viewVersionFile: typeof viewVersionFile;
};

type PropsFromRouter = {
  addonId: string;
  baseVersionId: string;
  headVersionId: string;
  lang: string;
};

type PropsFromState = {
  addonId: number;
  compareInfo: CompareInfo | null | void;
  path: string | undefined;
  version: Version | void | null;
};

type Props = RouteComponentProps<PropsFromRouter> &
  PropsFromState &
  PublicProps &
  ConnectedReduxProps;

export class CompareBase extends React.Component<Props> {
  static defaultProps = {
    _fetchDiff: fetchDiff,
    _viewVersionFile: viewVersionFile,
  };

  componentDidMount() {
    this.loadData();
  }

  componentDidUpdate() {
    this.loadData();
  }

  loadData() {
    const {
      _fetchDiff,
      compareInfo,
      dispatch,
      history,
      match,
      path,
    } = this.props;
    const { addonId, baseVersionId, headVersionId, lang } = match.params;

    const oldVersionId = parseInt(baseVersionId, 10);
    const newVersionId = parseInt(headVersionId, 10);

    // We ensure the new version ID is newer than the old version ID when
    // loading the page.
    if (oldVersionId > newVersionId) {
      history.push(
        `/${lang}/compare/${addonId}/versions/${headVersionId}...${baseVersionId}/`,
      );
      return;
    }

    if (compareInfo === null) {
      // An error has occured when fetching the compare info.
      return;
    }

    if (compareInfo === undefined) {
      dispatch(
        _fetchDiff({
          addonId: parseInt(addonId, 10),
          baseVersionId: oldVersionId,
          headVersionId: newVersionId,
          path: path || undefined,
        }),
      );
    }
  }

  viewVersionFile = (path: string) => {
    const { _viewVersionFile, dispatch, match } = this.props;
    const { headVersionId } = match.params;

    dispatch(
      _viewVersionFile({
        selectedPath: path,
        versionId: parseInt(headVersionId, 10),
        // When selecting a new file to view, we do not want to preserve the
        // hash in the URL (this hash highlights a specific line of code).
        preserveHash: false,
      }),
    );
  };

  renderLoadingMessageOrError(message: string) {
    const { compareInfo } = this.props;

    if (compareInfo === null) {
      return (
        <p className={styles.error}>
          {gettext('Ooops, an error has occured.')}
        </p>
      );
    }

    return (
      // Use a container so that `display: flex` doesn't disturb the contents.
      <div>
        <Loading message={message} />
      </div>
    );
  }

  render() {
    const { addonId, compareInfo, version } = this.props;

    return (
      <ContentShell
        mainSidePanel={
          version ? (
            <FileTree onSelect={this.viewVersionFile} versionId={version.id} />
          ) : (
            this.renderLoadingMessageOrError(gettext('Loading file tree...'))
          )
        }
      >
        <div className={styles.diffShell}>
          <VersionChooser addonId={addonId} />
          {version && compareInfo ? (
            <div
              key={makeCompareInfoKey(compareInfo)}
              className={styles.diffContent}
            >
              {/* The key in this ^ resets scrollbars between files */}
              <DiffView
                diffs={compareInfo.diffs}
                mimeType={compareInfo.mimeType}
                version={version}
              />
            </div>
          ) : (
            this.renderLoadingMessageOrError(gettext('Loading diff...'))
          )}
        </div>
      </ContentShell>
    );
  }
}

export const mapStateToProps = (
  state: ApplicationState,
  ownProps: RouteComponentProps<PropsFromRouter>,
): PropsFromState => {
  const { history, match } = ownProps;
  const addonId = parseInt(match.params.addonId, 10);
  const baseVersionId = parseInt(match.params.baseVersionId, 10);
  const headVersionId = parseInt(match.params.headVersionId, 10);
  const path = getPathFromQueryString(history) || undefined;

  const compareInfo = getCompareInfo(
    state.versions,
    addonId,
    baseVersionId,
    headVersionId,
    path,
  );

  // The Compare API returns the version info of the head/newest version.
  const version = getVersionInfo(state.versions, headVersionId);

  return {
    addonId,
    compareInfo,
    path,
    version,
  };
};

export default connect(mapStateToProps)(CompareBase);
