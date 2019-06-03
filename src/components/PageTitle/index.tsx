import * as React from 'react';

import { AnyReactNode } from '../../typeUtils';

export type PublicProps = {
  _setTitle?: () => void;
  children: AnyReactNode;
  title: string | null;
};

export type DefaultProps = {
  _document: typeof document;
};

type Props = PublicProps & DefaultProps;

export default class PageTitle extends React.Component<Props> {
  setTitle = this.props._setTitle || this._setTitle;

  static defaultProps: DefaultProps = {
    _document: document,
  };

  componentDidMount() {
    this.setTitle();
  }

  componentDidUpdate() {
    this.setTitle();
  }

  _setTitle() {
    const { _document, title } = this.props;

    if (title) {
      _document.title = title;
    }
  }

  render() {
    return this.props.children;
  }
}
