"use client";

export default function TextOverlay({
  editingId,
  overlayRect,
  editText,
  setEditText,
  commitTextEdit,
  setEditingId,
  setOverlayRect,
}) {
  if (!editingId || !overlayRect) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
      onMouseDown={commitTextEdit}
    >
      <textarea
        autoFocus
        value={editText}
        onChange={(e) => setEditText(e.target.value)}
        onBlur={commitTextEdit}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setEditingId(null);
            setOverlayRect(null);
          }
          e.stopPropagation();
        }}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          left: overlayRect.left,
          top: overlayRect.top,
          width: overlayRect.width + 20,
          minHeight: overlayRect.height + 8,
          fontSize: overlayRect.fontSize,
          fontWeight: overlayRect.fontWeight,
          color: overlayRect.color,
          textAlign: overlayRect.textAlign,
          background: 'rgba(219,234,254,0.95)',
          border: '2px solid #3b82f6',
          borderRadius: 6,
          padding: '3px 6px',
          outline: 'none',
          resize: 'both',
          lineHeight: 1.4,
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          zIndex: 9999,
          boxShadow: '0 4px 24px rgba(59,130,246,0.3)',
        }}
      />
    </div>
  );
}
