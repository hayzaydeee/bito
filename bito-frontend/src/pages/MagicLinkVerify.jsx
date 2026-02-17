import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TargetIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { useAuth } from "../contexts/AuthContext";

const MagicLinkVerify = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyMagicLink, isAuthenticated } = useAuth();

  const [status, setStatus] = useState("verifying"); // 'verifying' | 'error'
  const [errorMessage, setErrorMessage] = useState("");
  const hasVerified = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/app");
      return;
    }

    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setErrorMessage("Invalid sign-in link. No token found.");
      return;
    }

    // Prevent double-verification in StrictMode
    if (hasVerified.current) return;
    hasVerified.current = true;

    const verify = async () => {
      const result = await verifyMagicLink(token);

      if (result.success) {
        if (result.isNewUser) {
          navigate("/onboarding");
        } else {
          navigate("/app");
        }
      } else {
        setStatus("error");
        setErrorMessage(
          result.error || "Sign-in link is invalid or has expired."
        );
      }
    };

    verify();
  }, [searchParams, verifyMagicLink, navigate, isAuthenticated]);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--color-bg-primary)" }}
    >
      <div className="w-full max-w-sm px-6 text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "var(--color-brand-600)" }}
          >
            <TargetIcon className="w-5 h-5 text-white" />
          </div>
          <span
            className="text-lg font-bold font-garamond"
            style={{ color: "var(--color-text-primary)" }}
          >
            bito
          </span>
        </div>

        {status === "verifying" ? (
          <>
            <div
              className="w-10 h-10 border-3 rounded-full animate-spin mx-auto mb-6"
              style={{
                borderColor: "var(--color-border-primary)",
                borderTopColor: "var(--color-brand-500)",
              }}
            />
            <h2
              className="heading-lg font-garamond mb-2"
              style={{ color: "var(--color-text-primary)" }}
            >
              Signing you in…
            </h2>
            <p
              className="text-sm font-spartan"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Just a moment while we verify your link.
            </p>
          </>
        ) : (
          <>
            {/* Error state */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.08)",
              }}
            >
              <ExclamationTriangleIcon
                className="w-7 h-7"
                style={{ color: "var(--color-error, #ef4444)" }}
              />
            </div>

            <h2
              className="heading-lg font-garamond mb-2"
              style={{ color: "var(--color-text-primary)" }}
            >
              Link expired
            </h2>
            <p
              className="text-sm font-spartan mb-6"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {errorMessage}
            </p>

            <button
              onClick={() => navigate("/login")}
              className="btn btn-primary btn-md justify-center w-full font-spartan"
            >
              Request a new link
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MagicLinkVerify;
