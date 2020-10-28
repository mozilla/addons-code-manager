import * as React from 'react';
import { shallow } from 'enzyme';
import { Store } from 'redux';

import { infoPanelTitle } from '../VersionFileViewer';
import configureStore from '../../configureStore';
import { actions } from '../../reducers/accordionMenu';
import { createFakeEvent, shallowUntilTarget, spyOn } from '../../test-helpers';
import styles from './styles.module.scss';

import AccordionMenu, {
  AccordionItem,
  AccordionItemBase,
  DefaultItemProps,
  PublicItemProps,
  makeItemContentId,
} from '.';

describe(__filename, () => {
  describe('AccordionMenu', () => {
    it('renders children', () => {
      const childClass = 'example-class';
      const root = shallow(
        <AccordionMenu>
          <AccordionItem title="Example">
            <div className={childClass} />
          </AccordionItem>
        </AccordionMenu>,
      );

      expect(root.find(`.${childClass}`)).toHaveLength(1);
    });
  });

  describe('AccordionItem', () => {
    type RenderParams = { store?: Store } & Partial<PublicItemProps> &
      Partial<DefaultItemProps>;

    const render = ({
      store = configureStore(),
      ...moreProps
    }: RenderParams) => {
      const props = {
        children: <span />,
        title: 'Example Title',
        ...moreProps,
      };

      return shallowUntilTarget(
        <AccordionItem {...props} />,
        AccordionItemBase,
        {
          shallowOptions: { context: { store } },
        },
      );
    };

    const renderExpanded = ({
      title = 'Example Title',
      store = configureStore(),
      ...props
    }: RenderParams) => {
      store.dispatch(actions.toggleItem({ itemId: title }));
      return render({ title, store, ...props });
    };

    it('does not expand children by default', () => {
      const childClass = 'example-class';

      const root = render({
        children: <div className={childClass} />,
      });

      const item = root.find(`.${styles.itemContent}`);
      expect(item).not.toHaveClassName(styles.itemExpanded);
      expect(item).toHaveProp('aria-expanded', 'false');

      // The child still gets rendered, though:
      expect(item.find(`.${childClass}`)).toHaveLength(1);
    });

    it('renders the Information panel as expanded', () => {
      const childClass = 'example-class';

      const root = render({
        children: <div className={childClass} />,
        title: infoPanelTitle,
      });

      const item = root.find(`.${styles.itemContent}`);
      expect(item).toHaveClassName(styles.itemExpanded);
      expect(item).toHaveProp('aria-expanded', 'true');
      expect(item.find(`.${childClass}`)).toHaveLength(1);
    });

    it('can render children as expanded', () => {
      const childClass = 'example-class';

      const root = renderExpanded({
        children: <div className={childClass} />,
      });

      const item = root.find(`.${styles.itemContent}`);
      expect(item).toHaveClassName(styles.itemExpanded);
      expect(item).toHaveProp('aria-expanded', 'true');
      expect(item.find(`.${childClass}`)).toHaveLength(1);
    });

    it('does not dispatch an expansion action by default', () => {
      const store = configureStore();
      const dispatch = spyOn(store, 'dispatch');

      render({ store });

      expect(dispatch).not.toHaveBeenCalled();
    });

    it('dispatches an action to expand content when given expandedByDefault=true', () => {
      const title = 'Menu Item Title';

      const store = configureStore();
      const dispatch = spyOn(store, 'dispatch');

      render({ expandedByDefault: true, title, store });

      expect(dispatch).toHaveBeenCalledWith(
        actions.toggleItem({ itemId: title }),
      );
    });

    it('does not re-expand with expandedByDefault=true if already expanded', () => {
      const title = 'Menu Item Title';
      const store = configureStore();
      store.dispatch(actions.toggleItem({ itemId: title }));

      const dispatch = spyOn(store, 'dispatch');

      render({ expandedByDefault: true, title, store });

      expect(dispatch).not.toHaveBeenCalled();
    });

    it('associates a button with the content it expands', () => {
      const title = 'Example Title';
      const contentId = makeItemContentId(title);

      const root = render({ title });

      const button = root.find(`.${styles.itemButton}`);
      const content = root.find(`.${styles.itemContent}`);

      expect(button).toHaveProp('ariaControls', contentId);
      expect(content).toHaveProp('id', contentId);
    });

    it('toggles content expansion when clicking the button', () => {
      const title = 'Menu Item Title';

      const store = configureStore();
      const dispatch = spyOn(store, 'dispatch');

      const root = render({ title, store });
      root.find(`.${styles.itemButton}`).simulate('click', createFakeEvent());

      expect(dispatch).toHaveBeenCalledWith(
        actions.toggleItem({ itemId: title }),
      );
    });
  });

  describe('makeItemContentId', () => {
    it.each([
      ['Some Title', 'accordionContentSomeTitle'],
      ['Some-Title', 'accordionContentSomeTitle'],
      ['999 Problems', 'accordionContent999Problems'],
      ['Things Like \'":;()_^$#@!+%', 'accordionContentThingsLike'],
    ])('converts "%s" to "%s"', (input, id) => {
      expect(makeItemContentId(input)).toEqual(id);
    });

    it('does not allow empty IDs', () => {
      expect(() => makeItemContentId('\'":;()_^$#@!+%')).toThrow(
        /ID could not be generated/,
      );
    });
  });
});
