import { ArrowLeft, ArrowRight, ImagePlus, Star, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getApiErrorMessage, resolveApiAssetUrl } from "../api/axiosClient.js";
import {
  createListing,
  deleteListingImage,
  getListing,
  updateListing,
  updateListingImageOrder,
  uploadListingImages
} from "../api/listingsApi.js";
import {
  emptyListingForm,
  formToListingPayload,
  ListingForm,
  listingToForm
} from "../components/forms/ListingForm.jsx";
import { ListingImage } from "../components/listings/ListingImage.jsx";

function selectedFilesLabel(files) {
  if (!files.length) {
    return "Nicio imagine selectata";
  }

  if (files.length === 1) {
    return files[0].name;
  }

  return `${files.length} imagini selectate`;
}

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

  async function reorderImages(nextImages, successMessage) {
    if (!listing) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await updateListingImageOrder(
        listing.id,
        nextImages.map((image) => image.id)
      );
      setListing(response.data);
      setSuccess(successMessage);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    }
  }

  function moveImage(imageIndex, direction) {
    const nextIndex = imageIndex + direction;

    if (!listing?.images || nextIndex < 0 || nextIndex >= listing.images.length) {
      return;
    }

    const nextImages = [...listing.images];
    [nextImages[imageIndex], nextImages[nextIndex]] = [nextImages[nextIndex], nextImages[imageIndex]];

    reorderImages(nextImages, "Ordinea imaginilor a fost actualizata.");
  }

  function setCoverImage(imageIndex) {
    if (!listing?.images || imageIndex === 0) {
      return;
    }

    const nextImages = [...listing.images];
    const [coverImage] = nextImages.splice(imageIndex, 1);
    nextImages.unshift(coverImage);

    reorderImages(nextImages, "Imaginea de coperta a fost actualizata.");
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
                <div className="file-picker-label">Imagini pentru anunt</div>
                <label className="custom-file-picker">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(event) => setSelectedFiles(Array.from(event.target.files))}
                  />
                  <span className="custom-file-button">
                    <ImagePlus size={17} aria-hidden="true" />
                    Alege imagini
                  </span>
                  <span className="custom-file-name">{selectedFilesLabel(selectedFiles)}</span>
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
            <div className="file-picker-label">Incarca imagini</div>
            <label className="custom-file-picker">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(event) => setSelectedFiles(Array.from(event.target.files))}
              />
              <span className="custom-file-button">
                <ImagePlus size={17} aria-hidden="true" />
                Alege imagini
              </span>
              <span className="custom-file-name">{selectedFilesLabel(selectedFiles)}</span>
            </label>
            <button className="primary-button" type="submit" disabled={isUploading || !selectedFiles.length}>
              <ImagePlus size={18} aria-hidden="true" />
              {isUploading ? "Se incarca..." : "Incarca"}
            </button>
          </form>

          <div className="image-management-grid">
            {listing.images?.length ? (
              listing.images.map((image, imageIndex) => (
                <div className="managed-image" key={image.id}>
                  {imageIndex === 0 ? <span className="cover-badge">Coperta</span> : null}
                  <ListingImage className="managed-image-media" src={resolveApiAssetUrl(image.url)} alt="" />
                  <div className="managed-image-actions">
                    <button
                      className="secondary-button compact-button"
                      type="button"
                      onClick={() => setCoverImage(imageIndex)}
                      disabled={imageIndex === 0}
                    >
                      <Star size={15} aria-hidden="true" />
                      Coperta
                    </button>
                    <button
                      className="secondary-button icon-button"
                      type="button"
                      onClick={() => moveImage(imageIndex, -1)}
                      disabled={imageIndex === 0}
                      aria-label="Muta imaginea la stanga"
                    >
                      <ArrowLeft size={16} aria-hidden="true" />
                    </button>
                    <button
                      className="secondary-button icon-button"
                      type="button"
                      onClick={() => moveImage(imageIndex, 1)}
                      disabled={imageIndex === listing.images.length - 1}
                      aria-label="Muta imaginea la dreapta"
                    >
                      <ArrowRight size={16} aria-hidden="true" />
                    </button>
                    <button className="danger-button compact-button" type="button" onClick={() => handleDeleteImage(image.id)}>
                      <Trash2 size={16} aria-hidden="true" />
                      Sterge
                    </button>
                  </div>
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
