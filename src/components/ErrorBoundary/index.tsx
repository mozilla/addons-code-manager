import log from 'loglevel';
import * as React from 'react';

import styles from './styles.module.scss';

export type PublicProps = { children: JSX.Element };
export type DefaultProps = { _log: typeof log };
export type Props = PublicProps & DefaultProps;

export type State = {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
};

export class ErrorBoundaryBase extends React.Component<Props, State> {
  static defaultProps: DefaultProps = { _log: log };

  constructor(props: Props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { _log } = this.props;

    this.setState({ error, errorInfo });
    _log.error('Caught application error:', error, errorInfo);
  }

  render() {
    const { error, errorInfo } = this.state;
    if (errorInfo) {
      return (
        <div className={styles.container}>
          <h2>Oops, something went wrong.</h2>
          <p>
            Please let us know what you were trying to do when this error
            occured by{' '}
            <a
              href="https://github.com/mozilla/addons-code-manager/issues/new/"
              rel="noopener noreferrer"
              target="_blank"
            >
              filing an issue
            </a>
            .
          </p>
          <details className={styles.errorDetails}>
            <div className={styles.errorText}>{error && error.toString()}</div>
            <div className={styles.componentStack}>
              {errorInfo && errorInfo.componentStack}
            </div>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundaryBase;
