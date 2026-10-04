import { VertexId, Point3D, Point2D, ConnectionType, WirePath, WireSegment, AllowedSegmentsOption, ProjectionType } from '../types/cube';

export const CUBE_VERTICES: Record<VertexId, Point3D> = {
  A: { x: -1, y: -1, z: 1 },  // dolní přední levý
  B: { x: 1, y: -1, z: 1 },   // dolní přední pravý
  C: { x: 1, y: -1, z: -1 },  // dolní zadní pravý
  D: { x: -1, y: -1, z: -1 }, // dolní zadní levý
  E: { x: -1, y: 1, z: 1 },   // horní přední levý
  F: { x: 1, y: 1, z: 1 },    // horní přední pravý
  G: { x: 1, y: 1, z: -1 },   // horní zadní pravý
  H: { x: -1, y: 1, z: -1 },  // horní zadní levý
};

export const VERTEX_NAMES: Record<VertexId, string> = {
  A: 'A (dolní přední levý)',
  B: 'B (dolní přední pravý)',
  C: 'C (dolní zadní pravý)',
  D: 'D (dolní zadní levý)',
  E: 'E (horní přední levý)',
  F: 'F (horní přední pravý)',
  G: 'G (horní zadní pravý)',
  H: 'H (horní zadní levý)',
};

export const ALL_VERTEX_IDS: VertexId[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

// 12 edges of the cube
export const CUBE_EDGES: [VertexId, VertexId][] = [
  // Dolní podstava
  ['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A'],
  // Horní podstava
  ['E', 'F'], ['F', 'G'], ['G', 'H'], ['H', 'E'],
  // Svislé hrany
  ['A', 'E'], ['B', 'F'], ['C', 'G'], ['D', 'H'],
];

export function getConnectionType(v1: VertexId, v2: VertexId): ConnectionType | null {
  if (v1 === v2) return null;
  const p1 = CUBE_VERTICES[v1];
  const p2 = CUBE_VERTICES[v2];
  const dx = Math.abs(p1.x - p2.x);
  const dy = Math.abs(p1.y - p2.y);
  const dz = Math.abs(p1.z - p2.z);

  const diffCount = (dx > 0 ? 1 : 0) + (dy > 0 ? 1 : 0) + (dz > 0 ? 1 : 0);

  if (diffCount === 1) return 'edge';
  if (diffCount === 2) return 'face_diagonal';
  if (diffCount === 3) return 'space_diagonal';
  return null;
}

export function isAllowedConnection(v1: VertexId, v2: VertexId, allowedOption: AllowedSegmentsOption): boolean {
  const type = getConnectionType(v1, v2);
  if (!type) return false;
  if (allowedOption === 'edges') return type === 'edge';
  if (allowedOption === 'edges_and_face_diagonals') return type === 'edge' || type === 'face_diagonal';
  return true; // 'all'
}

export function generateRandomWirePath(
  segmentCount: number = 5,
  allowedOption: AllowedSegmentsOption = 'edges_and_face_diagonals'
): WirePath {
  // Generate a random continuous 3D polyline without immediately backtracking
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    attempts++;
    const vertices: VertexId[] = [];
    const segments: WireSegment[] = [];

    // Pick start vertex
    const startIdx = Math.floor(Math.random() * ALL_VERTEX_IDS.length);
    let current = ALL_VERTEX_IDS[startIdx];
    vertices.push(current);

    let success = true;
    for (let i = 0; i < segmentCount; i++) {
      // Find candidate next vertices
      const candidates = ALL_VERTEX_IDS.filter(next => {
        if (next === current) return false;
        // Don't immediately backtrack to the vertex visited 1 step ago
        if (vertices.length >= 2 && next === vertices[vertices.length - 2]) return false;
        // Check allowed type
        return isAllowedConnection(current, next, allowedOption);
      });

      if (candidates.length === 0) {
        success = false;
        break;
      }

      // Prioritize vertices that haven't been visited as much to create an interesting 3D path
      const scoredCandidates = candidates.map(c => {
        const visitCount = vertices.filter(v => v === c).length;
        // Check if edge already traversed in this exact segment
        const traversed = segments.some(
          s => (s.from === current && s.to === c) || (s.from === c && s.to === current)
        );
        return {
          vertex: c,
          weight: traversed ? 0.2 : 1 / (visitCount + 1),
        };
      });

      // Weighted random selection
      const totalWeight = scoredCandidates.reduce((acc, c) => acc + c.weight, 0);
      let rand = Math.random() * totalWeight;
      let chosen = scoredCandidates[0].vertex;
      for (const item of scoredCandidates) {
        rand -= item.weight;
        if (rand <= 0) {
          chosen = item.vertex;
          break;
        }
      }

      const type = getConnectionType(current, chosen)!;
      segments.push({
        from: current,
        to: chosen,
        type,
        index: i,
      });

      current = chosen;
      vertices.push(current);
    }

    if (success && segments.length === segmentCount) {
      return { vertices, segments };
    }
  }

  // Fallback fallback simple known path if loop fails
  return {
    vertices: ['A', 'B', 'G', 'E', 'D', 'B'],
    segments: [
      { from: 'A', to: 'B', type: 'edge', index: 0 },
      { from: 'B', to: 'G', type: 'face_diagonal', index: 1 },
      { from: 'G', to: 'E', type: 'face_diagonal', index: 2 },
      { from: 'E', to: 'D', type: 'face_diagonal', index: 3 },
      { from: 'D', to: 'B', type: 'face_diagonal', index: 4 },
    ],
  };
}

/**
 * 2D projection coordinates in normalized space [-1, 1]
 * where -1 is left/bottom and +1 is right/top
 */
export function projectVertexTo2D(vertexId: VertexId, projection: ProjectionType): Point2D {
  const p = CUBE_VERTICES[vertexId];
  if (projection === 'narys') {
    // Front view (look from +Z towards -Z)
    // x: left (-1) to right (+1)
    // y: bottom (-1) to top (+1)
    return { x: p.x, y: p.y };
  } else if (projection === 'pudorys') {
    // Plan view (look from +Y downwards towards -Y)
    // x: left (-1) to right (+1)
    // y: in standard technical drawing, front (z = +1) is bottom (-1)
    //    and back (z = -1) is top (+1)
    return { x: p.x, y: -p.z };
  } else {
    // Bokorys (Side view - look from left towards right along +X)
    // Front (z = +1) is to the right (+1), back (z = -1) is to the left (-1)
    // y: bottom (-1) to top (+1)
    return { x: p.z, y: p.y };
  }
}

export interface CornerLabel {
  id: string; // e.g. "top-left"
  pos: Point2D; // [-1, 1]
  primary: VertexId;
  secondary: VertexId;
  displayLabel: string; // e.g. "E₂ (H₂)"
  description: string;
}

export function getProjectionCornerLabels(projection: ProjectionType): CornerLabel[] {
  if (projection === 'narys') {
    return [
      {
        id: 'tl',
        pos: { x: -1, y: 1 },
        primary: 'E',
        secondary: 'H',
        displayLabel: 'E₂ ≡ H₂',
        description: 'E (vpředu), H (vzadu)',
      },
      {
        id: 'tr',
        pos: { x: 1, y: 1 },
        primary: 'F',
        secondary: 'G',
        displayLabel: 'F₂ ≡ G₂',
        description: 'F (vpředu), G (vzadu)',
      },
      {
        id: 'bl',
        pos: { x: -1, y: -1 },
        primary: 'A',
        secondary: 'D',
        displayLabel: 'A₂ ≡ D₂',
        description: 'A (vpředu), D (vzadu)',
      },
      {
        id: 'br',
        pos: { x: 1, y: -1 },
        primary: 'B',
        secondary: 'C',
        displayLabel: 'B₂ ≡ C₂',
        description: 'B (vpředu), C (vzadu)',
      },
    ];
  } else if (projection === 'pudorys') {
    return [
      {
        id: 'tl',
        pos: { x: -1, y: 1 }, // back-left
        primary: 'D',
        secondary: 'H',
        displayLabel: 'D₁ ≡ H₁',
        description: 'H (nahoře), D (dole)',
      },
      {
        id: 'tr',
        pos: { x: 1, y: 1 }, // back-right
        primary: 'C',
        secondary: 'G',
        displayLabel: 'C₁ ≡ G₁',
        description: 'G (nahoře), C (dole)',
      },
      {
        id: 'bl',
        pos: { x: -1, y: -1 }, // front-left
        primary: 'A',
        secondary: 'E',
        displayLabel: 'A₁ ≡ E₁',
        description: 'E (nahoře), A (dole)',
      },
      {
        id: 'br',
        pos: { x: 1, y: -1 }, // front-right
        primary: 'B',
        secondary: 'F',
        displayLabel: 'B₁ ≡ F₁',
        description: 'F (nahoře), B (dole)',
      },
    ];
  } else {
    // Bokorys (pohled zleva)
    return [
      {
        id: 'tl',
        pos: { x: -1, y: 1 },
        primary: 'H',
        secondary: 'G',
        displayLabel: 'H₃ ≡ G₃',
        description: 'H (vlevo), G (vpravo)',
      },
      {
        id: 'tr',
        pos: { x: 1, y: 1 },
        primary: 'E',
        secondary: 'F',
        displayLabel: 'E₃ ≡ F₃',
        description: 'E (vlevo), F (vpravo)',
      },
      {
        id: 'bl',
        pos: { x: -1, y: -1 },
        primary: 'D',
        secondary: 'C',
        displayLabel: 'D₃ ≡ C₃',
        description: 'D (vlevo), C (vpravo)',
      },
      {
        id: 'br',
        pos: { x: 1, y: -1 },
        primary: 'A',
        secondary: 'B',
        displayLabel: 'A₃ ≡ B₃',
        description: 'A (vlevo), B (vpravo)',
      },
    ];
  }
}

/**
 * Checks whether a 3D wire segment projects to a point (degenerate) in a given view
 */
export function isSegmentPerpendicularToView(segment: WireSegment, projection: ProjectionType): boolean {
  const p1 = projectVertexTo2D(segment.from, projection);
  const p2 = projectVertexTo2D(segment.to, projection);
  return Math.abs(p1.x - p2.x) < 0.001 && Math.abs(p1.y - p2.y) < 0.001;
}

export function getProjectionNameCz(projection: ProjectionType): { title: string; subtitle: string; plane: string } {
  if (projection === 'narys') {
    return {
      title: 'Nárys',
      subtitle: 'Pohled zepředu',
      plane: 'Nárysna ν (svislá průmětna)',
    };
  } else if (projection === 'pudorys') {
    return {
      title: 'Půdorys',
      subtitle: 'Pohled shora',
      plane: 'Půdorysna π (vodorovná průmětna)',
    };
  } else {
    return {
      title: 'Bokorys',
      subtitle: 'Pohled z boku',
      plane: 'Bokorysna μ (profilová průmětna)',
    };
  }
}
