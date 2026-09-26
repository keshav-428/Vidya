import React from 'react';

// The handful of icons this app uses, drawn exactly as the student app
// draws them (src/prototype/icons.tsx) so the two look like one product.
// Copied rather than imported: this app builds on its own.
const VIcon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.6 }: {
  name: string; size?: number; color?: string; strokeWidth?: number;
}) => {
  const props: React.SVGProps<SVGSVGElement> = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color,
    strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  switch (name) {
    case 'home':          return <svg {...props}><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /></svg>;
    case 'user':          return <svg {...props}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></svg>;
    case 'book':          return <svg {...props}><path d="M4 4h11a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z" /><path d="M4 4v12" /></svg>;
    case 'target':        return <svg {...props}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill={color} /></svg>;
    case 'chart':         return <svg {...props}><line x1="4" y1="20" x2="4" y2="10" /><line x1="10" y1="20" x2="10" y2="4" /><line x1="16" y1="20" x2="16" y2="14" /><line x1="22" y1="20" x2="2" y2="20" /></svg>;
    case 'arrow-left':    return <svg {...props}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
    case 'chevron-right': return <svg {...props}><polyline points="9 18 15 12 9 6" /></svg>;
    case 'check':         return <svg {...props}><polyline points="20 6 9 17 4 12" /></svg>;
    case 'plus':          return <svg {...props}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
    default:              return null;
  }
};

export default VIcon;
