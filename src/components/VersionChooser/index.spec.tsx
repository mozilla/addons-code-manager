import * as React from 'react';
import { Store } from 'redux';
import { History } from 'history';

import configureStore from '../../configureStore';
import VersionSelect from '../VersionSelect';
import Loading from '../Loading';
import {
  ExternalVersionsList,
  actions as versionActions,
} from '../../reducers/versions';
import {
  createContextWithFakeRouter,
  createFakeHistory,
  createFakeThunk,
  fakeVersionsList,
  fakeVersionsListItem,
  shallowUntilTarget,
  spyOn,
} from '../../test-helpers';
import styles from './styles.module.scss';

import VersionChooser, {
  DefaultProps,
  PropsFromRouter,
  PublicProps,
  VersionChooserBase,
} from '.';

describe(__filename, () => {
  const lang = 'en-US';

  type RenderParams = Partial<PublicProps> &
    Partial<PropsFromRouter> &
    Partial<DefaultProps> & {
      store?: Store;
      history?: History;
    };

  const render = ({
    _fetchVersionsList,
    addonId = '123',
    baseVersionId = '1',
    headVersionId = '2',
    history = createFakeHistory(),
    store = configureStore(),
  }: RenderParams = {}) => {
    const contextWithRouter = createContextWithFakeRouter({
      history,
      match: {
        params: {
          addonId,
          baseVersionId,
          headVersionId,
          lang,
        },
      },
    });
    const context = {
      ...contextWithRouter,
      context: {
        ...contextWithRouter.context,
        store,
      },
    };

    const props = { addonId: parseInt(addonId, 10), _fetchVersionsList };

    return shallowUntilTarget(
      <VersionChooser {...props} />,
      VersionChooserBase,
      { shallowOptions: { ...context } },
    );
  };

  const _loadVersionsList = (
    store: Store,
    addonId: number,
    versions: ExternalVersionsList,
  ) => {
    store.dispatch(versionActions.loadVersionsList({ addonId, versions }));
  };

  it('renders a loading message when lists of versions are not loaded', () => {
    const root = render();

    expect(root.find(VersionSelect)).toHaveLength(0);
    expect(root.find(Loading)).toHaveLength(1);
  });

  it('renders two VersionSelect components when lists of versions are loaded', () => {
    const addonId = 999;
    const store = configureStore();
    _loadVersionsList(store, addonId, fakeVersionsList);

    const root = render({ addonId: String(addonId), store });

    expect(root.find(VersionSelect)).toHaveLength(2);
    expect(root.find(VersionSelect).at(0)).toHaveProp(
      'label',
      'Choose an old version',
    );
    expect(root.find(VersionSelect).at(1)).toHaveProp(
      'label',
      'Choose a new version',
    );
    expect(root.find(VersionSelect).at(1)).toHaveProp('withLeftArrow', true);
  });

  it('splits the list of versions into listed and unlisted lists', () => {
    const addonId = 999;
    const listedVersions: ExternalVersionsList = [
      {
        ...fakeVersionsListItem,
        id: 1,
        channel: 'listed',
      },
    ];
    const unlistedVersions: ExternalVersionsList = [
      {
        ...fakeVersionsListItem,
        id: 2,
        channel: 'unlisted',
      },
    ];

    const store = configureStore();
    _loadVersionsList(store, addonId, [...listedVersions, ...unlistedVersions]);

    const root = render({ addonId: String(addonId), store });

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

    render({ _fetchVersionsList, addonId: String(addonId), store });

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
      addonId: String(addonId),
      store,
    });

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('dispatches fetchVersionsList() on mount when a different addonId is passed', () => {
    const addonId = 888;
    const store = configureStore();
    _loadVersionsList(store, addonId, []);

    const dispatch = spyOn(store, 'dispatch');
    const fakeThunk = createFakeThunk();
    const _fetchVersionsList = fakeThunk.createThunk;

    const secondAddonId = addonId + 123;

    render({ _fetchVersionsList, addonId: String(secondAddonId), store });

    expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
    expect(_fetchVersionsList).toHaveBeenCalledWith({ addonId: secondAddonId });
  });

  it('pushes a new URL when the old version changes', () => {
    const addonId = '999';
    const baseVersionId = '3';
    const headVersionId = '4';

    const store = configureStore();
    _loadVersionsList(store, parseInt(addonId, 10), fakeVersionsList);

    const history = createFakeHistory();
    const selectedVersion = '2';

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
    const addonId = '999';
    const baseVersionId = '3';
    const headVersionId = '4';

    const store = configureStore();
    _loadVersionsList(store, parseInt(addonId, 10), fakeVersionsList);

    const history = createFakeHistory();
    const selectedVersion = '5';

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

  it('ensures the order of the versions is respected (old < new version)', () => {
    const addonId = '999';
    const baseVersionId = '4';
    const headVersionId = '5';

    const store = configureStore();
    _loadVersionsList(store, parseInt(addonId, 10), fakeVersionsList);

    const history = createFakeHistory();
    const selectedVersion = '3'; // The value is lower than `baseVersionId`

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
      `/${lang}/compare/${addonId}/versions/${selectedVersion}...${baseVersionId}/`,
    );
  });
});
