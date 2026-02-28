"use client"

import type { KYCFormData } from "@/types/kyc"

interface Props {
  data: Partial<KYCFormData>
  errors: Record<string, string[]>
  onChange: (field: keyof KYCFormData, value: string) => void
}

export function PersonalInfoStep({ data, errors, onChange }: Props) {
  return (
    <div className="kyc-step">
      <div className="kyc-step__header">
        <h2 className="kyc-step__title">Personal Information</h2>
        <p className="kyc-step__description">
          Please provide your legal name and contact information as it appears
          on your government-issued ID.
        </p>
      </div>

      <div className="form">
        <div className="form__row">
          <div className="form-group">
            <label htmlFor="firstName" className="label label--required">
              First Name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              className={`input ${errors.firstName ? "input--error" : ""}`}
              value={data.firstName || ""}
              onChange={(e) => onChange("firstName", e.target.value)}
              placeholder="John"
              required
            />
            {errors.firstName && (
              <span className="help-text help-text--error">
                {errors.firstName[0]}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="lastName" className="label label--required">
              Last Name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              className={`input ${errors.lastName ? "input--error" : ""}`}
              value={data.lastName || ""}
              onChange={(e) => onChange("lastName", e.target.value)}
              placeholder="Doe"
              required
            />
            {errors.lastName && (
              <span className="help-text help-text--error">
                {errors.lastName[0]}
              </span>
            )}
          </div>
        </div>

        <div className="form__row">
          <div className="form-group">
            <label htmlFor="dateOfBirth" className="label label--required">
              Date of Birth
            </label>
            <input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              className={`input ${errors.dateOfBirth ? "input--error" : ""}`}
              value={data.dateOfBirth || ""}
              onChange={(e) => onChange("dateOfBirth", e.target.value)}
              max={new Date(
                new Date().setFullYear(new Date().getFullYear() - 18)
              )
                .toISOString()
                .split("T")[0]}
              required
            />
            {errors.dateOfBirth && (
              <span className="help-text help-text--error">
                {errors.dateOfBirth[0]}
              </span>
            )}
            <span className="help-text">You must be at least 18 years old</span>
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="label label--required">
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className={`input ${errors.phone ? "input--error" : ""}`}
              value={data.phone || ""}
              onChange={(e) => onChange("phone", e.target.value)}
              placeholder="+1 (555) 123-4567"
              required
            />
            {errors.phone && (
              <span className="help-text help-text--error">
                {errors.phone[0]}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
