import React, { useEffect, useMemo, useRef, useState } from 'react';
import { convertLength } from '../../thesis/units.js';

const cssPx = (mm, zoom) => convertLength(mm, 'mm', 'px') * zoom;
const toMm = (px, zoom) => convertLength(px / zoom, 'px', 'mm');
const newGuideId = () => `guide-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function formatPosition(positionMm, unit) {
  const value = convertLength(positionMm, 'mm', unit);
  return `${Number(value.toFixed(unit === 'mm' ? 1 : 2))} ${unit}`;
}

/** Controlled physical rulers and guide handles for the page editor. */
export default function LayoutRulers({ page, zoom = 1, guides = [], onGuidesChange, unit = 'mm', children }) {
  const rootRef = useRef(null);
  const dragRef = useRef(null);
  const draftGuidesRef = useRef(null);
  const onGuidesChangeRef = useRef(onGuidesChange);
  const [draggingId, setDraggingId] = useState(null);
  const [draftGuides, setDraftGuides] = useState(null);
  onGuidesChangeRef.current = onGuidesChange;
  const visibleGuides = draftGuides ?? guides;
  const widthPx = cssPx(page?.widthMm ?? 0, zoom);
  const heightPx = cssPx(page?.heightMm ?? 0, zoom);
  const minorMm = unit === 'pt' ? convertLength(1, 'pt', 'mm') : unit === 'in' || unit === 'inch' ? 2.54 : 1;
  const majorEvery = (unit === 'pt' ? 36 : 10) * Math.max(1, Math.ceil(0.65 / zoom));
  const horizontalTicks = useMemo(() => makeTicks(page?.widthMm ?? 0, minorMm, majorEvery), [page?.widthMm, minorMm, majorEvery]);
  const verticalTicks = useMemo(() => makeTicks(page?.heightMm ?? 0, minorMm, majorEvery), [page?.heightMm, minorMm, majorEvery]);

  useEffect(() => {
    const endDrag = (event) => {
      const drag = dragRef.current;
      if (drag && event.type === 'pointerup' && draftGuidesRef.current) {
        onGuidesChangeRef.current?.(draftGuidesRef.current);
      }
      dragRef.current = null;
      draftGuidesRef.current = null;
      setDraftGuides(null);
      setDraggingId(null);
    };
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    const cancelDrag = (event) => { if (event.key === 'Escape' && dragRef.current) endDrag({ type: 'pointercancel' }); };
    window.addEventListener('keydown', cancelDrag);
    return () => {
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
      window.removeEventListener('keydown', cancelDrag);
    };
  }, []);

  function positionFromEvent(event, axis) {
    const root = rootRef.current;
    if (!root) return 0;
    const ruler = root.querySelector(axis === 'x' ? '[data-ruler-axis="x"]' : '[data-ruler-axis="y"]');
    if (!ruler) return 0;
    const bounds = ruler.getBoundingClientRect();
    return Math.max(0, Math.min(axis === 'x' ? page.widthMm : page.heightMm,
      toMm((axis === 'x' ? event.clientX - bounds.left : event.clientY - bounds.top), zoom)));
  }

  function startNewGuide(event, axis) {
    if (event.button !== 0) return;
    event.preventDefault();
    const guide = { id: newGuideId(), axis, positionMm: positionFromEvent(event, axis), locked: false };
    const initial = guides;
    dragRef.current = { id: guide.id, axis, originalGuides: initial };
    draftGuidesRef.current = [...initial, guide];
    setDraftGuides(draftGuidesRef.current);
    setDraggingId(guide.id);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function startMoveGuide(event, guide) {
    if (event.button !== 0 || guide.locked) return;
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = { id: guide.id, axis: guide.axis, originalGuides: guides };
    draftGuidesRef.current = guides;
    setDraftGuides(guides);
    setDraggingId(guide.id);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function moveGuide(event) {
    const active = dragRef.current;
    if (!active) return;
    const positionMm = positionFromEvent(event, active.axis);
    const updated = (draftGuidesRef.current ?? guides).map((guide) => guide.id === active.id ? { ...guide, positionMm } : guide);
    draftGuidesRef.current = updated;
    setDraftGuides(updated);
  }

  function deleteGuide(event, guide) {
    event.preventDefault();
    event.stopPropagation();
    if (!guide.locked) onGuidesChange?.(guides.filter((item) => item.id !== guide.id));
  }

  function toggleLock(event, guide) {
    event.preventDefault();
    event.stopPropagation();
    onGuidesChange?.(guides.map((item) => item.id === guide.id ? { ...item, locked: !item.locked } : item));
  }

  const horizontalRulerGuides = visibleGuides.filter((guide) => guide.axis === 'x');
  const verticalRulerGuides = visibleGuides.filter((guide) => guide.axis === 'y');
  const rulerSurface = 'var(--thesis-ruler-background, #f3f4f6)';
  const rulerInk = 'var(--thesis-ruler-foreground, #4b5563)';
  return <div ref={rootRef} className="thesis-layout-rulers" onPointerMove={moveGuide}
    style={{ display: 'grid', gridTemplateColumns: '24px max-content', gridTemplateRows: '24px max-content', width: 'max-content', color: rulerInk, font: '10px/1 sans-serif' }}>
    <div className="thesis-ruler-corner" aria-hidden="true" data-thesis-editor-only=""
      style={{ gridColumn: 1, gridRow: 1, background: rulerSurface, borderRight: '1px solid currentColor', borderBottom: '1px solid currentColor' }} />
    <div className="thesis-ruler thesis-ruler-horizontal" data-ruler-axis="x" data-thesis-editor-only=""
      style={{ gridColumn: 2, gridRow: 1, width: widthPx, height: 24, touchAction: 'none', position: 'relative', userSelect: 'none', background: rulerSurface, borderBottom: '1px solid currentColor', boxSizing: 'border-box' }}
      aria-label={`Horizontal ruler, ${formatPosition(page.widthMm, unit)} wide`} onPointerDown={(event) => startNewGuide(event, 'x')}>
      <RulerTicks ticks={horizontalTicks} zoom={zoom} unit={unit} vertical={false} />
      {horizontalRulerGuides.map((guide) => <GuideHandle key={guide.id} guide={guide} offset={cssPx(guide.positionMm, zoom)}
        vertical={true} active={draggingId === guide.id} onPointerDown={(event) => startMoveGuide(event, guide)}
        onDoubleClick={(event) => deleteGuide(event, guide)} onContextMenu={(event) => toggleLock(event, guide)} />)}
    </div>
    <div className="thesis-ruler thesis-ruler-vertical" data-ruler-axis="y" data-thesis-editor-only=""
      style={{ gridColumn: 1, gridRow: 2, width: 24, height: heightPx, touchAction: 'none', position: 'relative', userSelect: 'none', background: rulerSurface, borderRight: '1px solid currentColor', boxSizing: 'border-box' }}
      aria-label={`Vertical ruler, ${formatPosition(page.heightMm, unit)} tall`} onPointerDown={(event) => startNewGuide(event, 'y')}>
      <RulerTicks ticks={verticalTicks} zoom={zoom} unit={unit} vertical={true} />
      {verticalRulerGuides.map((guide) => <GuideHandle key={guide.id} guide={guide} offset={cssPx(guide.positionMm, zoom)}
        vertical={false} active={draggingId === guide.id} onPointerDown={(event) => startMoveGuide(event, guide)}
        onDoubleClick={(event) => deleteGuide(event, guide)} onContextMenu={(event) => toggleLock(event, guide)} />)}
    </div>
    <div className="thesis-ruler-page-content" style={{ gridColumn: 2, gridRow: 2, width: widthPx, minHeight: heightPx, position: 'relative' }}>
      {children}
      <div aria-hidden="true" data-thesis-editor-only="" style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none', zIndex: 1000 }}>
        {visibleGuides.map((guide) => guide.axis === 'x'
          ? <span key={guide.id} className="thesis-layout-guide-line" style={{ position: 'absolute', left: cssPx(guide.positionMm, zoom), top: 0, bottom: 0, borderLeft: `1px ${guide.locked ? 'dashed' : 'solid'} #2563eb` }} />
          : <span key={guide.id} className="thesis-layout-guide-line" style={{ position: 'absolute', top: cssPx(guide.positionMm, zoom), left: 0, right: 0, borderTop: `1px ${guide.locked ? 'dashed' : 'solid'} #2563eb` }} />)}
      </div>
    </div>
  </div>;
}

/** Hundreds of tick elements per ruler: memoized so a keystroke in the page text does not re-render them. */
const RulerTicks = React.memo(function RulerTicks({ ticks, zoom, unit, vertical }) {
  const label = (tick) => Number(convertLength(tick.mm, 'mm', unit).toFixed(unit === 'mm' ? 0 : 2));
  return <>{ticks.map((tick) => vertical
    ? <span key={tick.index} className={`thesis-ruler-tick${tick.major ? ' is-major' : ''}`}
      style={{ position: 'absolute', top: cssPx(tick.mm, zoom), right: 0, width: tick.major ? 14 : 6, borderTop: '1px solid currentColor', boxSizing: 'border-box', pointerEvents: 'none' }}>
      {tick.major && <span style={{ position: 'absolute', top: 2, right: 3, whiteSpace: 'nowrap', writingMode: 'vertical-rl', pointerEvents: 'none' }}>{label(tick)}</span>}
    </span>
    : <span key={tick.index} className={`thesis-ruler-tick${tick.major ? ' is-major' : ''}`}
      style={{ position: 'absolute', left: cssPx(tick.mm, zoom), bottom: 0, height: tick.major ? 14 : 6, borderLeft: '1px solid currentColor', boxSizing: 'border-box', pointerEvents: 'none' }}>
      {tick.major && <span style={{ position: 'absolute', top: 2, left: 3, whiteSpace: 'nowrap', pointerEvents: 'none' }}>{label(tick)}</span>}
    </span>)}</>;
});

function makeTicks(extentMm, minorMm, majorEvery) {
  const total = Math.floor(extentMm / minorMm + 1e-7);
  return Array.from({ length: total + 1 }, (_, index) => ({
    index,
    mm: index * minorMm,
    major: index % majorEvery === 0,
  }));
}

function GuideHandle({ guide, offset, vertical, active, onPointerDown, onDoubleClick, onContextMenu }) {
  return <button type="button" className={`thesis-ruler-guide${active ? ' is-dragging' : ''}${guide.locked ? ' is-locked' : ''}`}
    data-thesis-editor-only="" aria-label={`${guide.axis === 'x' ? 'Vertical' : 'Horizontal'} guide at ${guide.positionMm} mm; double click to delete, right click to ${guide.locked ? 'unlock' : 'lock'}`}
    title={`${guide.positionMm.toFixed(2)} mm · double-click delete · right-click ${guide.locked ? 'unlock' : 'lock'}`}
    onPointerDown={onPointerDown} onDoubleClick={onDoubleClick} onContextMenu={onContextMenu}
    style={vertical
      ? { position: 'absolute', left: offset - 5, top: 0, width: 10, height: 24, padding: 0, border: 0, background: 'transparent', cursor: guide.locked ? 'default' : 'ew-resize', zIndex: 2 }
      : { position: 'absolute', top: offset - 5, left: 0, width: 24, height: 10, padding: 0, border: 0, background: 'transparent', cursor: guide.locked ? 'default' : 'ns-resize', zIndex: 2 }}>
    <span aria-hidden="true" style={vertical
      ? { position: 'absolute', left: 4, top: 0, bottom: 0, borderLeft: `2px solid ${guide.locked ? '#6b7280' : '#2563eb'}` }
      : { position: 'absolute', top: 4, left: 0, right: 0, borderTop: `2px solid ${guide.locked ? '#6b7280' : '#2563eb'}` }} />
  </button>;
}
