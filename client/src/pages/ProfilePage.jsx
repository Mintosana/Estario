import { Camera, Save, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { getApiErrorMessage, resolveApiAssetUrl } from "../api/axiosClient.js";
import { updateProfileRequest, uploadProfileAvatarRequest } from "../api/authApi.js";
import { useAuth } from "../context/AuthContext.jsx";

export function ProfilePage() {
  const { updateUser, user } = useAuth();
  const [form, setForm] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    bio: user?.bio ?? ""
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setForm({
      name: user?.name ?? "",
      phone: user?.phone ?? "",
      bio: user?.bio ?? ""
    });
  }, [user]);

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  }

  async function submitProfile(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
      const response = await updateProfileRequest(form);
      updateUser(response.user);
      setSuccess("Profilul a fost actualizat.");
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setIsSaving(false);
    }
  }

  async function submitAvatar(event) {
    event.preventDefault();

    if (!avatarFile) {
      setError("Alege o imagine pentru profil.");
      return;
    }

    setError("");
    setSuccess("");
    setIsUploading(true);

    try {
      const response = await uploadProfileAvatarRequest(avatarFile);
      updateUser(response.user);
      setAvatarFile(null);
      setSuccess("Poza de profil a fost actualizata.");
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="profile-page">
      <div className="dashboard-header">
        <div>
          <h1>Profilul meu</h1>
          <p>Actualizeaza informatiile afisate in contul tau Estario.</p>
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {success ? <p className="form-success">{success}</p> : null}

      <div className="profile-layout">
        <section className="content-panel profile-avatar-panel">
          <div className="profile-avatar">
            {user?.avatarUrl ? (
              <img src={resolveApiAssetUrl(user.avatarUrl)} alt={user.name} />
            ) : (
              <UserCircle size={88} aria-hidden="true" />
            )}
          </div>
          <form className="profile-avatar-form" onSubmit={submitAvatar}>
            <label className="custom-file-picker">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
              />
              <span className="custom-file-button">
                <Camera size={17} aria-hidden="true" />
                Alege poza
              </span>
              <span className="custom-file-name">{avatarFile?.name ?? "Nicio poza selectata"}</span>
            </label>
            <button className="primary-button" type="submit" disabled={isUploading || !avatarFile}>
              <Camera size={18} aria-hidden="true" />
              {isUploading ? "Se incarca..." : "Actualizeaza poza"}
            </button>
          </form>
        </section>

        <section className="content-panel">
          <form className="profile-form" onSubmit={submitProfile}>
            <label>
              Nume
              <input name="name" value={form.name} onChange={updateField} minLength={2} maxLength={80} required />
            </label>
            <label>
              Telefon
              <input name="phone" value={form.phone} onChange={updateField} maxLength={30} placeholder="Optional" />
            </label>
            <label>
              Despre tine
              <textarea
                name="bio"
                value={form.bio}
                onChange={updateField}
                maxLength={500}
                rows={5}
                placeholder="Optional"
              />
            </label>
            <button className="primary-button" type="submit" disabled={isSaving}>
              <Save size={18} aria-hidden="true" />
              {isSaving ? "Se salveaza..." : "Salveaza profilul"}
            </button>
          </form>
        </section>
      </div>
    </section>
  );
}
