/* eslint-disable @typescript-eslint/camelcase */
import { ShallowWrapper, shallow } from 'enzyme';
import * as React from 'react';
import { Form } from 'react-bootstrap';
import { Store } from 'redux';
import { History } from 'history';

import configureStore from '../../configureStore';
import VersionSelect, {
  PublicProps as VersionSelectProps,
} from '../VersionSelect';
import { actions as popoverActions } from '../../reducers/popover';
import {
  ExternalVersionsList,
  ExternalVersionsListItem,
  actions as versionsActions,
  createInternalVersionsListItem,
} from '../../reducers/versions';
import { pathQueryParam } from '../../utils';
import {
  createContextWithFakeRouter,
  createFakeHistory,
  createFakeThunk,
  createStoreWithVersion,
  fakeVersionWithContent,
  fakeVersionsList,
  fakeVersionsListItem,
  nextUniqueId,
  shallowUntilTarget,
  spyOn,
  simulatePopover,
  createFakeEvent,
  createFakeLocation,
} from '../../test-helpers';
import styles from './styles.module.scss';

import VersionChooser, {
  DefaultProps,
  POPOVER_ID,
  PublicProps,
  VersionChooserBase,
  higherVersionsThan,
  lowerVersionsThan,
} from '.';

describe(__filename, () => {
  const lang = process.env.REACT_APP_DEFAULT_API_LANG;

  const fakeListedVersion: ExternalVersionsListItem = {
    ...fakeVersionsListItem,
    channel: 'listed',
  };

  const fakeUnlistedVersion: ExternalVersionsListItem = {
    ...fakeVersionsListItem,
    channel: 'unlisted',
  };

  type RenderParams = {
    baseVersionId?: number;
    headVersionId?: number;
    setBaseVersion?: boolean;
    setHeadVersion?: boolean;
  } & Partial<PublicProps> &
    Partial<DefaultProps> & {
      store?: Store;
      history?: History;
    };

  const render = ({
    _fetchVersionsList,
    _higherVersionsThan,
    _lowerVersionsThan,
    addonId = nextUniqueId(),
    baseVersionId = nextUniqueId(),
    headVersionId = nextUniqueId(),
    history = createFakeHistory(),
    setBaseVersion = true,
    setHeadVersion = true,
    store = configureStore(),
  }: RenderParams = {}) => {
    if (setBaseVersion) {
      store.dispatch(
        versionsActions.setPendingBaseVersionId({
          versionId: baseVersionId,
        }),
      );
    }
    if (setHeadVersion) {
      store.dispatch(
        versionsActions.setPendingHeadVersionId({
          versionId: headVersionId,
        }),
      );
    }
    const contextWithRouter = createContextWithFakeRouter({ history });
    const shallowOptions = {
      ...contextWithRouter,
      context: {
        ...contextWithRouter.context,
        store,
      },
    };

    const props = {
      _fetchVersionsList,
      _higherVersionsThan,
      _lowerVersionsThan,
      addonId,
    };

    return shallowUntilTarget(
      <VersionChooser {...props} />,
      VersionChooserBase,
      { shallowOptions },
    );
  };

  const renderForm = (props = {}) => {
    const root = render(props);
    return { ...simulatePopover(root), root };
  };

  const changeSelectValue = (wrapper: ShallowWrapper, value: number) => {
    // First, convert to unknown because the enzyme type incorrectly
    // assumes we are referencing the standard React onChange prop.
    const onChangeResult = wrapper.prop('onChange') as unknown;
    // Convert onChange into the correct type.
    const onChange = onChangeResult as VersionSelectProps['onChange'];
    onChange(value);
  };

  const submitForm = (wrapper: ShallowWrapper) => {
    wrapper.find(Form).simulate('submit', createFakeEvent());
  };

  const getInstance = (root: ShallowWrapper) => {
    return root.instance() as VersionChooserBase;
  };

  const _loadVersionsList = ({
    store = configureStore(),
    addonId = nextUniqueId(),
    versions = fakeVersionsList,
  } = {}) => {
    store.dispatch(versionsActions.loadVersionsList({ addonId, versions }));
    return { addonId, store };
  };

  it('sets the `isLoading` prop to `true`  when lists of versions are not loaded', () => {
    const { content } = renderForm();

    expect(content.find(VersionSelect)).toHaveLength(2);
    expect(content.find(VersionSelect).at(0)).toHaveProp('isLoading', true);
    expect(content.find(VersionSelect).at(1)).toHaveProp('isLoading', true);
  });

  it('renders two VersionSelect components when lists of versions are loaded', () => {
    const { addonId, store } = _loadVersionsList();

    const { content } = renderForm({ addonId, store });

    expect(content.find(VersionSelect)).toHaveLength(2);
    expect(content.find(VersionSelect).at(0)).toHaveProp(
      'label',
      'Old version',
    );
    expect(content.find(VersionSelect).at(0)).toHaveProp('isLoading', false);
    expect(content.find(VersionSelect).at(1)).toHaveProp(
      'label',
      'New version',
    );
    expect(content.find(VersionSelect).at(1)).toHaveProp('isLoading', false);
  });

  it('passes a `isSelectable` function to each VersionSelect', () => {
    const baseVersionId = nextUniqueId();
    const headVersionId = nextUniqueId();
    const _higherVersionsThan = jest
      .fn()
      .mockReturnValue('_higherVersionsThan');
    const _lowerVersionsThan = jest.fn().mockReturnValue('_lowerVersionsThan');

    const versions: ExternalVersionsList = [fakeListedVersion];

    const { addonId, store } = _loadVersionsList({ versions });

    const { content } = renderForm({
      _higherVersionsThan,
      _lowerVersionsThan,
      addonId,
      baseVersionId,
      headVersionId,
      store,
    });

    const oldVersionSelect = content.find(`.${styles.baseVersionSelect}`);
    expect(oldVersionSelect).toHaveProp('isSelectable', _lowerVersionsThan());
    expect(_lowerVersionsThan).toHaveBeenCalledWith(String(headVersionId));

    const newVersionSelect = content.find(`.${styles.headVersionSelect}`);
    expect(newVersionSelect).toHaveProp('isSelectable', _higherVersionsThan());
    expect(_higherVersionsThan).toHaveBeenCalledWith(String(baseVersionId));
  });

  it.each([0, 1])(
    'splits the list of versions into listed / unlisted for select %s',
    (selectIndex) => {
      const listedVersions: ExternalVersionsList = [
        { ...fakeListedVersion, id: nextUniqueId() },
      ];
      const unlistedVersions: ExternalVersionsList = [
        { ...fakeUnlistedVersion, id: nextUniqueId() },
      ];

      const { addonId, store } = _loadVersionsList({
        versions: [...listedVersions, ...unlistedVersions],
      });

      const { content } = renderForm({ addonId, store });

      const select = content.find(VersionSelect).at(selectIndex);
      expect(select).toHaveProp(
        'listedVersions',
        listedVersions.map(createInternalVersionsListItem),
      );
      expect(select).toHaveProp(
        'unlistedVersions',
        unlistedVersions.map(createInternalVersionsListItem),
      );
    },
  );

  it('initializes a base version when one is not set', () => {
    const versions = [
      { ...fakeListedVersion, id: nextUniqueId() },
      { ...fakeListedVersion, id: nextUniqueId() },
      { ...fakeListedVersion, id: nextUniqueId() },
    ];

    const { addonId, store } = _loadVersionsList({ versions });
    const dispatchSpy = spyOn(store, 'dispatch');

    renderForm({ addonId, setBaseVersion: false, store });

    expect(dispatchSpy).toHaveBeenCalledWith(
      versionsActions.setPendingBaseVersionId({
        versionId: versions[versions.length - 1].id,
      }),
    );
  });

  it('does not initialize a base version when one is already set', () => {
    const versions = [
      { ...fakeListedVersion, id: nextUniqueId() },
      { ...fakeListedVersion, id: nextUniqueId() },
      { ...fakeListedVersion, id: nextUniqueId() },
    ];

    const { addonId, store } = _loadVersionsList({ versions });

    const baseVersionId = nextUniqueId();
    const { content } = renderForm({
      addonId,
      baseVersionId,
      setBaseVersion: true,
      store,
    });

    expect(content.find(`.${styles.baseVersionSelect}`)).toHaveProp(
      'value',
      String(baseVersionId),
    );
  });

  it('synchronizes on mount', () => {
    const spy = jest.spyOn(VersionChooserBase.prototype, 'synchronize');
    render();

    expect(spy).toHaveBeenCalled();
  });

  it('synchronizes on update', () => {
    const spy = jest.spyOn(VersionChooserBase.prototype, 'synchronize');
    const root = render();
    spy.mockClear();
    root.setProps({});

    expect(spy).toHaveBeenCalled();
  });

  it('accounts for unlisted versions when initializing a base version', () => {
    const unlistedId = nextUniqueId();
    const versions = [
      { ...fakeUnlistedVersion, id: unlistedId },
      { ...fakeListedVersion, id: nextUniqueId() },
    ];

    const { addonId, store } = _loadVersionsList({ versions });
    const dispatchSpy = spyOn(store, 'dispatch');

    renderForm({ addonId, setBaseVersion: false, store });

    expect(dispatchSpy).toHaveBeenCalledWith(
      versionsActions.setPendingBaseVersionId({ versionId: unlistedId }),
    );
  });

  it('does not initialize a base version when no versions exist', () => {
    const { addonId, store } = _loadVersionsList({ versions: [] });

    const { content } = renderForm({ addonId, setBaseVersion: false, store });

    expect(content.find(`.${styles.baseVersionSelect}`)).toHaveProp(
      'value',
      '',
    );
  });

  describe('synchronizing pending versions', () => {
    const setUpVersionsAndRender = ({
      currentBaseVersionId,
      currentVersionId,
      ...params
    }: {
      currentBaseVersionId?: number | undefined;
      currentVersionId?: number | undefined;
    } & RenderParams = {}) => {
      const versions = [
        // Add extra versions at the top and bottom since those are used
        // as default initializers in some cases.
        { ...fakeListedVersion, id: nextUniqueId() },
        { ...fakeListedVersion, id: currentBaseVersionId || nextUniqueId() },
        { ...fakeListedVersion, id: currentVersionId || nextUniqueId() },
        { ...fakeListedVersion, id: nextUniqueId() },
      ];
      const { addonId, store } = _loadVersionsList({ versions });

      if (currentBaseVersionId) {
        store.dispatch(
          versionsActions.setCurrentBaseVersionId({
            versionId: currentBaseVersionId,
          }),
        );
      }
      if (currentVersionId) {
        store.dispatch(
          versionsActions.setCurrentVersionId({ versionId: currentVersionId }),
        );
      }
      const dispatchSpy = spyOn(store, 'dispatch');

      const root = render({
        addonId,
        setBaseVersion: false,
        setHeadVersion: false,
        store,
        ...params,
      });

      return { dispatchSpy, root, store };
    };

    it('sets pendingBaseVersionId when undefined to currentBaseVersionId', () => {
      const currentBaseVersionId = nextUniqueId();
      const { dispatchSpy } = setUpVersionsAndRender({ currentBaseVersionId });

      expect(dispatchSpy).toHaveBeenCalledWith(
        versionsActions.setPendingBaseVersionId({
          versionId: currentBaseVersionId,
        }),
      );
    });

    it('sets pendingHeadVersionId when undefined to currentVersionId', () => {
      const currentVersionId = nextUniqueId();
      const { dispatchSpy } = setUpVersionsAndRender({ currentVersionId });

      expect(dispatchSpy).toHaveBeenCalledWith(
        versionsActions.setPendingHeadVersionId({
          versionId: currentVersionId,
        }),
      );
    });

    it('does not set pending versions when current versions are undefined', () => {
      const { addonId, store } = _loadVersionsList({ versions: [] });
      const dispatchSpy = spyOn(store, 'dispatch');

      render({ addonId, setBaseVersion: false, setHeadVersion: false, store });

      expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it('does not set pending versions when they are already defined', () => {
      const { addonId, store } = _loadVersionsList({ versions: [] });
      store.dispatch(
        versionsActions.setCurrentBaseVersionId({ versionId: nextUniqueId() }),
      );
      store.dispatch(
        versionsActions.setCurrentVersionId({ versionId: nextUniqueId() }),
      );
      store.dispatch(
        versionsActions.setPendingBaseVersionId({ versionId: nextUniqueId() }),
      );
      store.dispatch(
        versionsActions.setPendingHeadVersionId({ versionId: nextUniqueId() }),
      );
      const dispatchSpy = spyOn(store, 'dispatch');

      const root = render({
        addonId,
        setBaseVersion: false,
        setHeadVersion: false,
        store,
      });

      dispatchSpy.mockClear();
      root.setProps({});

      expect(dispatchSpy).not.toHaveBeenCalled();
    });
  });

  it('dispatches fetchVersionsList() on mount', () => {
    const addonId = 888;
    const store = configureStore();
    const dispatch = spyOn(store, 'dispatch');
    const fakeThunk = createFakeThunk();
    const _fetchVersionsList = fakeThunk.createThunk;

    render({ _fetchVersionsList, addonId, store });

    expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_fetchVersionsList).toHaveBeenCalledWith({ addonId });
  });

  it('does not dispatch fetchVersionsList() on mount when lists are already loaded', () => {
    const { addonId, store } = _loadVersionsList({ versions: [] });

    const dispatch = spyOn(store, 'dispatch');
    const fakeThunk = createFakeThunk();

    render({
      _fetchVersionsList: fakeThunk.createThunk,
      addonId,
      store,
    });

    expect(dispatch).not.toHaveBeenCalledWith(fakeThunk.thunk);
  });

  it('dispatches fetchVersionsList() on mount when a different unfetched addonId is passed in', () => {
    const store = configureStore();
    _loadVersionsList({ store, versions: [] });

    const dispatch = spyOn(store, 'dispatch');
    const fakeThunk = createFakeThunk();
    const _fetchVersionsList = fakeThunk.createThunk;

    const secondAddonId = nextUniqueId();

    render({ _fetchVersionsList, addonId: secondAddonId, store });

    expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_fetchVersionsList).toHaveBeenCalledWith({ addonId: secondAddonId });
  });

  it('dispatches setPendingBaseVersionId when selecting a base version', () => {
    const baseVersionId = nextUniqueId();
    const { addonId, store } = _loadVersionsList();
    const dispatchSpy = spyOn(store, 'dispatch');

    const { content } = renderForm({ addonId, store });

    changeSelectValue(
      content.find(`.${styles.baseVersionSelect}`),
      baseVersionId,
    );

    expect(dispatchSpy).toHaveBeenCalledWith(
      versionsActions.setPendingBaseVersionId({ versionId: baseVersionId }),
    );
  });

  it('dispatches setPendingHeadVersionId when selecting a head version', () => {
    const headVersionId = nextUniqueId();
    const { addonId, store } = _loadVersionsList();
    const dispatchSpy = spyOn(store, 'dispatch');

    const { content } = renderForm({ addonId, store });

    changeSelectValue(
      content.find(`.${styles.headVersionSelect}`),
      headVersionId,
    );

    expect(dispatchSpy).toHaveBeenCalledWith(
      versionsActions.setPendingHeadVersionId({ versionId: headVersionId }),
    );
  });

  it('pushes a new URL when submitting the form', () => {
    const baseVersionId = nextUniqueId();
    const headVersionId = nextUniqueId();

    const { addonId, store } = _loadVersionsList({
      versions: [
        { ...fakeListedVersion, id: baseVersionId },
        { ...fakeListedVersion, id: headVersionId },
      ],
    });

    const history = createFakeHistory();

    const { content } = renderForm({
      addonId,
      baseVersionId,
      headVersionId,
      history,
      store,
    });

    submitForm(content);

    expect(history.push).toHaveBeenCalledWith(
      `/${lang}/compare/${addonId}/versions/${baseVersionId}...${headVersionId}/`,
    );
  });

  it('pushes a new URL with a query string when the version has been loaded', () => {
    const baseVersionId = nextUniqueId();
    const headVersionId = nextUniqueId();

    const store = createStoreWithVersion({
      version: { ...fakeVersionWithContent, id: headVersionId },
    });
    const { addonId } = _loadVersionsList({ store });

    store.dispatch(
      versionsActions.setPendingBaseVersionId({ versionId: baseVersionId }),
    );
    store.dispatch(
      versionsActions.setPendingHeadVersionId({ versionId: headVersionId }),
    );

    const history = createFakeHistory();

    const addLocationQueryStringSpy = jest.spyOn(
      VersionChooserBase.prototype,
      'addLocationQueryString',
    );

    const { content, root } = renderForm({
      addonId,
      setBaseVersion: false,
      setHeadVersion: false,
      history,
      store,
    });

    submitForm(content);

    const expectedUrl = `/${lang}/compare/${addonId}/versions/${baseVersionId}...${headVersionId}/`;
    expect(addLocationQueryStringSpy).toHaveBeenCalledWith(expectedUrl);
    expect(history.push).toHaveBeenCalledWith(
      getInstance(root).addLocationQueryString(expectedUrl),
    );
  });

  it('hides the popover after submitting the form', () => {
    const { addonId, store } = _loadVersionsList();
    const dispatchSpy = spyOn(store, 'dispatch');

    const { content } = renderForm({ addonId, store });

    submitForm(content);

    expect(dispatchSpy).toHaveBeenCalledWith(popoverActions.hide(POPOVER_ID));
  });

  it('enables the submit button', () => {
    const { addonId, store } = _loadVersionsList();
    const { content } = renderForm({ addonId, store });

    expect(content.find(`.${styles.submitButton}`)).toHaveProp(
      'disabled',
      false,
    );
  });

  it('disables the submit button when versions are identical', () => {
    const versionId = nextUniqueId();
    const baseVersionId = versionId;
    const headVersionId = versionId;

    const { addonId, store } = _loadVersionsList({
      versions: [{ ...fakeListedVersion, id: versionId }],
    });

    const { content } = renderForm({
      addonId,
      baseVersionId,
      headVersionId,
      store,
    });

    expect(content.find(`.${styles.submitButton}`)).toHaveProp(
      'disabled',
      true,
    );
  });

  it('renders VersionSelect in a loading state before versionsMap has loaded', () => {
    const { content } = renderForm({ addonId: nextUniqueId() });

    expect(content.find(`.${styles.baseVersionSelect}`)).toHaveProp(
      'isLoading',
      true,
    );
    expect(content.find(`.${styles.headVersionSelect}`)).toHaveProp(
      'isLoading',
      true,
    );
  });

  describe('renderBrowseButton', () => {
    const _renderBrowseButton = ({
      versionId = String(nextUniqueId()),
      ...props
    }: { versionId?: string } & RenderParams = {}) => {
      const root = render(props);
      return {
        button: shallow(getInstance(root).renderBrowseButton(versionId)),
        root,
      };
    };

    it('renders a browse button for the base version and head version', () => {
      const baseVersionId = nextUniqueId();
      const headVersionId = nextUniqueId();
      const renderBrowseButton = jest.spyOn(
        VersionChooserBase.prototype,
        'renderBrowseButton',
      );
      const { addonId, store } = _loadVersionsList();

      renderForm({
        addonId,
        baseVersionId,
        headVersionId,
        store,
      });

      expect(renderBrowseButton).toHaveBeenCalledWith(String(baseVersionId));
      expect(renderBrowseButton).toHaveBeenCalledWith(String(headVersionId));
    });

    it('links to a browse page', () => {
      const addonId = nextUniqueId();
      const versionId = String(nextUniqueId());
      const history = createFakeHistory();
      const store = configureStore();
      const dispatchSpy = spyOn(store, 'dispatch');
      const fakeEvent = createFakeEvent();

      const addLocationQueryStringSpy = jest.spyOn(
        VersionChooserBase.prototype,
        'addLocationQueryString',
      );

      const { button, root } = _renderBrowseButton({
        addonId,
        history,
        store,
        versionId,
      });

      const expectedHref = `/${process.env.REACT_APP_DEFAULT_API_LANG}/browse/${addonId}/versions/${versionId}/`;
      expect(addLocationQueryStringSpy).toHaveBeenCalledWith(expectedHref);

      expect(button).toHaveProp('disabled', false);
      expect(button).toHaveProp(
        'href',
        getInstance(root).addLocationQueryString(expectedHref),
      );

      button.simulate('click', fakeEvent);

      expect(history.push).toHaveBeenCalledWith(
        getInstance(root).addLocationQueryString(expectedHref),
      );
      expect(fakeEvent.preventDefault).toHaveBeenCalled();
      expect(fakeEvent.stopPropagation).toHaveBeenCalled();
      expect(dispatchSpy).toHaveBeenCalledWith(popoverActions.hide(POPOVER_ID));
    });

    it('renders a disabled button when the version ID is empty', () => {
      const history = createFakeHistory();
      const { button } = _renderBrowseButton({ history, versionId: '' });

      expect(button).toHaveProp('disabled', true);
      expect(button).toHaveProp('href', undefined);

      button.simulate('click', createFakeEvent());
      expect(history.push).not.toHaveBeenCalled();
    });
  });

  describe('higherVersionsThan', () => {
    const versionId = '2';

    it('returns a function that returns `true` when given version has an ID higher than a pre-configured version ID', () => {
      const version = createInternalVersionsListItem({
        ...fakeVersionsListItem,
        id: 3,
      });

      expect(higherVersionsThan(versionId)(version)).toEqual(true);
    });

    it('returns a function that returns `false` when given version has an ID higher than a pre-configured version ID', () => {
      const version = createInternalVersionsListItem({
        ...fakeVersionsListItem,
        id: 1,
      });

      expect(higherVersionsThan(versionId)(version)).toEqual(false);
    });

    it('returns a function that returns `false` when given version has an ID equals to a pre-configured version ID', () => {
      const version = createInternalVersionsListItem({
        ...fakeVersionsListItem,
        id: parseInt(versionId, 10),
      });

      expect(higherVersionsThan(versionId)(version)).toEqual(false);
    });
  });

  describe('lowerVersionsThan', () => {
    const versionId = '2';

    it('returns a function that returns `false` when given version has an ID lower than a pre-configured version ID', () => {
      const version = createInternalVersionsListItem({
        ...fakeVersionsListItem,
        id: 3,
      });

      expect(lowerVersionsThan(versionId)(version)).toEqual(false);
    });

    it('returns a function that returns `true` when given version has an ID lower than a pre-configured version ID', () => {
      const version = createInternalVersionsListItem({
        ...fakeVersionsListItem,
        id: 1,
      });

      expect(lowerVersionsThan(versionId)(version)).toEqual(true);
    });

    it('returns a function that returns `false` when given version has an ID equals to a pre-configured version ID', () => {
      const version = createInternalVersionsListItem({
        ...fakeVersionsListItem,
        id: parseInt(versionId, 10),
      });

      expect(lowerVersionsThan(versionId)(version)).toEqual(false);
    });
  });

  describe('addLocationQueryString', () => {
    it('adds the location query string', () => {
      const location = createFakeLocation({
        searchQuery: {
          [pathQueryParam]: 'manifest.json',
        },
      });
      const root = render({ history: createFakeHistory({ location }) });

      const url = 'any/path/';
      expect(getInstance(root).addLocationQueryString(url)).toEqual(
        `${url}${location.search}`,
      );
    });

    it('handles an empty location query string', () => {
      const root = render();

      const url = 'any/path/';
      expect(getInstance(root).addLocationQueryString(url)).toEqual(url);
    });

    it('does not support URLs with existing query strings', () => {
      const root = render();

      expect(() => {
        getInstance(root).addLocationQueryString('/some/path/?existing=query');
      }).toThrow(/must end in a trailing slash/);
    });
  });
});
