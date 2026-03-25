export function CanvasBackground() {
  return (
    <g className="canvas-background">
      <defs>
        <pattern
          id="dot-grid"
          x="0"
          y="0"
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <circle
            cx="12"
            cy="12"
            r="1"
            fill="#1e2430"
            fillOpacity="0.44"
          />
        </pattern>
      </defs>
      <rect
        x="-10000"
        y="-10000"
        width="20000"
        height="20000"
        fill="url(#dot-grid)"
      />
    </g>
  )
}
