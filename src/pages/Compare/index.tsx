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
  EntryStatusMap,
  Version,
  VersionFile,
  fetchDiff,
  fetchVersionFile,
  isFileLoading,
  getCompareInfo,
  getEntryStatusMap,
  getVersionFile,
  getVersionInfo,
  viewVersionFile,
  actions as versionsActions,
} from '../../reducers/versions';
import {
  findRelativePathWithDiff,
  getTree,
  RelativePathPosition,
} from '../../reducers/fileTree';
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
  compareInfo: CompareInfo | null | undefined;
  nextCompareInfo: CompareInfo | null | undefined;
  nextFile: VersionFile | null | undefined;
  nextFileIsLoading: boolean;
  nextFilePath: string | undefined;
  entryStatusMap: EntryStatusMap | undefined;
  path: string | undefined;
  version: Version | undefined | null;
  versionFile: VersionFile | undefined | null;
  versionFileIsLoading: boolean;
  currentVersionId: number | null | undefined | false;
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
      currentVersionId,
      entryStatusMap,
      dispatch,
      history,
      match,
      nextCompareInfo,
      nextFile,
      nextFileIsLoading,
      nextFilePath,
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

    if (
      compareInfo === undefined ||
      version === undefined ||
      entryStatusMap === undefined
    ) {
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

    if (version) {
      if (currentVersionId !== version.id) {
        dispatch(
          versionsActions.setCurrentVersionId({ versionId: version.id }),
        );
      }

      if (!versionFileIsLoading && versionFile === undefined) {
        dispatch(
          _fetchVersionFile({
            addonId: parseInt(addonId, 10),
            versionId: version.id,
            path: version.selectedPath,
          }),
        );
      }

      if (versionFile && nextFilePath) {
        if (!nextFileIsLoading && nextFile === undefined) {
          dispatch(
            _fetchVersionFile({
              addonId: parseInt(addonId, 10),
              versionId: version.id,
              path: nextFilePath,
            }),
          );
        }

        if (nextCompareInfo === undefined) {
          dispatch(
            _fetchDiff({
              addonId: parseInt(addonId, 10),
              baseVersionId: oldVersionId,
              headVersionId: newVersionId,
              path: nextFilePath,
            }),
          );
        }
      }
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
    const comparedToVersionId = parseInt(baseVersionId, 10);

    return (
      <>
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
          comparedToVersionId={comparedToVersionId}
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
      </>
    );
  }
}

export const mapStateToProps = (
  state: ApplicationState,
  ownProps: RouteComponentProps<PropsFromRouter>,
): PropsFromState => {
  const { history, match } = ownProps;
  const { versions } = state;
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

  const entryStatusMap = getEntryStatusMap({
    versions,
    versionId: headVersionId,
    comparedToVersionId: baseVersionId,
  });

  const currentVersionId = version
    ? state.versions.currentVersionId
    : undefined;

  let versionFile;
  if (version) {
    versionFile = getVersionFile(
      state.versions,
      headVersionId,
      version.selectedPath,
    );
  }

  const tree = getTree(state.fileTree, headVersionId);

  const nextFilePath =
    version && tree && entryStatusMap
      ? findRelativePathWithDiff({
          currentPath: version.selectedPath,
          pathList: tree.pathList,
          position: RelativePathPosition.next,
          version,
          entryStatusMap,
        })
      : undefined;

  const nextCompareInfo = nextFilePath
    ? getCompareInfo(
        state.versions,
        addonId,
        baseVersionId,
        headVersionId,
        nextFilePath,
      )
    : undefined;

  return {
    addonId,
    compareInfo,
    currentVersionId,
    entryStatusMap,
    nextCompareInfo,
    nextFile: nextFilePath
      ? getVersionFile(state.versions, headVersionId, nextFilePath)
      : undefined,
    nextFileIsLoading: nextFilePath
      ? isFileLoading(state.versions, headVersionId, nextFilePath)
      : false,
    nextFilePath,
    path,
    version,
    versionFile,
    versionFileIsLoading: version
      ? isFileLoading(state.versions, version.id, version.selectedPath)
      : false,
  };
};

export default connect(mapStateToProps)(CompareBase);
