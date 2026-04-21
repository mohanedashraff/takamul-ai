// ============================================================
// Yilow Spaces — Node Validation
// Validates connections between nodes based on port types
// ============================================================

import { type PortType, NODE_TYPES } from './nodeRegistry';

// Connection compatibility matrix
// key = source type, value = set of compatible target types
const COMPATIBILITY: Record<PortType, Set<PortType>> = {
  text: new Set(['text', 'any']),
  image: new Set(['image', 'any']),
  video: new Set(['video', 'any']),
  audio: new Set(['audio', 'any']),
  any: new Set(['text', 'image', 'video', 'audio', 'any']),
};

/**
 * Check if a source port type can connect to a target port type
 */
export function isCompatible(sourceType: PortType, targetType: PortType): boolean {
  return COMPATIBILITY[sourceType]?.has(targetType) ?? false;
}

/**
 * Get the port type from a handle ID (e.g., "text-out" → looks up the node type)
 */
export function getPortType(nodeType: string, handleId: string, isSource: boolean): PortType | null {
  const def = NODE_TYPES[nodeType];
  if (!def) return null;

  const ports = isSource ? def.outputs : def.inputs;
  const port = ports.find(p => p.id === handleId);
  return port?.type ?? null;
}

/**
 * Get the color for a given port type
 */
export function getPortColor(type: PortType): string {
  const colors: Record<PortType, string> = {
    text: '#A78BFA',
    image: '#22D3EE',
    video: '#F59E0B',
    audio: '#34D399',
    any: '#94A3B8',
  };
  return colors[type] || colors.any;
}

/**
 * Get edge color based on the source port type
 */
export function getEdgeColor(sourceNodeType: string, sourceHandleId: string): string {
  const portType = getPortType(sourceNodeType, sourceHandleId, true);
  return portType ? getPortColor(portType) : '#94A3B8';
}
