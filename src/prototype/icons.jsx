import React from 'react';

const VIcon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.6 }) => {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'arrow-right': return <svg {...props}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
    case 'arrow-left':  return <svg {...props}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
    case 'check':       return <svg {...props}><polyline points="20 6 9 17 4 12"/></svg>;
    case 'x':           return <svg {...props}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
    case 'chevron-right': return <svg {...props}><polyline points="9 18 15 12 9 6"/></svg>;
    case 'chevron-down':  return <svg {...props}><polyline points="6 9 12 15 18 9"/></svg>;
    case 'chevron-up':    return <svg {...props}><polyline points="18 15 12 9 6 15"/></svg>;
    case 'sparkles':    return <svg {...props}><path d="M12 3l1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7z"/><path d="M19 14l.8 1.9L22 17l-2.2.9L19 20l-.8-2.1L16 17l2.2-1.1z" strokeWidth={strokeWidth*0.85}/></svg>;
    case 'flame':       return <svg {...props}><path d="M12 22a7 7 0 0 0 7-7c0-3-3-5-3-9 0 0-2 1-4 4-1-2-1-4 0-6-5 2-7 6-7 11a7 7 0 0 0 7 7z"/></svg>;
    case 'book':        return <svg {...props}><path d="M4 4h11a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z"/><path d="M4 4v12"/></svg>;
    case 'home':        return <svg {...props}><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>;
    case 'compass':     return <svg {...props}><circle cx="12" cy="12" r="9"/><polygon points="14.5 9.5 9.5 14.5 11 11 13 11"/></svg>;
    case 'chart':       return <svg {...props}><line x1="4" y1="20" x2="4" y2="10"/><line x1="10" y1="20" x2="10" y2="4"/><line x1="16" y1="20" x2="16" y2="14"/><line x1="22" y1="20" x2="2" y2="20"/></svg>;
    case 'user':        return <svg {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>;
    case 'menu':        return <svg {...props}><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>;
    case 'search':      return <svg {...props}><circle cx="11" cy="11" r="7"/><line x1="20" y1="20" x2="16.65" y2="16.65"/></svg>;
    case 'bell':        return <svg {...props}><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>;
    case 'camera':      return <svg {...props}><path d="M3 8h4l2-3h6l2 3h4v11H3z"/><circle cx="12" cy="13" r="3.5"/></svg>;
    case 'upload':      return <svg {...props}><path d="M12 16V4"/><polyline points="6 10 12 4 18 10"/><path d="M4 18v2h16v-2"/></svg>;
    case 'clock':       return <svg {...props}><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/></svg>;
    case 'edit':        return <svg {...props}><path d="M14 4l6 6L10 20H4v-6z"/></svg>;
    case 'play':        return <svg {...props}><polygon points="6 4 20 12 6 20" fill={color} stroke="none"/></svg>;
    case 'lock':        return <svg {...props}><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>;
    case 'eye':         return <svg {...props}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'lightbulb':   return <svg {...props}><path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/></svg>;
    case 'target':      return <svg {...props}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill={color}/></svg>;
    case 'zap':         return <svg {...props}><polygon points="13 3 4 14 11 14 10 21 19 10 12 10"/></svg>;
    case 'star':        return <svg {...props}><polygon points="12 3 14.5 9 21 9.5 16 14 17.5 21 12 17.5 6.5 21 8 14 3 9.5 9.5 9"/></svg>;
    case 'plus':        return <svg {...props}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case 'pencil':      return <svg {...props}><path d="M14 4l6 6L10 20H4v-6z"/></svg>;
    case 'feather':     return <svg {...props}><path d="M20 4c-6 0-10 4-12 8-1 2-1 4 0 5l5-1 7-7"/><line x1="20" y1="4" x2="9" y2="15"/></svg>;
    case 'send':        return <svg {...props}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9"/></svg>;
    case 'heart':       return <svg {...props}><path d="M12 21s-7-5-9-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 5-9 10-9 10z"/></svg>;
    case 'heart-fill':  return <svg {...props}><path d="M12 21s-7-5-9-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 5-9 10-9 10z" fill={color} stroke={color}/></svg>;
    case 'more':        return <svg {...props}><circle cx="5" cy="12" r="1.2" fill={color}/><circle cx="12" cy="12" r="1.2" fill={color}/><circle cx="19" cy="12" r="1.2" fill={color}/></svg>;
    case 'thumbs-up':   return <svg {...props}><path d="M7 22V11l5-8a2 2 0 0 1 2 3l-1 5h5a2 2 0 0 1 2 2l-2 7a2 2 0 0 1-2 2H7z"/><line x1="7" y1="11" x2="3" y2="11"/><line x1="3" y1="11" x2="3" y2="22"/><line x1="3" y1="22" x2="7" y2="22"/></svg>;
    case 'thumbs-down': return <svg {...props}><path d="M17 2v11l-5 8a2 2 0 0 1-2-3l1-5H6a2 2 0 0 1-2-2l2-7a2 2 0 0 1 2-2h9z"/><line x1="17" y1="13" x2="21" y2="13"/><line x1="21" y1="13" x2="21" y2="2"/><line x1="21" y1="2" x2="17" y2="2"/></svg>;
    case 'skip':        return <svg {...props}><polygon points="5 4 15 12 5 20"/><line x1="19" y1="5" x2="19" y2="19"/></svg>;
    case 'help':        return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7"/><circle cx="12" cy="17" r=".7" fill={color}/></svg>;
    case 'logout':      return <svg {...props}><path d="M14 4h5v16h-5"/><polyline points="9 8 5 12 9 16"/><line x1="5" y1="12" x2="15" y2="12"/></svg>;
    case 'shield':      return <svg {...props}><path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/></svg>;
    case 'globe':       return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18"/><path d="M12 3a14 14 0 0 0 0 18"/></svg>;
    case 'calendar':    return <svg {...props}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
    case 'mic':         return <svg {...props}><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>;
    case 'trending-up': return <svg {...props}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
    default: return null;
  }
};

export default VIcon;
export { VIcon };
