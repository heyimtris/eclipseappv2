import { Link } from "react-router-dom";

type ButtonProps = {
    to?: string;
    variant: "primary" | "secondary" | "text";
    className?: string;
    type?: "button" | "submit" | "reset";
    children: React.ReactNode;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onClick?: () => void;
    disabled?: boolean;
};

function Button({ to, onClick, type, variant, className = "", children, onMouseEnter, onMouseLeave, disabled }: ButtonProps) {
    const baseStyles = `
    inline-flex
    items-center
    justify-center
    rounded-3xl
    px-4
    py-2.5
    text-sm
    font-medium
    focus:outline-none
    `;
    const variantStyles = {
        primary: "bg-purple-400 text-gray-950 hover:bg-purple-600",
        secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
        text: "text-purple-400 hover:underline dark:text-purple-400 p-0 y-0 m-0 gap-0",
    }[variant];
    if (to) {
        return (
            <Link
                to={to}
                type="button"
                className={`${baseStyles} ${variantStyles} ${className}`}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
            >
                {children}
            </Link>
        );
    }
    return (
        <button
            onClick={onClick}
            type={type}
            disabled={disabled}
            className={`${baseStyles} ${variantStyles} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {children}
        </button>
    );
}

export { Button };