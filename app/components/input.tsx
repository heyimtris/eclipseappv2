

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    className?: string;
}

export function Input({ label, className, ...props }: InputProps) {
    return (
        <div className="flex flex-row">
            <input
                placeholder={label}
                aria-label={label}
                className={`rounded-xl px-3 py-2 text-sm dark:bg-gray-950 dark:border-gray-700 dark:text-white ${className}`}
                {...props}
            />
        </div>
    );
}