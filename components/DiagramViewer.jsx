'use client';
import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Download, ZoomIn, ZoomOut, RefreshCcw } from 'lucide-react';

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'strict',
  fontFamily: 'Inter, sans-serif'
});

export default function DiagramViewer({ chart }) {
  const containerRef = useRef(null);
  const [svgContent, setSvgContent] = useState('');
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 4));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.3));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (!svgContent || error) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    if (!svgContent || error) return;
    const zoomSensitivity = 0.005;
    setScale(prev => Math.min(Math.max(prev - e.deltaY * zoomSensitivity, 0.3), 4));
  };

  useEffect(() => {
    let isMounted = true;

    const renderDiagram = async () => {
      if (!chart || !containerRef.current) return;
      setError(null);

      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'strict',
          fontFamily: 'Inter, sans-serif'
        });

        const id = `mermaidSvg-${Math.round(Math.random() * 1000000)}`;
        const { svg } = await mermaid.render(id, chart);

        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Mermaid parsing error:", err);
          setError("Failed to parse diagram notation. The AI might have generated invalid syntax.");
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  const handleDownload = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!chart) {
    return (
      <div className="diagram-container placeholder" style={{ color: 'var(--text-muted)' }}>
        <span>No diagram generated yet</span>
      </div >
    );
  }

  return (
    <div
      className="diagram-container glass-panel"
      style={{
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        cursor: (!svgContent || error) ? 'default' : (isDragging ? 'grabbing' : 'grab')
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Actions toolbar */}
      {svgContent && !error && (
        <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem', zIndex: 10 }}>
          <button
            onClick={handleZoomIn}
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              padding: '0.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(5px)'
            }}
            title="Zoom In"
          >
            <ZoomIn size={18} />
          </button>

          <button
            onClick={handleZoomOut}
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              padding: '0.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(5px)'
            }}
            title="Zoom Out"
          >
            <ZoomOut size={18} />
          </button>

          <button
            onClick={handleReset}
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              padding: '0.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(5px)'
            }}
            title="Reset View"
          >
            <RefreshCcw size={18} />
          </button>

          <button
            onClick={handleDownload}
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              padding: '0.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(5px)'
            }}
            title="Download SVG"
          >
            <Download size={18} />
          </button>
        </div>
      )}

      {error ? (
        <div style={{ color: '#ef4444', textAlign: 'center', maxWidth: '80%' }}>
          <p style={{ fontWeight: 'bold' }}>Diagram Error</p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>{error}</p>
          <div style={{
            background: 'var(--error-bg)',
            padding: '1rem',
            borderRadius: '8px',
            marginTop: '1rem',
            textAlign: 'left',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            fontSize: '12px',
            color: 'var(--text-muted)'
          }}>
            {chart}
          </div>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="mermaid"
          dangerouslySetInnerHTML={{ __html: svgContent }}
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
          }}
        />
      )}
    </div>
  );
}
