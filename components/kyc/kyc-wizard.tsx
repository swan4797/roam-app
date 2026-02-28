"use client"

import { useState, useTransition, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, FieldValues } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { KYC_STEPS, type KYCFormData } from "@/types/kyc"
import {
  personalInfoSchema,
  addressSchema,
  accreditationSchema,
  documentsSchema,
} from "@/lib/validations/kyc"
import { KYCProgress } from "./kyc-progress"
import { PersonalInfoStep } from "./personal-info-step"
import { AddressStep } from "./address-step"
import { AccreditationStep } from "./accreditation-step"
import { DocumentsStep } from "./documents-step"
import { submitKYC } from "@/actions/kyc"

interface Props {
  initialData?: Partial<KYCFormData>
}

// Step schemas array for easier access
const stepSchemas = [
  personalInfoSchema,
  addressSchema,
  accreditationSchema,
  documentsSchema,
] as const

export function KYCWizard({ initialData = {} }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Partial<KYCFormData>>(initialData)
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({})

  // React Hook Form for current step with Zod validation
  const {
    register,
    formState: { errors, isValidating },
    trigger,
    setValue,
    getValues,
    reset,
    clearErrors,
  } = useForm({
    resolver: zodResolver(stepSchemas[currentStep]),
    defaultValues: formData as FieldValues,
    mode: "onBlur",
    reValidateMode: "onChange",
  })

  // Reset form when step changes
  useEffect(() => {
    reset(formData as FieldValues)
  }, [currentStep, reset, formData])

  const handleChange = useCallback(
    (field: keyof KYCFormData, value: string | number) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      setValue(field, value)
      if (serverErrors[field]) {
        setServerErrors((prev) => {
          const next = { ...prev }
          delete next[field]
          return next
        })
      }
    },
    [setValue, serverErrors]
  )

  const handleNext = async () => {
    const isValid = await trigger()

    if (!isValid) {
      return
    }

    // Save current step values
    const currentValues = getValues()
    setFormData((prev) => ({ ...prev, ...currentValues }))

    if (currentStep < KYC_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
      clearErrors()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      const currentValues = getValues()
      setFormData((prev) => ({ ...prev, ...currentValues }))
      setCurrentStep((prev) => prev - 1)
      clearErrors()
    }
  }

  const handleFinalSubmit = async () => {
    const isValid = await trigger()
    if (!isValid) return

    const currentValues = getValues()
    const finalData = { ...formData, ...currentValues } as KYCFormData

    startTransition(async () => {
      const result = await submitKYC(finalData)

      if (result.success) {
        router.push("/dashboard")
        router.refresh()
      } else if (result.errors) {
        setServerErrors(result.errors)
      }
    })
  }

  // Combine client and server errors
  const combinedErrors: Record<string, string[]> = {
    ...Object.fromEntries(
      Object.entries(errors).map(([key, value]) => [
        key,
        [String(value?.message || "")],
      ])
    ),
    ...serverErrors,
  }

  const renderStep = () => {
    const stepProps = {
      data: formData,
      errors: combinedErrors,
      onChange: handleChange,
    }

    switch (currentStep) {
      case 0:
        return <PersonalInfoStep {...stepProps} />
      case 1:
        return <AddressStep {...stepProps} />
      case 2:
        return <AccreditationStep {...stepProps} />
      case 3:
        return <DocumentsStep {...stepProps} />
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
            onClick={handleFinalSubmit}
            disabled={isPending || isValidating}
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
            disabled={isPending || isValidating}
          >
            {isValidating ? "Validating..." : "Continue"}
          </button>
        )}
      </div>
    </div>
  )
}
