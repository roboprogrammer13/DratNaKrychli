export type VertexId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

export interface Point3D {
  x: number; // -1 (left) to +1 (right)
  y: number; // -1 (bottom) to +1 (top)
  z: number; // -1 (back) to +1 (front)
}

export interface Point2D {
  x: number;
  y: number;
}

export type ConnectionType = 'edge' | 'face_diagonal' | 'space_diagonal';

export interface WireSegment {
  from: VertexId;
  to: VertexId;
  type: ConnectionType;
  index: number;
}

export interface WirePath {
  vertices: VertexId[];
  segments: WireSegment[];
}

export type ProjectionType = 'narys' | 'pudorys' | 'bokorys';

export type AllowedSegmentsOption = 'edges' | 'edges_and_face_diagonals' | 'all';

export type AppMode = 'reveal' | 'draw_quiz';

export interface VertexProjectionInfo {
  id: VertexId;
  label: string; // e.g., "A₂" or "D₁"
  coincidentWith: VertexId; // e.g. D in Nárys
  point2D: Point2D; // in normalized coords [-1, 1]
}
