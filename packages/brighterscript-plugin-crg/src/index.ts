import type { AfterValidateProgramEvent, Plugin, PluginFactoryOptions } from 'brighterscript';
import { isBrsFile } from 'brighterscript';
import * as fs from 'fs';
import * as path from 'path';
import { extractFile } from './extractor';
import { GraphWriter } from './writer';

export interface PluginOptions {
  /** Absolute or rootDir-relative path for the output SQLite database.
   *  Can also be set via the BSC_CRG_DB_PATH environment variable.
   *  Defaults to <rootDir>/.code-review-graph/graph.db */
  dbPath?: string;
}

export default function crgPlugin(
  options: PluginOptions = {},
  // second arg is the standard v1 PluginFactoryOptions (version info); unused here
  _bscOptions?: PluginFactoryOptions,
): Plugin {
  return {
    name: 'brighterscript-plugin-crg',

    afterValidateProgram(event: AfterValidateProgramEvent) {
      if (event.wasCancelled) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rootDir: string = (event.program.options as any).rootDir ?? process.cwd();

      const rawDbPath =
        options.dbPath ??
        process.env['BSC_CRG_DB_PATH'] ??
        path.join(rootDir, '.code-review-graph', 'graph.db');

      const dbPath = path.isAbsolute(rawDbPath)
        ? rawDbPath
        : path.resolve(rootDir, rawDbPath);

      const writer = new GraphWriter(dbPath);
      try {
        for (const file of Object.values(event.program.files)) {
          if (!isBrsFile(file)) continue;
          const { nodes, edges } = extractFile(file);
          writer.upsertNodes(nodes);
          writer.upsertEdges(edges);
        }
      } finally {
        writer.flush();
        const jsonPath = dbPath.replace(/\.db$/, '.json');
        fs.writeFileSync(jsonPath, JSON.stringify(writer.queryAll(), null, 2));
        writer.close();
      }
    },
  };
}
