import React from 'react'

const getOrdinalSuffix = (day) => {
  if (day >= 11 && day <= 13) return 'th';
  const last = day % 10;
  if (last === 1) return 'st';
  if (last === 2) return 'nd';
  if (last === 3) return 'rd';
  return 'th';
};

const formatDate = (dateStr) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const date = new Date(dateStr + 'T00:00:00');
  return `${months[date.getMonth()]} ${date.getDate()}${getOrdinalSuffix(date.getDate())}, ${date.getFullYear()}`;
};

const App = () => {
  const colors = {
    backgroundPt1: '#0f2a2a',
    backgroundPt2: '#2e6561',
    typographyHd: '#ffffff',
    typographyFt: '#c7d6d4',
  };

  const grainOverlayStyle = {
    position: 'absolute',
    inset: 0,
    opacity: 0.18,
    pointerEvents: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
    zIndex: 1,
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-gray-50 dark:bg-gray-950">
      <div
        className="relative w-full max-w-[380px] flex flex-col transition-all duration-500 transform hover:scale-[1.02]"
        style={{
          aspectRatio: '1 / 1',
          background: `linear-gradient(to bottom, ${colors.backgroundPt1}, ${colors.backgroundPt2})`,
          boxShadow: `
            0 2px 4px rgba(0,0,0,0.05),
            0 10px 20px rgba(0,0,0,0.08),
            0 20px 40px rgba(0,0,0,0.1)
          `,
          border: '1px solid rgba(0,0,0,0.06)',
          borderRadius: '0px',
        }}
      >
        <div style={grainOverlayStyle} aria-hidden="true" />

        <div className="relative z-10 flex flex-col items-center justify-center text-center p-6 flex-none">
          <p className="text-[10px] sm:text-xs font-medium tracking-[0.2em] uppercase mb-1" style={{ color: '#dad6d0' }}>
            {formatDate('2026-06-009')}
          </p>
          <h2 className="text-lg sm:text-xl font-bold uppercase tracking-[0.15em] leading-tight" style={{ color: colors.typographyHd }}>
            WEEKLY GIANNIS
          </h2>
        </div>

        <div className="relative z-10 px-8 flex-grow flex items-center justify-center min-h-0">
          <div className="w-full h-full flex items-center justify-center">
            <img
              src="https://i.ibb.co/JVTPDxG/Cover-of-by-Green-Apelsin.jpg"
              alt="Album art"
              className="max-w-full max-h-full object-cover shadow-xl border border-black/5"
              style={{ borderRadius: '0px' }}
            />
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center text-center p-6 flex-none">
          <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-none mb-1" style={{ color: colors.typographyFt }}>
            ГОРИ, АЛЫЙ ЦВЕТОК
          </h3>
          <p className="text-xs sm:text-sm font-medium tracking-wide opacity-70 uppercase" style={{ color: colors.typographyFt }}>
            GREEN APELSIN
          </p>
        </div>
      </div>
    </div>
  )
}

export default App