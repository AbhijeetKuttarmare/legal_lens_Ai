const PATHS = [
  'M 700 300 L 560 300 L 460 200 L 200 200',
  'M 700 340 L 600 340 L 560 380 L 560 480 L 480 560 L 180 560',
  'M 700 400 L 620 400 L 620 500 L 700 580 L 700 760',
  'M 720 300 L 820 300 L 900 220 L 1150 220',
  'M 720 350 L 860 350 L 900 390 L 900 490 L 980 570 L 1220 570',
  'M 720 420 L 800 420 L 800 540 L 720 620 L 720 780',
  'M 660 260 L 660 120 L 760 40',
  'M 660 460 L 560 460 L 560 620 L 460 720',
];

export default function CircuitLines() {
  return (
    <svg
      className="circuit-lines"
      viewBox="0 0 1440 820"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="circuitFade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#B08D57" stopOpacity="0" />
          <stop offset="50%" stopColor="#B08D57" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#B08D57" stopOpacity="0" />
        </linearGradient>
      </defs>
      {PATHS.map((d, i) => (
        <g key={i}>
          <path d={d} className="circuit-path" />
          <path
            d={d}
            className="circuit-pulse"
            style={{ animationDelay: `${i * 0.5}s`, animationDuration: `${3.5 + (i % 3)}s` }}
          />
        </g>
      ))}
    </svg>
  );
}
