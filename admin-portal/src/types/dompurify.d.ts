declare module 'dompurify' {
  export interface DOMPurifyI {
    sanitize(dirty: string, options?: any): string;
    addHook(hook: string, callback: Function): void;
    removeHook(hook: string): void;
    isSupported: boolean;
    setConfig(config: any): void;
    clearConfig(): void;
  }

  const DOMPurify: DOMPurifyI;
  export default DOMPurify;
}
