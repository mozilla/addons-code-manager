import { getLocalizedString } from './utils';

describe(__filename, () => {
  describe('getLocalizedString', () => {
    it('returns a localized string for a given language', () => {
      const lang = 'fr';
      const value = 'un peu de contenu';
      const localizedStringMap = {
        [lang]: value,
      };

      expect(getLocalizedString(localizedStringMap, lang)).toEqual(value);
    });

    it('returns undefined when localized string map does not contain the specified language', () => {
      const lang = 'fr';
      const localizedStringMap = {};

      expect(getLocalizedString(localizedStringMap, lang)).toEqual(undefined);
    });

    it('defaults to REACT_APP_DEFAULT_API_LANG', () => {
      const lang = process.env.REACT_APP_DEFAULT_API_LANG as string;
      const value = 'some content';
      const localizedStringMap = {
        [lang]: value,
      };

      expect(getLocalizedString(localizedStringMap)).toEqual(value);
    });
  });
});
