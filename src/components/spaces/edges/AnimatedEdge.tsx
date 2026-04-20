"use client";

// ============================================================
// Takamul Spaces — Animated Edge
// Color-coded animated connection lines between nodes
// ============================================================

import React from "react";
import { getBezierPath, BaseEdge, type EdgeProps, useReactFlow } from "@xyflow/react";
import { PORT_COLORS, type PortType } from "../lib/nodeRegistry";

export function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  data,
  selected,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.4,
  });

  // Determine color based on data type
  const dataType = (data?.portType as PortType) || 'any';
  const color = PORT_COLORS[dataType] || PORT_COLORS.any;

  return (
    <>
      {/* Glow effect behind the edge */}
      <path
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={selected ? 6 : 4}
        strokeOpacity={0.15}
        style={{ filter: `blur(4px)` }}
      />

      {/* Main edge path */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: selected ? 2.5 : 1.5,
          strokeOpacity: selected ? 1 : 0.6,
          ...style,
        }}
      />

      {/* Animated dot flowing along the edge */}
      <circle r="3" fill={color} filter={`drop-shadow(0 0 4px ${color})`}>
        <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
      </circle>
    </>
  );
}
