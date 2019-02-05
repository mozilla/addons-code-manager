declare module 'react-treefold' {
  export type TreefoldRenderProps<NodeType> = {
    getToggleProps: () => object;
    hasChildNodes: boolean;
    isExpanded: boolean;
    isFolder: boolean;
    level: number;
    node: NodeType;
    renderChildNodes: () => React.Element;
  };

  type TreefoldProps<NodeType> = {
    nodes: object[];
    render: (props: TreefoldRenderProps<NodeType>) => React.Node;
  };

  // eslint-disable-next-line no-undef
  export default class Treefold<NodeType> extends React.Component<
    TreefoldProps<NodeType>
  > {}
}
