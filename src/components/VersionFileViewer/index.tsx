import * as React from 'react';

import LinterMessage from '../LinterMessage';
import AccordionMenu, { AccordionItem } from '../AccordionMenu';
import CodeOverview from '../CodeOverview';
import { GetCodeLineAnchor } from '../CodeView/utils';
import FileMetadata from '../FileMetadata';
import FileTree, { PublicProps as FileTreeProps } from '../FileTree';
import ContentShell from '../FullscreenGrid/ContentShell';
import KeyboardShortcuts from '../KeyboardShortcuts';
import LinterProvider, { LinterProviderInfo } from '../LinterProvider';
import Loading from '../Loading';
import {
  EntryStatusMap,
  Version,
  VersionFileWithContent,
  VersionFileWithDiff,
  getInsertedLines,
  isFileWithContent,
  isFileWithDiff,
} from '../../reducers/versions';
import { AnyReactNode } from '../../typeUtils';
import { flattenDiffChanges, gettext } from '../../utils';
import styles from './styles.module.scss';

export enum ItemTitles {
  Files = 'Files',
  Information = 'Information',
  Shortcuts = 'Keyboard Shortcuts',
}

export type PublicProps = {
  _getInsertedLines?: typeof getInsertedLines;
  children: AnyReactNode;
  comparedToVersionId: number | null;
  entryStatusMap?: EntryStatusMap;
  file: VersionFileWithContent | VersionFileWithDiff | null | undefined;
  getCodeLineAnchor?: GetCodeLineAnchor;
  onSelectFile: FileTreeProps['onSelect'];
  version: Version | undefined | null;
};

const VersionFileViewer = ({
  _getInsertedLines = getInsertedLines,
  children,
  comparedToVersionId,
  entryStatusMap,
  file,
  getCodeLineAnchor,
  onSelectFile,
  version,
}: PublicProps) => {
  if (!version) {
    return (
      <ContentShell>
        <Loading message={gettext('Loading version...')} />
      </ContentShell>
    );
  }

  const renderWithLinterProvider = ({ messageMap }: LinterProviderInfo) => {
    const topContent =
      messageMap && messageMap.general.length
        ? messageMap.general.map((message) => {
            return (
              <LinterMessage
                className={styles.linterMessage}
                key={message.uid}
                message={message}
              />
            );
          })
        : null;

    const insertedLines =
      file && isFileWithDiff(file) && file.diff
        ? _getInsertedLines(file.diff)
        : [];

    const { versionString, selectedPath } = version;

    const renderFileInfo = () => {
      if (file) {
        return <FileMetadata file={file} versionString={versionString} />;
      }

      if (entryStatusMap && entryStatusMap[selectedPath] === 'D') {
        return (
          <span className={styles.deletedFileMessage}>
            {gettext(
              `The file has been deleted in the new version ${versionString}`,
            )}
          </span>
        );
      }

      return <Loading message={gettext('Loading file...')} />;
    };

    let overviewContent = '';
    if (file) {
      if (isFileWithDiff(file) && file.diff) {
        overviewContent = flattenDiffChanges(file.diff);
      } else if (isFileWithContent(file) && file.fileType !== 'image') {
        overviewContent = file.content;
      }
    }

    return (
      <ContentShell
        topContent={topContent}
        mainSidePanelIsBorderless
        mainSidePanel={
          <AccordionMenu>
            <AccordionItem expandedByDefault title={ItemTitles.Files}>
              <FileTree
                comparedToVersionId={comparedToVersionId}
                onSelect={onSelectFile}
                versionId={version.id}
              />
            </AccordionItem>
            <AccordionItem title={ItemTitles.Information}>
              {renderFileInfo()}
            </AccordionItem>
            <AccordionItem title={ItemTitles.Shortcuts}>
              <KeyboardShortcuts
                comparedToVersionId={comparedToVersionId}
                currentPath={version.selectedPath}
                file={file}
                messageMap={messageMap}
                versionId={version.id}
              />
            </AccordionItem>
          </AccordionMenu>
        }
        altSidePanel={
          <CodeOverview
            content={overviewContent}
            getCodeLineAnchor={getCodeLineAnchor}
            insertedLines={insertedLines}
            version={version}
          />
        }
      >
        {messageMap ? (
          children
        ) : (
          <Loading message={gettext('Loading linter information...')} />
        )}
      </ContentShell>
    );
  };

  return (
    <LinterProvider
      versionId={version.id}
      validationURL={version.validationURL}
      selectedPath={version.selectedPath}
    >
      {renderWithLinterProvider}
    </LinterProvider>
  );
};

export default VersionFileViewer;
