import * as React from 'react';
import { Store } from 'redux';
import { History } from 'history';

import configureStore from '../../configureStore';
import VersionSelect from '../VersionSelect';
import {
  ExternalVersionsList,
  ExternalVersionsListItem,
  actions as versionActions,
} from '../../reducers/versions';
import {
  createContextWithFakeRouter,
  createFakeHistory,
  createFakeThunk,
  createStoreWithVersion,
  fakeVersion,
  fakeVersionFile,
  fakeVersionsList,
  fakeVersionsListItem,
  nextUniqueId,
  shallowUntilTarget,
  spyOn,
} from '../../test-helpers';
import styles from './styles.module.scss';

import VersionChooser, {
  DefaultProps,
  PropsFromRouter,
  PublicProps,
  VersionChooserBase,
  higherVersionsThan,
  lowerVersionsThan,
} from '.';

describe(__filename, () => {
  const lang = 'en-US';

  const fakeListedVersion: ExternalVersionsListItem = {
    ...fakeVersionsListItem,
    channel: 'listed',
  };

  const fakeUnlistedVersion: ExternalVersionsListItem = {
    ...fakeVersionsListItem,
    channel: 'unlisted',
  };

  type RenderParams = Partial<PublicProps> &
    Partial<PropsFromRouter> &
    Partial<DefaultProps> & {
      store?: Store;
      history?: History;
    };

  const render = ({
    _fetchVersionsList,
    _higherVersionsThan,
    _lowerVersionsThan,
    addonId = 123,
    baseVersionId = nextUniqueId(),
    headVersionId = nextUniqueId(),
    history = createFakeHistory(),
    store = configureStore(),
  }: {
    baseVersionId?: number;
    headVersionId?: number;
  } & RenderParams = {}) => {
    store.dispatch(
      versionActions.setCurrentBaseVersionId({
        versionId: baseVersionId,
      }),
    );
    store.dispatch(
      versionActions.setCurrentVersionId({
        versionId: headVersionId,
      }),
    );
    const contextWithRouter = createContextWithFakeRouter({
      history,
      match: { params: { lang } },
    });
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

  const _loadVersionsList = (
    store: Store,
    addonId: number,
    versions: ExternalVersionsList,
  ) => {
    store.dispatch(versionActions.loadVersionsList({ addonId, versions }));
  };

  it('sets the `isLoading` prop to `true`  when lists of versions are not loaded', () => {
    const root = render();

    expect(root.find(VersionSelect)).toHaveLength(2);
    expect(root.find(VersionSelect).at(0)).toHaveProp('isLoading', true);
    expect(root.find(VersionSelect).at(1)).toHaveProp('isLoading', true);
  });

  it('renders two VersionSelect components when lists of versions are loaded', () => {
    const addonId = 999;
    const store = configureStore();
    _loadVersionsList(store, addonId, fakeVersionsList);

    const root = render({ addonId, store });

    expect(root.find(VersionSelect)).toHaveLength(2);
    expect(root.find(VersionSelect).at(0)).toHaveProp('label', 'Old version');
    expect(root.find(VersionSelect).at(1)).toHaveProp('label', 'New version');
    expect(root.find(VersionSelect).at(1)).toHaveProp('withLeftArrow', true);
  });

  it('passes a `isSelectable` function to each VersionSelect', () => {
    const addonId = nextUniqueId();
    const baseVersionId = nextUniqueId();
    const headVersionId = nextUniqueId();
    const _higherVersionsThan = jest
      .fn()
      .mockReturnValue('_higherVersionsThan');
    const _lowerVersionsThan = jest.fn().mockReturnValue('_lowerVersionsThan');

    const versions: ExternalVersionsList = [fakeListedVersion];

    const store = configureStore();
    _loadVersionsList(store, addonId, versions);

    const root = render({
      _higherVersionsThan,
      _lowerVersionsThan,
      addonId,
      baseVersionId,
      headVersionId,
      store,
    });

    const oldVersionSelect = root.find(`.${styles.baseVersionSelect}`);
    expect(oldVersionSelect).toHaveProp('isSelectable', _lowerVersionsThan());
    expect(_lowerVersionsThan).toHaveBeenCalledWith(String(headVersionId));

    const newVersionSelect = root.find(`.${styles.headVersionSelect}`);
    expect(newVersionSelect).toHaveProp('isSelectable', _higherVersionsThan());
    expect(_higherVersionsThan).toHaveBeenCalledWith(String(baseVersionId));
  });

  it('splits the list of versions into listed and unlisted lists', () => {
    const addonId = 999;
    const listedVersions: ExternalVersionsList = [
      { ...fakeListedVersion, id: 2 },
    ];
    const unlistedVersions: ExternalVersionsList = [
      { ...fakeUnlistedVersion, id: 3 },
    ];

    const store = configureStore();
    _loadVersionsList(store, addonId, [...listedVersions, ...unlistedVersions]);

    const root = render({ addonId, store });

    root.find(VersionSelect).forEach((versionSelect) => {
      expect(versionSelect).toHaveProp('listedVersions', listedVersions);
      expect(versionSelect).toHaveProp('unlistedVersions', unlistedVersions);
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
    const addonId = 888;
    const store = configureStore();
    _loadVersionsList(store, addonId, []);

    const dispatch = spyOn(store, 'dispatch');
    const fakeThunk = createFakeThunk();

    render({
      _fetchVersionsList: fakeThunk.createThunk,
      addonId,
      store,
    });

    expect(dispatch).not.toHaveBeenCalledWith(fakeThunk.thunk);
  });

  it('dispatches fetchVersionsList() on mount when a different addonId is passed', () => {
    const addonId = 888;
    const store = configureStore();
    _loadVersionsList(store, addonId, []);

    const dispatch = spyOn(store, 'dispatch');
    const fakeThunk = createFakeThunk();
    const _fetchVersionsList = fakeThunk.createThunk;

    const secondAddonId = addonId + 123;

    render({ _fetchVersionsList, addonId: secondAddonId, store });

    expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_fetchVersionsList).toHaveBeenCalledWith({ addonId: secondAddonId });
  });

  it('pushes a new URL when the old version changes', () => {
    const addonId = nextUniqueId();
    const baseVersionId = nextUniqueId();
    const headVersionId = nextUniqueId();

    const store = configureStore();
    _loadVersionsList(store, addonId, fakeVersionsList);

    const history = createFakeHistory();
    const selectedVersion = String(nextUniqueId());

    const root = render({
      addonId,
      baseVersionId,
      headVersionId,
      history,
      store,
    });

    const onChange = root
      // Retrieve the `VersionSelect` component with this `className`.
      .find({ className: styles.baseVersionSelect })
      .prop('onChange');
    onChange(selectedVersion);

    expect(history.push).toHaveBeenCalledWith(
      `/${lang}/compare/${addonId}/versions/${selectedVersion}...${headVersionId}/`,
    );
  });

  it('pushes a new URL when the new version changes', () => {
    const addonId = nextUniqueId();
    const baseVersionId = nextUniqueId();
    const headVersionId = nextUniqueId();

    const store = configureStore();
    _loadVersionsList(store, addonId, fakeVersionsList);

    const history = createFakeHistory();
    const selectedVersion = String(nextUniqueId());

    const root = render({
      addonId,
      baseVersionId,
      headVersionId,
      history,
      store,
    });

    const onChange = root
      .find({ className: styles.headVersionSelect })
      .prop('onChange');
    onChange(selectedVersion);

    expect(history.push).toHaveBeenCalledWith(
      `/${lang}/compare/${addonId}/versions/${baseVersionId}...${selectedVersion}/`,
    );
  });

  it('pushes a new URL with a query string when the version has been loaded', () => {
    const addonId = nextUniqueId();
    const baseVersionId = nextUniqueId();
    const headVersionId = nextUniqueId();
    const selectedFile = 'example.js';

    const store = createStoreWithVersion({
      version: {
        ...fakeVersion,
        id: headVersionId,
        // eslint-disable-next-line @typescript-eslint/camelcase
        file: { ...fakeVersionFile, selected_file: selectedFile },
      },
    });
    _loadVersionsList(store, addonId, fakeVersionsList);

    const history = createFakeHistory();

    const root = render({
      addonId,
      baseVersionId,
      headVersionId,
      history,
      store,
    });

    const onChange = root
      .find({ className: styles.headVersionSelect })
      .prop('onChange');
    onChange(headVersionId);

    expect(history.push).toHaveBeenCalledWith(
      `/${lang}/compare/${addonId}/versions/${baseVersionId}...${headVersionId}/?path=${selectedFile}`,
    );
  });

  it('dispatches setCurrentBaseVersionId() when the old version changes', () => {
    const addonId = nextUniqueId();
    const baseVersionId = nextUniqueId();
    const headVersionId = nextUniqueId();

    const store = configureStore();
    _loadVersionsList(store, addonId, fakeVersionsList);
    const dispatchSpy = spyOn(store, 'dispatch');

    const selectedVersion = String(nextUniqueId());

    const root = render({
      addonId,
      baseVersionId,
      headVersionId,
      store,
    });

    const onChange = root
      // Retrieve the `VersionSelect` component with this `className`.
      .find({ className: styles.baseVersionSelect })
      .prop('onChange');
    onChange(selectedVersion);

    expect(dispatchSpy).toHaveBeenCalledWith(
      versionActions.setCurrentBaseVersionId({
        versionId: parseInt(selectedVersion, 10),
      }),
    );
  });

  describe('higherVersionsThan', () => {
    const versionId = '2';

    it('returns a function that returns `true` when given version has an ID higher than a pre-configured version ID', () => {
      const version = {
        ...fakeVersionsListItem,
        id: 3,
      };

      expect(higherVersionsThan(versionId)(version)).toEqual(true);
    });

    it('returns a function that returns `false` when given version has an ID higher than a pre-configured version ID', () => {
      const version = {
        ...fakeVersionsListItem,
        id: 1,
      };

      expect(higherVersionsThan(versionId)(version)).toEqual(false);
    });

    it('returns a function that returns `false` when given version has an ID equals to a pre-configured version ID', () => {
      const version = {
        ...fakeVersionsListItem,
        id: parseInt(versionId, 10),
      };

      expect(higherVersionsThan(versionId)(version)).toEqual(false);
    });
  });

  describe('lowerVersionsThan', () => {
    const versionId = '2';

    it('returns a function that returns `false` when given version has an ID lower than a pre-configured version ID', () => {
      const version = {
        ...fakeVersionsListItem,
        id: 3,
      };

      expect(lowerVersionsThan(versionId)(version)).toEqual(false);
    });

    it('returns a function that returns `true` when given version has an ID lower than a pre-configured version ID', () => {
      const version = {
        ...fakeVersionsListItem,
        id: 1,
      };

      expect(lowerVersionsThan(versionId)(version)).toEqual(true);
    });

    it('returns a function that returns `false` when given version has an ID equals to a pre-configured version ID', () => {
      const version = {
        ...fakeVersionsListItem,
        id: parseInt(versionId, 10),
      };

      expect(lowerVersionsThan(versionId)(version)).toEqual(false);
    });
  });
});
