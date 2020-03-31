import * as React from 'react';
import { withRouter, Link, RouteComponentProps } from 'react-router-dom';
import makeClassName from 'classnames';

import styles from './styles.module.scss';
import Commentable from '../Commentable';
import CommentList from '../CommentList';
import FadableContent from '../FadableContent';
import LinterMessage from '../LinterMessage';
import {
  getCodeLineAnchor,
  getCodeLineAnchorID,
  getLines,
  mapWithDepth,
  GLOBAL_LINTER_ANCHOR_ID,
} from './utils';
import refractor from '../../refractor';
import {
  SLOW_LOADING_CHAR_COUNT,
  TRIMMED_CHAR_COUNT,
  codeShouldBeTrimmed,
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

export type PublicProps = {
  content: string;
  isMinified: boolean;
  mimeType: string;
  version: Version;
};

export type DefaultProps = {
  _scrollToSelectedLine: typeof scrollToSelectedLine;
  _sendPerfTiming: typeof sendPerfTiming;
  _slowLoadingCharCount: number;
  _trimmedCharCount: number;
  enableCommenting: boolean;
};

type Props = PublicProps & DefaultProps & RouteComponentProps;

export class CodeViewBase extends React.Component<Props> {
  static defaultProps: DefaultProps = {
    _scrollToSelectedLine: scrollToSelectedLine,
    _sendPerfTiming: sendPerfTiming,
    _slowLoadingCharCount: SLOW_LOADING_CHAR_COUNT,
    _trimmedCharCount: TRIMMED_CHAR_COUNT,
    enableCommenting: process.env.REACT_APP_ENABLE_COMMENTING === 'true',
  };

  // See https://github.com/reactjs/rfcs/blob/master/text/0051-profiler.md
  onRenderProfiler = (id: string, phase: string, actualDuration: number) => {
    this.props._sendPerfTiming({ actualDuration, id, phase });
  };

  renderWithLinterInfo = ({ selectedMessageMap }: LinterProviderInfo) => {
    const {
      _scrollToSelectedLine,
      _slowLoadingCharCount,
      _trimmedCharCount,
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
      codeShouldBeTrimmed(content.length, _slowLoadingCharCount, isMinified)
    ) {
      if (!shouldAllowSlowPages({ location })) {
        codeLines = getLines(
          `${content.substring(
            0,
            _trimmedCharCount,
          )} /* truncated by code-manager */`,
        );
        codeWasTrimmed = true;
      }
      slowAlert = (
        <SlowPageAlert
          location={location}
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
            <table className={styles.table}>
              <colgroup>
                <col className={styles.lineNumberCol} />
                <col />
              </colgroup>
              <tbody className={styles.tableBody}>
                {codeLines.map((code, i) => {
                  const line = i + 1;
                  const id = getCodeLineAnchorID(line);

                  let className = styles.line;
                  let shellRef;

                  if (isLineSelected(id, location)) {
                    className = makeClassName(className, styles.selectedLine);
                    shellRef = _scrollToSelectedLine;
                  }

                  return (
                    <React.Fragment key={`fragment-${line}`}>
                      <Commentable
                        as="tr"
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
                      {selectedMessageMap && selectedMessageMap.byLine[line] && (
                        <tr>
                          <td
                            id={`line-${line}-messages`}
                            className={styles.linterMessages}
                            colSpan={2}
                          >
                            {selectedMessageMap.byLine[line].map((msg) => {
                              return (
                                <LinterMessage
                                  inline
                                  key={msg.uid}
                                  message={msg}
                                />
                              );
                            })}
                          </td>
                        </tr>
                      )}
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
                })}
              </tbody>
            </table>
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
        <LinterProvider
          versionId={version.id}
          validationURL={version.validationURL}
          selectedPath={version.selectedPath}
        >
          {// This needs to be an anonymous function (which defeats memoization)
          // so that the component gets re-rendered in the case of adding
          // comments per line.
          (info: LinterProviderInfo) => this.renderWithLinterInfo(info)}
        </LinterProvider>
      </React.Profiler>
    );
  }
}

export default withRouter(CodeViewBase) as React.ComponentType<
  PublicProps & Partial<DefaultProps>
>;
