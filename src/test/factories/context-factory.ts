/**
 * Test Data Factory for Context Objects
 * Implements TASK-039: 회귀 테스트 스위트 1차 작성
 */

import { 
  ContextPack, 
  SymbolMeta, 
  EditDelta, 
  DependencyEdge, 
  CodeSlice,
  Position,
  Range
} from '@/lib/ai-engine/types'

export interface ContextFactoryOptions {
  symbolCount?: number
  editCount?: number
  dependencyCount?: number
  language?: ContextPack['language']
  filePath?: string
}

export class ContextFactory {
  static createPosition(line = 0, character = 0): Position {
    return { line, character }
  }

  static createRange(
    startLine = 0, 
    startChar = 0, 
    endLine = 0, 
    endChar = 10
  ): Range {
    return {
      start: { line: startLine, character: startChar },
      end: { line: endLine, character: endChar }
    }
  }

  static createSymbol(overrides: Partial<SymbolMeta> = {}): SymbolMeta {
    const defaults: SymbolMeta = {
      name: `testSymbol_${Math.random().toString(36).substr(2, 9)}`,
      kind: 'function',
      range: this.createRange(1, 0, 1, 20),
      filePath: '/test/file.ts',
      signature: 'function testSymbol(): void',
      documentation: 'Test symbol documentation',
      references: [this.createPosition(5, 10)],
      dependencies: ['otherSymbol']
    }

    return { ...defaults, ...overrides }
  }

  static createEditDelta(overrides: Partial<EditDelta> = {}): EditDelta {
    const defaults: EditDelta = {
      filePath: '/test/file.ts',
      timestamp: Date.now(),
      range: this.createRange(2, 0, 2, 5),
      oldText: 'old',
      newText: 'new',
      changeType: 'replace'
    }

    return { ...defaults, ...overrides }
  }

  static createDependencyEdge(overrides: Partial<DependencyEdge> = {}): DependencyEdge {
    const defaults: DependencyEdge = {
      from: 'symbolA',
      to: 'symbolB',
      type: 'references',
      weight: 1.0
    }

    return { ...defaults, ...overrides }
  }

  static createCodeSlice(overrides: Partial<CodeSlice> = {}): CodeSlice {
    const defaults: CodeSlice = {
      filePath: '/test/file.ts',
      content: `function example() {
  console.log('Hello, World!');
  return 42;
}`,
      range: this.createRange(0, 0, 3, 1),
      language: 'typescript' as const
    }

    return { ...defaults, ...overrides }
  }

  static createContextPack(options: ContextFactoryOptions = {}): ContextPack {
    const {
      symbolCount = 3,
      editCount = 2,
      dependencyCount = 2,
      language = 'typescript',
      filePath = '/test/file.ts'
    } = options

    const symbols = Array.from({ length: symbolCount }, (_, i) =>
      this.createSymbol({
        name: `symbol${i}`,
        filePath,
        kind: i % 2 === 0 ? 'function' : 'variable'
      })
    )

    const recentEdits = Array.from({ length: editCount }, (_, i) =>
      this.createEditDelta({
        filePath,
        timestamp: Date.now() - (i * 1000)
      })
    )

    const dependencyGraph = Array.from({ length: dependencyCount }, (_, i) =>
      this.createDependencyEdge({
        from: `symbol${i}`,
        to: `symbol${(i + 1) % symbolCount}`
      })
    )

    return {
      hash: `context_${Math.random().toString(36).substr(2, 16)}`,
      createdAt: Date.now(),
      ttl: 300,
      symbols,
      recentEdits,
      dependencyGraph,
      focusWindow: this.createCodeSlice({ filePath, language }),
      language,
      projectRoot: '/test/project',
      stats: {
        symbolCount: symbols.length,
        editCount: recentEdits.length,
        dependencyCount: dependencyGraph.length,
        buildTimeMs: Math.floor(Math.random() * 100)
      }
    }
  }

  static createMinimalContext(): ContextPack {
    return this.createContextPack({
      symbolCount: 0,
      editCount: 0,
      dependencyCount: 0
    })
  }

  static createLargeContext(): ContextPack {
    return this.createContextPack({
      symbolCount: 50,
      editCount: 20,
      dependencyCount: 100
    })
  }

  static createTypeScriptContext(): ContextPack {
    return this.createContextPack({
      language: 'typescript',
      filePath: '/src/components/Button.tsx'
    })
  }

  static createJavaScriptContext(): ContextPack {
    return this.createContextPack({
      language: 'javascript',
      filePath: '/src/utils/helpers.js'
    })
  }
}

// Snapshot data for regression tests
export const GOLDEN_CONTEXTS = {
  basic: {
    hash: 'golden_basic_context',
    createdAt: 1640995200000, // Fixed timestamp for consistency
    ttl: 300,
    symbols: [
      {
        name: 'calculateSum',
        kind: 'function' as const,
        range: { start: { line: 1, character: 0 }, end: { line: 3, character: 1 } },
        filePath: '/src/math.ts',
        signature: 'function calculateSum(a: number, b: number): number',
        references: [{ line: 10, character: 5 }],
        dependencies: []
      }
    ],
    recentEdits: [
      {
        filePath: '/src/math.ts',
        timestamp: 1640995100000,
        range: { start: { line: 2, character: 2 }, end: { line: 2, character: 7 } },
        oldText: 'a + b',
        newText: 'a + b + 0',
        changeType: 'replace' as const
      }
    ],
    dependencyGraph: [],
    focusWindow: {
      filePath: '/src/math.ts',
      content: 'function calculateSum(a: number, b: number): number {\n  return a + b;\n}',
      range: { start: { line: 0, character: 0 }, end: { line: 2, character: 1 } },
      language: 'typescript' as const
    },
    language: 'typescript' as const,
    projectRoot: '/project',
    stats: {
      symbolCount: 1,
      editCount: 1,
      dependencyCount: 0,
      buildTimeMs: 45
    }
  }
} as const
