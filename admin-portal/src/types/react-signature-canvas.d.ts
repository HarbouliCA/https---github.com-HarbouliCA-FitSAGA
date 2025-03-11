declare module 'react-signature-canvas' {
  import * as React from 'react';
  
  export interface SignatureCanvasProps {
    canvasProps?: React.CanvasHTMLAttributes<HTMLCanvasElement>;
    clearOnResize?: boolean;
    minWidth?: number;
    maxWidth?: number;
    penColor?: string;
    velocityFilterWeight?: number;
    dotSize?: number | (() => number);
    onBegin?: (event: MouseEvent | Touch) => void;
    onEnd?: (event: MouseEvent | Touch) => void;
  }
  
  export default class SignatureCanvas extends React.Component<SignatureCanvasProps> {
    clear(): void;
    isEmpty(): boolean;
    fromDataURL(dataURL: string, options?: object): void;
    toDataURL(type?: string, encoderOptions?: number): string;
    fromData(pointGroups: Array<any>): void;
    toData(): Array<any>;
  }
}
