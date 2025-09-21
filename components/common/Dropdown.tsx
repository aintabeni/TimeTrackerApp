import React, { useState, useRef, useEffect } from 'react';

interface DropdownProps {
  trigger: React.ReactElement;
  children: React.ReactNode;
}

export const Dropdown: React.FC<DropdownProps> = ({ trigger, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => setIsOpen(prev => !prev);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div onClick={handleToggle} className="cursor-pointer">
        {trigger}
      </div>
      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-700 ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            {React.Children.map(children, child => {
              // FIX: Add a generic type to `isValidElement` to type-guard the child element's props.
              // This ensures that `child` is a React element that can accept an `onClick` prop.
              if (!React.isValidElement<{ onClick?: () => void }>(child)) {
                return child;
              }
              return React.cloneElement(child, {
                  // This allows DropdownItems to close the dropdown on click
                  onClick: () => {
                    if (child.props.onClick && typeof child.props.onClick === 'function') {
                      child.props.onClick();
                    }
                    setIsOpen(false);
                  },
                });
            })}
          </div>
        </div>
      )}
    </div>
  );
};

interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({ children, onClick, className = '' }) => {
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
      }}
      className={`block px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 hover:text-white ${className}`}
      role="menuitem"
    >
      {children}
    </a>
  );
};