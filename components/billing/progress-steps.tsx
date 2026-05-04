"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface ProgressStepsProps {
  currentStep: number
  totalSteps: number
  steps: string[]
}

export function ProgressSteps({ currentStep, totalSteps, steps }: ProgressStepsProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-sm font-medium text-primary">
          {steps[currentStep - 1]}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          
          return (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    isCompleted && "bg-green-500 text-white",
                    isCurrent && "bg-primary text-primary-foreground",
                    !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : stepNumber}
                </div>
                <span
                  className={cn(
                    "text-xs mt-2 text-center max-w-[80px]",
                    isCurrent ? "text-primary font-medium" : "text-muted-foreground"
                  )}
                >
                  {step}
                </span>
              </div>
              
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-1 flex-1 mx-2 rounded-full transition-colors",
                    stepNumber < currentStep ? "bg-green-500" : "bg-muted"
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
