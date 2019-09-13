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
  comparedToVersionId: number | null;
  compareInfo?: CompareInfo | null | undefined;
  file: VersionFile | null | undefined;
  getCodeLineAnchor?: GetCodeLineAnchor;
  onSelectFile: FileTreeProps['onSelect'];
  version: Version | undefined | null;
};

const VersionFileViewer = ({
  children,
  comparedToVersionId,
  compareInfo,
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
              {file ? (
                <FileMetadata file={file} />
              ) : (
                <Loading message={gettext('Loading file...')} />
              )}
            </AccordionItem>
            <AccordionItem title={ItemTitles.Shortcuts}>
              <KeyboardShortcuts
                comparedToVersionId={comparedToVersionId}
                compareInfo={compareInfo}
                currentPath={version.selectedPath}
                messageMap={messageMap}
                versionId={version.id}
              />
            </AccordionItem>
          </AccordionMenu>
        }
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
