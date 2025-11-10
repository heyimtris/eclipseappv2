export function Banner({ src, style }: { src: string, style?: React.CSSProperties }) {
    return (
        <>
            {src ? (
                <div style={style} className="banner flex flex-grow flex-1 w-full h-32 mb-4 rounded-lg overflow-hidden">
                    <img
                        src={src}
                        alt="Banner"
                        className="w-full h-full object-cover"
                    />
                </div>
            ) : (
                <div style={style} className="banner w-full h-32 mb-4 rounded-2xl overflow-hidden bg-gray-200 dark:bg-purple-400 flex items-center justify-center">
                </div>
            )}
        </>
    );
}
