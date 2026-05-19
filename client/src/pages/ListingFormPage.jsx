import { ArrowLeft, ArrowRight, ImagePlus, Sparkles, Star, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getApiErrorMessage, resolveApiAssetUrl } from "../api/axiosClient.js";
import {
  checkListingQuality,
  createListing,
  deleteListingImage,
  generateListingDescription,
  getListing,
  updateListing,
  updateListingImageOrder,
  uploadListingImages
} from "../api/listingsApi.js";
import {
  emptyListingForm,
  formToListingDescriptionPayload,
  formToListingQualityPayload,
  formToListingPayload,
  ListingForm,
  listingToForm
} from "../components/forms/ListingForm.jsx";
import { ListingImage } from "../components/listings/ListingImage.jsx";
import { useToast } from "../context/ToastContext.jsx";

function selectedFilesLabel(files) {
  if (!files.length) {
    return "Nicio imagine selectata";
  }

  if (files.length === 1) {
    return files[0].name;
  }

  return `${files.length} imagini selectate`;
}

const qualityIssueLabels = {
  critical: "Probleme importante",
  warning: "Atentionari",
  info: "Informatii utile"
};

function groupQualityIssues(issues = []) {
  return issues.reduce(
    (current, issue) => {
      current[issue.severity]?.push(issue);
      return current;
    },
    {
      critical: [],
      warning: [],
      info: []
    }
  );
}

export function ListingFormPage({ mode }) {
  const { showToast } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = mode === "edit";
  const [form, setForm] = useState(emptyListingForm);
  const [listing, setListing] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [qualityReview, setQualityReview] = useState(null);
  const [generatedDescription, setGeneratedDescription] = useState(null);
  const [error, setError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [qualityError, setQualityError] = useState("");
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCheckingQuality, setIsCheckingQuality] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

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

  function appendSelectedFiles(fileList) {
    const nextFiles = Array.from(fileList);

    if (!nextFiles.length) {
      return;
    }

    setSelectedFiles((current) => [...current, ...nextFiles]);
  }

  function handleSelectFiles(event) {
    appendSelectedFiles(event.target.files);
    event.target.value = "";
  }

  function removeSelectedFile(fileIndex) {
    setSelectedFiles((current) => current.filter((_, index) => index !== fileIndex));
  }

  function moveSelectedFile(fileIndex, direction) {
    const nextIndex = fileIndex + direction;

    setSelectedFiles((current) => {
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const nextFiles = [...current];
      [nextFiles[fileIndex], nextFiles[nextIndex]] = [nextFiles[nextIndex], nextFiles[fileIndex]];
      return nextFiles;
    });
  }

  function setSelectedCoverFile(fileIndex) {
    setSelectedFiles((current) => {
      if (fileIndex === 0) {
        return current;
      }

      const nextFiles = [...current];
      const [coverFile] = nextFiles.splice(fileIndex, 1);
      nextFiles.unshift(coverFile);
      return nextFiles;
    });
  }

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

  useEffect(() => {
    if (error) {
      showToast({ message: error, type: "error" });
    }
  }, [error, showToast]);

  useEffect(() => {
    if (descriptionError) {
      showToast({ message: descriptionError, type: "error" });
    }
  }, [descriptionError, showToast]);

  useEffect(() => {
    if (qualityError) {
      showToast({ message: qualityError, type: "error" });
    }
  }, [qualityError, showToast]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
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
    setIsUploading(true);

    try {
      const response = await uploadListingImages(listing.id, selectedFiles);
      setListing(response.data);
      setSelectedFiles([]);
      showToast({ message: "Imaginile au fost incarcate.", type: "success" });
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

    try {
      const response = await deleteListingImage(listing.id, imageId);
      setListing(response.data);
      showToast({ message: "Imaginea a fost stearsa.", type: "success" });
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    }
  }

  async function reorderImages(nextImages, successMessage) {
    if (!listing) {
      return;
    }

    setError("");

    try {
      const response = await updateListingImageOrder(
        listing.id,
        nextImages.map((image) => image.id)
      );
      setListing(response.data);
      showToast({ message: successMessage, type: "success" });
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

  async function handleQualityCheck() {
    setQualityError("");
    setQualityReview(null);
    setIsCheckingQuality(true);

    try {
      const imageCount = isEdit ? listing?.images?.length ?? 0 : selectedFiles.length;
      const response = await checkListingQuality(formToListingQualityPayload(form, imageCount));
      setQualityReview(response.data);
    } catch (apiError) {
      setQualityError(getApiErrorMessage(apiError));
    } finally {
      setIsCheckingQuality(false);
    }
  }

  async function handleGenerateDescription() {
    setDescriptionError("");
    setGeneratedDescription(null);
    setIsGeneratingDescription(true);

    try {
      const response = await generateListingDescription(formToListingDescriptionPayload(form));
      setGeneratedDescription(response.data);
    } catch (apiError) {
      setDescriptionError(getApiErrorMessage(apiError));
    } finally {
      setIsGeneratingDescription(false);
    }
  }

  function applyTitleSuggestion(title) {
    setForm((current) => ({
      ...current,
      title
    }));
  }

  function applyDescriptionSuggestion() {
    if (!qualityReview?.descriptionSuggestion) {
      return;
    }

    setForm((current) => ({
      ...current,
      description: qualityReview.descriptionSuggestion
    }));
  }

  function applyGeneratedDescription() {
    if (!generatedDescription?.description) {
      return;
    }

    setForm((current) => ({
      ...current,
      description: generatedDescription.description
    }));
  }

  function renderDescriptionGenerator() {
    return (
      <section className="description-generator full-span">
        <div className="description-generator-header">
          <div>
            <h2>Generator descriere</h2>
            <p>Genereaza o descriere pe baza campurilor completate, apoi o poti edita manual.</p>
          </div>
          <button
            className="secondary-button compact-button"
            type="button"
            onClick={handleGenerateDescription}
            disabled={isGeneratingDescription}
          >
            <Sparkles size={17} aria-hidden="true" />
            {isGeneratingDescription ? "Se genereaza..." : "Genereaza descriere"}
          </button>
        </div>

        {generatedDescription ? (
          <div className="description-generator-result">
            <div>
              <span>
                {generatedDescription.source === "ai" || generatedDescription.source === "gemini"
                  ? "Generata cu AI + reguli locale"
                  : "Generata din reguli locale"}
              </span>
              <p>{generatedDescription.description}</p>
            </div>
            <button className="secondary-button compact-button" type="button" onClick={applyGeneratedDescription}>
              Foloseste descrierea
            </button>
          </div>
        ) : null}
      </section>
    );
  }

  function renderQualityAssistant() {
    const groupedIssues = groupQualityIssues(qualityReview?.issues);
    const issueGroups = ["critical", "warning", "info"].filter((severity) => groupedIssues[severity].length);

    return (
      <section className="quality-assistant full-span">
        <div className="quality-assistant-header">
          <div>
            <h2>Asistent calitate anunt</h2>
            <p>Verifica rapid daca anuntul are informatiile importante inainte de trimitere.</p>
          </div>
          <button className="secondary-button compact-button" type="button" onClick={handleQualityCheck} disabled={isCheckingQuality}>
            <Sparkles size={17} aria-hidden="true" />
            {isCheckingQuality ? "Se verifica..." : "Verifica anuntul"}
          </button>
        </div>

        {qualityReview ? (
          <div className="quality-result">
            <div className="quality-score">
              <span>Scor calitate</span>
              <strong>{qualityReview.score}/100</strong>
              <p>
                {qualityReview.source === "ai" || qualityReview.source === "gemini"
                  ? "Analiza AI + reguli locale"
                  : "Analiza din reguli locale"}
              </p>
            </div>
            <div className="quality-summary">
              <h3>{qualityReview.summary}</h3>
              {issueGroups.length ? (
                <div className="quality-issue-groups">
                  {issueGroups.map((severity) => (
                    <details className={`quality-issue-group quality-issue-group-${severity}`} key={severity}>
                      <summary>
                        <span>{qualityIssueLabels[severity]}</span>
                        <strong>{groupedIssues[severity].length}</strong>
                      </summary>
                      <ul>
                        {groupedIssues[severity].map((issue, index) => (
                          <li key={`${severity}-${index}`}>{issue.message}</li>
                        ))}
                      </ul>
                    </details>
                  ))}
                </div>
              ) : (
                <p>Nu au fost gasite probleme importante.</p>
              )}
            </div>

            {qualityReview.titleSuggestions.length ? (
              <div className="quality-suggestions">
                <h3>Titluri sugerate</h3>
                <div className="quality-suggestion-list">
                  {qualityReview.titleSuggestions.map((title) => (
                    <button className="secondary-button" type="button" key={title} onClick={() => applyTitleSuggestion(title)}>
                      {title}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {qualityReview.descriptionSuggestion ? (
              <div className="quality-description">
                <h3>Descriere sugerata</h3>
                <p>{qualityReview.descriptionSuggestion}</p>
                <button className="secondary-button compact-button" type="button" onClick={applyDescriptionSuggestion}>
                  Foloseste descrierea
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    );
  }

  function renderImageManager() {
    if (!isEdit || !listing) {
      return null;
    }

    return (
      <section className="image-editor-panel full-span">
        <h2>Imagini</h2>
        <div className="upload-form">
          <div className="file-picker-label">Incarca imagini</div>
          <label className="custom-file-picker">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleSelectFiles}
            />
            <span className="custom-file-button">
              <ImagePlus size={17} aria-hidden="true" />
              Alege imagini
            </span>
            <span className="custom-file-name">{selectedFilesLabel(selectedFiles)}</span>
          </label>
          <button className="primary-button" type="button" onClick={handleUpload} disabled={isUploading || !selectedFiles.length}>
            <ImagePlus size={18} aria-hidden="true" />
            {isUploading ? "Se incarca..." : "Incarca"}
          </button>
        </div>

        {selectedFilePreviews.length ? (
          <div className="selected-image-grid">
            {selectedFilePreviews.map((preview, imageIndex) => (
              <div className="selected-image-preview" key={preview.url}>
                {imageIndex === 0 ? <span className="cover-badge">Coperta</span> : null}
                <img src={preview.url} alt={preview.name} />
                <span>{preview.name}</span>
                <div className="selected-image-actions">
                  <button
                    className="secondary-button compact-button"
                    type="button"
                    onClick={() => setSelectedCoverFile(imageIndex)}
                    disabled={imageIndex === 0}
                  >
                    <Star size={15} aria-hidden="true" />
                    Coperta
                  </button>
                  <button
                    className="secondary-button icon-button"
                    type="button"
                    onClick={() => moveSelectedFile(imageIndex, -1)}
                    disabled={imageIndex === 0}
                    aria-label="Muta imaginea selectata la stanga"
                  >
                    <ArrowLeft size={16} aria-hidden="true" />
                  </button>
                  <button
                    className="secondary-button icon-button"
                    type="button"
                    onClick={() => moveSelectedFile(imageIndex, 1)}
                    disabled={imageIndex === selectedFilePreviews.length - 1}
                    aria-label="Muta imaginea selectata la dreapta"
                  >
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                  <button className="danger-button compact-button" type="button" onClick={() => removeSelectedFile(imageIndex)}>
                    <Trash2 size={16} aria-hidden="true" />
                    Sterge
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

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
      </section>
    );
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
        <ListingForm
          childrenBeforeSubmit={
            <>
              {!isEdit ? (
                <div className="full-span inline-image-upload">
                  <div className="file-picker-label">Imagini pentru anunt</div>
                  <label className="custom-file-picker">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handleSelectFiles}
                    />
                    <span className="custom-file-button">
                      <ImagePlus size={17} aria-hidden="true" />
                      Alege imagini
                    </span>
                    <span className="custom-file-name">{selectedFilesLabel(selectedFiles)}</span>
                  </label>
                  {selectedFilePreviews.length ? (
                    <div className="selected-image-grid">
                      {selectedFilePreviews.map((preview, imageIndex) => (
                        <div className="selected-image-preview" key={preview.url}>
                          {imageIndex === 0 ? <span className="cover-badge">Coperta</span> : null}
                          <img src={preview.url} alt={preview.name} />
                          <span>{preview.name}</span>
                          <div className="selected-image-actions">
                            <button
                              className="secondary-button compact-button"
                              type="button"
                              onClick={() => setSelectedCoverFile(imageIndex)}
                              disabled={imageIndex === 0}
                            >
                              <Star size={15} aria-hidden="true" />
                              Coperta
                            </button>
                            <button
                              className="secondary-button icon-button"
                              type="button"
                              onClick={() => moveSelectedFile(imageIndex, -1)}
                              disabled={imageIndex === 0}
                              aria-label="Muta imaginea selectata la stanga"
                            >
                              <ArrowLeft size={16} aria-hidden="true" />
                            </button>
                            <button
                              className="secondary-button icon-button"
                              type="button"
                              onClick={() => moveSelectedFile(imageIndex, 1)}
                              disabled={imageIndex === selectedFilePreviews.length - 1}
                              aria-label="Muta imaginea selectata la dreapta"
                            >
                              <ArrowRight size={16} aria-hidden="true" />
                            </button>
                            <button className="danger-button compact-button" type="button" onClick={() => removeSelectedFile(imageIndex)}>
                              <Trash2 size={16} aria-hidden="true" />
                              Sterge
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>Adauga fotografii acum; ele vor fi incarcate odata cu anuntul.</p>
                  )}
                </div>
              ) : null}
              {renderDescriptionGenerator()}
              {renderQualityAssistant()}
              {renderImageManager()}
            </>
          }
          form={form}
          isSubmitting={isSubmitting}
          onChange={setForm}
          onSubmit={handleSubmit}
          submitLabel={isEdit ? "Salveaza modificarile" : "Trimite spre aprobare"}
        />
      </div>

    </section>
  );
}
