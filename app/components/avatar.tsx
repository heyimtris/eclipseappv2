export function Avatar({ src, status, style = {} }: { src: string; status?: string; style?: React.CSSProperties }) {
    // Determine if custom width/height is provided
    const hasCustomSize = style.width || style.height;
    const sizeStyle = hasCustomSize ? { width: style.width, height: style.height } : {};
    return (
        <div className="relative" style={{ ...sizeStyle, ...style }}>
            <img
                src={src}
                alt="User Avatar"
                className={`rounded-full object-cover${hasCustomSize ? '' : ' w-10 h-10'}`}
                style={sizeStyle}
            />
            {status === "away" ? (
                <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-gray-950 flex items-center justify-center">
                    <img src="/idle.svg" alt="Away" className="w-3 h-3" />
                </span>
            ) : status === "dnd" ? (
                <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-gray-950 flex items-center justify-center">
                    <img src="/dnd.svg" alt="Do Not Disturb" className="w-3 h-3" />
                </span>
            ) : status === "online" || status === "offline" ? (
                <span
                    className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-gray-950 ${
                        status === "online" ? "bg-green-500" : "bg-gray-400"
                    }`}
                ></span>
            ) : null}
        </div>
    );
}