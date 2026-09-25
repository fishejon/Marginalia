import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Headphones,
  FileText,
  Star,
  Sparkles,
  Plus,
  ArrowUpRight,
  MessageSquare,
  Layers,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Eye,
  Sliders,
  Maximize2,
  Volume2,
} from 'lucide-react';
import { Entry, MediumType } from '../types';

interface VirtualBookshelfProps {
  entries: Entry[];
  onSelectEntry: (entry: Entry) => void;
  onReflectEntry: (entry: Entry) => void;
  onOpenNewModal: () => void;
  shelfStyle?: 'spines' | 'covers' | 'stack';
  onChangeShelfStyle?: (style: 'spines' | 'covers' | 'stack') => void;
  autoRotateEnabled?: boolean;
  onToggleAutoRotate?: () => void;
}

// Authentic fine binding leather & cloth palettes
const SPINE_PALETTES = [
  {
    name: 'Morocco Crimson',
    bg: 'bg-[#7A1D16]',
    gradient: 'from-[#8F231B] via-[#751A14] to-[#54120D]',
    border: 'border-[#4A100B]',
    foil: 'text-[#F9E2AF]',
    headband: '#C5A059',
    accent: '#E5A93C',
    pattern: 'leather',
  },
  {
    name: 'Oxford Navy',
    bg: 'bg-[#15233E]',
    gradient: 'from-[#1E335A] via-[#15233E] to-[#0D1627]',
    border: 'border-[#0B1220]',
    foil: 'text-[#EAECEF]',
    headband: '#8FA8CF',
    accent: '#64B5F6',
    pattern: 'buckram',
  },
  {
    name: 'Forest Buckram',
    bg: 'bg-[#143322]',
    gradient: 'from-[#1B432D] via-[#143322] to-[#0D2216]',
    border: 'border-[#0A1A11]',
    foil: 'text-[#E2EFDE]',
    headband: '#B2D8B0',
    accent: '#81C784',
    pattern: 'linen',
  },
  {
    name: 'Antique Cognac',
    bg: 'bg-[#6A3919]',
    gradient: 'from-[#82461F] via-[#6A3919] to-[#48250F]',
    border: 'border-[#3D1F0C]',
    foil: 'text-[#FDECD0]',
    headband: '#DFC087',
    accent: '#FFB74D',
    pattern: 'leather',
  },
  {
    name: 'Imperial Plum',
    bg: 'bg-[#3C1E3E]',
    gradient: 'from-[#4D2650] via-[#3C1E3E] to-[#2B142C]',
    border: 'border-[#221023]',
    foil: 'text-[#F6E6F7]',
    headband: '#CE93D8',
    accent: '#BA68C8',
    pattern: 'velvet',
  },
  {
    name: 'Burnished Amber',
    bg: 'bg-[#7B5318]',
    gradient: 'from-[#96651E] via-[#7B5318] to-[#57390F]',
    border: 'border-[#442C0A]',
    foil: 'text-[#FFF4DC]',
    headband: '#F5D061',
    accent: '#FFCA28',
    pattern: 'buckram',
  },
  {
    name: 'Charcoal Slate',
    bg: 'bg-[#252528]',
    gradient: 'from-[#333338] via-[#252528] to-[#18181A]',
    border: 'border-[#121214]',
    foil: 'text-[#F0F0F0]',
    headband: '#BDBDBD',
    accent: '#E0E0E0',
    pattern: 'canvas',
  },
  {
    name: 'Terracotta Clay',
    bg: 'bg-[#82331F]',
    gradient: 'from-[#9B3E26] via-[#82331F] to-[#5E2415]',
    border: 'border-[#4E1D10]',
    foil: 'text-[#FBE8DE]',
    headband: '#E09F84',
    accent: '#FF8A65',
    pattern: 'linen',
  },
];

// Curated organic heights and thicknesses for realistic variation
const BOOK_DIMENSIONS = [
  { height: 'h-[255px]', width: 'w-11 sm:w-13', lean: 'rotate-0', thickness: '46px' },
  { height: 'h-[275px]', width: 'w-13 sm:w-15', lean: 'rotate-0', thickness: '54px' },
  { height: 'h-[240px]', width: 'w-10 sm:w-12', lean: 'rotate-0', thickness: '38px' },
  { height: 'h-[285px]', width: 'w-14 sm:w-16', lean: 'rotate-0', thickness: '62px' },
  { height: 'h-[260px]', width: 'w-12 sm:w-14', lean: 'rotate-0', thickness: '50px' },
  { height: 'h-[248px]', width: 'w-11 sm:w-13', lean: 'rotate-0', thickness: '44px' },
  { height: 'h-[270px]', width: 'w-13 sm:w-15', lean: 'rotate-0', thickness: '52px' },
  { height: 'h-[235px]', width: 'w-10 sm:w-11', lean: 'rotate-0', thickness: '36px' },
  { height: 'h-[280px]', width: 'w-14 sm:w-16', lean: 'rotate-0', thickness: '60px' },
  { height: 'h-[265px]', width: 'w-12 sm:w-14', lean: 'rotate-0', thickness: '48px' },
];

export const VirtualBookshelf: React.FC<VirtualBookshelfProps> = ({
  entries,
  onSelectEntry,
  onReflectEntry,
  onOpenNewModal,
  shelfStyle: controlledShelfStyle,
  onChangeShelfStyle,
  autoRotateEnabled: controlledAutoRotate,
  onToggleAutoRotate,
}) => {
  // Local or controlled presentation style
  const [internalShelfStyle, setInternalShelfStyle] = useState<'spines' | 'covers' | 'stack'>('spines');
  const shelfStyle = controlledShelfStyle ?? internalShelfStyle;
  const setShelfStyle = onChangeShelfStyle ?? setInternalShelfStyle;

  // Auto-rotation state
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(
    controlledAutoRotate ?? true
  );
  const [rotationSpeed, setRotationSpeed] = useState<number>(6000); // 6 seconds per shelf
  const [viewAllShelves, setViewAllShelves] = useState<boolean>(false);
  const [activeShelfIdx, setActiveShelfIdx] = useState<number>(0);
  const [rotationProgress, setRotationProgress] = useState<number>(0);
  const [isHoveringShelf, setIsHoveringShelf] = useState<boolean>(false);

  // Active inspected book for spotlight pull-out
  const [activeHoverEntry, setActiveHoverEntry] = useState<Entry | null>(
    entries.length > 0 ? entries[0] : null
  );

  // Expanded shelf capacity: 12 slots per shelf (significantly more than 7)
  const ITEMS_PER_SHELF = 12;

  // Partition entries across shelf tiers
  const shelves: Entry[][] = [];
  if (entries.length === 0) {
    shelves.push([]);
  } else {
    for (let i = 0; i < entries.length; i += ITEMS_PER_SHELF) {
      shelves.push(entries.slice(i, i + ITEMS_PER_SHELF));
    }
  }

  // Ensure current activeShelfIdx is within bounds
  useEffect(() => {
    if (activeShelfIdx >= shelves.length) {
      setActiveShelfIdx(0);
    }
  }, [shelves.length, activeShelfIdx]);

  // Sync external auto-rotate prop if passed
  useEffect(() => {
    if (controlledAutoRotate !== undefined) {
      setIsAutoRotating(controlledAutoRotate);
    }
  }, [controlledAutoRotate]);

  // Auto-rotation timer loop
  useEffect(() => {
    // Only rotate if auto-rotate is ON, more than 1 shelf exists, user is not hovering, and not in "view all" mode
    if (!isAutoRotating || shelves.length <= 1 || isHoveringShelf || viewAllShelves) {
      setRotationProgress(0);
      return;
    }

    const intervalTime = 100; // tick every 100ms
    const totalTicks = rotationSpeed / intervalTime;
    let ticks = 0;

    const timer = setInterval(() => {
      ticks += 1;
      setRotationProgress(Math.min(100, Math.round((ticks / totalTicks) * 100)));

      if (ticks >= totalTicks) {
        ticks = 0;
        setRotationProgress(0);
        setActiveShelfIdx((prev) => (prev + 1) % shelves.length);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isAutoRotating, shelves.length, isHoveringShelf, viewAllShelves, rotationSpeed]);

  const handleNextShelf = () => {
    setActiveShelfIdx((prev) => (prev + 1) % shelves.length);
    setRotationProgress(0);
  };

  const handlePrevShelf = () => {
    setActiveShelfIdx((prev) => (prev - 1 + shelves.length) % shelves.length);
    setRotationProgress(0);
  };

  const toggleRotation = () => {
    if (onToggleAutoRotate) {
      onToggleAutoRotate();
    } else {
      setIsAutoRotating((prev) => !prev);
    }
  };

  // The shelves to render: either the single rotating shelf or all shelves
  const renderedShelves = viewAllShelves ? shelves : [shelves[activeShelfIdx] || []];

  return (
    <div className="space-y-4">
      {/* Top Shelf Bar: Shelf Navigation, Rotating Tour Status & Style Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 bg-white rounded-xl border border-[#E7E2D8] shadow-xs">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-widest font-mono font-bold text-[#9A3412]">
                Virtual Library Room
              </span>
              <span className="text-stone-300">·</span>
              <span className="text-xs font-sans text-stone-600">
                {entries.length} {entries.length === 1 ? 'Volume' : 'Volumes'} · {shelves.length} {shelves.length === 1 ? 'Shelf' : 'Shelves'} (12 Slots/Shelf)
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900 leading-tight">
              {!viewAllShelves && shelves.length > 1
                ? `Browsing Shelf Tier ${activeShelfIdx + 1} of ${shelves.length}`
                : 'Living Bookshelf & Curated Shelves'}
            </h2>
          </div>
        </div>

        {/* Shelf Tour / Rotation Engine Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {shelves.length > 1 && !viewAllShelves && (
            <div className="flex items-center gap-1.5 bg-[#FAF7F2] border border-[#DDD6C8] rounded-lg px-2.5 py-1 text-xs">
              {/* Play / Pause Rotation button */}
              <button
                type="button"
                onClick={toggleRotation}
                className="flex items-center gap-1 font-semibold text-stone-800 hover:text-[#9A3412] cursor-pointer transition-colors"
                title={isAutoRotating ? 'Pause Shelf Auto-Tour' : 'Start Shelf Auto-Tour'}
              >
                {isAutoRotating ? (
                  <>
                    <Pause className="w-3.5 h-3.5 text-[#9A3412]" />
                    <span className="text-[11px] font-mono">Tour: ON</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-stone-600" />
                    <span className="text-[11px] font-mono text-stone-600">Tour: PAUSED</span>
                  </>
                )}
              </button>

              {/* Progress ring or mini bar */}
              {isAutoRotating && !isHoveringShelf && (
                <div className="w-10 h-1.5 bg-stone-200 rounded-full overflow-hidden ml-1">
                  <div
                    className="h-full bg-[#9A3412] transition-all duration-100 ease-linear rounded-full"
                    style={{ width: `${rotationProgress}%` }}
                  />
                </div>
              )}

              {/* Speed cycle button */}
              <button
                onClick={() =>
                  setRotationSpeed((s) => (s === 4000 ? 7000 : s === 7000 ? 10000 : 4000))
                }
                className="text-[10px] font-mono text-stone-500 hover:text-stone-800 px-1 py-0.5 rounded cursor-pointer border-l border-stone-200 ml-1"
                title="Change Tour Speed"
              >
                {rotationSpeed / 1000}s
              </button>
            </div>
          )}

          {/* Prev / Next Shelf arrows */}
          {shelves.length > 1 && !viewAllShelves && (
            <div className="flex items-center gap-1 bg-[#FAF7F2] border border-[#DDD6C8] rounded-lg p-0.5">
              <button
                onClick={handlePrevShelf}
                className="p-1 text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded cursor-pointer transition-colors"
                title="Previous Shelf"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1 px-1.5">
                {shelves.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveShelfIdx(idx);
                      setRotationProgress(0);
                    }}
                    className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                      activeShelfIdx === idx
                        ? 'w-4 bg-[#9A3412]'
                        : 'bg-stone-300 hover:bg-stone-400'
                    }`}
                    title={`Jump to Shelf ${idx + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={handleNextShelf}
                className="p-1 text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded cursor-pointer transition-colors"
                title="Next Shelf"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Toggle View All Shelves at once vs Rotating Single Shelf */}
          {shelves.length > 1 && (
            <button
              onClick={() => setViewAllShelves((v) => !v)}
              className="text-xs font-mono px-2.5 py-1.5 bg-[#FAF7F2] border border-[#DDD6C8] rounded-lg text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              {viewAllShelves ? 'Single Rotating Shelf' : 'View All Shelves'}
            </button>
          )}

          {/* Presentation style switcher */}
          <div className="flex items-center gap-0.5 p-0.5 bg-[#F4EFE6] rounded-lg text-xs font-medium">
            <button
              onClick={() => setShelfStyle('spines')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                shelfStyle === 'spines'
                  ? 'bg-white text-stone-900 font-semibold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Spines
            </button>
            <button
              onClick={() => setShelfStyle('covers')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                shelfStyle === 'covers'
                  ? 'bg-white text-stone-900 font-semibold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Face-Out
            </button>
            <button
              onClick={() => setShelfStyle('stack')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                shelfStyle === 'stack'
                  ? 'bg-white text-stone-900 font-semibold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Desk Stack
            </button>
          </div>
        </div>
      </div>

      {/* Main Realistic Bookshelf Presentation Container */}
      <div
        onMouseEnter={() => setIsHoveringShelf(true)}
        onMouseLeave={() => setIsHoveringShelf(false)}
        className="rounded-2xl border-2 border-[#1A120B] bg-[#1E1510] shadow-2xl overflow-hidden relative"
      >
        {/* Realistic Bookcase Background Wall: Rich oiled walnut vertical panels */}
        <div
          className="absolute inset-0 opacity-90 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(0,0,0,0.6) 0%, rgba(255,255,255,0.02) 20%, rgba(0,0,0,0.4) 100%),
              repeating-linear-gradient(90deg, #241913 0px, #241913 80px, #1A120D 80px, #1A120D 82px)
            `,
          }}
        />

        {/* Ambient occlusion shadow inside bookcase frame */}
        <div className="absolute inset-0 shadow-[inset_0_20px_40px_rgba(0,0,0,0.85),inset_0_-20px_40px_rgba(0,0,0,0.85),inset_20px_0_40px_rgba(0,0,0,0.9),inset_-20px_0_40px_rgba(0,0,0,0.9)] pointer-events-none z-20" />

        {/* Shelves Content */}
        <div className="relative z-10 p-5 sm:p-8 space-y-10">
          {renderedShelves.map((shelfItems, shelfOffset) => {
            const actualShelfIdx = viewAllShelves ? shelfOffset : activeShelfIdx;
            const emptySlotsCount = Math.max(0, ITEMS_PER_SHELF - shelfItems.length);

            return (
              <div key={actualShelfIdx} className="relative">
                {/* Top Shelf Brass Label Plate */}
                <div className="flex items-center justify-between pb-3 px-3 text-[11px] font-mono uppercase tracking-widest text-[#D4C3A3]/80">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="font-bold text-[#F3E5AB]">Shelf Tier {actualShelfIdx + 1}</span>
                    <span className="text-white/40">·</span>
                    <span className="text-white/70">
                      {shelfItems.length} of {ITEMS_PER_SHELF} Slots Filled
                    </span>
                  </div>

                  {isAutoRotating && !viewAllShelves && shelves.length > 1 && (
                    <span className="text-[10px] text-amber-300/80 font-mono flex items-center gap-1">
                      <RotateCw className="w-3 h-3 animate-spin text-amber-400" />
                      Rotating Tour Active
                    </span>
                  )}
                </div>

                {/* Items on Shelf Surface */}
                <div className="relative flex items-end justify-start px-2 sm:px-6 overflow-x-auto pb-0.5 scrollbar-thin">
                  
                  {/* Left Antique Brass Bookend */}
                  <div className="shrink-0 mr-2 sm:mr-3 flex flex-col items-center justify-end z-15 pointer-events-none select-none">
                    <div className="w-5 sm:w-6 h-36 sm:h-44 bg-gradient-to-r from-[#9E7B3B] via-[#D8B467] to-[#785923] rounded-t-sm border border-[#523B10] shadow-lg flex flex-col justify-between items-center py-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#523B10]/60 border border-[#F3DE9C]" />
                      <div className="w-1 h-16 bg-[#523B10]/40 rounded-full" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#523B10]/60 border border-[#F3DE9C]" />
                    </div>
                    <div className="w-8 sm:w-10 h-3 bg-gradient-to-b from-[#D8B467] to-[#523B10] rounded-xs shadow-md border-t border-[#F8E7B2]" />
                  </div>

                  {/* STYLE A: Realistic Library Spines */}
                  {shelfStyle === 'spines' && (
                    <div className="flex items-end gap-1.5 sm:gap-2.5">
                      {shelfItems.map((item, itemIdx) => {
                        const globalIndex = actualShelfIdx * ITEMS_PER_SHELF + itemIdx;
                        const palette = SPINE_PALETTES[globalIndex % SPINE_PALETTES.length];
                        const dim = BOOK_DIMENSIONS[globalIndex % BOOK_DIMENSIONS.length];
                        const isHovered = activeHoverEntry?.id === item.id;

                        // Check if book has a real cover artwork URL
                        const hasCoverImage = Boolean(item.coverUrl);

                        return (
                          <div
                            key={item.id}
                            onMouseEnter={() => setActiveHoverEntry(item)}
                            onClick={() => onSelectEntry(item)}
                            className={`relative shrink-0 cursor-pointer transition-all duration-300 transform group ${
                              isHovered
                                ? '-translate-y-6 scale-105 z-30'
                                : 'hover:-translate-y-3 z-10'
                            }`}
                          >
                            {/* Realistic Hardcover Book Spine */}
                            <div
                              className={`${dim.height} ${dim.width} rounded-t-xs shadow-xl flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${palette.border} border-t border-r border-l`}
                              style={{
                                background: hasCoverImage
                                  ? undefined
                                  : `linear-gradient(135deg, ${palette.gradient.replace('from-', '').replace('via-', '').replace('to-', '')})`,
                                backgroundColor: !hasCoverImage ? undefined : '#1E1510',
                                boxShadow: isHovered
                                  ? '0 25px 35px -5px rgba(0, 0, 0, 0.9), 0 10px 15px -5px rgba(0, 0, 0, 0.7)'
                                  : '0 10px 15px -3px rgba(0,0,0,0.7), inset 2px 0 4px rgba(255,255,255,0.2), inset -2px 0 5px rgba(0,0,0,0.5)',
                              }}
                            >
                              {/* If book has actual cover art, use as realistic textured spine slice */}
                              {hasCoverImage && (
                                <div className="absolute inset-0 z-0">
                                  <img
                                    src={item.coverUrl}
                                    alt={item.title}
                                    className="w-full h-full object-cover filter brightness-90 contrast-105"
                                    referrerPolicy="no-referrer"
                                  />
                                  {/* Darkening tint to guarantee readability of embossed title */}
                                  <div className="absolute inset-0 bg-black/45" />
                                </div>
                              )}

                              {/* Realistic 3D Cylindrical Spine Lighting Curve */}
                              <div className="spine-curve-overlay absolute inset-0 z-10 pointer-events-none" />

                              {/* Top Headband: authentic woven fabric strip */}
                              <div
                                className="h-1.5 w-full z-20 shrink-0 border-b border-black/40"
                                style={{
                                  backgroundColor: palette.headband,
                                  backgroundImage:
                                    'repeating-linear-gradient(45deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 2px, transparent 2px, transparent 4px)',
                                }}
                              />

                              {/* Upper Raised Rib */}
                              <div className="spine-rib w-full h-1 bg-black/40 z-20 shrink-0 my-1 opacity-80" />

                              {/* Media Type & Star Rating Emblem */}
                              <div className="z-20 px-1 pt-1 flex flex-col items-center justify-center shrink-0">
                                {item.medium === 'podcast' ? (
                                  <div className="w-5 h-5 rounded-full bg-amber-500/30 border border-amber-300/40 flex items-center justify-center">
                                    <Headphones className="w-2.5 h-2.5 text-amber-200" />
                                  </div>
                                ) : item.medium === 'article' || item.medium === 'essay' ? (
                                  <div className="w-5 h-5 rounded-full bg-emerald-500/30 border border-emerald-300/40 flex items-center justify-center">
                                    <FileText className="w-2.5 h-2.5 text-emerald-200" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-yellow-500/20 border border-amber-300/30 flex items-center justify-center">
                                    <BookOpen className="w-2.5 h-2.5 text-amber-200" />
                                  </div>
                                )}
                              </div>

                              {/* Middle Raised Rib */}
                              <div className="spine-rib w-full h-1 bg-black/40 z-20 shrink-0 my-0.5 opacity-80" />

                              {/* Book Title: Authentic Vertical Foil Lettering */}
                              <div className="flex-1 flex items-center justify-center my-2 overflow-hidden z-20 px-0.5">
                                <span
                                  className={`text-[10px] sm:text-[11px] font-serif font-bold tracking-widest uppercase text-center select-none line-clamp-1 gold-foil-text drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]`}
                                  style={{
                                    writingMode: 'vertical-rl',
                                    textOrientation: 'mixed',
                                    transform: 'rotate(180deg)',
                                    maxHeight: '140px',
                                  }}
                                >
                                  {item.title}
                                </span>
                              </div>

                              {/* Lower Raised Rib */}
                              <div className="spine-rib w-full h-1 bg-black/40 z-20 shrink-0 my-0.5 opacity-80" />

                              {/* Author & Publisher Colophon at Spine Base */}
                              <div className="z-20 pb-2 px-1 flex flex-col items-center justify-center shrink-0">
                                <span className="text-[9px] font-sans font-medium tracking-tight text-white/90 truncate max-w-full text-center drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
                                  {item.author.split(' ').pop()}
                                </span>
                                <div className="mt-1 flex items-center gap-0.5 text-amber-300">
                                  <Star className="w-2 h-2 fill-amber-400 text-amber-400" />
                                  <span className="text-[8px] font-mono font-bold">{item.rating}</span>
                                </div>
                              </div>

                              {/* Bottom Tailband */}
                              <div
                                className="h-1.5 w-full z-20 shrink-0 border-t border-black/40"
                                style={{
                                  backgroundColor: palette.headband,
                                  backgroundImage:
                                    'repeating-linear-gradient(45deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 2px, transparent 2px, transparent 4px)',
                                }}
                              />

                              {/* Silk Ribbon Bookmark for 5-star items */}
                              {item.rating >= 5 && (
                                <div className="absolute -bottom-3 right-2 w-2 h-5 bg-gradient-to-b from-amber-500 to-amber-700 rounded-b-xs shadow-md z-30 border-r border-amber-800" />
                              )}
                            </div>

                            {/* Drop shadow cast under book onto the shelf wood */}
                            <div className="h-2 w-full bg-black/70 rounded-full blur-[1px] -mt-1 mx-auto" />
                          </div>
                        );
                      })}

                      {/* Empty Book Slots that fill up as new sources are recorded */}
                      {Array.from({ length: emptySlotsCount }).map((_, slotIdx) => {
                        const slotNumber = shelfItems.length + slotIdx + 1;
                        return (
                          <div
                            key={`empty-${slotIdx}`}
                            onClick={onOpenNewModal}
                            className="w-11 sm:w-13 h-[245px] border-2 border-dashed border-[#D4C3A3]/20 hover:border-[#D4C3A3]/60 bg-black/20 hover:bg-black/35 rounded-t-sm flex flex-col items-center justify-center text-[#D4C3A3]/40 hover:text-[#F3E5AB] transition-all cursor-pointer group shrink-0"
                            title={`Add a source to fill Slot ${slotNumber} on this shelf`}
                          >
                            <div className="w-7 h-7 rounded-full bg-white/5 group-hover:bg-amber-500/20 border border-white/10 group-hover:border-amber-400/40 flex items-center justify-center mb-2 transition-all group-hover:scale-110">
                              <Plus className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[9px] font-mono uppercase tracking-widest text-center px-1">
                              Slot {slotNumber}
                            </span>
                            <span className="text-[8px] font-sans text-stone-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              + Add
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* STYLE B: Face-Out Cover Display Ledge */}
                  {shelfStyle === 'covers' && (
                    <div className="flex items-end gap-3 sm:gap-4">
                      {shelfItems.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => onSelectEntry(item)}
                          className="w-32 sm:w-36 shrink-0 cursor-pointer transition-transform hover:-translate-y-3 duration-300 group"
                        >
                          <div className="h-44 sm:h-52 w-full rounded-md shadow-xl overflow-hidden border border-white/20 bg-stone-900 relative">
                            {item.coverUrl ? (
                              <img
                                src={item.coverUrl}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full p-3.5 flex flex-col justify-between bg-gradient-to-br from-[#4A3428] via-[#2F2119] to-[#1D140E] text-[#F5E6D3]">
                                <div className="flex justify-between items-center">
                                  <span className="text-[9px] font-mono uppercase text-amber-300">
                                    {item.medium}
                                  </span>
                                  <span className="text-[9px] font-mono text-amber-400 font-bold">
                                    ★ {item.rating}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-xs font-serif font-bold line-clamp-3 leading-snug text-white">
                                    {item.title}
                                  </p>
                                  <p className="text-[10px] font-serif italic text-stone-300 mt-1 truncate">
                                    {item.author}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                          <p className="text-xs font-serif text-[#F0E6D8] mt-2 truncate text-center">
                            {item.title}
                          </p>
                        </div>
                      ))}

                      {Array.from({ length: Math.min(4, emptySlotsCount) }).map((_, slotIdx) => (
                        <div
                          key={`empty-cover-${slotIdx}`}
                          onClick={onOpenNewModal}
                          className="w-32 sm:w-36 h-44 sm:h-52 border-2 border-dashed border-white/20 hover:border-white/40 rounded-md flex flex-col items-center justify-center text-white/40 hover:text-white/80 transition-colors cursor-pointer shrink-0 bg-black/20"
                        >
                          <Plus className="w-5 h-5 mb-1" />
                          <span className="text-[10px] font-mono">Empty Slot</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* STYLE C: Desk Stack */}
                  {shelfStyle === 'stack' && (
                    <div className="flex-1 flex items-end justify-center py-4">
                      <div className="flex flex-col-reverse items-center gap-2 w-full max-w-lg">
                        {shelfItems.map((item, idx) => {
                          const palette = SPINE_PALETTES[idx % SPINE_PALETTES.length];
                          return (
                            <div
                              key={item.id}
                              onClick={() => onSelectEntry(item)}
                              className={`w-full py-2.5 px-4 rounded ${palette.bg} ${palette.border} border shadow-lg flex items-center justify-between text-xs cursor-pointer hover:scale-102 transition-transform`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                                <span className="font-serif font-bold truncate text-[#FBEED7]">
                                  {item.title}
                                </span>
                              </div>
                              <span className="text-[10px] font-sans opacity-85 shrink-0 text-white">
                                {item.author}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Right Antique Brass Bookend */}
                  <div className="shrink-0 ml-2 sm:ml-3 flex flex-col items-center justify-end z-15 pointer-events-none select-none">
                    <div className="w-5 sm:w-6 h-36 sm:h-44 bg-gradient-to-r from-[#785923] via-[#D8B467] to-[#9E7B3B] rounded-t-sm border border-[#523B10] shadow-lg flex flex-col justify-between items-center py-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#523B10]/60 border border-[#F3DE9C]" />
                      <div className="w-1 h-16 bg-[#523B10]/40 rounded-full" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#523B10]/60 border border-[#F3DE9C]" />
                    </div>
                    <div className="w-8 sm:w-10 h-3 bg-gradient-to-b from-[#D8B467] to-[#523B10] rounded-xs shadow-md border-t border-[#F8E7B2]" />
                  </div>

                </div>

                {/* Heavy Handcrafted Oak Bookshelf Plinth with Brass Nameplate */}
                <div className="relative mt-0 z-20">
                  {/* Top beveled shelf ledge with warm light reflection */}
                  <div className="h-3 w-full bg-gradient-to-r from-[#9E7D69] via-[#B89885] to-[#9E7D69] border-t border-[#D7CCC8]/30 shadow-xs" />

                  {/* Solid hardwood front bullnose beam */}
                  <div className="wood-shelf-surface h-8 sm:h-9 w-full border-t border-[#795548] border-b-2 border-[#1B110B] shadow-2xl flex items-center justify-between px-6 sm:px-10 relative">
                    {/* Left brass screw */}
                    <div className="w-2.5 h-2.5 rounded-full bg-[#D4B26F] border border-[#8C6B2D] shadow-inner flex items-center justify-center">
                      <div className="w-1.5 h-0.5 bg-[#4A3716]" />
                    </div>

                    {/* Vintage Engraved Brass Shelf Nameplate */}
                    <div className="px-4 py-0.5 bg-gradient-to-r from-[#C29B53] via-[#F0D597] to-[#C29B53] rounded-xs border border-[#806124] shadow-md flex items-center gap-2">
                      <span className="text-[10px] font-serif font-bold text-[#3B290B] tracking-wider uppercase">
                        Marginalia Canon · Shelf {actualShelfIdx + 1}
                      </span>
                    </div>

                    {/* Right brass screw */}
                    <div className="w-2.5 h-2.5 rounded-full bg-[#D4B26F] border border-[#8C6B2D] shadow-inner flex items-center justify-center">
                      <div className="w-1.5 h-0.5 bg-[#4A3716]" />
                    </div>
                  </div>

                  {/* Deep drop shadow under the shelf plinth */}
                  <div className="h-6 w-full bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Active Book Spotlight (Pull-out Inspector) */}
      {activeHoverEntry && (
        <div className="bg-white rounded-xl border border-[#E7E2D8] p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-4 min-w-0">
            {activeHoverEntry.coverUrl ? (
              <img
                src={activeHoverEntry.coverUrl}
                alt={activeHoverEntry.title}
                className="w-16 h-22 object-cover rounded-md border border-[#DFD8C9] shrink-0 shadow-md"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-22 bg-[#F3EFE6] rounded-md border border-[#DFD8C9] flex items-center justify-center text-stone-400 shrink-0 font-serif font-bold text-xl">
                {activeHoverEntry.title.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-sans text-stone-500 mb-0.5">
                <span className="capitalize font-medium text-stone-800">
                  {activeHoverEntry.medium}
                </span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1 font-mono text-amber-600 font-bold">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  {activeHoverEntry.rating}/5
                </span>
                {activeHoverEntry.tags && activeHoverEntry.tags.length > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-[11px] text-stone-600 truncate">
                      #{activeHoverEntry.tags[0]}
                    </span>
                  </>
                )}
              </div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 leading-snug truncate">
                {activeHoverEntry.title}
              </h3>
              <p className="text-xs font-serif italic text-stone-600">
                by {activeHoverEntry.author}
              </p>
              <p className="text-xs text-stone-600 font-serif mt-1 line-clamp-1">
                {activeHoverEntry.whatImThinking || activeHoverEntry.whyILikedIt}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onReflectEntry(activeHoverEntry)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-800 bg-[#F4EFE6] hover:bg-[#EAE4D7] border border-[#D5CCBA] rounded-lg transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#9A3412]" />
              <span>Reflect</span>
            </button>
            <button
              onClick={() => onSelectEntry(activeHoverEntry)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <span>Pull Off Shelf</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
