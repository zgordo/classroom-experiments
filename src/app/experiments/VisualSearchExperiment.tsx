// VisualSearchExperiment.tsx
// Visual search experiment module

import React, { useEffect, useRef, useState } from 'react';

const ICONS = [
  '/file.svg',
  '/globe.svg',
  '/next.svg',
  '/vercel.svg',
  '/window.svg',
];

const NUM_TRIALS = 10;
const ICONS_PER_TRIAL = 8;

function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function shuffle<T>(array: T[]): T[] {
  return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

function randomPositions(count: number) {
  // Returns array of {top, left} in %
  return Array.from({ length: count }, () => ({
    top: Math.random() * 80 + 5, // 5% to 85%
    left: Math.random() * 80 + 5,
  }));
}

interface VisualSearchExperimentProps {
  studentId: string;
  onResult: (result: {
    studentId: string;
    trial: number;
    target: string;
    present: boolean;
    response: string;
    correct: boolean;
    rt: number;
  }) => void;
}

export default function VisualSearchExperiment({ studentId, onResult }: VisualSearchExperimentProps) {
  const [trial, setTrial] = useState<number>(0);
  const [showInstructions, setShowInstructions] = useState<boolean>(true);
  const [fullscreen, setFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [trialState, setTrialState] = useState<{
    targetIcon: string;
    targetPresent: boolean;
    icons: string[];
    positions: { top: number; left: number }[];
    start: number;
  } | null>(null);
  const [targetIcon, setTargetIcon] = useState<string>(() => ICONS[getRandomInt(ICONS.length)]);

  useEffect(() => {
    if (fullscreen && containerRef.current) {
      containerRef.current.requestFullscreen?.();
    }
  }, [fullscreen]);

  // Pick a new target icon for each experiment run
  useEffect(() => {
    setTargetIcon(ICONS[getRandomInt(ICONS.length)]);
  }, [studentId]);

  useEffect(() => {
    if (!showInstructions && trial < NUM_TRIALS) {
      startTrial();
    }
    // eslint-disable-next-line
  }, [showInstructions, trial]);

  function startTrial() {
    // Target icon is fixed for this run
    const targetPresent = Math.random() < 0.5;
    let icons = shuffle(ICONS.filter(i => i !== targetIcon)).slice(0, ICONS_PER_TRIAL - 1);
    if (targetPresent) icons.push(targetIcon);
    icons = shuffle(icons);
    const positions = randomPositions(ICONS_PER_TRIAL);
    setTrialState({ targetIcon, targetPresent, icons, positions, start: Date.now() });
  }

  function handleKey(e: KeyboardEvent) {
    if (!trialState) return;
    if (e.key === 'z' || e.key === '/') {
      const correct = (e.key === '/' && trialState.targetPresent) || (e.key === 'z' && !trialState.targetPresent);
      const rt = Date.now() - trialState.start;
      onResult({
        studentId,
        trial: trial + 1,
        target: trialState.targetIcon,
        present: trialState.targetPresent,
        response: e.key,
        correct,
        rt,
      });
      if (trial + 1 < NUM_TRIALS) {
        setTrial(t => t + 1);
      } else {
        setTrialState(null);
      }
    }
  }

  useEffect(() => {
    if (!showInstructions && trialState) {
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
    }
  }, [showInstructions, trialState]);

  if (showInstructions) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-2xl font-bold mb-4">Visual Search Experiment</h2>
        <p className="mb-4">You will see a set of icons randomly placed on the screen. Your task is to decide whether the <span className="font-bold">target icon</span> (shown below) is present or not. Press <kbd>z</kbd> if the target is <span className="font-bold">not present</span>, or <kbd>/</kbd> if it <span className="font-bold">is present</span>. Respond as quickly and accurately as possible. The experiment will begin in fullscreen mode.</p>
        <div className="mb-4 flex flex-col items-center">
          <span className="mb-1">Target Icon:</span>
          <img src={targetIcon} alt="target" className="w-12 h-12" />
        </div>
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => { setFullscreen(true); setShowInstructions(false); }}>Start Experiment</button>
      </div>
    );
  }

  if (!trialState && trial >= NUM_TRIALS) {
    return <div className="text-lg">Thank you! You have completed the experiment.</div>;
  }

  if (!trialState) return null;

  return (
    <div ref={containerRef} className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
      <div className="mb-2 text-lg">Trial {trial + 1} of {NUM_TRIALS}</div>
      <div className="relative w-[80vw] h-[60vh] border bg-gray-100 rounded">
        {trialState.icons.map((icon: string, i: number) => (
          <img
            key={i}
            src={icon}
            alt="icon"
            className="absolute w-12 h-12"
            style={{ top: `${trialState.positions[i].top}%`, left: `${trialState.positions[i].left}%`, transform: 'translate(-50%, -50%)' }}
          />
        ))}
      </div>
      <div className="mt-4 text-gray-600">Press <kbd>z</kbd> for not present, <kbd>/</kbd> for present</div>
    </div>
  );
}
