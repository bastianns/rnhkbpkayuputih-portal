// src/types.d.ts
declare module 'react-katex' {
  import * as React from 'react';

  interface MathProps {
    math: string;
    block?: boolean;
    errorColor?: string;
    renderError?: (error: Error | string) => React.ReactNode;
  }

  export class InlineMath extends React.Component<MathProps, any> {}
  export class BlockMath extends React.Component<MathProps, any> {}
}