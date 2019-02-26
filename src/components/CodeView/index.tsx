import * as React from 'react';
import Refractor from 'react-refractor/all';

import styles from './styles.module.scss';
import './prism.css';

type PublicProps = {
  mimeType: string;
  content: string;
};

export const getLanguage = (mimeType: string) => {
  switch (mimeType) {
    case 'application/javascript':
    case 'text/javascript':
      return 'js';
    case 'application/json':
      return 'json';
    case 'application/xml':
      return 'xml';
    case 'text/css':
      return 'css';
    case 'text/html':
      return 'html';
    default:
      return null;
  }
};

export const getLines = (content: string) => {
  return content.replace(/\n$/, '').split('\n');
};

const CodeViewBase = ({ mimeType, content }: PublicProps) => {
  const language = getLanguage(mimeType);

  return (
    <div className={styles.CodeView}>
      <pre>
        <code className={styles.lineNumbers}>
          {getLines(content).map((_, i) => {
            const lineNumber = i + 1;

            return (
              <span key={`line-number-${lineNumber}`}>{`${lineNumber}`}</span>
            );
          })}
        </code>

        {language ? (
          <Refractor
            className={styles.content}
            language={language}
            value={content}
            inline
          />
        ) : (
          <code className={styles.content}>{content}</code>
        )}
      </pre>
    </div>
  );
};

export default CodeViewBase;
