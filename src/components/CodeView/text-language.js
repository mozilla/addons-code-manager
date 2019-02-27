/* eslint amo/only-tsx-files: 0 */
// This file contains the implementation of a 'text' language for
// Prism/refractor.

const text = (Prism) => {
  // eslint-disable-next-line no-param-reassign
  Prism.languages.text = {};
};

text.displayName = 'text';
text.aliases = [];

export default text;
