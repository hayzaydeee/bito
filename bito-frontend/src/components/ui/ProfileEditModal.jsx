import React, { useState, useEffect } from "react";
import {
  FormModal,
  FormField,
  FormRow,
  INPUT_CLS,
  FormActions,
} from "./FormPrimitives";
import { userAPI } from "../../services/api";

const ProfileEditModal = ({ isOpen, onClose, userProfile, onSave }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && userProfile) {
      setFormData({
        firstName: userProfile.firstName || "",
        lastName: userProfile.lastName || "",
        username: userProfile.username || "",
      });
      setError(null);
    }
  }, [isOpen, userProfile]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // If username changed, we could check availability but updateProfile might handle it.
      // Wait, updateProfile might fail if username is taken.
      const res = await userAPI.updateProfile({
        username: formData.username,
      });

      if (res.success) {
        onSave(res.data.user);
        onClose();
      } else {
        setError(res.error || "Failed to update profile");
      }
    } catch (err) {
      setError(err.message || "An error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Profile"
      icon={
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[var(--signal)]"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-[var(--rose)]/10 border border-[var(--rose)]/20 text-[var(--rose)] text-sm">
            {error}
          </div>
        )}

        {/* FormRow for first and last name removed as per request */}

        <FormField
          label="Username"
          hint="Your unique handle across the platform"
        >
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-3)]">
              @
            </span>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`${INPUT_CLS} pl-8`}
              placeholder="jane_doe"
            />
          </div>
        </FormField>

        <FormActions
          onCancel={onClose}
          submitLabel="Save Changes"
          loading={loading}
        />
      </form>
    </FormModal>
  );
};

export default ProfileEditModal;
