import React from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  target: string;
  onClose: () => void;
  onSelectAction: (action: string, arg?: string) => void;
}

const MENU_OPTIONS: Record<string, { label: string; action: string; arg?: string }[]> = {
  bed: [
    { label: '🛌 Go to Sleep', action: 'sleep' },
    { label: '🧘 Sit on Edge', action: 'sit', arg: 'bed' },
    { label: '🔍 Inspect Bed', action: 'walk', arg: 'bed' },
  ],
  chair: [
    { label: '🪑 Sit on Chair', action: 'sit', arg: 'chair' },
    { label: '🔍 Inspect Desk', action: 'walk', arg: 'desk' },
  ],
  sofa: [
    { label: '🛋️ Sit on Sofa', action: 'sit', arg: 'sofa' },
    { label: '🔍 Inspect Sofa', action: 'walk', arg: 'sofa' },
  ],
  bookshelf: [
    { label: '📚 Read a Book', action: 'readBook' },
    { label: '🔍 Inspect Bookshelf', action: 'walk', arg: 'bookshelf' },
  ],
  window: [
    { label: '🌆 Look Outside', action: 'lookOutside' },
    { label: '🖼️ Open Window', action: 'openWindow' },
    { label: '🪟 Close Curtains', action: 'closeCurtains' },
  ],
  mug: [
    { label: '☕ Pick Up Mug', action: 'pickUpMug' },
    { label: '📥 Put Mug Back', action: 'putMugBack' },
  ],
  floor: [
    { label: '🚶 Walk Here', action: 'walkToPoint' },
  ]
};

export default function ContextMenu({ x, y, target, onClose, onSelectAction }: ContextMenuProps) {
  const options = MENU_OPTIONS[target] || [];

  if (options.length === 0) return null;

  return (
    <>
      {/* Click outside to close overlay */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose} 
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      
      {/* Floating glassmorphic context menu */}
      <div
        className="fixed z-50 min-w-[160px] backdrop-blur-xl bg-[#0d0d1e]/85 border border-white/[0.08] rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
        style={{ top: y, left: x }}
      >
        <div className="px-3 py-1.5 border-b border-white/[0.05] text-[10px] font-bold tracking-wider uppercase text-white/40">
          {target} actions
        </div>
        <ul className="flex flex-col">
          {options.map((opt, idx) => (
            <li key={idx}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-xs text-white/80 hover:bg-white/[0.08] hover:text-white transition flex items-center gap-2"
                onClick={() => {
                  onSelectAction(opt.action, opt.arg);
                  onClose();
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
