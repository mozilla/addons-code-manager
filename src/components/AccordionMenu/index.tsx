import * as React from 'react';
import { connect } from 'react-redux';
import makeClassName from 'classnames';

import Button from '../Button';
import { ApplicationState } from '../../reducers';
import { ConnectedReduxProps } from '../../configureStore';
import { actions, isExpanded } from '../../reducers/accordionMenu';
import { AnyReactNode } from '../../typeUtils';
import styles from './styles.module.scss';

export const makeItemContentId = (title: string) => {
  const id = title.replace(/[^A-Za-z0-9]+/g, '');
  if (!id) {
    throw new Error(`An ID could not be generated from this title: "${title}"`);
  }
  return `accordionContent${id}`;
};

export type PublicItemProps = {
  children: AnyReactNode;
  title: string;
};

export type DefaultItemProps = {
  expandedByDefault: boolean;
};

type ItemPropsFromState = {
  expanded: boolean;
};

type ItemProps = PublicItemProps &
  DefaultItemProps &
  ItemPropsFromState &
  ConnectedReduxProps;

export class AccordionItemBase extends React.Component<ItemProps> {
  static defaultProps = {
    expandedByDefault: false,
  };

  componentDidMount() {
    const { dispatch, expandedByDefault, expanded, title } = this.props;

    if (expandedByDefault && !expanded) {
      dispatch(actions.toggleItem({ itemId: title }));
    }
  }

  onItemClick = () => {
    const { dispatch, title } = this.props;
    dispatch(actions.toggleItem({ itemId: title }));
  };

  render() {
    const { children, expanded, title } = this.props;
    const contentId = makeItemContentId(title);

    return (
      <>
        <Button
          ariaControls={contentId}
          onClick={this.onItemClick}
          className={makeClassName(styles.item, styles.itemButton)}
        >
          {title}
        </Button>
        <div
          aria-expanded={expanded ? 'true' : 'false'}
          className={makeClassName(styles.item, styles.itemContent, {
            [styles.itemExpanded]: expanded,
          })}
          id={contentId}
        >
          {children}
        </div>
      </>
    );
  }
}

const mapStateToProps = (
  state: ApplicationState,
  ownProps: PublicItemProps,
): ItemPropsFromState => {
  return { expanded: isExpanded(state.accordionMenu, ownProps.title) };
};

export const AccordionItem = connect(mapStateToProps)(AccordionItemBase);

const AccordionMenu = ({ children }: { children: AnyReactNode }) => {
  return <div className={styles.menu}>{children}</div>;
};

export default AccordionMenu;
