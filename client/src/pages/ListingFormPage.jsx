import { ImagePlus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getApiErrorMessage, resolveApiAssetUrl } from "../api/axiosClient.js";
import {
  createListing,
  deleteListingImage,
  getListing,
  updateListing,
  uploadListingImages
} from "../api/listingsApi.js";
import {
  emptyListingForm,
  formToListingPayload,
  ListingForm,
  listingToForm
} from "../components/forms/ListingForm.jsx";
import { ListingImage } from "../components/listings/ListingImage.jsx";

export function ListingFormPage({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = mode === "edit";
  const [form, setForm] = useState(emptyListingForm);
  const [listing, setListing] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const selectedFilePreviews = useMemo(() => {
    return selectedFiles.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file)
    }));
  }, [selectedFiles]);

  useEffect(() => {
    return () => {
      selectedFilePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [selectedFilePreviews]);

  useEffect(() => {
    let isMounted = true;

    async function loadListing() {
      if (!isEdit) {
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const response = await getListing(id);
        if (isMounted) {
          setListing(response.data);
          setForm(listingToForm(response.data));
        }
      } catch (apiError) {
        if (isMounted) {
          setError(getApiErrorMessage(apiError));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadListing();

    return () => {
      isMounted = false;
    };
  }, [id, isEdit]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const payload = formToListingPayload(form);
      const response = isEdit ? await updateListing(id, payload) : await createListing(payload);
      let savedListing = response.data;

      if (!isEdit && selectedFiles.length) {
        const uploadResponse = await uploadListingImages(savedListing.id, selectedFiles);
        savedListing = uploadResponse.data;
      }

      setListing(savedListing);
      setSelectedFiles([]);
      navigate("/my-listings", {
        replace: true,
        state: {
          highlightedListingId: savedListing.id,
          notice: isEdit
            ? "Anuntul a fost modificat si retrimis spre aprobare."
            : selectedFiles.length
              ? "Anuntul si imaginile au fost salvate. Anuntul este in asteptarea aprobarii."
              : "Anuntul a fost salvat si este in asteptarea aprobarii."
        }
      });
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpload(event) {
    event.preventDefault();

    if (!selectedFiles.length || !listing) {
      return;
    }

    setError("");
    setSuccess("");
    setIsUploading(true);

    try {
      const response = await uploadListingImages(listing.id, selectedFiles);
      setListing(response.data);
      setSelectedFiles([]);
      setSuccess("Imaginile au fost incarcate.");
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDeleteImage(imageId) {
    if (!listing || !window.confirm("Stergi aceasta imagine?")) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await deleteListingImage(listing.id, imageId);
      setListing((current) => ({
        ...current,
        images: current.images.filter((image) => image.id !== imageId)
      }));
      setSuccess("Imaginea a fost stearsa.");
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    }
  }

  if (isLoading) {
    return <div className="page-status">Se incarca formularul...</div>;
  }

  return (
    <section className="form-page">
      <Link className="back-link" to="/my-listings">
        Inapoi la anunturile mele
      </Link>
      <div className="content-panel">
        <h1>{isEdit ? "Editeaza anunt" : "Adauga anunt"}</h1>
        {isEdit && listing?.status === "REJECTED" ? (
          <p className="owner-notice">
            Motiv respingere: {listing.rejectionReason || "Motiv necompletat."}
          </p>
        ) : null}
        {error ? <p className="form-error">{error}</p> : null}
        {success ? <p className="form-success">{success}</p> : null}
        <ListingForm
          childrenBeforeSubmit={
            !isEdit ? (
              <div className="full-span inline-image-upload">
                <label>
                  Imagini pentru anunt
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(event) => setSelectedFiles(Array.from(event.target.files))}
                  />
                </label>
                {selectedFilePreviews.length ? (
                  <div className="selected-image-grid">
                    {selectedFilePreviews.map((preview) => (
                      <div className="selected-image-preview" key={preview.url}>
                        <img src={preview.url} alt={preview.name} />
                        <span>{preview.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Adauga fotografii acum; ele vor fi incarcate odata cu anuntul.</p>
                )}
              </div>
            ) : null
          }
          form={form}
          isSubmitting={isSubmitting}
          onChange={setForm}
          onSubmit={handleSubmit}
          submitLabel={isEdit ? "Salveaza modificarile" : "Trimite spre aprobare"}
        />
      </div>

      {isEdit && listing ? (
        <div className="content-panel">
          <h2>Imagini</h2>
          <form className="upload-form" onSubmit={handleUpload}>
            <label>
              Incarca imagini
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(event) => setSelectedFiles(Array.from(event.target.files))}
              />
            </label>
            <button className="primary-button" type="submit" disabled={isUploading || !selectedFiles.length}>
              <ImagePlus size={18} aria-hidden="true" />
              {isUploading ? "Se incarca..." : "Incarca"}
            </button>
          </form>

          <div className="image-management-grid">
            {listing.images?.length ? (
              listing.images.map((image) => (
                <div className="managed-image" key={image.id}>
                  <ListingImage src={resolveApiAssetUrl(image.url)} alt="" />
                  <button type="button" onClick={() => handleDeleteImage(image.id)}>
                    <Trash2 size={16} aria-hidden="true" />
                    Sterge
                  </button>
                </div>
              ))
            ) : (
              <p>Nu exista imagini incarcate.</p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
