import makeClassName from 'classnames';
import queryString from 'query-string';
import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter, Link, RouteComponentProps } from 'react-router-dom';

import styles from './styles.module.scss';
import LinterMessage from '../LinterMessage';
import {
  getCodeLineAnchor,
  getCodeLineAnchorID,
  getLines,
  mapWithDepth,
} from './utils';
import refractor from '../../refractor';
import { getLanguageFromMimeType, messageUidQueryParam } from '../../utils';
import { ApplicationState } from '../../reducers';
import { LinterMessage as LinterMessageType } from '../../reducers/linter';
import { Version } from '../../reducers/versions';
import LinterProvider, { LinterProviderInfo } from '../LinterProvider';

// This function mimics what https://github.com/rexxars/react-refractor does,
// but we need a different layout to inline comments so we cannot use this
// component.
const renderHighlightedCode = (code: string, language: string) => {
  const ast = refractor.highlight(code, language);
  const value = ast.length === 0 ? code : ast.map(mapWithDepth(0));

  return (
    <pre className={styles.highlightedCode}>
      <code className={`language-${language}`}>{value}</code>
    </pre>
  );
};

const isLineSelected = (
  id: string,
  location: RouteComponentProps['location'],
) => {
  return `#${id}` === location.hash;
};

export const scrollToSelectedLine = (element: HTMLTableRowElement | null) => {
  if (element) {
    element.scrollIntoView();
  }
};

export type PublicProps = {
  _scrollToSelectedLine?: typeof scrollToSelectedLine;
  mimeType: string;
  content: string;
  version: Version;
};

type PropsFromState = {
  messageUid: LinterMessageType['uid'];
};

type Props = RouteComponentProps & PropsFromState & PublicProps;

type RowProps = {
  className: string;
  id: string;
  ref?: typeof scrollToSelectedLine;
};

export class CodeViewBase extends React.Component<Props> {
  renderWithLinterInfo = ({ selectedMessageMap }: LinterProviderInfo) => {
    const {
      _scrollToSelectedLine = scrollToSelectedLine,
      content,
      location,
      messageUid,
      mimeType,
    } = this.props;

    const language = getLanguageFromMimeType(mimeType);

    return (
      <React.Fragment>
        {selectedMessageMap &&
          selectedMessageMap.global.length > 0 &&
          isLineSelected(getCodeLineAnchorID(0), location) && (
            <div id={getCodeLineAnchorID(0)} ref={_scrollToSelectedLine} />
          )}
        {selectedMessageMap &&
          selectedMessageMap.global.map((message) => {
            return (
              <LinterMessage
                key={message.uid}
                message={message}
                highlight={message.uid === messageUid}
              />
            );
          })}
        <div className={styles.CodeView}>
          <table className={styles.table}>
            <tbody className={styles.tableBody}>
              {getLines(content).map((code, i) => {
                const line = i + 1;

                let rowProps: RowProps = {
                  id: getCodeLineAnchorID(line),
                  className: styles.line,
                };

                if (isLineSelected(rowProps.id, location)) {
                  rowProps = {
                    ...rowProps,
                    className: makeClassName(
                      rowProps.className,
                      styles.selectedLine,
                    ),
                    ref: _scrollToSelectedLine,
                  };
                }

                return (
                  <React.Fragment key={`fragment-${line}`}>
                    <tr {...rowProps}>
                      <td className={styles.lineNumber}>
                        <Link
                          to={{
                            ...location,
                            hash: getCodeLineAnchor(line),
                          }}
                        >{`${line}`}</Link>
                      </td>

                      <td className={styles.code}>
                        {renderHighlightedCode(code, language)}
                      </td>
                    </tr>
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
                                highlight={msg.uid === messageUid}
                                inline
                                key={msg.uid}
                                message={msg}
                              />
                            );
                          })}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </React.Fragment>
    );
  };

  render() {
    const { version } = this.props;

    return (
      <LinterProvider
        versionId={version.id}
        validationURL={version.validationURL}
        selectedPath={version.selectedPath}
      >
        {this.renderWithLinterInfo}
      </LinterProvider>
    );
  }
}

const mapStateToProps = (
  state: ApplicationState,
  ownProps: RouteComponentProps,
): PropsFromState => {
  const { location } = ownProps;
  const messageUid = queryString.parse(location.search)[messageUidQueryParam];

  return {
    messageUid: typeof messageUid === 'string' ? messageUid : '',
  };
};

export default withRouter(connect(mapStateToProps)(CodeViewBase));
