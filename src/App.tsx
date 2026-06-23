/**
 * Repro: @xyflow/system crashes in clampPositionToParent when
 * nodeLookup.get(node.parentId) returns undefined.
 *
 * Crash site — @xyflow/system store.ts:457:
 *   clampPositionToParent(positionAbsolute, dimensions, nodeLookup.get(node.parentId)!)
 *
 * Click "Remove parent" to trigger the crash.
 */

import { useCallback, useEffect, useState } from 'react';
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

export function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([PARENT, CHILD]);
  const [edges, , onEdgesChange] = useEdgesState([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: ErrorEvent) => {
      if (e.message.includes('measured')) {
        e.preventDefault();
        setError(e.message);
      }
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  const removeParent = useCallback(() => {
    setNodes([CHILD]);
  }, [setNodes]);

  if (error) {
    return (
      <div style={{ padding: 32, fontFamily: 'monospace' }}>
        <h2 style={{ color: '#e53e3e' }}>Crash reproduced!</h2>
        <pre style={{ background: '#fee', padding: 16, borderRadius: 8, whiteSpace: 'pre-wrap' }}>
          {error}
        </pre>
        <p style={{ marginTop: 16 }}>
          Bug: <code>@xyflow/system store.ts:457</code> calls{' '}
          <code>clampPositionToParent(pos, dims, nodeLookup.get(node.parentId)!)</code>{' '}
          without null-checking the lookup result.
        </p>
        <p>
          The crash is inside a <code>ResizeObserver</code> callback, so React
          ErrorBoundaries cannot catch it.
        </p>
        <button onClick={() => window.location.reload()}
          style={{ marginTop: 16, padding: '8px 16px', cursor: 'pointer' }}>
          Reload
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      />
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}>
        <button onClick={removeParent}
          style={{ padding: '8px 16px', background: '#e53e3e', color: 'white',
            border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>
          Remove parent → triggers crash
        </button>
      </div>
    </div>
  );
}
