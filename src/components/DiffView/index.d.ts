declare module 'react-diff-view' {
  export interface HunkInfo {
    content: string;
    oldStart: number;
    newStart: number;
    oldLines: number;
    newLines: number;
    changes: Array<object>;
    isPlain: boolean;
  }

  export type Hunks = Array<HunkInfo>;

  export interface DiffInfo {
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

  export function parseDiff(text: string, options?: object): Array<DiffInfo>;

  export type ViewType = 'split' | 'unified';

  export interface DiffProps {
    diffType: string;
    hunks: Hunks;
    viewType: ViewType;
  }

  export class Diff extends React.Component<DiffProps, any> {}
}
