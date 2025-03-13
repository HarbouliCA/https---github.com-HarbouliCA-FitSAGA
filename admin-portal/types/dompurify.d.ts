declare module 'dompurify' {
  export interface DOMPurifyI {
    sanitize(dirty: string, options?: any): string;
    addHook(entryPoint: string, hookFunction: (node: any) => any): void;
    setConfig(cfg: any): void;
    clearConfig(): void;
    isValidAttribute(tag: string, attr: string, value: string): boolean;
  }

  const DOMPurify: DOMPurifyI;
  export default DOMPurify;
}
