import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminAnalytics } from "../api/adminApi.js";
import { getApiErrorMessage } from "../api/axiosClient.js";
import { AdminAnalyticsDashboard } from "../components/admin/AdminAnalyticsDashboard.jsx";

export function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadAnalytics() {
    setIsLoading(true);
    setError("");

    try {
      const response = await getAdminAnalytics();
      setAnalytics(response.data);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  return (
    <section className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Statistici platforma</h1>
          <p>Indicatori agregati despre utilizatori, anunturi, vizualizari si interactiuni.</p>
        </div>
        <div className="dashboard-actions">
          <Link className="secondary-button" to="/admin">
            Moderare anunturi
          </Link>
          <button className="secondary-button icon-button" type="button" onClick={loadAnalytics} disabled={isLoading}>
            <RefreshCw size={18} aria-hidden="true" />
            Actualizeaza
          </button>
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {isLoading ? <div className="page-status">Se incarca statisticile...</div> : null}
      {!isLoading && analytics ? <AdminAnalyticsDashboard analytics={analytics} /> : null}
    </section>
  );
}
