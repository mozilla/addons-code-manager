import * as React from 'react';
import refractor from 'refractor';

import styles from './styles.module.scss';
import text from './text-language';
import { getLanguage, getLines, mapWithDepth } from './utils';
import './prism.css';

type PublicProps = {
  mimeType: string;
  content: string;
};

// This is needed to provide a fallback in `getLanguage()` when the mime type
// has no corresponding syntax highlighting language.
refractor.register(text);

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
  const language = getLanguage(mimeType);

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
