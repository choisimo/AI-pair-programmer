/**
 * Symbol Graph Builder Implementation
 * Implements TASK-007: 심볼 그래프 빌더
 */

import { createHash } from 'crypto';
import { 
  SymbolMeta, 
  DependencyEdge, 
  Logger,
  TelemetryEvent 
} from '../ai-engine/types';
import { parserConfig } from '@/config/environment';

export interface SymbolGraph {
  nodes: Map<string, SymbolNode>;
  edges: Map<string, DependencyEdge>;
  metadata: {
    version: number;
    lastUpdated: number;
    nodeCount: number;
    edgeCount: number;
    buildTimeMs: number;
  };
}

export interface SymbolNode {
  id: string;
  symbol: SymbolMeta;
  
  // Graph connectivity
  incomingEdges: Set<string>; // Edge IDs pointing to this node
  outgoingEdges: Set<string>; // Edge IDs from this node
  
  // Computed properties
  importance: number; // PageRank-like score
  centrality: number; // Betweenness centrality
  cluster?: string; // Cluster ID for grouping
  
  // Metadata
  lastAccessed: number;
  accessCount: number;
}

export interface GraphUpdate {
  addedNodes: SymbolNode[];
  removedNodes: string[]; // Node IDs
  modifiedNodes: Array<{
    nodeId: string;
    before: SymbolNode;
    after: SymbolNode;
  }>;
  addedEdges: DependencyEdge[];
  removedEdges: string[]; // Edge IDs
}

export interface GraphQuery {
  // Find nodes by criteria
  findNodes(predicate: (node: SymbolNode) => boolean): SymbolNode[];
  
  // Find shortest path between symbols
  findPath(fromId: string, toId: string): string[] | null;
  
  // Get neighbors within N hops
  getNeighbors(nodeId: string, maxHops: number): SymbolNode[];
  
  // Find strongly connected components
  findClusters(): Map<string, SymbolNode[]>;
  
  // Get symbols by importance ranking
  getRankedSymbols(limit?: number): SymbolNode[];
}

export class SymbolGraphBuilder implements GraphQuery {
  private graph: SymbolGraph;
  private logger: Logger;
  private updateQueue: Array<() => Promise<void>> = [];
  private isProcessing = false;

  constructor(logger: Logger) {
    this.logger = logger;
    this.graph = this.createEmptyGraph();
  }

  /**
   * Update graph with new symbols (incremental)
   */
  async updateSymbols(
    symbols: SymbolMeta[],
    filePath: string,
    isIncremental = true
  ): Promise<GraphUpdate> {
    const startTime = Date.now();
    
    try {
      if (!isIncremental) {
        // Full rebuild for this file
        return await this.rebuildFileSymbols(symbols, filePath);
      }
      
      // Incremental update
      const update = await this.performIncrementalUpdate(symbols, filePath);
      
      // Update graph metadata
      this.updateGraphMetadata(Date.now() - startTime);
      
      // Recompute graph properties if significant change
      if (this.shouldRecomputeProperties(update)) {
        await this.recomputeGraphProperties();
      }
      
      // Emit telemetry
      this.emitTelemetry('symbol_graph_updated', {
        filePath,
        addedNodes: update.addedNodes.length,
        removedNodes: update.removedNodes.length,
        isIncremental,
        updateTimeMs: Date.now() - startTime
      });
      
      return update;
      
    } catch (error) {
      this.logger.error('Symbol graph update failed', error as Error, { filePath });
      throw error;
    }
  }

  /**
   * Build dependency edges between symbols
   */
  async buildDependencies(
    symbols: SymbolMeta[],
    filePath: string
  ): Promise<DependencyEdge[]> {
    const edges: DependencyEdge[] = [];
    
    // Build intra-file dependencies
    for (const symbol of symbols) {
      for (const depName of symbol.dependencies) {
        const targetSymbol = symbols.find(s => s.name === depName);
        
        if (targetSymbol) {
          const edge: DependencyEdge = {
            from: symbol.name,
            to: targetSymbol.name,
            type: 'references',
            weight: this.calculateEdgeWeight(symbol, targetSymbol)
          };
          
          edges.push(edge);
        }
      }
    }
    
    // Build cross-file dependencies (imports/exports)
    const crossFileEdges = await this.buildCrossFileDependencies(symbols, filePath);
    edges.push(...crossFileEdges);
    
    return edges;
  }

  /**
   * Query interface implementations
   */
  findNodes(predicate: (node: SymbolNode) => boolean): SymbolNode[] {
    const results: SymbolNode[] = [];
    
    for (const node of this.graph.nodes.values()) {
      if (predicate(node)) {
        // Update access tracking
        node.lastAccessed = Date.now();
        node.accessCount++;
        results.push(node);
      }
    }
    
    return results;
  }

  findPath(fromId: string, toId: string): string[] | null {
    const fromNode = this.graph.nodes.get(fromId);
    const toNode = this.graph.nodes.get(toId);
    
    if (!fromNode || !toNode) {
      return null;
    }
    
    // BFS to find shortest path
    const queue: Array<{ nodeId: string; path: string[] }> = [
      { nodeId: fromId, path: [fromId] }
    ];
    const visited = new Set<string>([fromId]);
    
    while (queue.length > 0) {
      const { nodeId, path } = queue.shift()!;
      
      if (nodeId === toId) {
        return path;
      }
      
      const node = this.graph.nodes.get(nodeId);
      if (!node) continue;
      
      // Explore outgoing edges
      for (const edgeId of node.outgoingEdges) {
        const edge = this.graph.edges.get(edgeId);
        if (!edge) continue;
        
        const nextNodeId = edge.to;
        if (!visited.has(nextNodeId)) {
          visited.add(nextNodeId);
          queue.push({
            nodeId: nextNodeId,
            path: [...path, nextNodeId]
          });
        }
      }
    }
    
    return null; // No path found
  }

  getNeighbors(nodeId: string, maxHops: number): SymbolNode[] {
    const neighbors = new Set<string>();
    const queue: Array<{ nodeId: string; hops: number }> = [
      { nodeId, hops: 0 }
    ];
    const visited = new Set<string>([nodeId]);
    
    while (queue.length > 0) {
      const { nodeId: currentId, hops } = queue.shift()!;
      
      if (hops >= maxHops) continue;
      
      const node = this.graph.nodes.get(currentId);
      if (!node) continue;
      
      // Add all connected nodes
      const connectedEdges = [
        ...Array.from(node.outgoingEdges),
        ...Array.from(node.incomingEdges)
      ];
      
      for (const edgeId of connectedEdges) {
        const edge = this.graph.edges.get(edgeId);
        if (!edge) continue;
        
        const nextNodeId = edge.from === currentId ? edge.to : edge.from;
        
        if (!visited.has(nextNodeId)) {
          visited.add(nextNodeId);
          neighbors.add(nextNodeId);
          
          if (hops + 1 < maxHops) {
            queue.push({ nodeId: nextNodeId, hops: hops + 1 });
          }
        }
      }
    }
    
    return Array.from(neighbors)
      .map(id => this.graph.nodes.get(id))
      .filter((node): node is SymbolNode => node !== undefined);
  }

  findClusters(): Map<string, SymbolNode[]> {
    // Simplified clustering using connected components
    const clusters = new Map<string, SymbolNode[]>();
    const visited = new Set<string>();
    let clusterId = 0;
    
    for (const [nodeId, node] of this.graph.nodes) {
      if (visited.has(nodeId)) continue;
      
      const cluster = this.findConnectedComponent(nodeId, visited);
      const clusterKey = `cluster_${clusterId++}`;
      
      // Update cluster assignment
      for (const clusterNode of cluster) {
        clusterNode.cluster = clusterKey;
      }
      
      clusters.set(clusterKey, cluster);
    }
    
    return clusters;
  }

  getRankedSymbols(limit = 50): SymbolNode[] {
    const nodes = Array.from(this.graph.nodes.values());
    
    // Sort by importance score (descending)
    nodes.sort((a, b) => b.importance - a.importance);
    
    return nodes.slice(0, limit);
  }

  /**
   * Get graph statistics
   */
  getGraphStats() {
    const nodes = Array.from(this.graph.nodes.values());
    const edges = Array.from(this.graph.edges.values());
    
    return {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      avgDegree: edges.length > 0 ? (edges.length * 2) / nodes.length : 0,
      
      // Symbol type distribution
      symbolTypes: this.getSymbolTypeDistribution(nodes),
      
      // Dependency types
      dependencyTypes: this.getDependencyTypeDistribution(edges),
      
      // Graph connectivity
      stronglyConnectedComponents: this.findClusters().size,
      
      // Performance metrics
      lastUpdated: this.graph.metadata.lastUpdated,
      buildTimeMs: this.graph.metadata.buildTimeMs
    };
  }

  private async performIncrementalUpdate(
    symbols: SymbolMeta[],
    filePath: string
  ): Promise<GraphUpdate> {
    const update: GraphUpdate = {
      addedNodes: [],
      removedNodes: [],
      modifiedNodes: [],
      addedEdges: [],
      removedEdges: []
    };
    
    // Get existing nodes for this file
    const existingNodes = this.findNodes(node => 
      node.symbol.filePath === filePath
    );
    
    const existingNodeMap = new Map(
      existingNodes.map(node => [node.symbol.name, node])
    );
    
    // Process new symbols
    for (const symbol of symbols) {
      const existingNode = existingNodeMap.get(symbol.name);
      
      if (!existingNode) {
        // New symbol - add node
        const newNode = this.createSymbolNode(symbol);
        this.graph.nodes.set(newNode.id, newNode);
        update.addedNodes.push(newNode);
      } else {
        // Existing symbol - check for modifications
        if (this.hasSymbolChanged(existingNode.symbol, symbol)) {
          const before = { ...existingNode };
          existingNode.symbol = symbol;
          update.modifiedNodes.push({
            nodeId: existingNode.id,
            before,
            after: existingNode
          });
        }
        
        // Remove from existing map (remaining will be deleted)
        existingNodeMap.delete(symbol.name);
      }
    }
    
    // Remove nodes that no longer exist
    for (const [name, node] of existingNodeMap) {
      this.removeNode(node.id);
      update.removedNodes.push(node.id);
    }
    
    // Update edges
    const newEdges = await this.buildDependencies(symbols, filePath);
    
    // Remove old edges for this file
    const oldEdges = Array.from(this.graph.edges.values())
      .filter(edge => {
        const fromNode = this.findNodes(n => n.symbol.name === edge.from)[0];
        return fromNode?.symbol.filePath === filePath;
      });
    
    for (const edge of oldEdges) {
      const edgeId = this.getEdgeId(edge);
      this.removeEdge(edgeId);
      update.removedEdges.push(edgeId);
    }
    
    // Add new edges
    for (const edge of newEdges) {
      const edgeId = this.addEdge(edge);
      update.addedEdges.push(edge);
    }
    
    return update;
  }

  private async rebuildFileSymbols(
    symbols: SymbolMeta[],
    filePath: string
  ): Promise<GraphUpdate> {
    // Remove all existing nodes for this file
    const existingNodes = this.findNodes(node => 
      node.symbol.filePath === filePath
    );
    
    const removedNodeIds = existingNodes.map(node => {
      this.removeNode(node.id);
      return node.id;
    });
    
    // Add all new nodes
    const addedNodes = symbols.map(symbol => {
      const node = this.createSymbolNode(symbol);
      this.graph.nodes.set(node.id, node);
      return node;
    });
    
    // Build new edges
    const newEdges = await this.buildDependencies(symbols, filePath);
    const addedEdges = newEdges.map(edge => {
      this.addEdge(edge);
      return edge;
    });
    
    return {
      addedNodes,
      removedNodes: removedNodeIds,
      modifiedNodes: [],
      addedEdges,
      removedEdges: []
    };
  }

  private createSymbolNode(symbol: SymbolMeta): SymbolNode {
    const id = this.generateNodeId(symbol);
    
    return {
      id,
      symbol,
      incomingEdges: new Set(),
      outgoingEdges: new Set(),
      importance: 1.0, // Will be computed later
      centrality: 0.0,
      lastAccessed: Date.now(),
      accessCount: 0
    };
  }

  private generateNodeId(symbol: SymbolMeta): string {
    return createHash('sha256')
      .update(`${symbol.filePath}:${symbol.name}:${symbol.kind}`)
      .digest('hex')
      .substring(0, 16);
  }

  private addEdge(edge: DependencyEdge): string {
    const edgeId = this.getEdgeId(edge);
    
    // Add to graph
    this.graph.edges.set(edgeId, edge);
    
    // Update node connectivity
    const fromNodes = this.findNodes(n => n.symbol.name === edge.from);
    const toNodes = this.findNodes(n => n.symbol.name === edge.to);
    
    for (const fromNode of fromNodes) {
      fromNode.outgoingEdges.add(edgeId);
    }
    
    for (const toNode of toNodes) {
      toNode.incomingEdges.add(edgeId);
    }
    
    return edgeId;
  }

  private removeEdge(edgeId: string): void {
    const edge = this.graph.edges.get(edgeId);
    if (!edge) return;
    
    // Remove from graph
    this.graph.edges.delete(edgeId);
    
    // Update node connectivity
    for (const node of this.graph.nodes.values()) {
      node.incomingEdges.delete(edgeId);
      node.outgoingEdges.delete(edgeId);
    }
  }

  private removeNode(nodeId: string): void {
    const node = this.graph.nodes.get(nodeId);
    if (!node) return;
    
    // Remove all connected edges
    const edgesToRemove = [
      ...Array.from(node.incomingEdges),
      ...Array.from(node.outgoingEdges)
    ];
    
    for (const edgeId of edgesToRemove) {
      this.removeEdge(edgeId);
    }
    
    // Remove node
    this.graph.nodes.delete(nodeId);
  }

  private getEdgeId(edge: DependencyEdge): string {
    return createHash('sha256')
      .update(`${edge.from}->${edge.to}:${edge.type}`)
      .digest('hex')
      .substring(0, 16);
  }

  private calculateEdgeWeight(from: SymbolMeta, to: SymbolMeta): number {
    // Simple heuristic based on reference frequency and symbol types
    let weight = 1.0;
    
    // Boost weight for function calls
    if (from.kind === 'function' && to.kind === 'function') {
      weight *= 1.5;
    }
    
    // Boost weight for class relationships
    if (from.kind === 'class' || to.kind === 'class') {
      weight *= 1.3;
    }
    
    // Consider reference count
    const refCount = from.references.length;
    weight *= Math.min(1 + refCount * 0.1, 2.0);
    
    return weight;
  }

  private async buildCrossFileDependencies(
    symbols: SymbolMeta[],
    filePath: string
  ): Promise<DependencyEdge[]> {
    const edges: DependencyEdge[] = [];
    
    // Find import symbols
    const imports = symbols.filter(s => s.kind === 'import');
    
    for (const importSymbol of imports) {
      // Look for matching export in other files
      const exportNodes = this.findNodes(node => 
        node.symbol.kind === 'export' && 
        node.symbol.name === importSymbol.name &&
        node.symbol.filePath !== filePath
      );
      
      for (const exportNode of exportNodes) {
        edges.push({
          from: filePath,
          to: exportNode.symbol.filePath,
          type: 'imports',
          weight: 1.0
        });
      }
    }
    
    return edges;
  }

  private hasSymbolChanged(oldSymbol: SymbolMeta, newSymbol: SymbolMeta): boolean {
    return oldSymbol.signature !== newSymbol.signature ||
           oldSymbol.documentation !== newSymbol.documentation ||
           JSON.stringify(oldSymbol.range) !== JSON.stringify(newSymbol.range);
  }

  private shouldRecomputeProperties(update: GraphUpdate): boolean {
    const totalChanges = update.addedNodes.length + 
                        update.removedNodes.length + 
                        update.modifiedNodes.length;
    
    // Recompute if more than 10% of nodes changed
    const changeRatio = totalChanges / Math.max(this.graph.nodes.size, 1);
    return changeRatio > 0.1;
  }

  private async recomputeGraphProperties(): Promise<void> {
    // Compute PageRank-like importance scores
    await this.computeImportanceScores();
    
    // Compute centrality measures
    await this.computeCentralityScores();
    
    this.logger.debug('Graph properties recomputed', {
      nodeCount: this.graph.nodes.size,
      edgeCount: this.graph.edges.size
    });
  }

  private async computeImportanceScores(): Promise<void> {
    const dampingFactor = 0.85;
    const iterations = 10;
    const nodes = Array.from(this.graph.nodes.values());
    
    // Initialize scores
    const initialScore = 1.0 / nodes.length;
    for (const node of nodes) {
      node.importance = initialScore;
    }
    
    // Iterative computation
    for (let i = 0; i < iterations; i++) {
      const newScores = new Map<string, number>();
      
      for (const node of nodes) {
        let score = (1 - dampingFactor) / nodes.length;
        
        // Add contributions from incoming edges
        for (const edgeId of node.incomingEdges) {
          const edge = this.graph.edges.get(edgeId);
          if (!edge) continue;
          
          const sourceNodes = this.findNodes(n => n.symbol.name === edge.from);
          for (const sourceNode of sourceNodes) {
            const outDegree = sourceNode.outgoingEdges.size;
            if (outDegree > 0) {
              score += dampingFactor * (sourceNode.importance / outDegree) * edge.weight;
            }
          }
        }
        
        newScores.set(node.id, score);
      }
      
      // Update scores
      for (const node of nodes) {
        node.importance = newScores.get(node.id) || node.importance;
      }
    }
  }

  private async computeCentralityScores(): Promise<void> {
    // Simplified betweenness centrality
    for (const node of this.graph.nodes.values()) {
      node.centrality = this.calculateBetweennessCentrality(node.id);
    }
  }

  private calculateBetweennessCentrality(nodeId: string): number {
    // Simplified calculation - count how many shortest paths pass through this node
    let centrality = 0;
    const allNodes = Array.from(this.graph.nodes.keys());
    
    for (let i = 0; i < allNodes.length; i++) {
      for (let j = i + 1; j < allNodes.length; j++) {
        const path = this.findPath(allNodes[i], allNodes[j]);
        if (path && path.includes(nodeId) && path.length > 2) {
          centrality += 1;
        }
      }
    }
    
    return centrality;
  }

  private findConnectedComponent(startNodeId: string, visited: Set<string>): SymbolNode[] {
    const component: SymbolNode[] = [];
    const queue = [startNodeId];
    
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      
      const node = this.graph.nodes.get(nodeId);
      if (!node) continue;
      
      component.push(node);
      
      // Add connected nodes to queue
      const connectedEdges = [
        ...Array.from(node.outgoingEdges),
        ...Array.from(node.incomingEdges)
      ];
      
      for (const edgeId of connectedEdges) {
        const edge = this.graph.edges.get(edgeId);
        if (!edge) continue;
        
        const nextNodeId = edge.from === nodeId ? edge.to : edge.from;
        if (!visited.has(nextNodeId)) {
          queue.push(nextNodeId);
        }
      }
    }
    
    return component;
  }

  private getSymbolTypeDistribution(nodes: SymbolNode[]) {
    const distribution: Record<string, number> = {};
    
    for (const node of nodes) {
      const type = node.symbol.kind;
      distribution[type] = (distribution[type] || 0) + 1;
    }
    
    return distribution;
  }

  private getDependencyTypeDistribution(edges: DependencyEdge[]) {
    const distribution: Record<string, number> = {};
    
    for (const edge of edges) {
      const type = edge.type;
      distribution[type] = (distribution[type] || 0) + 1;
    }
    
    return distribution;
  }

  private createEmptyGraph(): SymbolGraph {
    return {
      nodes: new Map(),
      edges: new Map(),
      metadata: {
        version: 1,
        lastUpdated: Date.now(),
        nodeCount: 0,
        edgeCount: 0,
        buildTimeMs: 0
      }
    };
  }

  private updateGraphMetadata(buildTimeMs: number): void {
    this.graph.metadata = {
      version: this.graph.metadata.version + 1,
      lastUpdated: Date.now(),
      nodeCount: this.graph.nodes.size,
      edgeCount: this.graph.edges.size,
      buildTimeMs
    };
  }

  private emitTelemetry(eventName: string, properties: Record<string, any>): void {
    const event: TelemetryEvent = {
      name: eventName,
      timestamp: Date.now(),
      properties,
      metrics: {
        node_count: this.graph.nodes.size,
        edge_count: this.graph.edges.size,
        update_time_ms: properties.updateTimeMs
      }
    };
    
    // Send to telemetry system (TASK-034)
    this.logger.debug('Symbol graph telemetry', event);
  }
}

// Factory function
export function createSymbolGraphBuilder(logger: Logger): SymbolGraphBuilder {
  return new SymbolGraphBuilder(logger);
}
