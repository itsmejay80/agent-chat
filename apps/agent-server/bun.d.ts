// Bun-specific type declarations
// This extends the ImportMeta interface to include Bun's additional properties

interface ImportMeta {
  /**
   * The directory containing the current module.
   * Equivalent to `path.dirname(import.meta.url)` in Node.js
   */
  dir: string;

  /**
   * The full file path to the current module.
   */
  file: string;

  /**
   * The path to the current module as a file URL string.
   */
  url: string;

  /**
   * Whether the current module is the entry point.
   */
  main: boolean;

  /**
   * Resolve a module specifier relative to the current module.
   */
  resolve(moduleSpecifier: string): string;

  /**
   * The require function for CommonJS modules.
   */
  require: NodeRequire;
}
