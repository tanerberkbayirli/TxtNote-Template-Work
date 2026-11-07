import { useEffect, useRef } from 'react';

/**
 * A dark caret drawn where the open cite form (ThesisSources) will put the citation. The side panel has focus, so the
 * editor's own caret is invisible; this one follows the remembered caret (a click in the text moves it), scrolling,
 * typing and re-pagination. `getRect` returns a viewport box or null; the marker hides outside the page viewport `clipRef`.
 */
export default function CitationCaretMarker({ active, getRect, clipRef }) {
  const markerRef = useRef(null);
  const getRectRef = useRef(getRect);
  getRectRef.current = getRect;
  useEffect(() => {
    if (!active) return undefined;
    const place = () => {
      const marker = markerRef.current;
      if (!marker) return;
      let rect = null;
      try { rect = getRectRef.current(); } catch { rect = null; }
      const clip = clipRef?.current?.getBoundingClientRect();
      const visible = rect && (!clip || (rect.top + rect.height > clip.top && rect.top < clip.bottom && rect.left >= clip.left && rect.left <= clip.right));
      marker.hidden = !visible;
      if (visible) {
        marker.style.transform = `translate(${Math.round(rect.left - 1.5)}px, ${Math.round(rect.top)}px)`;
        marker.style.height = `${Math.round(rect.height)}px`;
      }
    };
    // The caret is remembered on selectionchange (useFormatMenu); place after it. The interval catches re-pagination and zoom.
    const later = () => setTimeout(place, 0);
    place();
    document.addEventListener('selectionchange', later);
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    document.addEventListener('input', later, true);
    const timer = setInterval(place, 300);
    return () => {
      document.removeEventListener('selectionchange', later);
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
      document.removeEventListener('input', later, true);
      clearInterval(timer);
    };
  }, [active, clipRef]);
  if (!active) return null;
  return <div ref={markerRef} className="thesis-citation-caret" data-testid="citation-caret" aria-hidden="true" hidden/>;
}
