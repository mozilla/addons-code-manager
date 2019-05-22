import * as React from 'react';
import makeClassName from 'classnames';
import { connect } from 'react-redux';

import { ApplicationState } from '../../reducers';
import { AnyReactNode } from '../../typeUtils';
import styles from './styles.module.scss';

type PropsFromState = {
  mainSidePanelIsExpanded: boolean;
};

type PublicProps = {
  children?: AnyReactNode;
  className?: string;
};

type Props = PublicProps & PropsFromState;

export enum PanelAttribs {
  altSidePanel = 'altSidePanel',
  mainSidePanel = 'mainSidePanel',
}

export const Header = ({
  children,
  className,
}: {
  children?: AnyReactNode;
  className?: string;
}) => {
  return (
    <header className={makeClassName(styles.Header, className)}>
      {children}
    </header>
  );
};

export const FullscreenGridBase = ({
  children,
  className,
  mainSidePanelIsExpanded,
}: Props) => {
  return (
    <div
      className={makeClassName(
        styles.FullscreenGrid,
        {
          [styles.hasACollapsedMainSidePanel]: !mainSidePanelIsExpanded,
        },
        className,
      )}
    >
      {children}
    </div>
  );
};

const mapStateToProps = (state: ApplicationState): PropsFromState => {
  return {
    mainSidePanelIsExpanded: state.fullscreenGrid.mainSidePanelIsExpanded,
  };
};

export default connect(mapStateToProps)(FullscreenGridBase);
