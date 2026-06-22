'use strict';
// Local wrapper — passes options to brighterscript-plugin-crg.
// bsconfig.json plugins must be plain strings in v1, so options live here.
const crgPlugin = require('../../../packages/brighterscript-plugin-crg/dist/index').default;

module.exports = () => crgPlugin({
  // Write to the demo exports directory, separate from the tree-sitter graph.db
  dbPath: '../exports/code-review-graph/bsc-graph.db',
});
