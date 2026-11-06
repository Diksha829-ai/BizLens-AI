import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * Reusable PasswordInput with show/hide password visibility toggle.
 * Supports all standard input props (id, name, value, onChange, placeholder, required, etc.)
 */
function PasswordInput({
  id = "password",
  name = "password",
  value = "",
  onChange,
  placeholder = "Enter your password",
  required = false,
  className = "",
  autoComplete = "current-password",
  disabled = false,
  ...rest
}) {
  const [showPassword, setShowPassword] = useState(false);

  const toggleVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className={`biz-password-wrapper ${className}`}>
      <input
        id={id}
        name={name}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        disabled={disabled}
        className="biz-password-input"
        {...rest}
      />
      <button
        type="button"
        onClick={toggleVisibility}
        className="biz-password-toggle-btn"
        aria-label={showPassword ? "Hide password" : "Show password"}
        title={showPassword ? "Hide password" : "Show password"}
        tabIndex={0}
      >
        {showPassword ? (
          <EyeOff size={18} aria-hidden="true" />
        ) : (
          <Eye size={18} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

<<<<<<< HEAD
export default PasswordInput;
=======
export default PasswordInput;
>>>>>>> b2e1095 (Components added)
