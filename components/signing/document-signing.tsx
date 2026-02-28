"use client"

import { useState, useCallback } from "react"
import { SignaturePad } from "./signature-pad"
import type { Document, SignatureData } from "@/types/signing"

interface Props {
  document: Document
  onComplete: (signature: SignatureData) => void
  onDecline: () => void
}

type SignatureMethod = "draw" | "type"

export function DocumentSigning({ document, onComplete, onDecline }: Props) {
  const [method, setMethod] = useState<SignatureMethod>("draw")
  const [typedSignature, setTypedSignature] = useState("")
  const [signature, setSignature] = useState<string | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [step, setStep] = useState<"review" | "sign" | "confirm">("review")

  const handleDrawSignature = useCallback((data: string) => {
    setSignature(data)
    setStep("confirm")
  }, [])

  const handleTypeSignature = useCallback(() => {
    if (!typedSignature.trim()) return

    // Create a typed signature canvas
    const canvas = window.document.createElement("canvas")
    canvas.width = 400
    canvas.height = 100
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, 400, 100)
    ctx.fillStyle = "#1E1E2D"
    ctx.font = "italic 32px 'Dancing Script', cursive, serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(typedSignature, 200, 50)

    setSignature(canvas.toDataURL("image/png"))
    setStep("confirm")
  }, [typedSignature])

  const handleConfirm = useCallback(() => {
    if (!signature || !agreedToTerms) return

    onComplete({
      type: method,
      data: method === "type" ? typedSignature : signature,
      timestamp: new Date().toISOString(),
    })
  }, [signature, agreedToTerms, method, typedSignature, onComplete])

  const handleBack = useCallback(() => {
    setSignature(null)
    setStep("sign")
  }, [])

  return (
    <div className="document-signing">
      {/* Progress indicator */}
      <div className="signing-progress" role="progressbar" aria-valuenow={step === "review" ? 1 : step === "sign" ? 2 : 3} aria-valuemin={1} aria-valuemax={3}>
        <div className={`signing-progress__step ${step === "review" ? "is-active" : "is-complete"}`}>
          <span className="signing-progress__dot">1</span>
          <span className="signing-progress__label">Review</span>
        </div>
        <div className="signing-progress__line" />
        <div className={`signing-progress__step ${step === "sign" ? "is-active" : step === "confirm" ? "is-complete" : ""}`}>
          <span className="signing-progress__dot">2</span>
          <span className="signing-progress__label">Sign</span>
        </div>
        <div className="signing-progress__line" />
        <div className={`signing-progress__step ${step === "confirm" ? "is-active" : ""}`}>
          <span className="signing-progress__dot">3</span>
          <span className="signing-progress__label">Confirm</span>
        </div>
      </div>

      {/* Step content */}
      {step === "review" && (
        <div className="signing-step">
          <div className="card">
            <div className="card__header">
              <div>
                <h2 className="card__title">{document.title}</h2>
                <p className="card__subtitle">{document.description}</p>
              </div>
            </div>

            <div className="card__body">
              {/* Document preview placeholder */}
              <div className="document-preview">
                <div className="document-preview__page" aria-label="Document preview">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <line x1="10" y1="9" x2="8" y2="9" />
                  </svg>
                  <p>Investment Agreement</p>
                  <span className="document-preview__info">
                    Please review the document before signing
                  </span>
                </div>
              </div>

              <div className="document-details">
                <div className="document-details__row">
                  <span className="document-details__label">Document ID</span>
                  <span className="document-details__value">{document.id}</span>
                </div>
                <div className="document-details__row">
                  <span className="document-details__label">Created</span>
                  <span className="document-details__value">
                    {new Date(document.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {document.expiresAt && (
                  <div className="document-details__row">
                    <span className="document-details__label">Expires</span>
                    <span className="document-details__value">
                      {new Date(document.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="card__footer">
              <div className="form__actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={onDecline}
                >
                  Decline
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => setStep("sign")}
                >
                  Continue to Sign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === "sign" && (
        <div className="signing-step">
          <div className="card">
            <div className="card__header">
              <div>
                <h2 className="card__title">Add Your Signature</h2>
                <p className="card__subtitle">Choose how you want to sign</p>
              </div>
            </div>

            <div className="card__body">
              {/* Signature method tabs */}
              <div className="signature-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={method === "draw"}
                  className={`signature-tabs__tab ${method === "draw" ? "is-active" : ""}`}
                  onClick={() => setMethod("draw")}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M12 19l7-7 3 3-7 7-3-3z" />
                    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                    <path d="M2 2l7.586 7.586" />
                  </svg>
                  Draw
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={method === "type"}
                  className={`signature-tabs__tab ${method === "type" ? "is-active" : ""}`}
                  onClick={() => setMethod("type")}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <polyline points="4 7 4 4 20 4 20 7" />
                    <line x1="9" y1="20" x2="15" y2="20" />
                    <line x1="12" y1="4" x2="12" y2="20" />
                  </svg>
                  Type
                </button>
              </div>

              {/* Signature input */}
              <div className="signature-input" role="tabpanel">
                {method === "draw" ? (
                  <SignaturePad onSign={handleDrawSignature} />
                ) : (
                  <div className="signature-type">
                    <label htmlFor="typed-signature" className="label">
                      Type your full name
                    </label>
                    <input
                      id="typed-signature"
                      type="text"
                      className="input signature-type__input"
                      value={typedSignature}
                      onChange={(e) => setTypedSignature(e.target.value)}
                      placeholder="John Doe"
                    />
                    {typedSignature && (
                      <div className="signature-type__preview">
                        <span className="signature-type__text">
                          {typedSignature}
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      className="btn btn--primary btn--block"
                      onClick={handleTypeSignature}
                      disabled={!typedSignature.trim()}
                    >
                      Apply Signature
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="card__footer">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setStep("review")}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "confirm" && signature && (
        <div className="signing-step">
          <div className="card">
            <div className="card__header">
              <div>
                <h2 className="card__title">Confirm Your Signature</h2>
                <p className="card__subtitle">
                  Review and confirm your signature to complete
                </p>
              </div>
            </div>

            <div className="card__body">
              <div className="signature-preview">
                <label className="signature-preview__label">Your Signature</label>
                <div className="signature-preview__box">
                  <img
                    src={signature}
                    alt="Your signature"
                    className="signature-preview__image"
                  />
                </div>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={handleBack}
                >
                  Change signature
                </button>
              </div>

              <label className="checkbox signing-terms">
                <input
                  type="checkbox"
                  className="checkbox__input"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
                <span className="checkbox__box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span className="checkbox__label">
                  I agree that my electronic signature is the legal equivalent of
                  my manual signature on this document.
                </span>
              </label>
            </div>

            <div className="card__footer">
              <div className="form__actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={handleBack}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={handleConfirm}
                  disabled={!agreedToTerms}
                >
                  Complete Signing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
