import type { Plugin, PluginFactoryOptions } from 'brighterscript';
export interface PluginOptions {
    /** Absolute or rootDir-relative path for the output SQLite database.
     *  Can also be set via the BSC_CRG_DB_PATH environment variable.
     *  Defaults to <rootDir>/.code-review-graph/graph.db */
    dbPath?: string;
}
export default function crgPlugin(options?: PluginOptions, _bscOptions?: PluginFactoryOptions): Plugin;
//# sourceMappingURL=index.d.ts.map