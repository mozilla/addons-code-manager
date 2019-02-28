import * as React from 'react';

import styles from './styles.module.scss';
import { getLines, mapWithDepth } from './utils';
import refractor from '../../refractor';
import { getLanguageFromMimeType } from '../../utils';

type PublicProps = {
  mimeType: string;
  content: string;
};

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

const CodeViewBase = ({ mimeType, content }: PublicProps) => {
  const language = getLanguageFromMimeType(mimeType);

  return (
    <div className={styles.CodeView}>
      <table className={styles.table}>
        <tbody className={styles.tableBody}>
          {getLines(content).map((code, i) => {
            const line = i + 1;

            return (
              <tr key={`row-${line}`}>
                <td className={styles.lineNumber}>{`${line}`}</td>

                <td className={styles.code}>
                  {renderHighlightedCode(code, language)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default CodeViewBase;
