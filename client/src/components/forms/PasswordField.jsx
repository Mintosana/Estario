import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function PasswordField({ label, name, onChange, value, ...inputProps }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <label>
      {label}
      <span className="password-field">
        <input
          {...inputProps}
          name={name}
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={onChange}
        />
        <button
          type="button"
          aria-label={isVisible ? "Ascunde parola" : "Arata parola"}
          onClick={() => setIsVisible((current) => !current)}
        >
          {isVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </span>
    </label>
  );
}
