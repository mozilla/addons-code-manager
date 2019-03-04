import * as React from 'react';
import { Store } from 'redux';

import configureStore from '../../configureStore';
import VersionSelect from '../VersionSelect';
import Loading from '../Loading';
import {
  ExternalVersionsList,
  actions as versionActions,
} from '../../reducers/versions';
import {
  createFakeThunk,
  fakeVersionsList,
  shallowUntilTarget,
  spyOn,
} from '../../test-helpers';

import VersionChooser, { VersionChooserBase, PublicProps } from '.';

describe(__filename, () => {
  type RenderParams = Partial<PublicProps> & { store?: Store };

  const render = ({
    _fetchVersionsList,
    addonId = 123,
    store = configureStore(),
  }: RenderParams = {}) => {
    const props = { addonId, _fetchVersionsList };

    return shallowUntilTarget(
      <VersionChooser {...props} />,
      VersionChooserBase,
      {
        shallowOptions: {
          context: { store },
        },
      },
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

    const root = render({ addonId, store });

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
        ...fakeVersionsList[0],
        channel: 'listed',
      },
    ];
    const unlistedVersions: ExternalVersionsList = [
      {
        ...fakeVersionsList[1],
        channel: 'unlisted',
      },
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

    render({ _fetchVersionsList: fakeThunk.createThunk, addonId, store });

    expect(dispatch).not.toHaveBeenCalled();
  });
});
