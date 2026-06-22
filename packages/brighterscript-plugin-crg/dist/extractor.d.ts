import type { BrsFile } from 'brighterscript';
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
export declare function extractFile(file: BrsFile): {
    nodes: CrgNode[];
    edges: CrgEdge[];
};
//# sourceMappingURL=extractor.d.ts.map