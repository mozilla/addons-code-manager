// This file contains the implementation of a 'text' language for
// Prism/refractor.

type Prism = {
  languages: {
    text: object;
  };
};

const text = (Prism: Prism) => {
  // eslint-disable-next-line no-param-reassign
  Prism.languages.text = {};
};

text.displayName = 'text';
text.aliases = [] as string[];

export default text;
