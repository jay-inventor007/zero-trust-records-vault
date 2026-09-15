import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, ApiError, type RecordDetail } from "../lib/api";
import { SignOutButton } from "../components/SignOutButton";
import { errorMessage } from "../lib/formErrors";

export function RecordDetailPage() {
  // The URL parameter is the slug, never the database id - this page is
  // addressable and shareable without exposing anything about the row's
  // real identity.
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<RecordDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!slug) return;
    api.getRecord(slug)
      .then(({ record }) => setRecord(record))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
        else setError(errorMessage(err));
      });
  }, [slug]);

  async function handleDelete() {
    if (!slug) return;
    setBusy(true);
    setError(null);
    try {
      await api.deleteRecord(slug);
      navigate("/records");
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  if (notFound) {
    return (
      <main className="auth-page">
        <p>That record doesn't exist, or isn't yours.</p>
        <Link to="/records">Back to your records</Link>
      </main>
    );
  }

  if (!record) {
    return (
      <main className="auth-page">
        {error ? <p className="form-error">{error}</p> : <p>Loading...</p>}
      </main>
    );
  }

  return (
    <main className="auth-page record-detail-page">
      <div className="page-header">
        <h1>{record.title}</h1>
        <SignOutButton />
      </div>

      <p className="record-meta">
        Created {new Date(record.created_at).toLocaleString()}
        {record.updated_at !== record.created_at && ` · updated ${new Date(record.updated_at).toLocaleString()}`}
      </p>

      {record.body && <p className="record-body">{record.body}</p>}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {!confirmingDelete && (
        <button onClick={() => setConfirmingDelete(true)} disabled={busy}>
          Delete record
        </button>
      )}

      {confirmingDelete && (
        <div className="cancel-confirm">
          <p>Delete "{record.title}"? This can't be undone.</p>
          <button onClick={handleDelete} disabled={busy}>
            {busy ? "Deleting..." : "Confirm delete"}
          </button>
          <button type="button" onClick={() => setConfirmingDelete(false)} disabled={busy}>
            Never mind
          </button>
        </div>
      )}

      <p>
        <Link to="/records">Back to your records</Link>
      </p>
    </main>
  );
}
