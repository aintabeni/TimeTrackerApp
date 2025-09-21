import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

interface DropdownProps {
  trigger: React.ReactElement;
  children: React.ReactNode;
}

const DropdownContext = React.createContext<{ setIsOpen: (isOpen: boolean) => void } | null>(null);


export const Dropdown: React.FC<DropdownProps> = ({ trigger, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const menuWidth = 192; // w-48 is 12rem
      const menuMargin = 8; // mt-2 is 0.5rem

      // Estimate menu height. Approx 36px per item (py-2 * 2 + text).
      const estMenuHeight = React.Children.count(children) * 36;
      const spaceBelow = window.innerHeight - rect.bottom - menuMargin;
      
      let top = rect.bottom + window.scrollY + menuMargin;
      
      // If not enough space below, and more space above, render upwards
      if (spaceBelow < estMenuHeight && rect.top > spaceBelow) {
        // Adjust top position to be above the trigger, accounting for menu height
        top = rect.top + window.scrollY - estMenuHeight - menuMargin;
      }
      
      // 'right-0' aligns right edge of menu with right edge of container
      const left = rect.right + window.scrollX - menuWidth;

      setStyle({
        position: 'absolute',
        width: '12rem',
        top: `${top}px`,
        left: `${left}px`,
      });
    }
    setIsOpen(prev => !prev);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(event.target as Node) &&
        dropdownMenuRef.current && !dropdownMenuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const DropdownMenu = (
    <div
      ref={dropdownMenuRef}
      style={style}
      className="rounded-md shadow-lg bg-gray-700 ring-1 ring-black ring-opacity-5 z-50"
    >
      <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
        {React.Children.map(children, child => {
          // FIX: A specific cast like `{ onClick?: ... }` on the child is too narrow
          // and can cause type errors if the child has other props. Casting to
          // `React.ReactElement<any>` is safer for injecting props into unknown children.
          if (!React.isValidElement(child)) {
            return child;
          }
          const element = child as React.ReactElement<any>;
          return React.cloneElement(element, {
            onClick: (e: React.MouseEvent) => {
              e.stopPropagation();
              if (element.props.onClick) {
                element.props.onClick(e);
              }
              // The timeout for closing the dropdown could cause a race condition when the
              // action (like delete) unmounts the component. Closing it directly is safer
              // with modern React's state batching.
              setIsOpen(false);
            },
          });
        })}
      </div>
    </div>
  );

  // FIX: Cast `trigger` to `React.ReactElement<any>` to resolve a TypeScript error.
  // This ensures `onClick` can be added via `cloneElement` without type conflicts.
  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {React.cloneElement(trigger as React.ReactElement<any>, { onClick: handleToggle })}
      {isOpen && ReactDOM.createPortal(DropdownMenu, document.body)}
    </div>
  );
};

interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({ children, onClick, className = '' }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 hover:text-white ${className}`}
      role="menuitem"
    >
      {children}
    </button>
  );
};