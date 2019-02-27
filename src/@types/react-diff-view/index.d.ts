/* eslint react/no-multi-comp: 0 */

declare module 'react-diff-view' {
  type ChangeType = 'delete' | 'insert' | 'normal';

  type ChangeInfo = {
    content: string;
    isDelete?: boolean;
    isInsert?: boolean;
    isNormal?: boolean;
    lineNumber?: number;
    newLineNumber?: number;
    oldLineNumber?: number;
    type: ChangeType;
  };

  export type HunkInfo = {
    changes: ChangeInfo[];
    content: string;
    isPlain: boolean;
    newLines: number;
    newStart: number;
    oldLines: number;
    oldStart: number;
  };

  type Hunks = HunkInfo[];

  export type DiffInfo = {
    oldPath: string;
    newPath: string;
    hunks: Hunks;
    oldEndingNewLine: boolean;
    newEndingNewLine: boolean;
    oldRevision: string;
    newRevision: string;
    newMode: string;
    oldMode: string;
    type: string;
  };

  declare function parseDiff(text: string, options?: object): DiffInfo[];

  type ViewType = 'split' | 'unified';

  type DiffProps = {
    className?: string;
    diffType: string;
    hunks: Hunks;
    viewType: ViewType;
  };

  // eslint-disable-next-line no-undef
  export class Diff extends React.Component<DiffProps, {}> {}

  type DecorationProps = {
    className?: string;
  };

  // eslint-disable-next-line no-undef
  export class Decoration extends React.Component<DecorationProps, {}> {}

  type HunkProps = {
    className?: string;
    hunk: HunkInfo;
  };

  // eslint-disable-next-line no-undef
  export class Hunk extends React.Component<HunkProps, {}> {}
}
