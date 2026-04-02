import { useState } from 'react';

function getDefectMarkers(analysis, side = 'front') {
  const markers = [];
  if (!analysis) return markers;

  const { corners, surfaces, edges, centering } = analysis;

  // Corner defects
  const cornerPositions = {
    [`${side}_top_left`]: { x: 8, y: 8 },
    [`${side}_top_right`]: { x: 92, y: 8 },
    [`${side}_bottom_left`]: { x: 8, y: 92 },
    [`${side}_bottom_right`]: { x: 92, y: 92 },
  };

  Object.entries(cornerPositions).forEach(([key, pos]) => {
    const corner = corners?.[key];
    if (corner && corner.severity > 2) {
      markers.push({
        id: key,
        x: pos.x,
        y: pos.y,
        type: 'corner',
        label: key.replace(/_/g, ' ').replace(/front |back /, ''),
        severity: corner.severity,
        detail: `${corner.grade}${corner.whitening ? ' · Whitening' : ''}`,
        notes: corner.notes,
      });
    }
  });

  // Surface defects on front
  const surf = surfaces?.[side];
  if (surf) {
    if (surf.holo_scratches?.count > 0) {
      markers.push({
        id: `${side}_holo`,
        x: 50,
        y: 35,
        type: 'surface',
        label: 'Holo Scratches',
        severity: surf.holo_scratches.count,
        detail: `${surf.holo_scratches.count} scratch(es) — ${surf.holo_scratches.severity}`,
        notes: surf.holo_scratches.notes,
      });
    }
    if (surf.surface_scratches?.count > 0) {
      markers.push({
        id: `${side}_scratch`,
        x: 55,
        y: 55,
        type: 'surface',
        label: 'Surface Scratches',
        severity: surf.surface_scratches.count,
        detail: `${surf.surface_scratches.count} scratch(es) — ${surf.surface_scratches.severity}`,
        notes: surf.surface_scratches.notes,
      });
    }
    if (surf.print_defects?.present) {
      markers.push({
        id: `${side}_print`,
        x: 40,
        y: 60,
        type: 'surface',
        label: 'Print Defects',
        severity: 5,
        detail: surf.print_defects.description,
        notes: null,
      });
    }
    if (surf.stains?.present) {
      markers.push({
        id: `${side}_stain`,
        x: 60,
        y: 70,
        type: 'surface',
        label: 'Staining',
        severity: 5,
        detail: surf.stains.description,
        notes: null,
      });
    }
    if (surf.indentations?.present) {
      markers.push({
        id: `${side}_indent`,
        x: 45,
        y: 45,
        type: 'surface',
        label: 'Indentations',
        severity: 6,
        detail: surf.indentations.description,
        notes: null,
      });
    }
  }

  // Edge defects
  const edgePositions = {
    top: { x: 50, y: 3 },
    bottom: { x: 50, y: 97 },
    left: { x: 3, y: 50 },
    right: { x: 97, y: 50 },
  };

  Object.entries(edgePositions).forEach(([edge, pos]) => {
    const edgeData = edges?.[edge];
    if (edgeData && (edgeData.whitening || edgeData.nicks || edgeData.score < 8)) {
      markers.push({
        id: `edge_${edge}`,
        x: pos.x,
        y: pos.y,
        type: 'edge',
        label: `${edge.charAt(0).toUpperCase() + edge.slice(1)} Edge`,
        severity: 10 - (edgeData.score ?? 5),
        detail: `${edgeData.condition}${edgeData.whitening ? ' · Whitening' : ''}${edgeData.nicks ? ' · Nicks' : ''}`,
        notes: null,
      });
    }
  });

  // Centering issue
  const frontCentering = centering?.front;
  if (frontCentering && !frontCentering.within_gem_mint && side === 'front') {
    markers.push({
      id: 'centering',
      x: 85,
      y: 15,
      type: 'centering',
      label: 'Centering Off',
      severity: frontCentering.within_mint ? 3 : 6,
      detail: `L/R: ${frontCentering.left_right_ratio} · T/B: ${frontCentering.top_bottom_ratio}`,
      notes: frontCentering.notes,
    });
  }

  return markers;
}

const typeColors = {
  corner: '#ef4444',
  surface: '#f97316',
  edge: '#eab308',
  centering: '#3b82f6',
};

function DefectMarker({ marker }) {
  const [hovered, setHovered] = useState(false);
  const color = typeColors[marker.type] || '#6b7280';

  return (
    <div
      className="absolute"
      style={{
        left: `${marker.x}%`,
        top: `${marker.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
      }}
    >
      <div
        className="relative cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Ping ring */}
        <div
          className="absolute inset-0 rounded-full animate-ping"
          style={{
            background: color,
            opacity: 0.3,
            transform: 'scale(2)',
          }}
        />
        {/* Marker dot */}
        <div
          className="relative w-3 h-3 rounded-full border-2 border-white/30 shadow-lg"
          style={{ background: color }}
        />

        {/* Tooltip */}
        {hovered && (
          <div
            className="absolute z-20 bg-charcoal-light border border-platinum/20 rounded-lg p-3 shadow-2xl min-w-[160px]"
            style={{
              left: marker.x > 50 ? 'auto' : '100%',
              right: marker.x > 50 ? '100%' : 'auto',
              top: marker.y > 50 ? 'auto' : '100%',
              bottom: marker.y > 50 ? '100%' : 'auto',
              marginLeft: marker.x > 50 ? 0 : 8,
              marginRight: marker.x > 50 ? 8 : 0,
              marginTop: marker.y > 50 ? 0 : 8,
              marginBottom: marker.y > 50 ? 8 : 0,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="text-xs font-semibold text-platinum">{marker.label}</span>
            </div>
            <p className="text-xs text-platinum/60 font-mono">{marker.detail}</p>
            {marker.notes && (
              <p className="text-xs text-platinum/40 mt-1 font-mono">{marker.notes}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DefectMap({ analysis, imageUrl, side = 'front' }) {
  const markers = getDefectMarkers(analysis, side);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full" style={{ paddingBottom: '140%' }}>
        <div className="absolute inset-0 rounded-xl overflow-hidden bg-charcoal-surface border border-platinum/10">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`Card ${side}`}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-platinum/30 text-sm font-mono">
              No image
            </div>
          )}

          {/* Defect markers overlay */}
          {markers.map(marker => (
            <DefectMarker key={marker.id} marker={marker} />
          ))}
        </div>
      </div>

      {/* Legend */}
      {markers.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {Object.entries(typeColors).map(([type, color]) => {
            const hasType = markers.some(m => m.type === type);
            if (!hasType) return null;
            return (
              <div key={type} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                <span className="text-xs font-mono text-platinum/50 capitalize">{type}</span>
              </div>
            );
          })}
        </div>
      )}

      {markers.length === 0 && (
        <p className="text-xs text-green-400/70 font-mono text-center">
          No significant defects detected on {side}
        </p>
      )}
    </div>
  );
}
