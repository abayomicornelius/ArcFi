const NODES = [
  { x: 40, label: "Sponsor", sub: "deposits USDC", color: "#4a8fe0" },
  { x: 220, label: "Escrow", sub: "holds it on Arc", color: "#eeab2f" },
  { x: 400, label: "Contributor", sub: "gets paid", color: "#34c98a" },
];

/** Abstract sponsor → escrow → contributor flow, standing in for a product screenshot. */
export function HeroFlow() {
  return (
    <svg viewBox="0 0 460 200" className="w-full max-w-md" role="img" aria-label="Sponsor funds escrow, escrow pays contributor on merge">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="rgba(255,255,255,0.35)" />
        </marker>
      </defs>

      <line x1="95" y1="90" x2="175" y2="90" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" markerEnd="url(#arrow)" />
      <line x1="275" y1="90" x2="355" y2="90" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" markerEnd="url(#arrow)" />

      <text x="135" y="75" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.5)">
        fund
      </text>
      <text x="315" y="75" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.5)">
        PR merged
      </text>

      {NODES.map((node) => (
        <g key={node.label} transform={`translate(${node.x}, 50)`}>
          <circle cx="40" cy="40" r="38" fill="rgba(255,255,255,0.05)" stroke={node.color} strokeOpacity="0.5" strokeWidth="1.5" />
          <circle cx="40" cy="40" r="6" fill={node.color} />
          <text x="40" y="70" textAnchor="middle" fontSize="11" fontWeight="600" fill="white">
            {node.label}
          </text>
          <text x="40" y="105" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.45)">
            {node.sub}
          </text>
        </g>
      ))}
    </svg>
  );
}
