declare module 'react-diff-view' {
  type ChangeType = 'delete' | 'insert' | 'normal';

  interface ChangeInfo {
    content: string;
    isDelete?: boolean;
    isInsert?: boolean;
    isNormal?: boolean;
    lineNumber?: number;
    newLineNumber?: number;
    oldLineNumber?: number;
    type: ChangeType;
  }

  interface HunkInfo {
    changes: Array<ChangeInfo>;
    content: string;
    isPlain: boolean;
    newLines: number;
    newStart: number;
    oldLines: number;
    oldStart: number;
  }

  type Hunks = Array<HunkInfo>;

  interface DiffInfo {
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
  }

  function parseDiff(text: string, options?: object): Array<DiffInfo>;

  type ViewType = 'split' | 'unified';

  interface DiffProps {
    diffType: string;
    hunks: Hunks;
    viewType: ViewType;
  }

  class Diff extends React.Component<DiffProps, any> {}
}
