'use client';
import React, { useState } from 'react';
import DiagramTypeSelector from '@/components/DiagramTypeSelector';
import DiagramViewer from '@/components/DiagramViewer';
import { Link, Zap } from 'lucide-react';
import styles from './page.module.css'; // Just keeping this if nextjs needs it, though we rely on globals

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('');
  const [selectedType, setSelectedType] = useState('er');
  const [diagramChart, setDiagramChart] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!repoUrl.includes('github.com')) {
      setError('Please provide a valid GitHub repository URL.');
      return;
    }

    setLoading(true);
    setError('');
    setDiagramChart(''); // Reset current diagram

    try {
      const res = await fetch('/api/generate-diagram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          repoUrl,
          diagramType: selectedType
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate diagram');
      }

      setDiagramChart(data.mermaidString);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred while analyzing the repo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="main-layout" suppressHydrationWarning>
      {/* Background blobs for aesthetic */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>

      <header className="hero">
        <h1 suppressHydrationWarning>
          Visualize Code with <br />
          <span className="title-gradient">Arch-Flow</span>
        </h1>
        <p suppressHydrationWarning>
          Instantly generate professional architectural, sequence, and deployment diagrams automatically from any GitHub repository using AI.
        </p>
      </header>

      <div className="container workspace-area">
        <aside className="sidebar">
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <form onSubmit={handleGenerate} className="input-group">

              <div>
                <label htmlFor="repoUrl" className="form-label">GitHub Repository URL</label>
                <div style={{ position: 'relative' }}>
                  <Link style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1rem', color: 'var(--text-muted)' }} size={20} />
                  <input
                    id="repoUrl"
                    type="url"
                    required
                    placeholder="https://github.com/user/project"
                    className="input-field"
                    style={{ paddingLeft: '3rem' }}
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Select Diagram Type</label>
                <DiagramTypeSelector
                  selectedType={selectedType}
                  onSelectType={setSelectedType}
                />
              </div>

              {error && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1rem', borderRadius: '12px', color: '#fca5a5', fontSize: '0.9rem' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {loading ? (
                  <>
                    <span className="loader" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></span>
                    Analyzing Repo...
                  </>
                ) : (
                  <>
                    <Zap size={20} />
                    Generate Diagram
                  </>
                )}
              </button>
            </form>
          </div>
        </aside>

        <section className="main-content">
          <DiagramViewer chart={diagramChart} />
        </section>
      </div>

      {/* Professional Footer Container */}
      <footer style={{
        marginTop: '3rem',
        padding: '2.5rem 1rem 1.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.9rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.8rem',
        zIndex: 5,
        width: '100%',
        background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)'
      }}>
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '0.8rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="#" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-main)', textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer' }}>Documentation</a>
          <a href="https://github.com/sanket-patil09" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-main)', textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer' }}>GitHub</a>
          <a href="#" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-main)', textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer' }}>Privacy Policy</a>
          <a href="#" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-main)', textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer' }}>Terms of Service</a>
        </div>
        <p style={{ margin: 0 }}>© 2026 Arch-Flow. All rights reserved.</p>
        <p style={{ margin: 0, opacity: 0.5, fontSize: '0.8rem' }}>Powered by Mermaid.js & Google Gemini</p>
      </footer>
    </main>
  );
}
