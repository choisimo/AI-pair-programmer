/**
 * AST Parser Implementation
 * Implements TASK-006: AST 델타 생성기 구현
 */

import * as ts from 'typescript';
import { createHash } from 'crypto';
import { 
  EditDelta, 
  SymbolMeta, 
  Position, 
  Range, 
  DependencyEdge,
  Logger 
} from '../ai-engine/types';
import { parserConfig } from '@/config/environment';

export interface ASTDelta {
  filePath: string;
  timestamp: number;
  changeType: 'incremental' | 'full';
  
  // Changed nodes
  addedNodes: ASTNode[];
  removedNodes: ASTNode[];
  modifiedNodes: Array<{
    before: ASTNode;
    after: ASTNode;
  }>;
  
  // Affected symbols
  affectedSymbols: string[];
  
  // Performance metrics
  parseTimeMs: number;
  nodeCount: number;
}

export interface ASTNode {
  id: string;
  kind: ts.SyntaxKind;
  name?: string;
  range: Range;
  text: string;
  parent?: string;
  children: string[];
  
  // Symbol information
  symbolInfo?: {
    kind: SymbolMeta['kind'];
    signature?: string;
    documentation?: string;
    modifiers: string[];
  };
}

export interface ParseResult {
  sourceFile: ts.SourceFile;
  symbols: SymbolMeta[];
  dependencies: DependencyEdge[];
  diagnostics: ts.Diagnostic[];
  parseTimeMs: number;
}

export class IncrementalASTParser {
  private program: ts.Program | null = null;
  private host: ts.CompilerHost;
  private fileCache = new Map<string, {
    version: number;
    sourceFile: ts.SourceFile;
    symbols: SymbolMeta[];
    lastModified: number;
  }>();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.host = this.createCompilerHost();
  }

  /**
   * Parse file and generate AST delta
   */
  async parseFile(
    filePath: string,
    content: string,
    editDelta?: EditDelta
  ): Promise<ASTDelta> {
    const startTime = Date.now();
    
    try {
      // Check if we can do incremental parsing
      const cached = this.fileCache.get(filePath);
      const useIncremental = cached && editDelta && this.canUseIncremental(editDelta);
      
      if (useIncremental) {
        return await this.parseIncremental(filePath, content, editDelta, cached);
      } else {
        return await this.parseFull(filePath, content);
      }
      
    } catch (error) {
      this.logger.error('AST parsing failed', error as Error, { filePath });
      
      // Fallback to full parse
      if (editDelta) {
        this.logger.warn('Falling back to full parse after incremental failure');
        return await this.parseFull(filePath, content);
      }
      
      throw error;
    }
  }

  /**
   * Extract symbols from AST
   */
  extractSymbols(sourceFile: ts.SourceFile): SymbolMeta[] {
    const symbols: SymbolMeta[] = [];
    const checker = this.program?.getTypeChecker();
    
    const visit = (node: ts.Node) => {
      if (this.isSymbolNode(node)) {
        const symbol = this.createSymbolMeta(node, sourceFile, checker);
        if (symbol) {
          symbols.push(symbol);
        }
      }
      
      ts.forEachChild(node, visit);
    };
    
    visit(sourceFile);
    return symbols;
  }

  /**
   * Build dependency graph from symbols
   */
  buildDependencyGraph(
    symbols: SymbolMeta[],
    sourceFile: ts.SourceFile
  ): DependencyEdge[] {
    const dependencies: DependencyEdge[] = [];
    const checker = this.program?.getTypeChecker();
    
    if (!checker) return dependencies;
    
    // Find import/export relationships
    const imports = this.extractImports(sourceFile);
    const exports = this.extractExports(sourceFile);
    
    // Add import dependencies
    for (const imp of imports) {
      dependencies.push({
        from: sourceFile.fileName,
        to: imp.moduleSpecifier,
        type: 'imports',
        weight: 1.0
      });
    }
    
    // Add symbol dependencies
    for (const symbol of symbols) {
      for (const dep of symbol.dependencies) {
        dependencies.push({
          from: symbol.name,
          to: dep,
          type: 'references',
          weight: this.calculateDependencyWeight(symbol, dep)
        });
      }
    }
    
    return dependencies;
  }

  private async parseIncremental(
    filePath: string,
    content: string,
    editDelta: EditDelta,
    cached: NonNullable<ReturnType<typeof this.fileCache.get>>
  ): Promise<ASTDelta> {
    const startTime = Date.now();
    
    // Calculate minimal reparse window
    const reparseRange = this.calculateReparseRange(editDelta, cached.sourceFile);
    
    // Create new source file with changes
    const newSourceFile = ts.updateSourceFile(
      cached.sourceFile,
      content,
      {
        span: {
          start: this.positionToOffset(reparseRange.start, cached.sourceFile),
          length: this.positionToOffset(reparseRange.end, cached.sourceFile) - 
                  this.positionToOffset(reparseRange.start, cached.sourceFile)
        },
        newLength: editDelta.newText.length
      }
    );
    
    // Extract nodes in the changed region
    const oldNodes = this.extractNodesInRange(cached.sourceFile, reparseRange);
    const newNodes = this.extractNodesInRange(newSourceFile, reparseRange);
    
    // Calculate delta
    const delta = this.calculateNodeDelta(oldNodes, newNodes, filePath);
    
    // Update cache
    const newSymbols = this.extractSymbols(newSourceFile);
    this.updateCache(filePath, newSourceFile, newSymbols);
    
    const parseTimeMs = Date.now() - startTime;
    
    return {
      ...delta,
      parseTimeMs,
      nodeCount: newNodes.length,
      timestamp: Date.now(),
      changeType: 'incremental'
    };
  }

  private async parseFull(filePath: string, content: string): Promise<ASTDelta> {
    const startTime = Date.now();
    
    // Create source file
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );
    
    // Update program
    this.updateProgram([sourceFile]);
    
    // Extract symbols and dependencies
    const symbols = this.extractSymbols(sourceFile);
    const allNodes = this.extractAllNodes(sourceFile);
    
    // Update cache
    this.updateCache(filePath, sourceFile, symbols);
    
    const parseTimeMs = Date.now() - startTime;
    
    // For full parse, everything is "added"
    return {
      filePath,
      timestamp: Date.now(),
      changeType: 'full',
      addedNodes: allNodes,
      removedNodes: [],
      modifiedNodes: [],
      affectedSymbols: symbols.map(s => s.name),
      parseTimeMs,
      nodeCount: allNodes.length
    };
  }

  private canUseIncremental(editDelta: EditDelta): boolean {
    // Heuristics for when incremental parsing is beneficial
    const changeSize = editDelta.newText.length + editDelta.oldText.length;
    const isSmallChange = changeSize < 500; // characters
    const isSingleLine = !editDelta.newText.includes('\n') && !editDelta.oldText.includes('\n');
    
    return isSmallChange && isSingleLine;
  }

  private calculateReparseRange(editDelta: EditDelta, sourceFile: ts.SourceFile): Range {
    // Expand range to include complete statements/expressions
    const start = editDelta.range.start;
    const end = editDelta.range.end;
    
    // Find containing statement
    const startNode = this.findContainingStatement(start, sourceFile);
    const endNode = this.findContainingStatement(end, sourceFile);
    
    return {
      start: startNode ? this.offsetToPosition(startNode.getStart(), sourceFile) : start,
      end: endNode ? this.offsetToPosition(startNode.getEnd(), sourceFile) : end
    };
  }

  private extractNodesInRange(sourceFile: ts.SourceFile, range: Range): ASTNode[] {
    const nodes: ASTNode[] = [];
    const startOffset = this.positionToOffset(range.start, sourceFile);
    const endOffset = this.positionToOffset(range.end, sourceFile);
    
    const visit = (node: ts.Node) => {
      const nodeStart = node.getStart();
      const nodeEnd = node.getEnd();
      
      // Check if node overlaps with range
      if (nodeStart < endOffset && nodeEnd > startOffset) {
        nodes.push(this.createASTNode(node, sourceFile));
      }
      
      ts.forEachChild(node, visit);
    };
    
    visit(sourceFile);
    return nodes;
  }

  private extractAllNodes(sourceFile: ts.SourceFile): ASTNode[] {
    const nodes: ASTNode[] = [];
    
    const visit = (node: ts.Node) => {
      nodes.push(this.createASTNode(node, sourceFile));
      ts.forEachChild(node, visit);
    };
    
    visit(sourceFile);
    return nodes;
  }

  private calculateNodeDelta(
    oldNodes: ASTNode[],
    newNodes: ASTNode[],
    filePath: string
  ): Omit<ASTDelta, 'parseTimeMs' | 'nodeCount' | 'timestamp' | 'changeType'> {
    
    const oldNodeMap = new Map(oldNodes.map(n => [n.id, n]));
    const newNodeMap = new Map(newNodes.map(n => [n.id, n]));
    
    const addedNodes: ASTNode[] = [];
    const removedNodes: ASTNode[] = [];
    const modifiedNodes: Array<{ before: ASTNode; after: ASTNode }> = [];
    
    // Find added and modified nodes
    for (const newNode of newNodes) {
      const oldNode = oldNodeMap.get(newNode.id);
      
      if (!oldNode) {
        addedNodes.push(newNode);
      } else if (oldNode.text !== newNode.text) {
        modifiedNodes.push({ before: oldNode, after: newNode });
      }
    }
    
    // Find removed nodes
    for (const oldNode of oldNodes) {
      if (!newNodeMap.has(oldNode.id)) {
        removedNodes.push(oldNode);
      }
    }
    
    // Calculate affected symbols
    const affectedSymbols = new Set<string>();
    
    [...addedNodes, ...removedNodes, ...modifiedNodes.map(m => m.after)]
      .forEach(node => {
        if (node.symbolInfo && node.name) {
          affectedSymbols.add(node.name);
        }
      });
    
    return {
      filePath,
      addedNodes,
      removedNodes,
      modifiedNodes,
      affectedSymbols: Array.from(affectedSymbols)
    };
  }

  private createASTNode(node: ts.Node, sourceFile: ts.SourceFile): ASTNode {
    const start = node.getStart();
    const end = node.getEnd();
    const text = sourceFile.text.substring(start, end);
    
    // Generate stable ID based on position and content
    const id = createHash('sha256')
      .update(`${sourceFile.fileName}:${start}:${end}:${text}`)
      .digest('hex')
      .substring(0, 16);
    
    const astNode: ASTNode = {
      id,
      kind: node.kind,
      range: {
        start: this.offsetToPosition(start, sourceFile),
        end: this.offsetToPosition(end, sourceFile)
      },
      text,
      children: []
    };
    
    // Add name if available
    if ('name' in node && node.name && ts.isIdentifier(node.name)) {
      astNode.name = node.name.text;
    }
    
    // Add symbol information
    if (this.isSymbolNode(node)) {
      astNode.symbolInfo = this.extractSymbolInfo(node);
    }
    
    return astNode;
  }

  private createSymbolMeta(
    node: ts.Node,
    sourceFile: ts.SourceFile,
    checker?: ts.TypeChecker
  ): SymbolMeta | null {
    
    if (!('name' in node) || !node.name || !ts.isIdentifier(node.name)) {
      return null;
    }
    
    const name = node.name.text;
    const start = node.getStart();
    const end = node.getEnd();
    
    const symbol: SymbolMeta = {
      name,
      kind: this.getSymbolKind(node),
      range: {
        start: this.offsetToPosition(start, sourceFile),
        end: this.offsetToPosition(end, sourceFile)
      },
      filePath: sourceFile.fileName,
      references: [],
      dependencies: []
    };
    
    // Add signature and documentation if available
    if (checker) {
      const tsSymbol = checker.getSymbolAtLocation(node.name);
      if (tsSymbol) {
        symbol.signature = checker.typeToString(
          checker.getTypeOfSymbolAtLocation(tsSymbol, node)
        );
        
        const docs = tsSymbol.getDocumentationComment(checker);
        if (docs.length > 0) {
          symbol.documentation = docs.map(d => d.text).join('\n');
        }
      }
    }
    
    return symbol;
  }

  private isSymbolNode(node: ts.Node): boolean {
    return ts.isFunctionDeclaration(node) ||
           ts.isClassDeclaration(node) ||
           ts.isInterfaceDeclaration(node) ||
           ts.isTypeAliasDeclaration(node) ||
           ts.isVariableDeclaration(node) ||
           ts.isMethodDeclaration(node) ||
           ts.isPropertyDeclaration(node);
  }

  private getSymbolKind(node: ts.Node): SymbolMeta['kind'] {
    if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) return 'function';
    if (ts.isClassDeclaration(node)) return 'class';
    if (ts.isInterfaceDeclaration(node)) return 'interface';
    if (ts.isTypeAliasDeclaration(node)) return 'type';
    if (ts.isVariableDeclaration(node)) return 'variable';
    if (ts.isImportDeclaration(node)) return 'import';
    if (ts.isExportDeclaration(node)) return 'export';
    
    return 'variable'; // fallback
  }

  private extractSymbolInfo(node: ts.Node) {
    const modifiers: string[] = [];
    
    if ('modifiers' in node && node.modifiers) {
      for (const modifier of node.modifiers) {
        modifiers.push(ts.SyntaxKind[modifier.kind].toLowerCase());
      }
    }
    
    return {
      kind: this.getSymbolKind(node),
      modifiers
    };
  }

  private extractImports(sourceFile: ts.SourceFile): Array<{ moduleSpecifier: string }> {
    const imports: Array<{ moduleSpecifier: string }> = [];
    
    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        imports.push({
          moduleSpecifier: node.moduleSpecifier.text
        });
      }
      
      ts.forEachChild(node, visit);
    };
    
    visit(sourceFile);
    return imports;
  }

  private extractExports(sourceFile: ts.SourceFile): Array<{ name: string }> {
    const exports: Array<{ name: string }> = [];
    
    // Implementation would extract export declarations
    // This is a simplified version
    
    return exports;
  }

  private calculateDependencyWeight(symbol: SymbolMeta, dependency: string): number {
    // Simple heuristic: more references = higher weight
    return Math.min(symbol.references.length * 0.1, 1.0);
  }

  private findContainingStatement(position: Position, sourceFile: ts.SourceFile): ts.Node | null {
    const offset = this.positionToOffset(position, sourceFile);
    
    const visit = (node: ts.Node): ts.Node | null => {
      if (node.getStart() <= offset && offset <= node.getEnd()) {
        // Check children first
        for (const child of node.getChildren()) {
          const result = visit(child);
          if (result) return result;
        }
        
        // If this is a statement-level node, return it
        if (this.isStatementNode(node)) {
          return node;
        }
      }
      
      return null;
    };
    
    return visit(sourceFile);
  }

  private isStatementNode(node: ts.Node): boolean {
    return ts.isStatement(node) || ts.isDeclaration(node);
  }

  private positionToOffset(position: Position, sourceFile: ts.SourceFile): number {
    return ts.getPositionOfLineAndCharacter(sourceFile, position.line, position.character);
  }

  private offsetToPosition(offset: number, sourceFile: ts.SourceFile): Position {
    const lineAndChar = ts.getLineAndCharacterOfPosition(sourceFile, offset);
    return {
      line: lineAndChar.line,
      character: lineAndChar.character
    };
  }

  private updateCache(filePath: string, sourceFile: ts.SourceFile, symbols: SymbolMeta[]): void {
    const cached = this.fileCache.get(filePath);
    const version = cached ? cached.version + 1 : 1;
    
    this.fileCache.set(filePath, {
      version,
      sourceFile,
      symbols,
      lastModified: Date.now()
    });
    
    // Cleanup old entries
    if (this.fileCache.size > 100) {
      this.cleanupCache();
    }
  }

  private cleanupCache(): void {
    const entries = Array.from(this.fileCache.entries());
    entries.sort((a, b) => a[1].lastModified - b[1].lastModified);
    
    // Remove oldest 20%
    const toRemove = Math.floor(entries.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      this.fileCache.delete(entries[i][0]);
    }
  }

  private updateProgram(sourceFiles: ts.SourceFile[]): void {
    const fileNames = sourceFiles.map(sf => sf.fileName);
    
    this.program = ts.createProgram({
      rootNames: fileNames,
      options: {
        target: ts.ScriptTarget.Latest,
        module: ts.ModuleKind.ESNext,
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true
      },
      host: this.host
    });
  }

  private createCompilerHost(): ts.CompilerHost {
    const host = ts.createCompilerHost({
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.ESNext
    });
    
    // Override file reading to use our cache
    const originalGetSourceFile = host.getSourceFile;
    host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
      const cached = this.fileCache.get(fileName);
      if (cached && !shouldCreateNewSourceFile) {
        return cached.sourceFile;
      }
      
      return originalGetSourceFile.call(host, fileName, languageVersion, onError, shouldCreateNewSourceFile);
    };
    
    return host;
  }
}

// Factory function
export function createASTParser(logger: Logger): IncrementalASTParser {
  return new IncrementalASTParser(logger);
}
