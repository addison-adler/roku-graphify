import type { BrsFile } from 'brighterscript';
import { createVisitor, WalkMode } from 'brighterscript';
import * as path from 'path';

export interface CrgNode {
  kind: 'File' | 'Function' | 'Class';
  name: string;
  qualifiedName: string;
  filePath: string;
  lineStart: number;
  lineEnd: number;
  language: 'brightscript' | 'brighterscript';
  parentName: string | null;
  params: string | null;
  extra: Record<string, unknown>;
}

export interface CrgEdge {
  kind: 'CONTAINS' | 'CALLS' | 'IMPORTS_FROM';
  sourceQualified: string;
  targetQualified: string;
  filePath: string;
  line: number;
  extra: Record<string, unknown>;
}

export function extractFile(file: BrsFile): { nodes: CrgNode[]; edges: CrgEdge[] } {
  const nodes: CrgNode[] = [];
  const edges: CrgEdge[] = [];
  const fp = file.srcPath;
  const lang: 'brightscript' | 'brighterscript' = fp.endsWith('.bs') ? 'brighterscript' : 'brightscript';
  const fileQname = fp;

  nodes.push({
    kind: 'File',
    name: path.basename(fp),
    qualifiedName: fileQname,
    filePath: fp,
    lineStart: 1,
    lineEnd: 0,
    language: lang,
    parentName: null,
    params: null,
    extra: { parser: 'brighterscript' },
  });

  for (const callable of file.callables) {
    const name = callable.name;
    if (!name) continue;

    const qname = `${fp}::${name}`;
    const lineStart = (callable.nameRange?.start?.line ?? 0) + 1;
    const lineEnd = (callable.range?.end?.line ?? 0) + 1;
    const params = (callable.params ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((p: any) => (p.name?.text ?? String(p.name ?? '')).trim())
      .filter(Boolean);

    nodes.push({
      kind: 'Function',
      name,
      qualifiedName: qname,
      filePath: fp,
      lineStart,
      lineEnd,
      language: lang,
      parentName: null,
      params: JSON.stringify(params),
      extra: {
        col: callable.nameRange?.start?.character ?? 0,
        isSub: callable.isSub,
        parser: 'brighterscript',
      },
    });

    edges.push({
      kind: 'CONTAINS',
      sourceQualified: fileQname,
      targetQualified: qname,
      filePath: fp,
      line: lineStart,
      extra: {},
    });

    // Walk this callable's body to find all CallExpressions.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = (callable as any).functionStatement;
    // v1: func is a FunctionExpression on the statement; v0: body directly on statement
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = (stmt?.func as any)?.body ?? (stmt as any)?.body;
    if (!body?.walk) continue;

    body.walk(
      createVisitor({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        CallExpression: (expr: any) => {
          const calleeName = resolveCalleeName(expr.callee);
          if (!calleeName) return;
          edges.push({
            kind: 'CALLS',
            sourceQualified: qname,
            targetQualified: calleeName,
            filePath: fp,
            line: (expr.range?.start?.line ?? 0) + 1,
            extra: { col: expr.range?.start?.character ?? 0 },
          });
        },
      }),
      { walkMode: WalkMode.visitAllRecursive },
    );
  }

  // Class nodes via AST walk (BrighterScript .bs files)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((file as any).ast?.walk) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (file as any).ast.walk(
      createVisitor({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ClassStatement: (cls: any) => {
          const name: string | undefined = cls.name?.text ?? cls.tokens?.name?.text;
          if (!name) return;
          const qname = `${fp}::${name}`;
          nodes.push({
            kind: 'Class',
            name,
            qualifiedName: qname,
            filePath: fp,
            lineStart: (cls.range?.start?.line ?? 0) + 1,
            lineEnd: (cls.range?.end?.line ?? 0) + 1,
            language: lang,
            parentName: null,
            params: null,
            extra: { parser: 'brighterscript' },
          });
          edges.push({
            kind: 'CONTAINS',
            sourceQualified: fileQname,
            targetQualified: qname,
            filePath: fp,
            line: (cls.range?.start?.line ?? 0) + 1,
            extra: {},
          });
        },
      }),
      { walkMode: WalkMode.visitAllRecursive },
    );
  }

  // IMPORTS_FROM edges from library/import statements
  for (const imp of file.ownScriptImports) {
    const target: string = imp.destPath ?? imp.text;
    if (!target) continue;
    edges.push({
      kind: 'IMPORTS_FROM',
      sourceQualified: fileQname,
      targetQualified: target,
      filePath: fp,
      line: (imp.filePathRange?.start?.line ?? 0) + 1,
      extra: {},
    });
  }

  return { nodes, edges };
}

/**
 * Resolve a callee expression to a dotted name string.
 * Handles VariableExpression (foo), DottedGetExpression (a.b.c),
 * and falls back to getText() for anything else.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveCalleeName(node: any): string | null {
  if (!node) return null;

  // Use getText() if available — covers most cases cleanly
  if (typeof node.getText === 'function') {
    const text: string = node.getText()?.trim() ?? '';
    if (text) return text;
  }

  // Manual dotted-path reconstruction for DottedGetExpression chains
  const parts: string[] = [];
  let cur = node;
  while (cur) {
    const nameText: string | undefined =
      cur.name?.text ?? cur.tokens?.name?.text;
    if (nameText) {
      parts.unshift(nameText);
      cur = cur.obj;
    } else {
      // VariableExpression leaf
      const varName: string | undefined =
        cur.tokens?.name?.text ?? cur.name?.text;
      if (varName) parts.unshift(varName);
      break;
    }
  }
  return parts.length > 0 ? parts.join('.') : null;
}
