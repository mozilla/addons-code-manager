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
  getVersionInfo,
  viewVersionFile,
} from '../../reducers/versions';
import { gettext, getPathFromQueryString } from '../../utils';
import styles from './styles.module.scss';

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

  componentDidUpdate(prevProps: Props) {
    this.loadData(prevProps);
  }

  loadData(prevProps?: Props) {
    const {
      _fetchDiff,
      compareInfo,
      dispatch,
      history,
      match,
      version,
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

    const path = getPathFromQueryString(history);

    if (compareInfo === null) {
      // An error has occured when fetching the version.
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
      return;
    }

    if (!prevProps) {
      return;
    }

    if (
      version &&
      ((prevProps.version &&
        version.selectedPath !== prevProps.version.selectedPath) ||
        addonId !== prevProps.match.params.addonId ||
        baseVersionId !== prevProps.match.params.baseVersionId ||
        headVersionId !== prevProps.match.params.headVersionId)
    ) {
      dispatch(
        _fetchDiff({
          addonId: parseInt(addonId, 10),
          baseVersionId: oldVersionId,
          headVersionId: newVersionId,
          path: version.selectedPath,
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

    return <Loading message={message} />;
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
        <VersionChooser addonId={addonId} />
        {version && compareInfo ? (
          <DiffView
            diffs={compareInfo.diffs}
            mimeType={compareInfo.mimeType}
            version={version}
          />
        ) : (
          this.renderLoadingMessageOrError(gettext('Loading diff...'))
        )}
      </ContentShell>
    );
  }
}

const mapStateToProps = (
  state: ApplicationState,
  ownProps: RouteComponentProps<PropsFromRouter>,
): PropsFromState => {
  const { match } = ownProps;
  const addonId = parseInt(match.params.addonId, 10);
  const headVersionId = parseInt(match.params.headVersionId, 10);

  const { compareInfo } = state.versions;

  // The Compare API returns the version info of the head/newest version.
  const version = getVersionInfo(state.versions, headVersionId);

  return {
    addonId,
    compareInfo,
    version,
  };
};

export default connect(mapStateToProps)(CompareBase);
