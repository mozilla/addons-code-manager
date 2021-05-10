// The original module directly exports an anonymous function.

declare module 'content-security-policy-parser' {
  function fn(policy: string): {
    [directive: string]: string;
  };
  export = fn;
}
