import { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils/helpers';

interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  children?: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  variant?: 'default' | 'pills' | 'underline';
  orientation?: 'horizontal' | 'vertical';
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  className,
  variant = 'default',
  orientation = 'horizontal',
}: TabsProps) {
  const tabsRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState({ left: 0, maxLeft: 0 });

  const handleScroll = () => {
    if (tabsRef.current) {
      setScrollPosition({
        left: tabsRef.current.scrollLeft,
        maxLeft: tabsRef.current.scrollWidth - tabsRef.current.clientWidth,
      });
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, []);

  const scrollToTab = (tabId: string) => {
    if (!tabsRef.current) return;
    const tabElement = tabsRef.current.querySelector(`[data-tab-id="${tabId}"]`);
    if (tabElement) {
      tabElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  useEffect(() => {
    scrollToTab(activeTab);
  }, [activeTab]);

  const variantStyles = {
    default: 'border-b border-gray-200',
    pills: 'bg-gray-100 p-1 rounded-lg',
    underline: 'border-b-2 border-transparent',
  };

  const tabStyles = {
    default: 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
    pills: 'rounded-md text-gray-600 hover:text-gray-900',
    underline: 'border-b-2 border-transparent text-gray-500 hover:text-gray-700',
  };

  const activeStyles = {
    default: 'border-primary-600 text-primary-600',
    pills: 'bg-white text-primary-600 shadow-sm',
    underline: 'border-primary-600 text-primary-600',
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        ref={tabsRef}
        className={cn(
          'flex gap-1 overflow-x-auto scrollbar-hide',
          variantStyles[variant],
          orientation === 'vertical' ? 'flex-col' : ''
        )}
        role="tablist"
        aria-orientation={orientation}
        onScroll={handleScroll}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            data-tab-id={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id}-panel`}
            id={`${tab.id}-tab`}
            onClick={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
            className={cn(
              'px-4 py-2 text-sm font-medium whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
              tabStyles[variant],
              activeTab === tab.id && activeStyles[variant],
              tab.disabled && 'opacity-50 cursor-not-allowed',
              orientation === 'vertical' && 'text-left w-full'
            )}
          >
            {tab.icon && <span className="mr-2 flex-shrink-0">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>

      {orientation === 'horizontal' && (
        <div className="flex justify-between items-center px-2 text-xs text-gray-400">
          {scrollPosition.left > 0 && (
            <span>←</span>
          )}
          {scrollPosition.left < scrollPosition.maxLeft - 10 && (
            <span>→</span>
          )}
        </div>
      )}

      {tabs.map((tab) => (
        <div
          key={`${tab.id}-panel`}
          id={`${tab.id}-panel`}
          role="tabpanel"
          aria-labelledby={`${tab.id}-tab`}
          hidden={activeTab !== tab.id}
          className="mt-4"
        >
          {activeTab === tab.id && <div data-tab-content>{tab.children}</div>}
        </div>
      ))}
    </div>
  );
}

interface TabPanelProps {
  id: string;
  children: React.ReactNode;
}

export function TabPanel({ id, children }: TabPanelProps) {
  return <div data-tab-content id={id} role="tabpanel">{children}</div>;
}