import queryString from 'query-string';
import * as React from 'react';
import {
  ChangeInfo,
  Decoration,
  Diff,
  DiffInfo,
  DiffProps,
  Hunk,
  Hunks,
  HunkInfo,
  RenderGutterParams,
  WidgetMap,
  getChangeKey,
  tokenize,
} from 'react-diff-view';
import { Alert } from 'react-bootstrap';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import makeClassName from 'classnames';

import Commentable from '../Commentable';
import CommentList from '../CommentList';
import FadableContent from '../FadableContent';
import LinterProvider, { LinterProviderInfo } from '../LinterProvider';
import LinterMessage from '../LinterMessage';
import GlobalLinterMessages from '../GlobalLinterMessages';
import SlowPageAlert from '../SlowPageAlert';
import refractor from '../../refractor';
import {
  ScrollTarget,
  Version,
  changeTypes,
  getDiffAnchors,
  getRelativeDiffAnchor,
} from '../../reducers/versions';
import {
  TRIMMED_CHAR_COUNT,
  SLOW_LOADING_LINE_COUNT,
  codeCanBeHighlighted,
  codeShouldBeTrimmed,
  contentAddedByTrimmer,
  getAllHunkChanges,
  getLanguageFromMimeType,
  gettext,
  sendPerfTiming,
  shouldAllowSlowPages,
} from '../../utils';
import styles from './styles.module.scss';
import 'react-diff-view/style/index.css';

const { Profiler } = React;

export const addedChange: ChangeInfo = {
  content: contentAddedByTrimmer,
  isDelete: false,
  isInsert: false,
  isNormal: true,
  lineNumber: undefined,
  newLineNumber: undefined,
  oldLineNumber: undefined,
  type: 'normal',
};

export const getChangeCharCount = (hunks: Hunks) => {
  const changes = getAllHunkChanges(hunks);
  return changes.reduce((charCount, change) => {
    return charCount + change.content.length;
  }, 0);
};

export const trimHunkChars = ({
  hunks,
  _trimmedCharCount = TRIMMED_CHAR_COUNT,
}: {
  hunks: Hunks;
  _trimmedCharCount?: number;
}): Hunks => {
  let charCount = 0;
  let hunkIndex = 0;
  const trimmedHunks: Hunks = [];
  for (const hunk of hunks) {
    trimmedHunks.push({ ...hunk, changes: [] });
    hunkIndex = trimmedHunks.length - 1;
    for (const change of hunk.changes) {
      if (charCount + change.content.length > _trimmedCharCount) {
        if (_trimmedCharCount - charCount) {
          // Push a trimmed version of this change, if there's any room left.
          trimmedHunks[hunkIndex].changes.push({
            ...change,
            content: change.content.substring(0, _trimmedCharCount - charCount),
          });
        }
        // Push an additional change with a comment that says the content has
        // been trimmed.
        trimmedHunks[hunkIndex].changes.push(addedChange);
        return trimmedHunks;
      }
      trimmedHunks[hunkIndex].changes.push(change);
      charCount += change.content.length;
    }
  }
  return trimmedHunks;
};

export const changeCanBeCommentedUpon = (change: ChangeInfo) => {
  return [changeTypes.insert, changeTypes.normal].includes(change.type);
};

export type PublicProps = {
  diff: DiffInfo | null;
  isMinified: boolean;
  mimeType: string;
  version: Version;
};

export type DefaultProps = {
  _changeCanBeCommentedUpon: typeof changeCanBeCommentedUpon;
  _codeCanBeHighlighted: typeof codeCanBeHighlighted;
  _codeShouldBeTrimmed: typeof codeShouldBeTrimmed;
  _document: typeof document;
  _getDiffAnchors: typeof getDiffAnchors;
  _getRelativeDiffAnchor: typeof getRelativeDiffAnchor;
  _trimmedCharCount: number;
  _sendPerfTiming: typeof sendPerfTiming;
  _slowLoadingLineCount: number;
  _tokenize: typeof tokenize;
  _trimHunkChars: typeof trimHunkChars;
  enableCommenting: boolean;
  viewType: DiffProps['viewType'];
};

export type RouterProps = RouteComponentProps<
  Record<string, string | undefined>
>;

export type Props = PublicProps & DefaultProps & RouterProps;

export class DiffViewBase extends React.Component<Props> {
  static defaultProps: DefaultProps = {
    _changeCanBeCommentedUpon: changeCanBeCommentedUpon,
    _codeCanBeHighlighted: codeCanBeHighlighted,
    _codeShouldBeTrimmed: codeShouldBeTrimmed,
    _document: document,
    _getDiffAnchors: getDiffAnchors,
    _getRelativeDiffAnchor: getRelativeDiffAnchor,
    _trimmedCharCount: TRIMMED_CHAR_COUNT,
    _sendPerfTiming: sendPerfTiming,
    _slowLoadingLineCount: SLOW_LOADING_LINE_COUNT,
    _tokenize: tokenize,
    _trimHunkChars: trimHunkChars,
    enableCommenting: process.env.REACT_APP_ENABLE_COMMENTING === 'true',
    viewType: 'unified',
  };

  // See https://github.com/reactjs/rfcs/blob/master/text/0051-profiler.md
  onRenderProfiler = (id: string, phase: string, actualDuration: number) => {
    this.props._sendPerfTiming({ actualDuration, id });
  };

  componentDidMount() {
    this.loadData();
  }

  componentDidUpdate() {
    this.loadData();
  }

  loadData() {
    const {
      _document,
      _getDiffAnchors,
      _getRelativeDiffAnchor,
      diff,
      history,
      location,
    } = this.props;

    if (diff) {
      const queryParams = queryString.parse(location.search);
      const { scrollTo } = queryParams;
      let anchor;
      if (scrollTo) {
        if (scrollTo === ScrollTarget.firstDiff) {
          anchor = _getRelativeDiffAnchor({ diff });
        } else {
          const anchors = _getDiffAnchors(diff);
          if (anchors.length) {
            anchor = anchors[anchors.length - 1];
          }
        }
        if (anchor) {
          const newParams = { ...queryParams };

          delete newParams.scrollTo;
          const newLocation = {
            ...location,
            hash: `#${anchor}`,
            search: queryString.stringify(newParams),
          };

          history.push(newLocation);
        }
      }
    }

    if (!location.hash.length) {
      return;
    }

    const element = _document.querySelector(location.hash);

    if (element) {
      element.scrollIntoView();
    }
  }

  getWidgets = (
    hunks: Hunks,
    selectedMessageMap: LinterProviderInfo['selectedMessageMap'],
  ) => {
    const { _changeCanBeCommentedUpon, enableCommenting, version } = this.props;

    const allWidgets: WidgetMap = {};

    // We only want widgets for delete, insert and normal changes, not eofnl changes.
    const changesAllowingWidgets = getAllHunkChanges(hunks).filter(
      (change) => change.isDelete || change.isInsert || change.isNormal,
    );
    for (const change of changesAllowingWidgets) {
      const changeKey = getChangeKey(change);
      const line = change.lineNumber;

      let messages;
      if (line && selectedMessageMap) {
        messages = selectedMessageMap.byLine[line];
      }

      let widget =
        enableCommenting && line && _changeCanBeCommentedUpon(change) ? (
          <CommentList
            addonId={version.addon.id}
            fileName={version.selectedPath}
            line={line}
            versionId={version.id}
          >
            {(allComments) => allComments}
          </CommentList>
        ) : null;

      if (messages && messages.length) {
        widget = (
          <>
            {widget}
            <div className={styles.inlineLinterMessages}>
              {messages.map((msg) => {
                return <LinterMessage key={msg.uid} message={msg} inline />;
              })}
            </div>
          </>
        );
      }
      allWidgets[changeKey] = widget;
    }

    return allWidgets;
  };

  renderHeader({ hunks }: DiffInfo) {
    const { additions, deletions } = hunks.reduce(
      (acc, hunk) => {
        return {
          additions:
            acc.additions +
            hunk.changes.filter((change) => change.isInsert).length,
          deletions:
            acc.deletions +
            hunk.changes.filter((change) => change.isDelete).length,
        };
      },
      { additions: 0, deletions: 0 },
    );

    return (
      <div className={styles.header}>
        <div className={styles.stats}>
          <span className={styles.statsAdditions}>{`+++ ${additions}`}</span>
          <span className={styles.statsDeletions}>{`--- ${deletions}`}</span>
        </div>
      </div>
    );
  }

  renderHunk = (hunk: HunkInfo, index: number) => {
    const components = [
      <Hunk key={`hunk-${hunk.content}`} hunk={hunk} className={styles.hunk} />,
    ];

    // We don't want to display a separator above the first hunk because it
    // would add the separator between the diff header and the hunk.
    if (index > 0) {
      components.unshift(
        <Decoration key={`decoration-${hunk.content}`}>
          <div className={styles.hunkSeparator}>...</div>
        </Decoration>,
      );
    }

    return components;
  };

  renderHunks = (hunks: HunkInfo[]) => {
    return hunks.map(this.renderHunk);
  };

  renderExtraMessages = (messages: React.ReactNode) => {
    return <div className={styles.extraMessages}>{messages}</div>;
  };

  renderGutter = ({
    change,
    renderDefault,
    side,
    wrapInAnchor,
  }: RenderGutterParams) => {
    const { _changeCanBeCommentedUpon, enableCommenting, version } = this.props;

    const { lineNumber } = change;

    const defaultGutter = wrapInAnchor(renderDefault());
    let gutter = defaultGutter;
    if (
      enableCommenting &&
      _changeCanBeCommentedUpon(change) &&
      lineNumber &&
      side === 'new'
    ) {
      gutter = (
        <Commentable
          as="div"
          className={styles.gutter}
          line={lineNumber}
          fileName={version.selectedPath}
          versionId={version.id}
        >
          {(addCommentButton) => (
            <>
              {defaultGutter}
              <span className={styles.commentButton}>{addCommentButton}</span>
            </>
          )}
        </Commentable>
      );
    }

    return gutter;
  };

  renderWithMessages = ({ selectedMessageMap }: LinterProviderInfo) => {
    const {
      _codeCanBeHighlighted,
      _codeShouldBeTrimmed,
      _trimmedCharCount,
      _slowLoadingLineCount,
      _tokenize,
      _trimHunkChars,
      diff,
      isMinified,
      location,
      mimeType,
      version,
      viewType,
    } = this.props;

    const options = {
      highlight: true,
      language: getLanguageFromMimeType(mimeType),
      refractor,
    };

    const selectedChanges =
      // Remove the `#` if `location.hash` is defined
      location.hash.length > 2 ? [location.hash.substring(1)] : [];

    const extraMessages = [];

    let hunks;
    let diffWasTrimmed = false;
    let diffIsSlowAlert;

    if (diff) {
      let changeCount = 0;
      for (const hunk of diff.hunks) {
        changeCount += hunk.changes.length;
      }

      hunks = diff.hunks;

      if (
        _codeShouldBeTrimmed({
          codeCharLength: getChangeCharCount(hunks),
          codeLineLength: changeCount,
          isMinified,
          trimmedCharCount: _trimmedCharCount,
          slowLoadingLineCount: _slowLoadingLineCount,
        })
      ) {
        if (!shouldAllowSlowPages({ allowByDefault: !isMinified, location })) {
          hunks = _trimHunkChars({ hunks });
          diffWasTrimmed = true;
        }
        diffIsSlowAlert = (
          <SlowPageAlert
            allowSlowPagesByDefault={!isMinified}
            key="slowPageAlert"
            getMessage={(allowSlowPages: boolean) => {
              return allowSlowPages
                ? gettext('This diff may load slowly.')
                : gettext('This diff was shortened to load faster.');
            }}
            getLinkText={(allowSlowPages: boolean) => {
              return allowSlowPages
                ? gettext('Shorten the diff.')
                : gettext('Show the original diff.');
            }}
          />
        );
        extraMessages.push(diffIsSlowAlert);
      }
    }

    let tokens;
    if (
      hunks &&
      _codeCanBeHighlighted({ code: getAllHunkChanges(hunks) }) &&
      !diffWasTrimmed
    ) {
      // TODO: always highlight when we can use a Web Worker.
      // https://github.com/mozilla/addons-code-manager/issues/928
      tokens = _tokenize(hunks, options);
    }

    // If tokenize fails to create valid tokens, we can end up with an object
    // that looks like:
    // { new: [[]], old: [[]] }
    // which is what we're trying to catch here so that invlaid tokens do not
    // get passed into the Diff component.
    if (
      tokens &&
      tokens.old.length === 1 &&
      Array.isArray(tokens.old[0]) &&
      tokens.old[0].length === 0 &&
      tokens.new.length === 1 &&
      Array.isArray(tokens.new[0]) &&
      tokens.new[0].length === 0
    ) {
      tokens = undefined;
    }

    if (diff && !tokens) {
      extraMessages.push(
        <Alert key="syntaxHighlightingAlert" variant="warning">
          {gettext('Syntax highlighting was disabled for performance')}
        </Alert>,
      );
    }

    return (
      <div className={styles.DiffView}>
        {!diff && (
          <>
            <div className={styles.header} />
            <div className={makeClassName(styles.diff, styles.noDiffs)}>
              {gettext('No differences')}
            </div>
          </>
        )}

        <GlobalLinterMessages
          className={styles.globalLinterMessages}
          messages={selectedMessageMap && selectedMessageMap.global}
        />

        {extraMessages.length ? this.renderExtraMessages(extraMessages) : null}

        {diff && hunks && (
          <React.Fragment key={version.id}>
            {this.renderHeader(diff)}
            <FadableContent fade={diffWasTrimmed}>
              <Diff
                className={styles.diff}
                diffType={diff.type}
                hunks={hunks}
                tokens={tokens}
                viewType={viewType}
                gutterType="anchor"
                generateAnchorID={getChangeKey}
                selectedChanges={selectedChanges}
                widgets={this.getWidgets(hunks, selectedMessageMap)}
                renderGutter={this.renderGutter}
              >
                {this.renderHunks}
              </Diff>
            </FadableContent>
          </React.Fragment>
        )}

        {/* Only show a slow alert at the bottom if the diff was trimmed */}
        {diffWasTrimmed &&
          diffIsSlowAlert &&
          this.renderExtraMessages(diffIsSlowAlert)}
      </div>
    );
  };

  render() {
    const { version } = this.props;

    return (
      <Profiler id="DiffView-Render" onRender={this.onRenderProfiler}>
        <LinterProvider version={version} selectedPath={version.selectedPath}>
          {this.renderWithMessages}
        </LinterProvider>
      </Profiler>
    );
  }
}

export default withRouter(DiffViewBase) as React.ComponentType<
  PublicProps & Partial<DefaultProps>
>;
