"use client";

// ExperimentManager.tsx
// Handles experiment selection, user flow, and experiment swapping

import React, { useState, useEffect } from 'react';
import VisualSearchExperiment from './experiments/VisualSearchExperiment';

export type ExperimentType = 'visual-search'; // Add more as needed

const experiments = {
  'visual-search': VisualSearchExperiment,
  // Add more experiments here
};

// Utility to generate a unique 6-digit ID
function generateStudentId() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Utility to get/set classroom state/results in localStorage
const CLASSROOM_KEY = 'classroom-experiment-state';
const RESULTS_KEY = 'classroom-experiment-results';

function getClassroomState() {
  if (typeof window === 'undefined') return { started: false, ended: false };
  try {
    return JSON.parse(localStorage.getItem(CLASSROOM_KEY) || '{}');
  } catch {
    return { started: false, ended: false };
  }
}
function setClassroomState(state: any) {
  localStorage.setItem(CLASSROOM_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event('storage')); // force update for all tabs
}
function getResults() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RESULTS_KEY) || '[]');
  } catch {
    return [];
  }
}
function addResult(result: any) {
  const results = getResults();
  results.push(result);
  localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
}
function clearResults() {
  localStorage.removeItem(RESULTS_KEY);
}

export default function ExperimentManager() {
  const [role, setRole] = useState<'professor' | 'student' | null>(null);
  const [experiment, setExperiment] = useState<ExperimentType>('visual-search');
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);

  // Sync classroom state across tabs
  useEffect(() => {
    function syncState() {
      const state = getClassroomState();
      setStarted(!!state.started);
      setEnded(!!state.ended);
    }
    window.addEventListener('storage', syncState);
    syncState();
    return () => window.removeEventListener('storage', syncState);
  }, []);

  function handleStart() {
    setClassroomState({ started: true, ended: false });
    clearResults();
  }
  function handleEnd() {
    setClassroomState({ started: false, ended: true });
  }
  function handleStudentJoin() {
    const id = generateStudentId();
    setStudentId(id);
  }
  function handleStudentResult(result: any) {
    addResult(result);
  }
  function handleDownloadCSV() {
    const results = getResults();
    const header = 'student_id,trial,target,present,response,correct,rt\n';
    const rows = results.map((d: any) => [d.studentId, d.trial, d.target, d.present, d.response, d.correct, d.rt].join(','));
    const csv = header + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'classroom-results.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  // Role selection screen
  if (!role) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-2xl font-bold mb-4">Classroom Experiment</h2>
        <button className="bg-blue-500 text-white px-4 py-2 rounded mb-2" onClick={() => setRole('professor')}>I am the Professor</button>
        <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={() => setRole('student')}>I am a Student</button>
      </div>
    );
  }

  // Professor view
  if (role === 'professor') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <div className="mb-4">
          <button onClick={handleStart} className="bg-green-500 text-white px-4 py-2 rounded mr-2">Start</button>
          <button onClick={handleEnd} className="bg-red-500 text-white px-4 py-2 rounded">End</button>
          <button onClick={handleDownloadCSV} className="bg-blue-500 text-white px-4 py-2 rounded ml-2">Download CSV</button>
        </div>
        <div className="mb-2">Experiment is <span className={started ? 'text-green-600' : 'text-red-600'}>{started ? 'Running' : ended ? 'Ended' : 'Not Started'}</span></div>
      </div>
    );
  }

  // Student view
  if (role === 'student') {
    if (!studentId) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleStudentJoin}>Join Experiment</button>
        </div>
      );
    }
    if (!started && !ended) {
      return (
        <div className="text-lg flex flex-col items-center">Waiting for professor to start the experiment...<div className="mt-2 text-sm">Your ID: <span className="font-mono text-xl">{studentId}</span></div></div>
      );
    }
    if (ended) {
      return (
        <div className="text-lg flex flex-col items-center">Experiment ended. Thank you!<div className="mt-2 text-sm">Your ID: <span className="font-mono text-xl">{studentId}</span></div></div>
      );
    }
    const ExperimentComponent = experiments[experiment];
    return (
      <ExperimentComponent studentId={studentId} onResult={handleStudentResult} />
    );
  }
  return null;
}

function NameEntry({ onSubmit }: { onSubmit: (name: string) => void }) {
  const [name, setName] = useState('');
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        if (name.trim()) onSubmit(name.trim());
      }}
      className="flex flex-col items-center"
    >
      <label className="mb-2 text-lg">Enter your name to begin:</label>
      <input
        className="border px-2 py-1 rounded mb-2"
        value={name}
        onChange={e => setName(e.target.value)}
        required
      />
      <button className="bg-blue-500 text-white px-4 py-2 rounded" type="submit">Continue</button>
    </form>
  );
}
