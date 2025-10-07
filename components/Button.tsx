import React, { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md';
    className?: string;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
    const baseClasses = "inline-flex items-center justify-center border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed";

    const variantClasses = {
        primary: "border-transparent bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
        secondary: "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 focus:ring-indigo-500",
        danger: "border-transparent bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
        ghost: "border-transparent bg-transparent text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-slate-700 focus:ring-indigo-500"
    };

    const sizeClasses = {
        md: "px-4 py-2 text-sm font-medium",
        sm: "px-3 py-1.5 text-xs font-semibold"
    };

    return (
        <button className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};