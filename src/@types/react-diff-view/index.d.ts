/* eslint react/no-multi-comp: 0, max-classes-per-file: 0 */

declare module 'react-diff-view' {
  // The eofnl types are not coming from react-diff-view, but are returned by our API.
  type ChangeType =
    | 'delete'
    | 'delete-eofnl'
    | 'insert'
    | 'insert-eofnl'
    | 'normal'
    | 'normal-eofnl';

  export type ChangeInfo = {
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

  export type DiffInfoType = 'add' | 'copy' | 'delete' | 'modify' | 'rename';

  export type DiffInfo = {
    oldPath: string;
    newPath: string;
    hunks: Hunks;
    oldEndingNewLine: boolean;
    newEndingNewLine: boolean;
    newMode: string;
    oldMode: string;
    type: DiffInfoType;
  };

  declare function parseDiff(text: string, options?: object): DiffInfo[];

  type ViewType = 'split' | 'unified';

  export type WidgetMap = { [changeKey: string]: ReactNode };

  export type RenderGutterParams = {
    change: ChangeInfo;
    side: 'new' | 'old';
    renderDefault: () => ReactElement;
    wrapInAnchor: (ReactElement) => ReactElement;
    inHoverState: boolean;
  };

  type DiffProps = {
    children: (hunks: HunkInfo[]) => ReactNode;
    className?: string;
    diffType: string;
    hunks: Hunks;
    tokens?: Tokens;
    viewType: ViewType;
    gutterType?: 'default' | 'anchor' | 'none';
    generateAnchorID?: (change: ChangeInfo) => string;
    renderGutter?: (RenderGutterParams) => ReactElement;
    selectedChanges?: string[];
    widgets?: WidgetMap;
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

  type TokenizeOptions = {
    highlight: boolean;
    language: string;
    refractor: typeof import('refractor');
  };

  type Token =
    | {
        type: string;
        value: string;
      }
    // When tokenize fails to properly parse some content, it returns an
    // empty array as the Token, which is what the following is meant to
    // illustrate.
    | string[];

  type Tokens = {
    old: Token[];
    new: Token[];
  };

  declare function tokenize(
    hunks: HunkInfo[],
    options: TokenizeOptions,
  ): Tokens;

  declare function getChangeKey(change: ChangeInfo): string;
}
