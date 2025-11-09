export function Banner({ src }: { src: string }) {
    return (
        <>
            {src ? (
                <div className="banner flex flex-grow flex-1 w-full h-32 mb-4 rounded-lg overflow-hidden">
                    <img
                        src={src}
                        alt="Banner"
                        className="w-full h-full object-cover"
                    />
                </div>
            ) : (
                <div className="banner w-full h-32 mb-4 rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                    <span className="text-gray-500 dark:text-gray-400 w-full">No Banner</span>
                </div>
            )}
        </>
    );
}
