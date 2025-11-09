export function User({ children, onClick, banner, style, isActive }: { children: React.ReactNode; style?: React.CSSProperties; banner?: boolean; onClick?: () => void; isActive?: boolean }) {
    const renderChild = (child: any, index?: number) => (
        <div
            key={index ?? 'only'} 
            className={`flex-shrink-0 ${child?.type === 'p' ? 'ml-2 text-sm text-gray-400' : ''}
             ${child?.type === 'div' ? 'w-full' : ''}`}
        >
            {child}
        </div>
    );

    return (
        <div
            className={`group flex ${banner ? "flex-col items-start justify-left p-5" : "flex-row items-center justify-start p-2"} space-x-3 w-full rounded-4xl pl-3'} cursor-pointer transition-colors duration-150 ease-in-out hover:bg-gray-200 dark:hover:bg-gray-700 hover:shadow-sm ${
                isActive ? 'bg-gray-850 dark:bg-gray-850 text-white' : ''
            }`}
            style={style}
            onClick={onClick}
        >
            {Array.isArray(children)
                ? (children as any[]).map((child, index) => renderChild(child, index))
                : renderChild(children)}
        </div>
    );
}