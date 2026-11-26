import React from 'react';

interface ProgressIndicatorProps {
  currentStep: 1 | 2 | 3;
  totalSteps?: 2 | 3;
}

export function ProgressIndicator({ currentStep, totalSteps = 3 }: ProgressIndicatorProps) {
  const steps = totalSteps === 2 ? [1, 2] : [1, 2, 3];

  return (
    <div className="flex items-center justify-center gap-2 py-1">
      {steps.map((stepNumber, idx) => {
        const isCurrent = currentStep === stepNumber;
        const isCompleted = currentStep > stepNumber;

        return (
          <React.Fragment key={stepNumber}>
            {idx > 0 && (
              <div
                className={`h-1 w-8 sm:w-12 rounded-full transition-colors ${
                  isCompleted ? 'bg-pb-red' : 'bg-pb-cream-muted'
                }`}
              />
            )}
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                isCurrent
                  ? 'bg-pb-red text-white shadow-xs scale-105'
                  : isCompleted
                    ? 'bg-pb-red text-white'
                    : 'border border-pb-cream-border bg-pb-cream-muted text-pb-charcoal-light'
              }`}
            >
              {isCompleted ? (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                stepNumber
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
