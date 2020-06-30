import * as React from 'react';
import { Helmet } from 'react-helmet';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import log from 'loglevel';

import { ApplicationState } from '../../reducers';
import { ConnectedReduxProps } from '../../configureStore';
import { ApiState } from '../../reducers/api';
import VersionFileViewer from '../../components/VersionFileViewer';
import {
  Version,
  VersionFileWithContent,
  fetchVersion,
  fetchVersionFile,
  getVersionFile,
  getVersionInfo,
  isFileLoading,
  viewVersionFile,
  actions as versionsActions,
} from '../../reducers/versions';
import {
  getRelativePath,
  getTree,
  RelativePathPosition,
} from '../../reducers/fileTree';
import {
  getLocalizedString,
  gettext,
  getPathFromQueryString,
  makeReviewersURL,
} from '../../utils';
import Loading from '../../components/Loading';
import CodeView from '../../components/CodeView';
import styles from './styles.module.scss';

export type PublicProps = {};

export type DefaultProps = {
  _fetchVersion: typeof fetchVersion;
  _fetchVersionFile: typeof fetchVersionFile;
  _log: typeof log;
  _viewVersionFile: typeof viewVersionFile;
};

type PropsFromRouter = {
  addonId: string;
  versionId: string;
};

type PropsFromState = {
  apiState: ApiState;
  file: VersionFileWithContent | null | undefined;
  fileIsLoading: boolean;
  fileTreeComparedToVersionId: number | null;
  fileTreeVersionId: number | undefined;
  nextFilePath: string | undefined;
  nextFile: VersionFileWithContent | null | undefined;
  nextFileIsLoading: boolean;
  version: Version | undefined | null;
  currentBaseVersionId: number | null | undefined | false;
  currentVersionId: number | null | undefined | false;
};

export type Props = RouteComponentProps<PropsFromRouter> &
  PropsFromState &
  PublicProps &
  DefaultProps &
  ConnectedReduxProps;

export class BrowseBase extends React.Component<Props> {
  static defaultProps = {
    _fetchVersion: fetchVersion,
    _fetchVersionFile: fetchVersionFile,
    _log: log,
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
      _fetchVersion,
      _fetchVersionFile,
      currentBaseVersionId,
      currentVersionId,
      dispatch,
      file,
      fileIsLoading,
      fileTreeComparedToVersionId,
      fileTreeVersionId,
      history,
      match,
      nextFile,
      nextFileIsLoading,
      nextFilePath,
      version,
    } = this.props;

    const path = getPathFromQueryString(history);
    const addonId = parseInt(match.params.addonId, 10);

    if (version === null) {
      // An error has occured when fetching the version.
      return;
    }

    const shouldReloadVersion =
      version &&
      fileTreeVersionId &&
      (fileTreeComparedToVersionId !== null ||
        fileTreeVersionId !== version.id);

    if (version === undefined || shouldReloadVersion) {
      const { versionId } = match.params;

      dispatch(
        _fetchVersion({
          addonId,
          versionId: parseInt(versionId, 10),
          path: undefined,
        }),
      );
      return;
    }

    if (currentBaseVersionId) {
      dispatch(versionsActions.unsetCurrentBaseVersionId());
    }

    if (version && currentVersionId !== version.id) {
      dispatch(versionsActions.setCurrentVersionId({ versionId: version.id }));
    }

    if (version.selectedPath && !fileIsLoading && file === undefined) {
      dispatch(
        _fetchVersionFile({
          addonId,
          versionId: version.id,
          path: version.selectedPath,
        }),
      );
    }

    if (file && nextFilePath && !nextFileIsLoading && nextFile === undefined) {
      dispatch(
        _fetchVersionFile({
          addonId,
          versionId: version.id,
          path: nextFilePath,
        }),
      );
    }

    const { initialPath, selectedPath } = version;
    const targetPath = path || initialPath;

    if (selectedPath !== targetPath) {
      dispatch(
        versionsActions.updateSelectedPath({
          versionId: version.id,
          selectedPath: targetPath,
        }),
      );
    }
  }

  viewVersionFile = (path: string) => {
    const { _viewVersionFile, dispatch, match } = this.props;
    const { versionId } = match.params;

    dispatch(
      _viewVersionFile({
        versionId: parseInt(versionId, 10),
        selectedPath: path,
        // When selecting a new file to view, we do not want to preserve the
        // hash in the URL (this hash highlights a specific line of code).
        preserveHash: false,
      }),
    );
  };

  getContent() {
    const { file, version } = this.props;
    if (!file || !version) {
      return <Loading message={gettext('Loading content...')} />;
    }
    if (file.fileType === 'image' && file.downloadURL) {
      return (
        <div className={styles.Image}>
          <img
            alt=""
            src={makeReviewersURL({ url: file.downloadURL })}
            className={styles.responsive}
          />
        </div>
      );
    }
    return (
      <CodeView
        content={file.content}
        isMinified={file.isMinified}
        mimeType={file.mimeType}
        version={version}
      />
    );
  }

  render() {
    const { file, version } = this.props;

    return (
      <>
        <Helmet>
          <title>
            {version
              ? gettext(
                  `Browse ${getLocalizedString(version.addon.name)}: ${
                    version.versionString
                  }`,
                )
              : gettext('Browse add-on version')}
          </title>
        </Helmet>
        <VersionFileViewer
          comparedToVersionId={null}
          file={file}
          onSelectFile={this.viewVersionFile}
          version={version}
        >
          {this.getContent()}
        </VersionFileViewer>
      </>
    );
  }
}

const mapStateToProps = (
  state: ApplicationState,
  ownProps: RouteComponentProps<PropsFromRouter>,
): PropsFromState => {
  const { match } = ownProps;
  const versionId = parseInt(match.params.versionId, 10);
  const version = getVersionInfo(state.versions, versionId);
  const currentVersionId = version
    ? state.versions.currentVersionId
    : undefined;
  const tree = getTree(state.fileTree, versionId);
  const { selectedPath } = state.versions;

  const paths = version ? version.entries.map((entry) => entry.path) : [];

  const nextFilePath =
    tree && selectedPath && paths.includes(selectedPath)
      ? getRelativePath({
          currentPath: selectedPath,
          pathList: tree.pathList,
          position: RelativePathPosition.next,
        })
      : undefined;

  return {
    apiState: state.api,
    file: version
      ? getVersionFile(state.versions, versionId, version.selectedPath)
      : null,
    fileIsLoading: version
      ? isFileLoading(state.versions, versionId, version.selectedPath)
      : false,
    fileTreeComparedToVersionId: state.fileTree.comparedToVersionId,
    fileTreeVersionId: state.fileTree.forVersionId,
    nextFile:
      version && nextFilePath
        ? getVersionFile(state.versions, versionId, nextFilePath)
        : undefined,
    nextFileIsLoading:
      version && nextFilePath
        ? isFileLoading(state.versions, versionId, nextFilePath)
        : false,
    nextFilePath,
    version,
    currentBaseVersionId: state.versions.currentBaseVersionId,
    currentVersionId,
  };
};

export default connect(mapStateToProps)(BrowseBase);
