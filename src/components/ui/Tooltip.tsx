'use client';

import React, { useState, useRef, useId } from 'react';

export interface TooltipProps {
  readonly content: React.ReactNode;
  readonly position?: 'top' | 'bottom' | 'left' | 'right';
  readonly delayMs?: number;
  readonly children: React.ReactNode;
  readonly className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = 'top',
  delayMs = 200,
  children,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipId = useId();

  const showTooltip = () => {
    timerRef.current = setTimeout(() => setIsVisible(true), delayMs);
  };

  const hideTooltip = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsVisible(false);
  };

  const positionClasses: Record<NonNullable<TooltipProps['position']>, string> = {
    top: 'bottom-full start-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full start-1/2 -translate-x-1/2 mt-2',
    left: 'end-full top-1/2 -translate-y-1/2 me-2',
    right: 'start-full top-1/2 -translate-y-1/2 ms-2',
  };

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      aria-describedby={isVisible ? tooltipId : undefined}
    >
      {children}
      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={`absolute z-50 px-2.5 py-1 text-xs font-medium text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded-md shadow-md pointer-events-none whitespace-nowrap transition-opacity duration-150 ${positionClasses[position]}`}
        >
          {content}
        </div>
      )}
    </div>
  );
};
