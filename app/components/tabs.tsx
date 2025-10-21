import {Button} from "./button";
import React from "react";

const svgIcons = {
   // heroicons outline
    chats: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" >
  <path stroke-linecap="round" stroke-linejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
</svg>

    ),
     servers: (
         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"  fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" >
  <path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
</svg>
    ),
     friends: (
         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="h-5 w-5">
  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
</svg>

    ),
    search: (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
</svg>

    ),
    avatar: (
        <span className="block w-6 h-6 rounded-full overflow-hidden shrink-0">
            <img src="/pingu.jpg" alt="User Avatar" className="block w-full h-full object-cover" />
        </span>
    )
}

type TabProps = {
    label: string;
    onClick?: () => void;
    isActive?: boolean;
    // Internal wiring from TabContainer
    hoveredLabel?: string | null;
    onHoverChange?: (hovering: boolean, label: string) => void;
    isDesktop?: boolean;
};

type TabContainerProps = {
    children: React.ReactNode;
    externalActiveTab?: string;
};

export function Tab({ label, onClick, isActive, hoveredLabel, onHoverChange, isDesktop }: TabProps) {
    const [isHovered, setIsHovered] = React.useState(false);
    const isAvatar = label === "Avatar";

    // Build classes with a special case for the Avatar tab for perfect centering
    const baseClasses = "flex items-center justify-center text-center rounded-2xl text-gray-900 dark:text-gray-100 transition-transform duration-150 ease-in-out";
    const sizeClasses = isAvatar ? "flex-none w-10 h-10 p-0 rounded-full" : "px-4 h-10 w-auto shrink-0";
    const stateClasses = (isHovered || isActive) ? "bg-purple-400 text-white dark:bg-purple-600" : "bg-gray-850 dark:bg-gray-950";
    const hoverScaleClasses = isAvatar ? "" : "md:hover:-translate-y-[1px]";

    const hoveredOther = !!hoveredLabel && hoveredLabel !== label;

    // Show label when hovered, or when active and not suppressed by another hovered tab on desktop
    const showLabel = !isAvatar && (isHovered || (isActive && !(isDesktop && hoveredOther)));

    return (
        <Button
            variant="primary"
            onClick={onClick}
            className={[baseClasses, sizeClasses, stateClasses, hoverScaleClasses, showLabel ? "gap-2" : ""].join(" ")}
            onMouseEnter={() => { setIsHovered(true); onHoverChange && onHoverChange(true, label); }}
            onMouseLeave={() => { setIsHovered(false); onHoverChange && onHoverChange(false, label); }}
        >
            <div className="flex items-center">
                {svgIcons[label.toLowerCase() as keyof typeof svgIcons]}
            </div>
            <span
                className={`whitespace-nowrap transition-all duration-300 ease-out pointer-events-none flex items-center justify-center
                    ${showLabel ? "static opacity-100 scale-100 pointer-events-auto" : "hidden left-full top-1/2 -translate-y-1/2 opacity-0 scale-90 translate-y-0"}
                    `}
                style={{ willChange: 'opacity, transform' }}
            >
                {label}
            </span>
        </Button>
    );
}

export function TabContainer({ children, externalActiveTab }: TabContainerProps) {
    const childArray = React.Children.toArray(children);
    const [internalActiveTab, setInternalActiveTab] = React.useState(
        childArray[0] && typeof childArray[0] === "object" && "props" in childArray[0]
            ? (childArray[0] as any).props.label
            : null
    );

    // Use external active tab if provided, otherwise use internal state
    const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;
    const isSearchActive = activeTab === "Search";

    // Track which tab is hovered (for desktop behavior)
    const [hoveredLabel, setHoveredLabel] = React.useState<string | null>(null);
    const [isDesktop, setIsDesktop] = React.useState<boolean>(false);

    React.useEffect(() => {
        const mq = window.matchMedia('(min-width: 768px)');
        const update = () => setIsDesktop(mq.matches);
        update();
        mq.addEventListener ? mq.addEventListener('change', update) : mq.addListener(update as any);
        return () => {
            mq.removeEventListener ? mq.removeEventListener('change', update) : mq.removeListener(update as any);
        };
    }, []);

    // Separate Avatar tab from others to right-align it
    const otherTabs = childArray.filter((child: any) => child && child.props && child.props.label !== "Avatar");
    const avatarTabs = childArray.filter((child: any) => child && child.props && child.props.label === "Avatar");

    const cloneWithHandlers = (child: any) =>
        React.cloneElement(child, {
            isActive: child.props.label === activeTab,
            onClick: (e: any) => {
                if (child.props.onClick) child.props.onClick(e);
                setInternalActiveTab(child.props.label);
            }
        });

    const cloneWithHoverAndHandlers = (child: any) =>
        React.cloneElement(child, {
            isActive: child.props.label === activeTab,
            onClick: (e: any) => {
                if (child.props.onClick) child.props.onClick(e);
                setInternalActiveTab(child.props.label);
            },
            hoveredLabel,
            isDesktop,
            onHoverChange: (hovering: boolean, label: string) => {
                if (hovering) setHoveredLabel(label);
                else if (hoveredLabel === label) setHoveredLabel(null);
            }
        });

        return (
            <div className="flex items-center bg-gray-850 rounded-3xl h-auto py-0.5 px-2 w-full md:w-full overflow-hidden">
                <div className="flex flex-1 items-center justify-start gap-2 overflow-x-auto whitespace-nowrap min-w-0">
                {otherTabs.map((child: any) => (child && child.props ? cloneWithHoverAndHandlers(child) : child))}
            </div>
            <div className="flex items-center gap-2">
                {avatarTabs.map((child: any) => (child && child.props ? cloneWithHoverAndHandlers(child) : child))}
            </div>
        </div>
    );
}