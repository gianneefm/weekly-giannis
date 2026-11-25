import React, { useMemo, useRef, useCallback } from 'react';
import * as htmlToImage from 'html-to-image';

const WAITING_COLOR = '#b0afac';

/**
 * Приводит HEX к виду #RRGGBB (поддерживает #RGB). Возвращает null, если цвет некорректен.
 */
const normalizeHex = (color) => {
  if (typeof color !== 'string') return null;
  let value = color.trim().replace('#', '');

  if (value.length === 3) {
    value = value
      .split('')
      .map((ch) => ch + ch)
      .join('');
  }

  return /^[0-9a-fA-F]{6}$/.test(value) ? value : null;
};

/**
 * Смешивает два HEX-цвета.
 */
const interpolateColor = (color1, color2, factor) => {
  const h1 = normalizeHex(color1);
  const h2 = normalizeHex(color2);
  if (!h1 || !h2) return WAITING_COLOR;

  const n1 = parseInt(h1, 16);
  const n2 = parseInt(h2, 16);

  const r1 = (n1 >> 16) & 255;
  const g1 = (n1 >> 8) & 255;
  const b1 = n1 & 255;

  const r2 = (n2 >> 16) & 255;
  const g2 = (n2 >> 8) & 255;
  const b2 = n2 & 255;

  const mix = (a, b) => Math.round(a + factor * (b - a));
  const toHex = (value) => value.toString(16).padStart(2, '0');

  return `#${toHex(mix(r1, r2))}${toHex(mix(g1, g2))}${toHex(mix(b1, b2))}`;
};

/**
 * Считает три цвета градиента для звезды и текста.
 */
const getGradientStops = (ratingValue, current, previous, next, fillPercentage) => {
  if (ratingValue === null || ratingValue === 0) {
    return [WAITING_COLOR, WAITING_COLOR, WAITING_COLOR];
  }

  const currentDark = interpolateColor(current.color, '#000000', 0.4);
  const prevDark = previous
    ? interpolateColor(previous.color, '#000000', 0.4)
    : '#000000';

  const mixFactor = (100 - fillPercentage) / 100;
  const mixedPreviousDark = interpolateColor(prevDark, currentDark, mixFactor);
  const mixedNext = next
    ? interpolateColor(current.color, next.color, fillPercentage / 100)
    : current.color;

  if (ratingValue < current.average) {
    return [mixedPreviousDark, currentDark, current.color];
  }

  if (ratingValue > current.average) {
    return [currentDark, current.color, mixedNext];
  }

  return [current.color, current.color, current.color];
};

// Геометрия звезды (общая для построения граней и маски заливки)
const CENTER = 100;
const OUTER_RADIUS = 90;
const INNER_RADIUS = OUTER_RADIUS * 0.45;

const STAR_POINTS = Array.from({ length: 10 }, (_, i) => {
  const angle = (i * Math.PI) / 5 - Math.PI / 2;
  const radius = i % 2 === 0 ? OUTER_RADIUS : INNER_RADIUS;

  return {
    x: CENTER + radius * Math.cos(angle),
    y: CENTER + radius * Math.sin(angle),
  };
});

const STAR_MIN_X = Math.min(...STAR_POINTS.map((p) => p.x));
const STAR_MAX_X = Math.max(...STAR_POINTS.map((p) => p.x));

const FACET_PATHS = STAR_POINTS.map((point, index) => {
  const nextPoint = STAR_POINTS[(index + 1) % STAR_POINTS.length];
  return `M ${CENTER},${CENTER} L ${point.x},${point.y} L ${nextPoint.x},${nextPoint.y} Z`;
});

const Star = ({
  ratingValue,
  current,
  previous,
  next,
  fillPercentage,
  size = 28,
}) => {
  const id = useMemo(() => Math.random().toString(36).slice(2, 11), []);

  const stops = useMemo(
    () => getGradientStops(ratingValue, current, previous, next, fillPercentage),
    [ratingValue, current, previous, next, fillPercentage],
  );

  // Заливка считается по реальной ширине звезды, а не по всей ширине viewBox
  const fillWidth = (STAR_MAX_X - STAR_MIN_X) * (fillPercentage / 100);

  return (
    <div
      className="relative flex items-center justify-center animate-rating-pulse"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full overflow-visible drop-shadow-[0_3px_5px_rgba(0,0,0,0.4)]"
      >
        <defs>
          <linearGradient
            id={`starGrad-${id}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor={stops[0]} />
            <stop offset="50%" stopColor={stops[1]} />
            <stop offset="100%" stopColor={stops[2]} />
          </linearGradient>

          <mask
            id={`starMask-${id}`}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="200"
            height="200"
          >
            <rect x={STAR_MIN_X} y="0" width={fillWidth} height="200" fill="white" />
          </mask>
        </defs>

        <g>
          {FACET_PATHS.map((path, index) => (
            <React.Fragment key={`bg-${index}`}>
              <path d={path} fill={WAITING_COLOR} />
              <path
                d={path}
                fill={index % 2 === 0 ? 'white' : 'black'}
                fillOpacity={index % 2 === 0 ? 0.05 : 0.08}
              />
            </React.Fragment>
          ))}
        </g>

        {ratingValue > 0 && (
          <g mask={`url(#starMask-${id})`}>
            {FACET_PATHS.map((path, index) => (
              <React.Fragment key={`fg-${index}`}>
                <path d={path} fill={`url(#starGrad-${id})`} />
                <path
                  d={path}
                  fill={index % 2 === 0 ? 'white' : 'black'}
                  fillOpacity={index % 2 === 0 ? 0.12 : 0.18}
                />
              </React.Fragment>
            ))}
          </g>
        )}

        <g fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1">
          {FACET_PATHS.map((path, index) => (
            <path key={`s-${index}`} d={path} />
          ))}
        </g>
      </svg>
    </div>
  );
};

const TIERS = [
  { label: 'STOP', color: '#EF4444', threshold: 0, average: 0.5 },
  { label: 'FLOP', color: '#EA580C', threshold: 1, average: 1.75 },
  { label: 'MOP', color: '#F59E0B', threshold: 2.5, average: 3.125 },
  { label: 'POP', color: '#7D9A3A', threshold: 3.75, average: 4 },
  { label: 'TOP', color: '#059669', threshold: 4.25, average: 4.625 },
];

const App = () => {
  const cardRef = useRef(null);

  const coverLink =
    'https://t2.genius.com/unsafe/604x0/https%3A%2F%2Fimages.genius.com%2F3e49b14373c802c9f73f8097c4aa46f9.1000x1000x1.png';
  const hdStop1 = '#f0f3f4';
  const hdStop2 = '#ffffff';
  const hdTypo = '#000000';
  const ftStop1 = '';
  const ftStop2 = '';
  const ftTypo = '#000000';
  const albumTitle = 'make depression great again';
  const artist = 'markul';

  const proxiedCoverLink = useMemo(() => {
    if (!coverLink) return null;

    return `https://images.weserv.nl/?url=${encodeURIComponent(
      coverLink,
    )}&default=${encodeURIComponent(coverLink)}`;
  }, [coverLink]);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;

    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: undefined,
        includeQueryParams: true,
      });

      const link = document.createElement('a');
      link.download = `${artist} - ${albumTitle}.png`.replace(/\s+/g, '_');
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Ошибка экспорта:', error);
    }
  }, [artist, albumTitle]);

  const scaleMx = 1000;
  const rateArray = [914];

  const ratingValue = rateArray.length
    ? rateArray.reduce((sum, value) => sum + value, 0) /
      (rateArray.length * (scaleMx / 5))
    : null;

  // Индекс самой высокой категории, порог которой достигнут
  let actualIndex = 0;
  if (ratingValue !== null) {
    for (let i = TIERS.length - 1; i >= 0; i -= 1) {
      if (ratingValue >= TIERS[i].threshold) {
        actualIndex = i;
        break;
      }
    }
  }

  const current = TIERS[actualIndex];
  const previous = TIERS[actualIndex - 1];
  const next = TIERS[actualIndex + 1];

  const fillPercentage =
    ratingValue !== null
      ? Math.min(100, Math.max(0, (ratingValue / 5) * 100))
      : 0;

  const displayRating =
    ratingValue !== null ? ratingValue.toFixed(2).replace('.', ',') : null;

  const textStops = getGradientStops(
    ratingValue,
    current,
    previous,
    next,
    fillPercentage,
  );

  const gradientTextStyle =
    ratingValue !== null
      ? {
          backgroundImage: `linear-gradient(to right, ${textStops[0]}, ${textStops[1]}, ${textStops[2]})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          color: 'transparent',
          display: 'inline-block',
        }
      : { color: WAITING_COLOR };

  return (
    <div className="flex flex-col items-center justify-center gap-4 min-h-screen bg-neutral-200 p-4">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&family=Space+Grotesk:wght@400;700;900&display=swap');

            .font-orbitron {
              font-family: 'Orbitron', sans-serif;
            }

            .font-header {
              font-family: 'Space Grotesk', sans-serif;
            }

            .font-share-mono {
              font-family: 'Share Tech Mono', monospace;
            }

            @keyframes rating-pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.05); }
              100% { transform: scale(1); }
            }

            .animate-rating-pulse {
              animation: rating-pulse 2s infinite ease-in-out;
            }
          `,
        }}
      />

      <div
        ref={cardRef}
        className="w-full max-w-[450px] aspect-square flex flex-col shadow-2xl overflow-hidden relative"
      >
        {/* HEADER */}
        <div
          className="h-[32px] shrink-0 flex items-center justify-center border-b border-black/5 z-30"
          style={{
            background: `linear-gradient(to bottom, ${hdStop1 || '#fff'} 50%, ${hdStop2 || '#fff'} 100%)`,
          }}
        >
          <span
            className="font-orbitron text-[10px] tracking-[0.45em] uppercase"
            style={{ color: hdTypo || '#000', fontWeight: 900 }}
          >
            Gianneeversary
          </span>
        </div>

        {/* VINYL SECTION */}
        <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col justify-end items-start p-8">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: proxiedCoverLink
                ? `url("${proxiedCoverLink}")`
                : 'none',
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-tr from-black/90 via-black/30 to-transparent pointer-events-none" />

          <div className="relative z-20 text-white drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)]">
            <span className="font-share-mono block text-[10px] tracking-[0.35em] uppercase mb-2 opacity-90">
              <span className="font-extrabold text-white">2 года</span> альбому
            </span>

            <h2 className="font-orbitron text-4xl font-black leading-none mb-3 uppercase tracking-tighter">
              {albumTitle}
            </h2>

            <p className="font-orbitron text-[10px] tracking-[0.3em] font-bold opacity-75 uppercase">
              ОТ <b>{artist}</b>
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div
          className="h-[56px] flex items-center justify-between px-8 shrink-0 z-30"
          style={{
            background: `linear-gradient(to bottom, ${ftStop1 || '#FFFFFF'} 50%, ${ftStop2 || '#FFFFFF'} 100%)`,
          }}
        >
          <div className="flex items-center w-full">
            <div className="flex flex-col items-center justify-center min-w-[35px]">
              <Star
                ratingValue={ratingValue}
                current={current}
                previous={previous}
                next={next}
                fillPercentage={fillPercentage}
                size={28}
              />

              <span
                className="font-share-mono text-[12px] font-black tracking-tighter leading-none mt-1"
                style={gradientTextStyle}
              >
                {displayRating}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center opacity-30 flex-1">
              <span
                className="font-orbitron text-[7px] tracking-[0.3em] font-black uppercase"
                style={{ color: ftTypo || '#000000' }}
              >
                RELEASE
              </span>
              <span
                className="font-orbitron text-[7px] tracking-[0.3em] font-black uppercase mt-1 leading-none"
                style={{ color: ftTypo || '#000000' }}
              >
                RANK
              </span>
            </div>

            <div className="flex items-center justify-end min-w-[60px]">
              <span
                className="font-orbitron text-xl font-black tracking-tighter uppercase"
                style={gradientTextStyle}
              >
                {ratingValue === null ? 'WAITING…' : current.label}
              </span>
            </div>
          </div>
        </div>

        <div className="h-2 w-full bg-neutral-950 shrink-0 z-30" />
      </div>

      <button
        type="button"
        onClick={handleDownload}
        className="px-4 py-2 rounded bg-neutral-900 text-white text-sm hover:bg-neutral-700"
      >
        Скачать PNG
      </button>
    </div>
  );
};

export default App;
