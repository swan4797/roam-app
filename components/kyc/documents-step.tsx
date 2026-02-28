"use client"

import { useState } from "react"
import type { KYCFormData } from "@/types/kyc"

interface Props {
  data: Partial<KYCFormData>
  errors: Record<string, string[]>
  onChange: (field: keyof KYCFormData, value: string) => void
}

interface FileUploadProps {
  id: string
  label: string
  description: string
  required?: boolean
  accept?: string
  value?: string
  error?: string
  onFileSelect: (file: File | null) => void
}

function FileUpload({
  id,
  label,
  description,
  required,
  accept = ".pdf,.jpg,.jpeg,.png",
  value,
  error,
  onFileSelect,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      setFileName(file.name)
      onFileSelect(file)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      onFileSelect(file)
    }
  }

  const handleRemove = () => {
    setFileName(null)
    onFileSelect(null)
  }

  return (
    <div className="form-group">
      <label htmlFor={id} className={`label ${required ? "label--required" : ""}`}>
        {label}
      </label>
      <p className="help-text" style={{ marginBottom: "0.5rem" }}>
        {description}
      </p>

      {fileName || value ? (
        <div className="file-preview">
          <div className="file-preview__icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div className="file-preview__info">
            <span className="file-preview__name">
              {fileName || "Document uploaded"}
            </span>
            <span className="file-preview__status">Ready to submit</span>
          </div>
          <button
            type="button"
            className="file-preview__remove"
            onClick={handleRemove}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ) : (
        <div
          className={`file-upload ${isDragging ? "file-upload--dragging" : ""} ${
            error ? "file-upload--error" : ""
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            id={id}
            name={id}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="file-upload__input"
          />
          <div className="file-upload__icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div className="file-upload__text">
            <span className="file-upload__primary">
              Drop file here or <span className="file-upload__link">browse</span>
            </span>
            <span className="file-upload__secondary">
              PDF, JPG, or PNG (max 10MB)
            </span>
          </div>
        </div>
      )}

      {error && <span className="help-text help-text--error">{error}</span>}
    </div>
  )
}

export function DocumentsStep({ data, errors, onChange }: Props) {
  const isAccredited = data.isAccredited === "yes"

  return (
    <div className="kyc-step">
      <div className="kyc-step__header">
        <h2 className="kyc-step__title">Document Verification</h2>
        <p className="kyc-step__description">
          Upload the required documents to verify your identity. All documents
          are encrypted and stored securely.
        </p>
      </div>

      <div className="form">
        <FileUpload
          id="idDocument"
          label="Government-Issued ID"
          description="Passport, driver's license, or national ID card"
          required
          value={data.idDocumentUrl}
          error={errors.idDocumentUrl?.[0]}
          onFileSelect={(file) => {
            if (file) {
              onChange("idDocumentUrl", file.name)
            }
          }}
        />

        <FileUpload
          id="addressProof"
          label="Proof of Address"
          description="Utility bill, bank statement, or government letter (dated within 3 months)"
          required
          value={data.addressProofUrl}
          error={errors.addressProofUrl?.[0]}
          onFileSelect={(file) => {
            if (file) {
              onChange("addressProofUrl", file.name)
            }
          }}
        />

        {isAccredited && (
          <FileUpload
            id="accreditationDoc"
            label="Accreditation Documentation"
            description="Tax return, CPA letter, or brokerage statement verifying accredited status"
            required
            value={data.accreditationUrl}
            error={errors.accreditationUrl?.[0]}
            onFileSelect={(file) => {
              if (file) {
                onChange("accreditationUrl", file.name)
              }
            }}
          />
        )}

        <div className="kyc-step__info-box kyc-step__info-box--secure">
          <div className="kyc-step__info-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div className="kyc-step__info-content">
            <strong>Your documents are secure</strong>
            <p>
              All uploads are encrypted using AES-256 encryption and stored in
              compliance with SOC 2 and GDPR requirements.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
