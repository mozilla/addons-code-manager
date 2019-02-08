declare module 'react-treefold' {
  // Based on https://github.com/gnapse/react-treefold/blob/3ae905279010b00ccda727c307cecf65da3bdc0e/src/Node.js#L26-L44
  type ToggleProps = {
    onClick: () => void;
    onKeyDown: () => void;
    role: string;
    tabIndex: number;
  };

  export type TreefoldRenderProps<NodeType> = {
    getToggleProps: () => ToggleProps;
    hasChildNodes: boolean;
    isExpanded: boolean;
    isFolder: boolean;
    level: number;
    node: NodeType;
    renderChildNodes: () => React.Element;
  };

  type TreefoldProps<NodeType> = {
    nodes: NodeType[];
    render: (props: TreefoldRenderProps<NodeType>) => React.Node;
  };

  // eslint-disable-next-line no-undef
  export default class Treefold<NodeType> extends React.Component<
    TreefoldProps<NodeType>
  > {}
}
