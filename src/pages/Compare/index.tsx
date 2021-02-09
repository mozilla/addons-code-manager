import * as React from 'react';
import { Helmet } from 'react-helmet';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';

import { ApplicationState } from '../../reducers';
import { ConnectedReduxProps } from '../../configureStore';
import DiffView from '../../components/DiffView';
import Loading from '../../components/Loading';
import VersionFileViewer from '../../components/VersionFileViewer';
import {
  EntryStatusMap,
  Version,
  VersionFileWithDiff,
  fetchVersionWithDiff,
  fetchDiffFile,
  getAddonName,
  getEntryStatusMap,
  getVersionDiff,
  getVersionInfo,
  isDiffLoading,
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
  getPathFromQueryString,
  gettext,
} from '../../utils';

export type PublicProps = {
  _fetchVersionWithDiff: typeof fetchVersionWithDiff;
  _fetchDiffFile: typeof fetchDiffFile;
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
  currentBaseVersionId: number | null | undefined | false;
  currentVersionId: number | null | undefined | false;
  entryStatusMap: EntryStatusMap | undefined;
  fileTreeComparedToVersionId: number | null;
  fileTreeVersionId: number | undefined;
  nextDiff: VersionFileWithDiff | undefined | null;
  nextDiffIsLoading: boolean;
  nextDiffPath: string | undefined;
  path: string | undefined;
  selectedPath: string | null;
  version: Version | undefined | null;
  versionDiff: VersionFileWithDiff | undefined | null;
  versionDiffIsLoading: boolean;
};

type Props = RouteComponentProps<PropsFromRouter> &
  PropsFromState &
  PublicProps &
  ConnectedReduxProps;

export class CompareBase extends React.Component<Props> {
  static defaultProps = {
    _fetchVersionWithDiff: fetchVersionWithDiff,
    _fetchDiffFile: fetchDiffFile,
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
      _fetchVersionWithDiff,
      _fetchDiffFile,
      currentBaseVersionId,
      currentVersionId,
      entryStatusMap,
      fileTreeComparedToVersionId,
      fileTreeVersionId,
      dispatch,
      history,
      match,
      nextDiff,
      nextDiffIsLoading,
      nextDiffPath,
      path,
      selectedPath,
      version,
      versionDiff,
      versionDiffIsLoading,
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

    if (versionDiff === null) {
      // An error has occured when fetching the diff.
      return;
    }

    if (oldVersionId !== currentBaseVersionId) {
      dispatch(
        versionsActions.setCurrentBaseVersionId({
          versionId: oldVersionId,
        }),
      );
    }

    // Force-reload a version so the file tree rebuilds itself.
    const forceReloadVersion = fileTreeVersionId
      ? oldVersionId !== fileTreeComparedToVersionId ||
        newVersionId !== fileTreeVersionId
      : false;

    // Fetch full version, if we need it.
    if (
      !versionDiffIsLoading &&
      (version === undefined ||
        entryStatusMap === undefined ||
        forceReloadVersion)
    ) {
      dispatch(
        _fetchVersionWithDiff({
          addonId: parseInt(addonId, 10),
          baseVersionId: oldVersionId,
          headVersionId: newVersionId,
          path: path || undefined,
          forceReloadVersion,
        }),
      );
      return;
    }
    if (!versionDiffIsLoading && path && !versionDiff) {
      dispatch(
        _fetchDiffFile({
          addonId: parseInt(addonId, 10),
          baseVersionId: oldVersionId,
          headVersionId: newVersionId,
          path,
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

      const targetPath = path || version.initialPath;

      if (selectedPath !== targetPath) {
        dispatch(
          versionsActions.updateSelectedPath({
            selectedPath: targetPath,
            versionId: version.id,
          }),
        );
      }

      if (nextDiffPath && nextDiff === undefined && !nextDiffIsLoading) {
        dispatch(
          _fetchDiffFile({
            addonId: parseInt(addonId, 10),
            baseVersionId: oldVersionId,
            headVersionId: newVersionId,
            path: nextDiffPath,
          }),
        );
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
    const { version, versionDiff } = this.props;

    if (version === null || versionDiff === null) {
      return <p>{gettext('Oops, an error has occurred.')}</p>;
    }

    return (
      // Use a container since Loading renders a fragment.
      <div>
        <Loading message={message} />
      </div>
    );
  }

  render() {
    const { entryStatusMap, match, path, version, versionDiff } = this.props;

    const { baseVersionId, headVersionId } = match.params;
    const comparedToVersionId = parseInt(baseVersionId, 10);

    return (
      <>
        <Helmet>
          <title>
            {version
              ? gettext(
                  `Compare ${getAddonName(
                    version.addon.name,
                  )}: ${baseVersionId}...${headVersionId}`,
                )
              : gettext('Compare add-on versions')}
          </title>
        </Helmet>
        <VersionFileViewer
          comparedToVersionId={comparedToVersionId}
          entryStatusMap={entryStatusMap}
          file={versionDiff}
          getCodeLineAnchor={createCodeLineAnchorGetter(versionDiff)}
          onSelectFile={this.viewVersionFile}
          version={version}
        >
          {version && versionDiff ? (
            <DiffView
              diff={versionDiff.diff}
              isMinified={versionDiff.isMinified}
              // This key resets scrollbars between files
              key={`${version.id}:${path}`}
              mimeType={versionDiff.mimeType}
              version={version}
            />
          ) : (
            this.renderLoadingMessageOrError(gettext('Loading diff...'))
          )}
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
  const { fileTree, versions } = state;
  const { selectedPath } = versions;
  const addonId = parseInt(match.params.addonId, 10);
  const baseVersionId = parseInt(match.params.baseVersionId, 10);
  const headVersionId = parseInt(match.params.headVersionId, 10);
  const path = getPathFromQueryString(history) || undefined;

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

  const versionDiff = getVersionDiff({
    addonId,
    baseVersionId,
    headVersionId,
    path: (version && version.selectedPath) || '',
    versions: state.versions,
  });

  const tree = getTree(state.fileTree, headVersionId);
  const paths = version ? version.entries.map((entry) => entry.path) : [];

  const nextDiffPath =
    version &&
    tree &&
    entryStatusMap &&
    selectedPath &&
    paths.includes(selectedPath)
      ? findRelativePathWithDiff({
          currentPath: selectedPath,
          pathList: tree.pathList,
          position: RelativePathPosition.next,
          version,
          entryStatusMap,
        })
      : undefined;

  const nextDiff = nextDiffPath
    ? getVersionDiff({
        addonId,
        baseVersionId,
        headVersionId,
        path: nextDiffPath,
        versions: state.versions,
      })
    : undefined;

  return {
    addonId,
    currentBaseVersionId: state.versions.currentBaseVersionId,
    currentVersionId,
    entryStatusMap,
    fileTreeComparedToVersionId: fileTree.comparedToVersionId,
    fileTreeVersionId: fileTree.forVersionId,
    nextDiff,
    nextDiffIsLoading: nextDiffPath
      ? isDiffLoading(
          state.versions,
          addonId,
          baseVersionId,
          headVersionId,
          nextDiffPath,
        )
      : false,
    nextDiffPath,
    path,
    selectedPath,
    version,
    versionDiff,
    versionDiffIsLoading: version
      ? isDiffLoading(
          state.versions,
          addonId,
          baseVersionId,
          headVersionId,
          version.selectedPath,
        )
      : false,
  };
};

export default connect(mapStateToProps)(CompareBase);
