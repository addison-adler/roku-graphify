import type { CrgNode, CrgEdge } from './extractor';
export declare class GraphWriter {
    private db;
    private pendingNodes;
    private pendingEdges;
    private dirtyFilePaths;
    constructor(dbPath: string);
    upsertNodes(nodes: CrgNode[]): void;
    upsertEdges(edges: CrgEdge[]): void;
    flush(): void;
    queryAll(): {
        nodes: unknown[];
        edges: unknown[];
    };
    close(): void;
}
//# sourceMappingURL=writer.d.ts.map