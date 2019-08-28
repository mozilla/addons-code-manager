import reducer, {
  CommentInfo,
  actions,
  createCommentKey,
  createEmptyCommentInfo,
  createInternalComment,
} from './comments';
import { createInternalVersion } from './versions';
import { createFakeExternalComment, fakeVersion } from '../test-helpers';

describe(__filename, () => {
  const createCommentInfo = (info: Partial<CommentInfo> = {}): CommentInfo => {
    return {
      ...createEmptyCommentInfo(),
      ...info,
    };
  };

  describe('beginComment', () => {
    it('begins a comment by key', () => {
      const fileName = 'manifest.json';
      const line = 123;
      const versionId = 1;

      const state = reducer(
        undefined,
        actions.beginComment({ versionId, fileName, line }),
      );

      expect(
        state.byKey[createCommentKey({ versionId, fileName, line })],
      ).toEqual(createCommentInfo({ beginNewComment: true }));
    });
  });

  describe('finishComment', () => {
    it('finishes a comment by key', () => {
      const fileName = 'manifest.json';
      const line = 123;
      const versionId = 1;

      const state = reducer(
        undefined,
        actions.finishComment({ fileName, line, versionId }),
      );

      expect(
        state.byKey[createCommentKey({ versionId, fileName, line })],
      ).toEqual(createCommentInfo({ beginNewComment: false }));
    });
  });

  describe('setComment', () => {
    it('sets a comment for a key', () => {
      const comment = createFakeExternalComment({ id: 54321 });
      const versionId = 1;
      const line = 123;
      const fileName = 'manifest.json';

      const state = reducer(
        undefined,
        actions.setComment({ comment, fileName, line, versionId }),
      );

      expect(state.byId[comment.id]).toEqual(createInternalComment(comment));

      expect(
        state.byKey[createCommentKey({ fileName, line, versionId })],
      ).toMatchObject({
        commentIds: [comment.id],
      });
    });

    it('adds a comment to a key', () => {
      const comment1 = createFakeExternalComment({ id: 1 });
      const comment2 = createFakeExternalComment({ id: 2 });

      const versionId = 1;
      const line = 123;
      const fileName = 'manifest.json';

      let state;
      state = reducer(
        state,
        actions.setComment({ comment: comment1, fileName, line, versionId }),
      );
      state = reducer(
        state,
        actions.setComment({ comment: comment2, fileName, line, versionId }),
      );

      expect(
        state.byKey[createCommentKey({ fileName, line, versionId })],
      ).toMatchObject({
        commentIds: [comment1.id, comment2.id],
      });

      expect(state.byId[comment1.id]).toEqual(createInternalComment(comment1));
      expect(state.byId[comment2.id]).toEqual(createInternalComment(comment2));
    });
  });

  describe('createCommentKey', () => {
    it('creates a key from versionId, fileName, line', () => {
      const versionId = 1;
      const fileName = 'manifest.json';
      const line = 321;

      expect(createCommentKey({ versionId, fileName, line })).toEqual(
        `version:${versionId};file:${fileName};line:${line}`,
      );
    });

    it('creates a key from versionId, fileName', () => {
      const versionId = 1;
      const fileName = 'manifest.json';

      expect(createCommentKey({ versionId, fileName, line: null })).toEqual(
        `version:${versionId};file:${fileName}`,
      );
    });

    it('creates a key from versionId', () => {
      const versionId = 1;

      expect(
        createCommentKey({ versionId, fileName: null, line: null }),
      ).toEqual(`version:${versionId}`);
    });

    it('cannot create a key from just versionId and line', () => {
      expect(() =>
        createCommentKey({ versionId: 1, fileName: null, line: 2 }),
      ).toThrow(/Cannot create key/);
    });
  });

  describe('createInternalComment', () => {
    it('creates a comment', () => {
      const comment = 'Example comment';
      const id = 1;
      const lineno = 321;
      const filename = 'manifest.json';
      const userId = 1;
      const userName = 'Toni';
      const userUrl = 'https://domain/user';
      const userUsername = 'some_user';
      const version = fakeVersion;

      expect(
        createInternalComment({
          comment,
          id,
          lineno,
          filename,
          user: {
            id: userId,
            name: userName,
            url: userUrl,
            username: userUsername,
          },
          version,
        }),
      ).toEqual({
        content: comment,
        id,
        lineno,
        filename,
        userId,
        userName,
        userUrl,
        userUsername,
        version: createInternalVersion(version),
      });
    });
  });
});
