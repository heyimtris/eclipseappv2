export function User({ children, onClick, isActive }: { children: React.ReactNode; onClick?: () => void; isActive?: boolean }) {
    const renderChild = (child: any, index?: number) => (
        <div
            key={index ?? 'only'}
            className={`flex-shrink-0 ${child?.type === 'p' ? 'ml-2 text-sm text-gray-400' : ''}`}
        >
            {child}
        </div>
    );

    return (
        <div
            className={`group flex flex-row items-center justify-start space-x-3 w-full p-2 rounded-4xl pl-3 cursor-pointer transition-colors duration-150 ease-in-out hover:bg-gray-200 dark:hover:bg-gray-700 hover:shadow-sm ${
                isActive ? 'bg-gray-850 dark:bg-gray-850 text-white' : ''
            }`}
            onClick={onClick}
        >
            {Array.isArray(children)
                ? (children as any[]).map((child, index) => renderChild(child, index))
                : renderChild(children)}
        </div>
    );
}