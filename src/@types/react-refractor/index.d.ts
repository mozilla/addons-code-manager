declare module 'react-refractor/all' {
  type Props = {
    className?: string;
    inline?: boolean;
    language: string;
    value: string;
  };

  // eslint-disable-next-line no-undef
  class Refractor extends React.Component<Props> {}

  export default Refractor;
}
