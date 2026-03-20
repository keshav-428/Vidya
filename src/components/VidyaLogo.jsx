const VidyaLogo = ({ dark = false }) => (
    <div className="flex items-center gap-2">
        {/* V mark */}
        <svg width="32" height="36" viewBox="0 0 32 36" fill="none">
            {/* Star */}
            <polygon
                points="13,3 14.2,6.6 18,6.6 15,8.8 16.2,12.4 13,10.2 9.8,12.4 11,8.8 8,6.6 11.8,6.6"
                fill="#f59e0b"
            />
            {/* Left arm — dark navy */}
            <line x1="4" y1="10" x2="16" y2="35" stroke={dark ? '#c7c9e8' : '#1e2156'} strokeWidth="7" strokeLinecap="round" />
            {/* Right arm — lavender */}
            <line x1="28" y1="10" x2="16" y2="35" stroke={dark ? '#9b9fd4' : '#9b9fd4'} strokeWidth="7" strokeLinecap="round" />
        </svg>

        {/* Wordmark */}
        <div className="flex items-center gap-1.5">
            <span className={`text-xl font-black tracking-tight ${dark ? 'text-white' : 'text-[#1e2156]'}`}
                style={{ fontFamily: 'system-ui', letterSpacing: '-0.02em' }}>
                Vidya
            </span>
            <span className="text-[9px] font-black text-white bg-[#4338ca] px-1.5 py-0.5 rounded-md tracking-wider">
                AI
            </span>
        </div>
    </div>
);

export default VidyaLogo;
