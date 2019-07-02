import * as React from 'react';
import { Helmet } from 'react-helmet';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';

import { ApplicationState } from '../../reducers';
import { ConnectedReduxProps } from '../../configureStore';
import DiffView from '../../components/DiffView';
import Loading from '../../components/Loading';
import VersionChooser from '../../components/VersionChooser';
import VersionFileViewer from '../../components/VersionFileViewer';
import {
  CompareInfo,
  Version,
  VersionFile,
  fetchDiff,
  fetchVersionFile,
  isFileLoading,
  getCompareInfo,
  getVersionFile,
  getVersionInfo,
  viewVersionFile,
} from '../../reducers/versions';
import {
  createCodeLineAnchorGetter,
  getLocalizedString,
  getPathFromQueryString,
  gettext,
} from '../../utils';
import styles from './styles.module.scss';

export type PublicProps = {
  _fetchDiff: typeof fetchDiff;
  _fetchVersionFile: typeof fetchVersionFile;
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
  versionFile: VersionFile | void | null;
  versionFileIsLoading: boolean;
};

type Props = RouteComponentProps<PropsFromRouter> &
  PropsFromState &
  PublicProps &
  ConnectedReduxProps;

export class CompareBase extends React.Component<Props> {
  static defaultProps = {
    _fetchDiff: fetchDiff,
    _fetchVersionFile: fetchVersionFile,
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
      _fetchVersionFile,
      compareInfo,
      dispatch,
      history,
      match,
      path,
      version,
      versionFile,
      versionFileIsLoading,
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

    if (compareInfo === undefined || version === undefined) {
      dispatch(
        _fetchDiff({
          addonId: parseInt(addonId, 10),
          baseVersionId: oldVersionId,
          headVersionId: newVersionId,
          path: path || undefined,
        }),
      );
    }

    if (version && !versionFileIsLoading && versionFile === undefined) {
      dispatch(
        _fetchVersionFile({
          addonId: parseInt(addonId, 10),
          versionId: version.id,
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

    return (
      // Use a container so that `display: flex` doesn't disturb the contents.
      <div>
        <Loading message={message} />
      </div>
    );
  }

  render() {
    const {
      addonId,
      compareInfo,
      match,
      path,
      version,
      versionFile,
    } = this.props;

    const { baseVersionId, headVersionId } = match.params;

    return (
      <React.Fragment>
        <Helmet>
          <title>
            {version
              ? gettext(
                  `Compare ${getLocalizedString(
                    version.addon.name,
                  )}: ${baseVersionId}...${headVersionId}`,
                )
              : gettext('Compare add-on versions')}
          </title>
        </Helmet>
        <VersionFileViewer
          compareInfo={compareInfo}
          file={versionFile}
          getCodeLineAnchor={createCodeLineAnchorGetter({ compareInfo })}
          onSelectFile={this.viewVersionFile}
          version={version}
        >
          <div className={styles.diffShell}>
            <VersionChooser addonId={addonId} />
            {version && compareInfo ? (
              <div key={`${version.id}:${path}`} className={styles.diffContent}>
                {/* The key in this ^ resets scrollbars between files */}
                <DiffView
                  diff={compareInfo.diff}
                  mimeType={compareInfo.mimeType}
                  version={version}
                />
              </div>
            ) : (
              this.renderLoadingMessageOrError(gettext('Loading diff...'))
            )}
          </div>
        </VersionFileViewer>
      </React.Fragment>
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
  const version = getVersionInfo(state.versions, headVersionId, {
    comparedToVersionId: baseVersionId,
  });

  let versionFile;
  if (version) {
    versionFile = getVersionFile(
      state.versions,
      headVersionId,
      version.selectedPath,
    );
  }

  return {
    addonId,
    compareInfo,
    path,
    version,
    versionFile,
    versionFileIsLoading: version
      ? isFileLoading(state.versions, version.id, version.selectedPath)
      : false,
  };
};

export default connect(mapStateToProps)(CompareBase);
