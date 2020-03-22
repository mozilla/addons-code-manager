/* eslint-disable @typescript-eslint/camelcase */
import { ShallowWrapper } from 'enzyme';
import React from 'react';
import { Store } from 'redux';

import configureStore, { ConnectedReduxProps } from '../../configureStore';
import CommentSummaryButton from '../CommentSummaryButton';
import LoginButton from '../LoginButton';
import VersionChooser from '../VersionChooser';
import styles from './styles.module.scss';
import {
  createFakeExternalComment,
  createFakeThunk,
  createStoreWithVersion,
  createStoreWithVersionComments,
  dispatchLoadVersionInfo,
  fakeExternalDiff,
  fakeUser,
  fakeVersion,
  fakeVersionAddon,
  fakeVersionEntry,
  fakeVersionFile,
  nextUniqueId,
  shallowUntilTarget,
  spyOn,
} from '../../test-helpers';
import { actions as userActions } from '../../reducers/users';
import { actions as versionsActions } from '../../reducers/versions';

import Navbar, { NavbarBase, PublicProps, mapStateToProps } from '.';

describe(__filename, () => {
  type RenderParams = Partial<PublicProps> &
    Partial<ConnectedReduxProps> & { store?: Store };

  const render = ({
    store = configureStore(),
    ...moreProps
  }: RenderParams = {}) => {
    const props = {
      _fetchVersion: jest.fn(),
      _requestLogOut: jest.fn(),
      ...moreProps,
    };

    return shallowUntilTarget(<Navbar {...props} />, NavbarBase, {
      shallowOptions: { context: { store } },
    });
  };

  const storeWithUser = (user = fakeUser) => {
    const store = configureStore();

    store.dispatch(userActions.loadCurrentUser({ user }));
    return store;
  };

  const createStoreWithCurrentVersion = ({
    addonId = nextUniqueId(),
    id = nextUniqueId(),
    versionString = '2.0.0',
  } = {}) => {
    return createStoreWithVersion({
      version: {
        ...fakeVersion,
        id,
        version: versionString,
        addon: { ...fakeVersion.addon, id: addonId },
      },
      makeCurrent: true,
    });
  };

  const _loadVersionFile = ({
    store = configureStore(),
    version = { ...fakeVersion, id: nextUniqueId() },
  }) => {
    store.dispatch(
      versionsActions.loadVersionFile({
        path: version.file.selected_file,
        version,
      }),
    );
  };

  describe('when a version is loaded', () => {
    it('renders addon name', () => {
      const addonName = 'addon name example';
      const store = createStoreWithVersion({
        version: {
          ...fakeVersion,
          addon: { ...fakeVersionAddon, name: { 'en-US': addonName } },
        },
        makeCurrent: true,
      });
      const root = render({ store });

      expect(root.find(`.${styles.addonName}`).text()).toContain(addonName);
    });

    it('renders a link to reviewer tools', () => {
      const reviewersHost = 'https://example.com';
      const slug = 'some-slug';
      const store = createStoreWithVersion({
        version: {
          ...fakeVersion,
          addon: { ...fakeVersionAddon, slug },
        },
        makeCurrent: true,
      });
      const root = render({ reviewersHost, store });

      expect(root.find(`.${styles.reviewerToolsLink}`)).toHaveProp(
        'href',
        `${reviewersHost}/reviewers/review/${slug}`,
      );
    });

    it('renders VersionChooser', () => {
      const addonId = nextUniqueId();
      const store = createStoreWithCurrentVersion({ addonId });
      const root = render({ store });

      const chooser = root.find(VersionChooser);
      expect(chooser).toHaveLength(1);
      expect(chooser).toHaveProp('addonId', addonId);
    });

    describe('with a file loaded', () => {
      it('renders a link to the legacy file viewer in the browse page', () => {
        const reviewersHost = 'https://example.com';
        const path = '/some/file/path/file.js';
        const version = {
          ...fakeVersion,
          file: {
            ...fakeVersionFile,
            entries: {
              ...fakeVersion.file.entries,
              [path]: { ...fakeVersionEntry, filename: path, path },
            },
            selected_file: path,
          },
        };
        const store = createStoreWithVersion({
          version,
          makeCurrent: true,
        });
        _loadVersionFile({ store, version });
        const root = render({ reviewersHost, store });

        expect(root.find(`.${styles.legacyLink}`)).toHaveProp(
          'href',
          `${reviewersHost}/${process.env.REACT_APP_DEFAULT_API_LANG}/firefox/files/browse/${version.file.id}/file/${path}`,
        );
      });

      it('renders a link to the legacy diff viewer in the compare page', () => {
        const reviewersHost = 'https://example.com';
        const path = '/some/file/path/file.js';
        const baseFileId = nextUniqueId();
        const baseVersionId = nextUniqueId();
        const headVersionId = baseVersionId + 1;
        const version = {
          ...fakeVersion,
          id: headVersionId,
          file: {
            ...fakeVersionFile,
            base_file: {
              id: baseFileId,
            },
            diff: fakeExternalDiff,
            entries: {
              ...fakeVersion.file.entries,
              [path]: { ...fakeVersionEntry, filename: path, path },
            },
            selected_file: path,
          },
        };

        const store = createStoreWithVersion({
          version,
          makeCurrent: true,
        });
        dispatchLoadVersionInfo({
          store,
          version: { ...version, id: baseVersionId },
        });
        _loadVersionFile({ store, version });
        store.dispatch(
          versionsActions.loadDiff({
            addonId: version.addon.id,
            baseVersionId,
            headVersionId,
            path,
            version,
          }),
        );
        store.dispatch(
          versionsActions.setCurrentBaseVersionId({
            versionId: baseVersionId,
          }),
        );

        const root = render({ reviewersHost, store });

        expect(root.find(`.${styles.legacyLink}`)).toHaveProp(
          'href',
          `${reviewersHost}/${process.env.REACT_APP_DEFAULT_API_LANG}/firefox/files/compare/${version.file.id}...${baseFileId}/file/${path}`,
        );
      });
    });

    describe('without a file loaded', () => {
      it('does not render a link to the legacy file viewer', () => {
        const reviewersHost = 'https://example.com';
        const store = createStoreWithVersion({
          version: fakeVersion,
          makeCurrent: true,
        });
        const root = render({ reviewersHost, store });

        expect(root.find(`.${styles.legacyLink}`)).toHaveLength(0);
      });
    });
  });

  describe('when version is undefined', () => {
    it('does not render addon name', () => {
      const root = render();

      expect(root.find(`.${styles.addonName}`)).toHaveLength(0);
    });

    it('does not render a link to reviewer tools', () => {
      const root = render();

      expect(root.find(`.${styles.reviewerToolsLink}`)).toHaveLength(0);
    });

    it('does not render VersionChooser', () => {
      const root = render();

      expect(root.find(VersionChooser)).toHaveLength(0);
    });

    it('does not render a link to the legacy file viewer', () => {
      const root = render();

      expect(root.find(`.${styles.legacyLink}`)).toHaveLength(0);
    });
  });

  describe('when a user is provided', () => {
    it('renders a username', () => {
      const name = 'Bob';
      const store = storeWithUser({ ...fakeUser, name });
      const root = render({ store });

      expect(root.find(`.${styles.username}`)).toHaveText(name);
    });

    it('renders a log out button', () => {
      const root = render({ store: storeWithUser() });

      expect(root.find(`.${styles.logOut}`)).toHaveLength(1);
    });

    it('does not render a log in button', () => {
      const root = render({ store: storeWithUser() });

      expect(root.find(LoginButton)).toHaveLength(0);
    });
  });

  describe('when user is null', () => {
    it('does not render a username', () => {
      const root = render();

      expect(root.find(`.${styles.username}`)).toHaveLength(0);
    });

    it('renders a log in button', () => {
      const root = render();

      expect(root.find(LoginButton)).toHaveLength(1);
    });

    it('does not render a log out button', () => {
      const root = render();

      expect(root.find(`.${styles.logOut}`)).toHaveLength(0);
    });
  });

  describe('Log out button', () => {
    it('dispatches requestLogOut when clicked', () => {
      const store = storeWithUser();
      const dispatch = spyOn(store, 'dispatch');

      const fakeThunk = createFakeThunk();
      const root = render({
        store,
        _requestLogOut: fakeThunk.createThunk,
      });

      root.find(`.${styles.logOut}`).simulate('click');
      expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
    });
  });

  describe('comments', () => {
    it('does not render a comment nav for undefined comments', () => {
      const root = render();

      expect(root.find(`.${styles.commentCount}`)).toHaveLength(0);
      expect(root.find(CommentSummaryButton)).toHaveLength(0);
    });

    it('does not render a comment nav for zero comments', () => {
      const root = render({
        store: createStoreWithVersionComments({ comments: [] }),
      });

      expect(root.find(`.${styles.commentCount}`)).toHaveLength(0);
      expect(root.find(CommentSummaryButton)).toHaveLength(0);
    });

    it('renders a comment count', () => {
      const comments = [
        createFakeExternalComment({ comment: 'first' }),
        createFakeExternalComment({ comment: 'second' }),
      ];
      const root = render({
        store: createStoreWithVersionComments({ comments }),
      });

      const count = root.find(`.${styles.commentCount}`);
      expect(count).toHaveLength(1);
      expect(count).toHaveText(String(comments.length));
    });

    it('renders CommentSummaryButton', () => {
      const root = render({
        store: createStoreWithVersionComments({
          comments: [createFakeExternalComment()],
        }),
      });

      expect(root.find(CommentSummaryButton)).toHaveLength(1);
    });
  });

  describe('loading data', () => {
    const renderForFetching = ({
      store = configureStore(),
      ...moreProps
    }: RenderParams = {}) => {
      const dispatch = spyOn(store, 'dispatch');
      const fakeThunk = createFakeThunk();
      const _fetchVersion = fakeThunk.createThunk;

      const props = { _fetchVersion, store, ...moreProps };
      const root = render(props);

      return {
        _fetchVersion,
        _fetchVersionThunk: fakeThunk.thunk,
        dispatch,
        root,
      };
    };

    it('loads data on mount', () => {
      const loadData = jest.spyOn(NavbarBase.prototype, 'loadData');

      renderForFetching();

      expect(loadData).toHaveBeenCalled();
    });

    it('loads data on update', () => {
      const loadData = jest.spyOn(NavbarBase.prototype, 'loadData');

      const { root } = renderForFetching();
      loadData.mockClear();

      root.setProps({});

      expect(loadData).toHaveBeenCalled();
    });

    it('fetches the base version when it has an ID and a current version', () => {
      const addonId = nextUniqueId();
      const store = createStoreWithCurrentVersion({ addonId });

      const currentBaseVersionId = nextUniqueId();
      store.dispatch(
        versionsActions.setCurrentBaseVersionId({
          versionId: currentBaseVersionId,
        }),
      );

      const { _fetchVersion, _fetchVersionThunk, dispatch } = renderForFetching(
        {
          store,
        },
      );

      expect(dispatch).toHaveBeenCalledWith(_fetchVersionThunk);
      expect(_fetchVersion).toHaveBeenCalledWith({
        addonId,
        path: undefined,
        setAsCurrent: false,
        versionId: currentBaseVersionId,
      });
    });

    it('does not fetch the base version without a current version', () => {
      const store = createStoreWithVersion({ makeCurrent: false });
      const { _fetchVersionThunk, dispatch } = renderForFetching({ store });

      expect(dispatch).not.toHaveBeenCalledWith(_fetchVersionThunk);
    });

    it('does not fetch the base version without an ID', () => {
      const store = createStoreWithVersion({ makeCurrent: true });
      const { _fetchVersionThunk, dispatch } = renderForFetching({ store });

      expect(dispatch).not.toHaveBeenCalledWith(_fetchVersionThunk);
    });

    it('does not fetch the base version when it already exists', () => {
      const store = createStoreWithVersion({ makeCurrent: true });

      const currentBaseVersionId = nextUniqueId();
      dispatchLoadVersionInfo({
        store,
        version: { ...fakeVersion, id: currentBaseVersionId },
      });
      store.dispatch(
        versionsActions.setCurrentBaseVersionId({
          versionId: currentBaseVersionId,
        }),
      );
      const { _fetchVersionThunk, dispatch } = renderForFetching({ store });

      expect(dispatch).not.toHaveBeenCalledWith(_fetchVersionThunk);
    });

    it('does not fetch the base version when there was an error fetching it', () => {
      const store = createStoreWithVersion({ makeCurrent: true });

      const currentBaseVersionId = nextUniqueId();
      store.dispatch(
        versionsActions.setCurrentBaseVersionId({
          versionId: currentBaseVersionId,
        }),
      );
      // Simulate a failed fetch.
      store.dispatch(
        versionsActions.abortFetchVersion({ versionId: currentBaseVersionId }),
      );
      const { _fetchVersionThunk, dispatch } = renderForFetching({ store });

      expect(dispatch).not.toHaveBeenCalledWith(_fetchVersionThunk);
    });
  });

  describe('version indicators', () => {
    const dispatchBaseVersion = ({
      store,
      id = nextUniqueId(),
      versionString = '1.0.0',
    }: {
      store: Store;
      id?: number;
      versionString?: string;
    }) => {
      const baseVersion = { ...fakeVersion, id, version: versionString };
      dispatchLoadVersionInfo({ store, version: baseVersion });
      store.dispatch(
        versionsActions.setCurrentBaseVersionId({ versionId: baseVersion.id }),
      );
    };

    const simulateUpdate = ({
      root,
      store,
    }: {
      root: ShallowWrapper;
      store: Store;
    }) => {
      root.setProps({
        dispatch: jest.fn(),
        ...mapStateToProps(store.getState()),
      });
    };

    it('does not render version indicators without any versions', () => {
      const root = render({ store: configureStore() });

      expect(root.find(`.${styles.versionIndicator}`)).toHaveLength(0);
    });

    it('renders a current version indicator', () => {
      const current = '1.0.0';
      const root = render({
        store: createStoreWithCurrentVersion({ versionString: current }),
      });

      const info = root.find(`.${styles.versionIndicator}`);
      expect(info).toHaveText(current);
    });

    it('renders a base to current range indicator', () => {
      const base = '1.0.0';
      const current = '2.0.0';

      const store = createStoreWithCurrentVersion({ versionString: current });
      dispatchBaseVersion({ store, versionString: base });

      const root = render({ store });

      const info = root.find(`.${styles.versionIndicator}`);
      expect(info).toHaveText(`${base}…${current}`);
      expect(info.find(`.${styles.baseVersionIsLoading}`)).toHaveLength(0);
    });

    it('renders an imprint of the last base version while loading the next one', () => {
      const base = '1.0.0';
      const current = '3.0.0';

      const store = createStoreWithCurrentVersion({ versionString: current });
      dispatchBaseVersion({ store, versionString: base });

      const root = render({ store });

      // Simulate loading the next base version.
      store.dispatch(
        versionsActions.setCurrentBaseVersionId({ versionId: nextUniqueId() }),
      );

      simulateUpdate({ root, store });

      const info = root.find(`.${styles.versionIndicator}`);
      expect(info).toHaveText(`${base}…${current}`);
      expect(info.find(`.${styles.baseVersionIsLoading}`)).toHaveLength(1);
    });

    it('does not render a base version imprint when the base version has been unset', () => {
      const current = '3.0.0';

      const store = createStoreWithCurrentVersion({ versionString: current });
      dispatchBaseVersion({ store });

      const root = render({ store });

      // Unset the base version.
      store.dispatch(versionsActions.unsetCurrentBaseVersionId());

      simulateUpdate({ root, store });

      const info = root.find(`.${styles.versionIndicator}`);
      expect(info).toHaveText(`${current}`);
    });
  });
});
