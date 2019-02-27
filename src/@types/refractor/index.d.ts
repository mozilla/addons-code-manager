declare module 'refractor' {
  declare function register(language: object): void;

  type RefractorNode = {
    children: RefractorNode[];
    properties: object;
    tagName: string;
    type: string;
    value: string;
    properties?: {
      className?: string | string[];
    };
  };

  declare function highlight(value: string, language: string): RefractorNode[];
}
