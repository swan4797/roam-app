"use client"

import { ACCREDITATION_TYPES, type KYCFormData } from "@/types/kyc"

interface Props {
  data: Partial<KYCFormData>
  errors: Record<string, string[]>
  onChange: (field: keyof KYCFormData, value: string | number) => void
}

export function AccreditationStep({ data, errors, onChange }: Props) {
  const isAccredited = data.isAccredited === "yes"

  const formatCurrency = (value: number | undefined) => {
    if (!value) return ""
    return value.toString()
  }

  return (
    <div className="kyc-step">
      <div className="kyc-step__header">
        <h2 className="kyc-step__title">Investor Accreditation</h2>
        <p className="kyc-step__description">
          Under SEC regulations, certain investment opportunities are only
          available to accredited investors. Please indicate your accreditation
          status.
        </p>
      </div>

      <div className="form">
        <div className="form-group">
          <label className="label label--required">
            Are you an accredited investor?
          </label>

          <div className="radio-group">
            <label className="radio-card">
              <input
                type="radio"
                name="isAccredited"
                value="yes"
                checked={data.isAccredited === "yes"}
                onChange={(e) => onChange("isAccredited", e.target.value)}
              />
              <div className="radio-card__content">
                <div className="radio-card__indicator" />
                <div className="radio-card__text">
                  <span className="radio-card__title">
                    Yes, I am an accredited investor
                  </span>
                  <span className="radio-card__description">
                    I meet one or more of the SEC accreditation criteria
                  </span>
                </div>
              </div>
            </label>

            <label className="radio-card">
              <input
                type="radio"
                name="isAccredited"
                value="no"
                checked={data.isAccredited === "no"}
                onChange={(e) => onChange("isAccredited", e.target.value)}
              />
              <div className="radio-card__content">
                <div className="radio-card__indicator" />
                <div className="radio-card__text">
                  <span className="radio-card__title">
                    No, I am not accredited
                  </span>
                  <span className="radio-card__description">
                    I can still invest in Regulation A+ offerings
                  </span>
                </div>
              </div>
            </label>
          </div>

          {errors.isAccredited && (
            <span className="help-text help-text--error">
              {errors.isAccredited[0]}
            </span>
          )}
        </div>

        {isAccredited && (
          <>
            <div className="form-group">
              <label
                htmlFor="accreditationType"
                className="label label--required"
              >
                Accreditation Basis
              </label>
              <select
                id="accreditationType"
                name="accreditationType"
                className={`select ${
                  errors.accreditationType ? "input--error" : ""
                }`}
                value={data.accreditationType || ""}
                onChange={(e) => onChange("accreditationType", e.target.value)}
                required
              >
                <option value="">Select how you qualify</option>
                {ACCREDITATION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {data.accreditationType && (
                <span className="help-text">
                  {
                    ACCREDITATION_TYPES.find(
                      (t) => t.value === data.accreditationType
                    )?.description
                  }
                </span>
              )}
              {errors.accreditationType && (
                <span className="help-text help-text--error">
                  {errors.accreditationType[0]}
                </span>
              )}
            </div>

            {(data.accreditationType === "INCOME" ||
              data.accreditationType === "NET_WORTH") && (
              <div className="form__row">
                {data.accreditationType === "INCOME" && (
                  <div className="form-group">
                    <label htmlFor="annualIncome" className="label">
                      Annual Income (USD)
                    </label>
                    <div className="input-group">
                      <span className="input-group__prefix">$</span>
                      <input
                        id="annualIncome"
                        name="annualIncome"
                        type="number"
                        className="input input--with-prefix"
                        value={formatCurrency(data.annualIncome)}
                        onChange={(e) =>
                          onChange("annualIncome", parseFloat(e.target.value) || 0)
                        }
                        placeholder="200,000"
                        min="0"
                        step="1000"
                      />
                    </div>
                    <span className="help-text">
                      Your individual income from the last two years
                    </span>
                  </div>
                )}

                {data.accreditationType === "NET_WORTH" && (
                  <div className="form-group">
                    <label htmlFor="netWorth" className="label">
                      Net Worth (USD)
                    </label>
                    <div className="input-group">
                      <span className="input-group__prefix">$</span>
                      <input
                        id="netWorth"
                        name="netWorth"
                        type="number"
                        className="input input--with-prefix"
                        value={formatCurrency(data.netWorth)}
                        onChange={(e) =>
                          onChange("netWorth", parseFloat(e.target.value) || 0)
                        }
                        placeholder="1,000,000"
                        min="0"
                        step="10000"
                      />
                    </div>
                    <span className="help-text">
                      Excluding your primary residence
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="kyc-step__info-box">
              <div className="kyc-step__info-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <div className="kyc-step__info-content">
                <strong>Verification Required</strong>
                <p>
                  Accredited investor status may require additional
                  documentation such as tax returns, CPA letter, or brokerage
                  statements.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
