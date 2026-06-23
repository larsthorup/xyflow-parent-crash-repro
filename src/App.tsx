/**
 * Repro: @xyflow/system crashes in clampPositionToParent when
 * nodeLookup.get(node.parentId) returns undefined.
 *
 * Crash site — @xyflow/system store.ts:457:
 *   clampPositionToParent(positionAbsolute, dimensions, nodeLookup.get(node.parentId)!)
 *
 * Click "Remove parent" to trigger the crash.
 */

import { Component, useCallback, useState, type ReactNode } from 'react';
import { ReactFlow, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Node } from '@xyflow/react';

const PARENT: Node = {
  id: 'parent-1',
  type: 'default',
  position: { x: 0, y: 0 },
  data: { label: 'Parent' },
  style: { width: 300, height: 200, border: '2px solid #666', borderRadius: 8 },
};

const CHILD: Node = {
  id: 'child-1',
  type: 'default',
  parentId: 'parent-1',
  extent: 'parent',
  position: { x: 10, y: 50 },
  data: { label: 'Child (extent: parent)' },
};

function Graph() {
  const [nodes, setNodes, onNodesChange] = useNodesState([PARENT, CHILD]);
  const [edges, , onEdgesChange] = useEdgesState([]);

  const removeParent = useCallback(() => {
    // Remove parent but keep child — nodeLookup no longer has 'parent-1'.
    // When xyflow re-processes the child, it calls:
    //   clampPositionToParent(pos, dims, nodeLookup.get('parent-1'))
    // which is undefined → getNodeDimensions(undefined) → crash
    setNodes([CHILD]);
  }, [setNodes]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      />
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}>
        <button
          onClick={removeParent}
          style={{
            padding: '8px 16px',
            background: '#e53e3e',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Remove parent → triggers crash
        </button>
      </div>
    </div>
  );
}

export function App() {
  const [error, setError] = useState<Error | null>(null);

  if (error) {
    return (
      <div style={{ padding: 32, fontFamily: 'monospace' }}>
        <h2 style={{ color: '#e53e3e' }}>💥 Crash reproduced!</h2>
        <pre style={{ background: '#fee', padding: 16, borderRadius: 8, whiteSpace: 'pre-wrap' }}>
          {error.message}
        </pre>
        <p style={{ marginTop: 16 }}>
          Bug: <code>@xyflow/system</code> calls{' '}
          <code>clampPositionToParent(pos, dims, nodeLookup.get(node.parentId)!)</code>{' '}
          without null-checking the parent lookup result.
        </p>
        <p>
          When the parent node is absent from <code>nodeLookup</code>,{' '}
          <code>getNodeDimensions(undefined)</code> throws{' '}
          <em>"Cannot read properties of undefined (reading 'measured')"</em>.
        </p>
        <p style={{ marginTop: 16 }}>
          <strong>Affected:</strong> @xyflow/system 0.0.68 – 0.0.78 (latest).
          Still unfixed on xyflow <code>main</code> branch.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{ marginTop: 16, padding: '8px 16px', cursor: 'pointer' }}
        >
          Reload to try again
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ErrorBoundary onError={setError}>
        <Graph />
      </ErrorBoundary>
    </div>
  );
}

class ErrorBoundary extends Component<
  { children: ReactNode; onError: (e: Error) => void },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    this.props.onError(error);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}
