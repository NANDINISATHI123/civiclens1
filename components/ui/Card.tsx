import React from 'react';

// Simplified props to avoid complex type inheritance
// FIX: Added optional 'id' prop to BaseProps to allow for accessibility attributes.
interface BaseProps {
    id?: string;
    className?: string;
    children?: React.ReactNode;
    onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

const Card = ({ className, children, onClick }: BaseProps) => (
  <div
    className={`rounded-xl border bg-card text-card-foreground shadow ${className || ''}`}
    onClick={onClick}
  >
    {children}
  </div>
);

const CardHeader = ({ className, children }: BaseProps) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className || ''}`}>
    {children}
  </div>
);

// FIX: Modified CardTitle to accept and apply the 'id' prop for accessibility.
const CardTitle = ({ className, children, id }: BaseProps) => (
  <h3 id={id} className={`text-2xl font-semibold leading-none tracking-tight ${className || ''}`}>
    {children}
  </h3>
);

const CardDescription = ({ className, children }: BaseProps) => (
  <p className={`text-sm text-muted-foreground ${className || ''}`}>
    {children}
  </p>
);

const CardContent = ({ className, children }: BaseProps) => (
  <div className={`p-6 pt-0 ${className || ''}`}>
    {children}
  </div>
);

const CardFooter = ({ className, children }: BaseProps) => (
  <div className={`flex items-center p-6 pt-0 ${className || ''}`}>
    {children}
  </div>
);

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };