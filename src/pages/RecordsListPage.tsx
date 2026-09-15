import { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import { api, type RecordSummary } from "../lib/api";
import { FormField } from "../components/FormField";
import { SignOutButton } from "../components/SignOutButton";
import { errorMessage } from "../lib/formErrors";

export function RecordsListPage() {
  const [records, setRecords] = useState<RecordSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [creating, setCreating] = useState(false);
  const bodyId = useId();

  async function load() {
    try {
      const { records } = await api.listRecords();
      setRecords(records);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setCreating(true);
    try {
      await api.createRecord({ title, body });
      setTitle("");
      setBody("");
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="auth-page records-page">
      <div className="page-header">
        <h1>Your records</h1>
        <SignOutButton />
      </div>

      <form onSubmit={handleCreate} className="create-record-form">
        <FormField
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          required
        />
        <div className="field">
          <label htmlFor={bodyId}>Body (optional)</label>
          <textarea id={bodyId} value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button disabled={creating}>{creating ? "Creating..." : "Create record"}</button>
      </form>

      {records === null
        ? <p>Loading...</p>
        : records.length === 0
        ? (
          // A genuine empty state - no placeholder or sample record ever
          // exists, so this is the true first-run experience, not a mock-up.
          <p className="empty-state">You have no records yet. Create your first one above.</p>
        )
        : (
          <ul className="record-list">
            {records.map((record) => (
              <li key={record.slug}>
                <Link to={`/records/${record.slug}`}>{record.title}</Link>
                <span className="record-date">{new Date(record.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
    </main>
  );
}
