// This file contains the implementation of a 'text' language for
// Prism/refractor.

type PrismType = {
  languages: {
    text: Record<string, unknown>;
  };
};

const text = (Prism: PrismType): void => {
  // eslint-disable-next-line no-param-reassign
  Prism.languages.text = {};
};

text.displayName = 'text';
text.aliases = [] as string[];

export default text;
