"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { KYC_STEPS, type KYCFormData } from "@/types/kyc"
import { KYCProgress } from "./kyc-progress"
import { PersonalInfoStep } from "./personal-info-step"
import { AddressStep } from "./address-step"
import { AccreditationStep } from "./accreditation-step"
import { DocumentsStep } from "./documents-step"
import {
  validatePersonalInfo,
  validateAddress,
  validateAccreditation,
  submitKYC,
} from "@/actions/kyc"

interface Props {
  initialData?: Partial<KYCFormData>
}

export function KYCWizard({ initialData = {} }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Partial<KYCFormData>>(initialData)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const handleChange = (field: keyof KYCFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const validateCurrentStep = async (): Promise<boolean> => {
    let result: { success: boolean; errors?: Record<string, string[]> }

    switch (currentStep) {
      case 0:
        result = await validatePersonalInfo(formData)
        break
      case 1:
        result = await validateAddress(formData)
        break
      case 2:
        result = await validateAccreditation(formData)
        break
      case 3:
        // Documents step - no validation for now (UI only)
        return true
      default:
        return true
    }

    if (!result.success && result.errors) {
      setErrors(result.errors)
      return false
    }

    setErrors({})
    return true
  }

  const handleNext = async () => {
    const isValid = await validateCurrentStep()
    if (!isValid) return

    if (currentStep < KYC_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    const isValid = await validateCurrentStep()
    if (!isValid) return

    startTransition(async () => {
      const result = await submitKYC(formData as KYCFormData)
      if (result.success) {
        router.push("/dashboard")
        router.refresh()
      } else if (result.errors) {
        setErrors(result.errors)
      }
    })
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <PersonalInfoStep
            data={formData}
            errors={errors}
            onChange={handleChange}
          />
        )
      case 1:
        return (
          <AddressStep
            data={formData}
            errors={errors}
            onChange={handleChange}
          />
        )
      case 2:
        return (
          <AccreditationStep
            data={formData}
            errors={errors}
            onChange={handleChange}
          />
        )
      case 3:
        return (
          <DocumentsStep
            data={formData}
            errors={errors}
            onChange={handleChange}
          />
        )
      default:
        return null
    }
  }

  const isLastStep = currentStep === KYC_STEPS.length - 1

  return (
    <div className="kyc-wizard">
      <KYCProgress currentStep={currentStep} />

      <div className="kyc-wizard__content">{renderStep()}</div>

      <div className="kyc-wizard__actions">
        <button
          type="button"
          className="btn btn--secondary"
          onClick={handleBack}
          disabled={currentStep === 0 || isPending}
        >
          Back
        </button>

        {isLastStep ? (
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <span className="btn__spinner" />
                Submitting...
              </>
            ) : (
              "Submit Verification"
            )}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleNext}
            disabled={isPending}
          >
            Continue
          </button>
        )}
      </div>
    </div>
  )
}
