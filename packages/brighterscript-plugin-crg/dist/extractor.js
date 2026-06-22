"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractFile = extractFile;
const brighterscript_1 = require("brighterscript");
const path = __importStar(require("path"));
function extractFile(file) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
    const nodes = [];
    const edges = [];
    const fp = file.srcPath;
    const lang = fp.endsWith('.bs') ? 'brighterscript' : 'brightscript';
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
        if (!name)
            continue;
        const qname = `${fp}::${name}`;
        const lineStart = ((_c = (_b = (_a = callable.nameRange) === null || _a === void 0 ? void 0 : _a.start) === null || _b === void 0 ? void 0 : _b.line) !== null && _c !== void 0 ? _c : 0) + 1;
        const lineEnd = ((_f = (_e = (_d = callable.range) === null || _d === void 0 ? void 0 : _d.end) === null || _e === void 0 ? void 0 : _e.line) !== null && _f !== void 0 ? _f : 0) + 1;
        const params = ((_g = callable.params) !== null && _g !== void 0 ? _g : [])
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((p) => { var _a, _b, _c; return ((_b = (_a = p.name) === null || _a === void 0 ? void 0 : _a.text) !== null && _b !== void 0 ? _b : String((_c = p.name) !== null && _c !== void 0 ? _c : '')).trim(); })
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
                col: (_k = (_j = (_h = callable.nameRange) === null || _h === void 0 ? void 0 : _h.start) === null || _j === void 0 ? void 0 : _j.character) !== null && _k !== void 0 ? _k : 0,
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
        const stmt = callable.functionStatement;
        // v1: func is a FunctionExpression on the statement; v0: body directly on statement
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body = (_m = (_l = stmt === null || stmt === void 0 ? void 0 : stmt.func) === null || _l === void 0 ? void 0 : _l.body) !== null && _m !== void 0 ? _m : stmt === null || stmt === void 0 ? void 0 : stmt.body;
        if (!(body === null || body === void 0 ? void 0 : body.walk))
            continue;
        body.walk((0, brighterscript_1.createVisitor)({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            CallExpression: (expr) => {
                var _a, _b, _c, _d, _e, _f;
                const calleeName = resolveCalleeName(expr.callee);
                if (!calleeName)
                    return;
                edges.push({
                    kind: 'CALLS',
                    sourceQualified: qname,
                    targetQualified: calleeName,
                    filePath: fp,
                    line: ((_c = (_b = (_a = expr.range) === null || _a === void 0 ? void 0 : _a.start) === null || _b === void 0 ? void 0 : _b.line) !== null && _c !== void 0 ? _c : 0) + 1,
                    extra: { col: (_f = (_e = (_d = expr.range) === null || _d === void 0 ? void 0 : _d.start) === null || _e === void 0 ? void 0 : _e.character) !== null && _f !== void 0 ? _f : 0 },
                });
            },
        }), { walkMode: brighterscript_1.WalkMode.visitAllRecursive });
    }
    // Class nodes via AST walk (BrighterScript .bs files)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((_o = file.ast) === null || _o === void 0 ? void 0 : _o.walk) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        file.ast.walk((0, brighterscript_1.createVisitor)({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ClassStatement: (cls) => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
                const name = (_b = (_a = cls.name) === null || _a === void 0 ? void 0 : _a.text) !== null && _b !== void 0 ? _b : (_d = (_c = cls.tokens) === null || _c === void 0 ? void 0 : _c.name) === null || _d === void 0 ? void 0 : _d.text;
                if (!name)
                    return;
                const qname = `${fp}::${name}`;
                nodes.push({
                    kind: 'Class',
                    name,
                    qualifiedName: qname,
                    filePath: fp,
                    lineStart: ((_g = (_f = (_e = cls.range) === null || _e === void 0 ? void 0 : _e.start) === null || _f === void 0 ? void 0 : _f.line) !== null && _g !== void 0 ? _g : 0) + 1,
                    lineEnd: ((_k = (_j = (_h = cls.range) === null || _h === void 0 ? void 0 : _h.end) === null || _j === void 0 ? void 0 : _j.line) !== null && _k !== void 0 ? _k : 0) + 1,
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
                    line: ((_o = (_m = (_l = cls.range) === null || _l === void 0 ? void 0 : _l.start) === null || _m === void 0 ? void 0 : _m.line) !== null && _o !== void 0 ? _o : 0) + 1,
                    extra: {},
                });
            },
        }), { walkMode: brighterscript_1.WalkMode.visitAllRecursive });
    }
    // IMPORTS_FROM edges from library/import statements
    for (const imp of file.ownScriptImports) {
        const target = (_p = imp.destPath) !== null && _p !== void 0 ? _p : imp.text;
        if (!target)
            continue;
        edges.push({
            kind: 'IMPORTS_FROM',
            sourceQualified: fileQname,
            targetQualified: target,
            filePath: fp,
            line: ((_s = (_r = (_q = imp.filePathRange) === null || _q === void 0 ? void 0 : _q.start) === null || _r === void 0 ? void 0 : _r.line) !== null && _s !== void 0 ? _s : 0) + 1,
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
function resolveCalleeName(node) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    if (!node)
        return null;
    // Use getText() if available — covers most cases cleanly
    if (typeof node.getText === 'function') {
        const text = (_b = (_a = node.getText()) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : '';
        if (text)
            return text;
    }
    // Manual dotted-path reconstruction for DottedGetExpression chains
    const parts = [];
    let cur = node;
    while (cur) {
        const nameText = (_d = (_c = cur.name) === null || _c === void 0 ? void 0 : _c.text) !== null && _d !== void 0 ? _d : (_f = (_e = cur.tokens) === null || _e === void 0 ? void 0 : _e.name) === null || _f === void 0 ? void 0 : _f.text;
        if (nameText) {
            parts.unshift(nameText);
            cur = cur.obj;
        }
        else {
            // VariableExpression leaf
            const varName = (_j = (_h = (_g = cur.tokens) === null || _g === void 0 ? void 0 : _g.name) === null || _h === void 0 ? void 0 : _h.text) !== null && _j !== void 0 ? _j : (_k = cur.name) === null || _k === void 0 ? void 0 : _k.text;
            if (varName)
                parts.unshift(varName);
            break;
        }
    }
    return parts.length > 0 ? parts.join('.') : null;
}
//# sourceMappingURL=extractor.js.map