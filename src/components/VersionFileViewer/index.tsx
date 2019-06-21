import * as React from 'react';

import AccordionMenu, { AccordionItem } from '../AccordionMenu';
import CodeOverview, { GetCodeLineAnchor } from '../CodeOverview';
import FileMetadata from '../FileMetadata';
import FileTree, { PublicProps as FileTreeProps } from '../FileTree';
import ContentShell from '../FullscreenGrid/ContentShell';
import KeyboardShortcuts from '../KeyboardShortcuts';
import LinterProvider from '../LinterProvider';
import Loading from '../Loading';
import { CompareInfo, Version, VersionFile } from '../../reducers/versions';
import { AnyReactNode } from '../../typeUtils';
import { gettext } from '../../utils';
import styles from './styles.module.scss';

export enum ItemTitles {
  Files = 'Files',
  Information = 'Information',
  Shortcuts = 'Keyboard Shortcuts',
}

export type PublicProps = {
  children: AnyReactNode;
  compareInfo?: CompareInfo | null | void;
  getCodeLineAnchor?: GetCodeLineAnchor;
  file: VersionFile | null | void;
  onSelectFile: FileTreeProps['onSelect'];
  showFileInfo: boolean;
  version: Version | void | null;
};

const VersionFileViewer = ({
  children,
  compareInfo,
  file,
  getCodeLineAnchor,
  onSelectFile,
  showFileInfo,
  version,
}: PublicProps) => {
  if (!version) {
    return (
      <ContentShell>
        <Loading message={gettext('Loading version...')} />
      </ContentShell>
    );
  }

  return (
    <ContentShell
      mainSidePanel={
        <AccordionMenu>
          <AccordionItem expandedByDefault title={ItemTitles.Files}>
            <FileTree onSelect={onSelectFile} versionId={version.id} />
          </AccordionItem>
          {showFileInfo ? (
            <AccordionItem title={ItemTitles.Information}>
              {file ? (
                <FileMetadata file={file} />
              ) : (
                <Loading message={gettext('Loading file...')} />
              )}
            </AccordionItem>
          ) : null}
          <AccordionItem title={ItemTitles.Shortcuts}>
            <LinterProvider
              selectedPath={version.selectedPath}
              validationURL={version.validationURL}
              versionId={version.id}
            >
              {({ messageMap }) => (
                <KeyboardShortcuts
                  compareInfo={compareInfo}
                  currentPath={version.selectedPath}
                  messageMap={messageMap}
                  versionId={version.id}
                />
              )}
            </LinterProvider>
          </AccordionItem>
        </AccordionMenu>
      }
      mainSidePanelClass={styles.mainSidePanel}
      altSidePanelClass={styles.altSidePanel}
      altSidePanel={
        file ? (
          <CodeOverview
            content={file.type === 'image' ? '' : file.content}
            getCodeLineAnchor={getCodeLineAnchor}
            version={version}
          />
        ) : null
      }
    >
      {children}
    </ContentShell>
  );
};

export default VersionFileViewer;
