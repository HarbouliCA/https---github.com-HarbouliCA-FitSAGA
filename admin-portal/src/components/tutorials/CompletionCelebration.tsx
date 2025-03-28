'use client';

import { useState, useEffect } from 'react';
import { Tutorial } from '@/interfaces/tutorial';
import confetti from 'canvas-confetti';
import Link from 'next/link';

interface CompletionCelebrationProps {
  tutorial: Tutorial;
  onRestart: () => void;
}

export default function CompletionCelebration({ tutorial, onRestart }: CompletionCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(true);
  
  useEffect(() => {
    if (showConfetti) {
      // Trigger confetti animation
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      
      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };
      
      const confettiInterval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        
        if (timeLeft <= 0) {
          clearInterval(confettiInterval);
          return;
        }
        
        confetti({
          particleCount: 3,
          angle: randomInRange(55, 125),
          spread: randomInRange(50, 70),
          origin: { y: 0.6 }
        });
        
      }, 200);
      
      return () => {
        clearInterval(confettiInterval);
      };
    }
  }, [showConfetti]);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
          <p className="text-gray-600">
            You've completed the "{tutorial.title}" tutorial.
          </p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="text-sm text-gray-500 mb-2">Tutorial Summary</div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{tutorial.days.length}</div>
              <div className="text-gray-500">Days</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {tutorial.days.reduce((total, day) => total + day.exercises.length, 0)}
              </div>
              <div className="text-gray-500">Exercises</div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col space-y-3">
          <button
            onClick={onRestart}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Restart Tutorial
          </button>
          <Link
            href="/dashboard/tutorials"
            className="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Back to Tutorials
          </Link>
        </div>
      </div>
    </div>
  );
} 