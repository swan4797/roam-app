"use client"

import { KYC_STEPS } from "@/types/kyc"

interface Props {
  currentStep: number
}

export function KYCProgress({ currentStep }: Props) {
  return (
    <div className="kyc-progress">
      <div className="kyc-progress__track">
        {KYC_STEPS.map((step, index) => (
          <div key={step.id} className="kyc-progress__step-wrapper">
            {/* Connector line (except for first step) */}
            {index > 0 && (
              <div
                className={`kyc-progress__connector ${
                  index <= currentStep ? "kyc-progress__connector--active" : ""
                }`}
              />
            )}

            {/* Step circle */}
            <div
              className={`kyc-progress__step ${
                index < currentStep
                  ? "kyc-progress__step--completed"
                  : index === currentStep
                  ? "kyc-progress__step--active"
                  : ""
              }`}
            >
              {index < currentStep ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <span>{index + 1}</span>
              )}
            </div>

            {/* Step label */}
            <span
              className={`kyc-progress__label ${
                index <= currentStep ? "kyc-progress__label--active" : ""
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
