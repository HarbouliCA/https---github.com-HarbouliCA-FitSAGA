import React from 'react';

export type ButtonVariant = "primary" | "secondary" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant = "primary", size = "md", className = "", ...props }: ButtonProps) {
  let baseClass = "";
  if (variant === "primary") {
    baseClass += " bg-blue-500 text-white ";
  } else if (variant === "secondary") {
    baseClass += " bg-gray-200 text-black ";
  } else if (variant === "danger") {
    baseClass += " bg-red-500 text-white ";
  }

  if (size === "sm") {
    baseClass += " py-1 px-2 text-sm ";
  } else if (size === "md") {
    baseClass += " py-2 px-4 ";
  } else if (size === "lg") {
    baseClass += " py-3 px-6 text-lg ";
  }

  const combinedClassName = `${baseClass} ${className}`.trim();

  return <button className={combinedClassName} {...props} />;
}
