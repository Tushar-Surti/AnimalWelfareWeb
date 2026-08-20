import { ImageResponse } from 'next/og';

export const alt = 'A.W.W. Helpers — a home for every paw';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * The card people see when a link is pasted into WhatsApp — which, given the
 * share buttons, is the most common way anyone will first encounter this site.
 *
 * Built with layout primitives only (no external fonts or images) so it renders
 * fast at the edge and can never fail on a missing asset.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '72px 88px',
          background: '#FFF6EE',
          position: 'relative',
        }}
      >
        {/* Soft colour fields, echoing the site's blobs. */}
        <div
          style={{
            position: 'absolute', top: -140, left: -120, width: 520, height: 520,
            borderRadius: 9999, background: '#FFE0E8',
          }}
        />
        <div
          style={{
            position: 'absolute', bottom: -180, right: -100, width: 480, height: 480,
            borderRadius: 9999, background: '#DAEEFA',
          }}
        />
        <div
          style={{
            position: 'absolute', top: 210, right: 150, width: 220, height: 220,
            borderRadius: 9999, background: '#FFF3D1',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, zIndex: 1 }}>
          <div
            style={{
              width: 76, height: 76, borderRadius: 9999, background: '#FF7EA0',
              border: '5px solid #E0517A', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 40,
            }}
          >
            🐾
          </div>
          <div style={{ fontSize: 40, fontWeight: 700, color: '#4A3730', letterSpacing: -1 }}>
            A.W.W. Helpers
          </div>
        </div>

        <div
          style={{
            marginTop: 44, fontSize: 96, fontWeight: 800, color: '#4A3730',
            lineHeight: 1.02, letterSpacing: -4, zIndex: 1, display: 'flex', flexDirection: 'column',
          }}
        >
          <span>A home for</span>
          <span style={{ color: '#E0517A' }}>every paw.</span>
        </div>

        <div style={{ marginTop: 34, fontSize: 34, color: '#8A7268', maxWidth: 820, zIndex: 1 }}>
          Report a street animal in trouble and the nearest shelter hears about it in seconds.
        </div>

        <div style={{ marginTop: 44, display: 'flex', gap: 14, zIndex: 1 }}>
          {['Rescue', 'Adopt', 'Foster', 'Reunite', 'Volunteer'].map((word) => (
            <div
              key={word}
              style={{
                padding: '12px 26px', borderRadius: 9999, background: '#FFFFFF',
                border: '3px solid #F2DDCD', fontSize: 26, fontWeight: 600, color: '#4A3730',
              }}
            >
              {word}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
