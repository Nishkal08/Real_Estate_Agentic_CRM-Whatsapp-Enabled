import * as RadixTooltip from '@radix-ui/react-tooltip';

/**
 * Glass tooltip using Radix UI
 */
export function Tooltip({ children, content, side = 'top', align = 'center', delayDuration = 400 }) {
  if (!content) return children;

  return (
    <RadixTooltip.Provider delayDuration={delayDuration}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>
          {children}
        </RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            align={align}
            sideOffset={6}
            className="radix-tooltip-content animate-fade-in"
          >
            {content}
            <RadixTooltip.Arrow
              style={{ fill: 'var(--bg-elevated)', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.08))' }}
            />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
