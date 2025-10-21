import React from "react";

let base = `
    alert
    w-full
    rounded-3xl
    p-4
    m-1
    text-sm
    flex
    items-center
    gap-2
    dark:bg-gray-800
    dark:text-gray-300
`;

const classes = {
    info: `

        ${base.replace('dark:bg-gray-800', 'dark:bg-blue-700 dark:text-blue-800')}
    `,
    success: `
        ${base.replace('dark:bg-gray-800', 'dark:bg-green-500 dark:text-green-800')}
    `,
    warning: `
        ${base.replace('dark:bg-gray-800', 'dark:bg-yellow-500 dark:text-yellow-800')}
    `,
    error: `
        ${base.replace('dark:bg-gray-800', 'dark:bg-red-500 dark:text-white')}
    `,
}
function cn(...classes: (string | undefined | false)[]) {
    return classes.filter(Boolean).join(" ");
    }

type AlertProps = {
  type: "info" | "success" | "warning" | "error";
  className?: string;
  children: React.ReactNode;
};

const Alert = ({ type, className, children }: AlertProps) => {
  return (
    <div className={cn(classes[type], className)}>
      {type === "info" && (
        <>
        <svg
          className="h-5 w-5 flex-shrink-0 text-blue-800 dark:text-blue-200"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
        </>
      )}
        {type === "success" && (
        <>
            <svg
              className="h-5 w-5 flex-shrink-0 text-green-800 dark:text-green-200"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
        </>
        )}
        {type === "warning" && (
          <>
            <svg
              className="h-5 w-5 flex-shrink-0 text-yellow-800 dark:text-yellow-200"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>  
          </>
        )}
        {type === "error" && (
          <>
            <svg
              className="h-5 w-5 flex-shrink-0 text-red-800 dark:text-red-200"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-4.95-2.536a1 1 0 00-1.414-1.414L10 8.586 7.364 5.95a1 1 0 10-1.414 1.414L8.586 10l-2.636 2.636a1 1 0 101.414 1.414L10 11.414l2.636 2.636a1 1 0 001.414-1.414L11.414 10l2.636-2.636z"
                clipRule="evenodd"
              />
            </svg>
          </>
        )}
      {children}
    </div>
  );
};

export { Alert };
