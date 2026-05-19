import { UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../api/axiosClient.js";
import { PasswordField } from "../components/forms/PasswordField.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export function RegisterPage() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (error) {
      showToast({ message: error, type: "error" });
    }
  }, [error, showToast]);

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (form.password !== form.confirmPassword) {
      setError("Parolele nu coincid.");
      setIsSubmitting(false);
      return;
    }

    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password
      });
      navigate("/", { replace: true });
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Inregistrare</h1>
        <label>
          Nume
          <input name="name" value={form.name} onChange={updateField} required minLength={2} />
        </label>
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={updateField} required />
        </label>
        <PasswordField
          label="Parola"
          name="password"
          value={form.password}
          onChange={updateField}
          required
          minLength={8}
        />
        <PasswordField
          label="Confirma parola"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={updateField}
          required
          minLength={8}
        />
        <button className="primary-button" type="submit" disabled={isSubmitting}>
          <UserPlus size={18} aria-hidden="true" />
          {isSubmitting ? "Se creeaza contul..." : "Creeaza cont"}
        </button>
        <p>
          Ai deja cont? <Link to="/login">Autentifica-te</Link>
        </p>
      </form>
    </section>
  );
}
