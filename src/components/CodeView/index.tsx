import * as React from 'react';
import { withRouter, Link, RouteComponentProps } from 'react-router-dom';
import makeClassName from 'classnames';
import { FixedSizeList as List } from 'react-window';
// @ts-ignore
import AutoSizer from 'react-virtualized-auto-sizer';

import styles from './styles.module.scss';
import Commentable from '../Commentable';
import CommentList from '../CommentList';
import FadableContent from '../FadableContent';
import {
  getCodeLineAnchor,
  getCodeLineAnchorID,
  getLines,
  mapWithDepth,
  GLOBAL_LINTER_ANCHOR_ID,
} from './utils';
import refractor from '../../refractor';
import {
  TRIMMED_CHAR_COUNT,
  SLOW_LOADING_LINE_COUNT,
  codeShouldBeTrimmed,
  contentAddedByTrimmer,
  gettext,
  getLanguageFromMimeType,
  sendPerfTiming,
  shouldAllowSlowPages,
} from '../../utils';
import { Version } from '../../reducers/versions';
import LinterProvider, { LinterProviderInfo } from '../LinterProvider';
import GlobalLinterMessages from '../GlobalLinterMessages';
import SlowPageAlert from '../SlowPageAlert';

// This function mimics what https://github.com/rexxars/react-refractor does,
// but we need a different layout to inline comments so we cannot use this
// component.
const renderCode = ({ code, language }: { code: string; language: string }) => {
  const ast = refractor.highlight(code, language);
  const value = ast.length === 0 ? code : ast.map(mapWithDepth(0));

  return (
    <pre className={styles.highlightedCode}>
      <code
        className={makeClassName(
          styles.innerHighlightedCode,
          `language-${language}`,
        )}
      >
        {value}
      </code>
    </pre>
  );
};

const isLineSelected = (
  id: string,
  location: RouteComponentProps['location'],
) => {
  return `#${id}` === location.hash;
};

export const scrollToSelectedLine = (element: HTMLElement | null) => {
  if (element) {
    element.scrollIntoView();
  }
};

export const trimCode = (content: string) => {
  return `${content.substring(0, TRIMMED_CHAR_COUNT)} ${contentAddedByTrimmer}`;
};

export type PublicProps = {
  content: string;
  isMinified: boolean;
  mimeType: string;
  version: Version;
};

export type DefaultProps = {
  _codeShouldBeTrimmed: typeof codeShouldBeTrimmed;
  _trimCode: typeof trimCode;
  _trimmedCharCount: number;
  _scrollToSelectedLine: typeof scrollToSelectedLine;
  _sendPerfTiming: typeof sendPerfTiming;
  _slowLoadingLineCount: number;
  enableCommenting: boolean;
};

type Props = PublicProps & DefaultProps & RouteComponentProps;

export class CodeViewBase extends React.Component<Props> {
  static defaultProps: DefaultProps = {
    _codeShouldBeTrimmed: codeShouldBeTrimmed,
    _trimCode: trimCode,
    _trimmedCharCount: TRIMMED_CHAR_COUNT,
    _scrollToSelectedLine: scrollToSelectedLine,
    _sendPerfTiming: sendPerfTiming,
    _slowLoadingLineCount: SLOW_LOADING_LINE_COUNT,
    enableCommenting: process.env.REACT_APP_ENABLE_COMMENTING === 'true',
  };

  // See https://github.com/reactjs/rfcs/blob/master/text/0051-profiler.md
  onRenderProfiler = (id: string, phase: string, actualDuration: number) => {
    this.props._sendPerfTiming({ actualDuration, id });
  };

  renderWithLinterInfo = ({ selectedMessageMap }: LinterProviderInfo) => {
    const {
      _codeShouldBeTrimmed,
      _trimCode,
      _trimmedCharCount,
      _scrollToSelectedLine,
      _slowLoadingLineCount,
      content,
      enableCommenting,
      isMinified,
      location,
      mimeType,
      version,
    } = this.props;

    const language = getLanguageFromMimeType(mimeType);
    let codeLines = getLines(content);
    let codeWasTrimmed = false;
    let slowAlert;

    if (
      _codeShouldBeTrimmed({
        codeCharLength: content.length,
        codeLineLength: codeLines.length,
        isMinified,
        trimmedCharCount: _trimmedCharCount,
        slowLoadingLineCount: _slowLoadingLineCount,
      })
    ) {
      if (!shouldAllowSlowPages({ location })) {
        codeLines = getLines(_trimCode(content));
        codeWasTrimmed = true;
      }
      slowAlert = (
        <SlowPageAlert
          getMessage={(allowSlowPages: boolean) => {
            return allowSlowPages
              ? gettext('This file may be loading slowly.')
              : gettext('This file has been shortened to load faster.');
          }}
          getLinkText={(allowSlowPages: boolean) => {
            return allowSlowPages
              ? gettext('View a shortened file.')
              : gettext('View the original file.');
          }}
        />
      );
    }

    return (
      <>
        <GlobalLinterMessages
          containerRef={
            isLineSelected(
              getCodeLineAnchorID(GLOBAL_LINTER_ANCHOR_ID),
              location,
            )
              ? _scrollToSelectedLine
              : undefined
          }
          // This forces a remount for all location changes which
          // keeps the containerRef in sync with location.
          // See https://github.com/mozilla/addons-code-manager/issues/905
          key={location.key}
          messages={selectedMessageMap && selectedMessageMap.global}
        />
        {slowAlert}
        <FadableContent fade={codeWasTrimmed}>
          <div className={styles.CodeView}>
            <AutoSizer>
              {({ height, width }: any) => (
                <table className={styles.table}>
                  <colgroup>
                    <col className={styles.lineNumberCol} />
                    <col />
                  </colgroup>

                  <tbody className={styles.tableBody}>
                    <List
                      className="List"
                      height={height}
                      itemCount={codeLines.length}
                      itemSize={19}
                      width={width}
                      itemData={codeLines}
                    >
                      {({ index, style, data }: any) => {
                        const i = index;
                        const code = data[i];

                        const line = i + 1;
                        const id = getCodeLineAnchorID(line);

                        let className = styles.line;
                        let shellRef;

                        if (isLineSelected(id, location)) {
                          className = makeClassName(
                            className,
                            styles.selectedLine,
                          );
                          shellRef = _scrollToSelectedLine;
                        }

                        return (
                          <React.Fragment key={`fragment-${line}`}>
                            <Commentable
                              style={style}
                              as="div"
                              id={id}
                              className={className}
                              line={line}
                              fileName={version.selectedPath}
                              shellRef={shellRef}
                              versionId={version.id}
                            >
                              {(addCommentButton) => (
                                <>
                                  <td className={styles.lineNumber}>
                                    <Link
                                      className={styles.lineNumberLink}
                                      to={{
                                        ...location,
                                        hash: getCodeLineAnchor(line),
                                      }}
                                    >{`${line}`}</Link>
                                    {enableCommenting && addCommentButton}
                                  </td>
                                  <td className={styles.code}>
                                    {renderCode({
                                      code,
                                      language,
                                    })}
                                  </td>
                                </>
                              )}
                            </Commentable>
                            {enableCommenting && (
                              <CommentList
                                addonId={version.addon.id}
                                fileName={version.selectedPath}
                                line={line}
                                versionId={version.id}
                              >
                                {(commentList) => (
                                  <tr>
                                    <td colSpan={2}>{commentList}</td>
                                  </tr>
                                )}
                              </CommentList>
                            )}
                          </React.Fragment>
                        );
                      }}
                    </List>
                  </tbody>
                </table>
              )}
            </AutoSizer>
          </div>
        </FadableContent>
        {/* Only show a slow alert at the bottom if the code was trimmed. */}
        {codeWasTrimmed && slowAlert}
      </>
    );
  };

  render() {
    const { version } = this.props;

    return (
      <React.Profiler id="CodeView-Render" onRender={this.onRenderProfiler}>
        <LinterProvider version={version} selectedPath={version.selectedPath}>
          {
            // This needs to be an anonymous function (which defeats memoization)
            // so that the component gets re-rendered in the case of adding
            // comments per line.
            (info: LinterProviderInfo) => this.renderWithLinterInfo(info)
          }
        </LinterProvider>
      </React.Profiler>
    );
  }
}

export default withRouter(CodeViewBase) as React.ComponentType<
  PublicProps & Partial<DefaultProps>
>;
