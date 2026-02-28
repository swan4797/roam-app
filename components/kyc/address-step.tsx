"use client"

import { COUNTRIES, US_STATES, type KYCFormData } from "@/types/kyc"

interface Props {
  data: Partial<KYCFormData>
  errors: Record<string, string[]>
  onChange: (field: keyof KYCFormData, value: string) => void
}

export function AddressStep({ data, errors, onChange }: Props) {
  const showUSStates = data.country === "US"

  return (
    <div className="kyc-step">
      <div className="kyc-step__header">
        <h2 className="kyc-step__title">Address Details</h2>
        <p className="kyc-step__description">
          Enter your current residential address. This must match the address on
          your proof of address document.
        </p>
      </div>

      <div className="form">
        <div className="form-group">
          <label htmlFor="country" className="label label--required">
            Country
          </label>
          <select
            id="country"
            name="country"
            className={`select ${errors.country ? "input--error" : ""}`}
            value={data.country || ""}
            onChange={(e) => onChange("country", e.target.value)}
            required
          >
            <option value="">Select a country</option>
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
          {errors.country && (
            <span className="help-text help-text--error">
              {errors.country[0]}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="addressLine1" className="label label--required">
            Address Line 1
          </label>
          <input
            id="addressLine1"
            name="addressLine1"
            type="text"
            className={`input ${errors.addressLine1 ? "input--error" : ""}`}
            value={data.addressLine1 || ""}
            onChange={(e) => onChange("addressLine1", e.target.value)}
            placeholder="123 Main Street"
            required
          />
          {errors.addressLine1 && (
            <span className="help-text help-text--error">
              {errors.addressLine1[0]}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="addressLine2" className="label">
            Address Line 2
          </label>
          <input
            id="addressLine2"
            name="addressLine2"
            type="text"
            className="input"
            value={data.addressLine2 || ""}
            onChange={(e) => onChange("addressLine2", e.target.value)}
            placeholder="Apt, Suite, Unit, etc. (optional)"
          />
        </div>

        <div className="form__row">
          <div className="form-group">
            <label htmlFor="city" className="label label--required">
              City
            </label>
            <input
              id="city"
              name="city"
              type="text"
              className={`input ${errors.city ? "input--error" : ""}`}
              value={data.city || ""}
              onChange={(e) => onChange("city", e.target.value)}
              placeholder="New York"
              required
            />
            {errors.city && (
              <span className="help-text help-text--error">
                {errors.city[0]}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="state" className="label label--required">
              {showUSStates ? "State" : "State / Province / Region"}
            </label>
            {showUSStates ? (
              <select
                id="state"
                name="state"
                className={`select ${errors.state ? "input--error" : ""}`}
                value={data.state || ""}
                onChange={(e) => onChange("state", e.target.value)}
                required
              >
                <option value="">Select a state</option>
                {US_STATES.map((state) => (
                  <option key={state.code} value={state.code}>
                    {state.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="state"
                name="state"
                type="text"
                className={`input ${errors.state ? "input--error" : ""}`}
                value={data.state || ""}
                onChange={(e) => onChange("state", e.target.value)}
                placeholder="State / Province"
                required
              />
            )}
            {errors.state && (
              <span className="help-text help-text--error">
                {errors.state[0]}
              </span>
            )}
          </div>
        </div>

        <div className="form-group" style={{ maxWidth: "200px" }}>
          <label htmlFor="postalCode" className="label label--required">
            {data.country === "US" ? "ZIP Code" : "Postal Code"}
          </label>
          <input
            id="postalCode"
            name="postalCode"
            type="text"
            className={`input ${errors.postalCode ? "input--error" : ""}`}
            value={data.postalCode || ""}
            onChange={(e) => onChange("postalCode", e.target.value)}
            placeholder={data.country === "US" ? "10001" : "Postal code"}
            required
          />
          {errors.postalCode && (
            <span className="help-text help-text--error">
              {errors.postalCode[0]}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
