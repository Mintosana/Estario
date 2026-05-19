import { BadgeEuro, Camera, CreditCard, Save, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { getApiErrorMessage, resolveApiAssetUrl } from "../api/axiosClient.js";
import { updateProfileRequest, uploadProfileAvatarRequest } from "../api/authApi.js";
import { buyPromotionBundle } from "../api/promotionApi.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

const promotionBundles = [
  {
    credits: 3,
    key: "starter",
    name: "Starter",
    price: 5
  },
  {
    credits: 8,
    key: "growth",
    name: "Growth",
    price: 12
  },
  {
    credits: 20,
    key: "pro",
    name: "Pro",
    price: 25
  }
];

export function ProfilePage() {
  const { updateUser, user } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    bio: user?.bio ?? ""
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [buyingBundleKey, setBuyingBundleKey] = useState("");

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
    setIsSaving(true);

    try {
      const response = await updateProfileRequest(form);
      updateUser(response.user);
      showToast({ message: "Profilul a fost actualizat.", type: "success" });
    } catch (apiError) {
      showToast({ message: getApiErrorMessage(apiError), type: "error" });
    } finally {
      setIsSaving(false);
    }
  }

  async function submitAvatar(event) {
    event.preventDefault();

    if (!avatarFile) {
      showToast({ message: "Alege o imagine pentru profil.", type: "warning" });
      return;
    }

    setIsUploading(true);

    try {
      const response = await uploadProfileAvatarRequest(avatarFile);
      updateUser(response.user);
      setAvatarFile(null);
      showToast({ message: "Poza de profil a fost actualizata.", type: "success" });
    } catch (apiError) {
      showToast({ message: getApiErrorMessage(apiError), type: "error" });
    } finally {
      setIsUploading(false);
    }
  }

  async function buyBundle(bundleKey) {
    setBuyingBundleKey(bundleKey);

    try {
      const response = await buyPromotionBundle(bundleKey);
      updateUser(response.user);
      showToast({ message: `Pachetul ${response.bundle.label} a fost adaugat in cont.`, type: "success" });
    } catch (apiError) {
      showToast({ message: getApiErrorMessage(apiError), type: "error" });
    } finally {
      setBuyingBundleKey("");
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

      <section className="promotion-panel" aria-label="Pachete promovare">
        <div className="promotion-panel-heading">
          <div>
            <span>Boost anunturi</span>
            <h2>Pachete promovare</h2>
            <p>Cumpara credite demo si foloseste-le pentru a afisa anunturile tale in zona promovata.</p>
          </div>
          <div className="promotion-credit-balance">
            <BadgeEuro size={22} aria-hidden="true" />
            <strong>{user?.promotionCredits ?? 0}</strong>
            <span>credite disponibile</span>
          </div>
        </div>

        <div className="promotion-bundle-grid">
          {promotionBundles.map((bundle) => (
            <article className="promotion-bundle-card" key={bundle.key}>
              <div>
                <h3>{bundle.name}</h3>
                <strong>{bundle.credits} credite</strong>
                <p>{bundle.credits} luni de promovare pentru anunturile aprobate.</p>
              </div>
              <button
                className="primary-button"
                type="button"
                onClick={() => buyBundle(bundle.key)}
                disabled={buyingBundleKey === bundle.key}
              >
                <CreditCard size={17} aria-hidden="true" />
                {buyingBundleKey === bundle.key ? "Se proceseaza..." : `${bundle.price} EUR`}
              </button>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
