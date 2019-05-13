import * as React from 'react';

import AccordionMenu, { AccordionItem } from '../AccordionMenu';
import CodeOverview from '../CodeOverview';
import FileMetadata from '../FileMetadata';
import FileTree, { PublicProps as FileTreeProps } from '../FileTree';
import ContentShell from '../FullscreenGrid/ContentShell';
import KeyboardShortcuts from '../KeyboardShortcuts';
import Loading from '../Loading';
import { Version, VersionFile } from '../../reducers/versions';
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
  file: VersionFile | null | void;
  onSelectFile: FileTreeProps['onSelect'];
  showFileInfo: boolean;
  version: Version | void | null;
};

const VersionFileViewer = ({
  children,
  file,
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
            <KeyboardShortcuts
              currentPath={version.selectedPath}
              versionId={version.id}
            />
          </AccordionItem>
        </AccordionMenu>
      }
      mainSidePanelClass={styles.mainSidePanel}
      altSidePanel={
        file ? (
          <CodeOverview
            content={file.type === 'image' ? '' : file.content}
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
