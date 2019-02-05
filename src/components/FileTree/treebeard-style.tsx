import defaultTheme from 'react-treebeard/lib/themes/default';

export default {
  ...defaultTheme,
  tree: {
    ...defaultTheme.tree,
    node: {
      ...defaultTheme.tree.node,
      // This is required because of a bug in the upstream library, see:
      // https://github.com/storybooks/react-treebeard/issues/148
      container: {},
    },
  },
};
