declare module 'react-treebeard' {
  type TreebeardProps = {
    data: object;
    style?: object;
  };

  // eslint-disable-next-line no-undef
  export class Treebeard extends React.Component<TreebeardProps, {}> {}
}

declare module 'react-treebeard/lib/themes/default';
