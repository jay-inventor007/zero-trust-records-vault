import type {
  SignUpInput,
  SignInInput,
  VerifyEmailInput,
  ResendVerificationInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  CreateRecordInput,
} from "../../shared/validation";

export interface RecordSummary {
  slug: string;
  title: string;
  body: string;
  created_at: string;
}

export interface RecordDetail extends RecordSummary {
  updated_at: string;
}

const API_BASE = "/api";

export class ApiError extends Error {
  status: number;
  issues?: { fieldErrors: Record<string, string[] | undefined> };
  retryAfterSeconds?: number;

  constructor(
    status: number,
    message: string,
    issues?: { fieldErrors: Record<string, string[] | undefined> },
    retryAfterSeconds?: number,
  ) {
    super(message);
    this.status = status;
    this.issues = issues;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const retryAfter = response.headers.get("Retry-After");
    throw new ApiError(
      response.status,
      body.error ?? "Something went wrong",
      body.issues,
      retryAfter ? Number(retryAfter) : undefined,
    );
  }

  return body as T;
}

export const api = {
  signUp: (data: SignUpInput) =>
    request<{ email: string }>("/signup", { method: "POST", body: JSON.stringify(data) }),
  signIn: (data: SignInInput) =>
    request<{ email: string }>("/signin", { method: "POST", body: JSON.stringify(data) }),
  verifyEmail: (data: VerifyEmailInput) =>
    request<{ email: string }>("/verify-email", { method: "POST", body: JSON.stringify(data) }),
  resendVerification: (data: ResendVerificationInput) =>
    request<{ message: string }>("/resend-verification", { method: "POST", body: JSON.stringify(data) }),
  forgotPassword: (data: ForgotPasswordInput) =>
    request<{ message: string }>("/forgot-password", { method: "POST", body: JSON.stringify(data) }),
  resetPassword: (data: ResetPasswordInput) =>
    request<{ message: string }>("/reset-password", { method: "POST", body: JSON.stringify(data) }),
  signOut: () => request<{ message: string }>("/signout", { method: "POST" }),
  me: () => request<{ email: string }>("/me", { method: "GET" }),

  listRecords: () => request<{ records: RecordSummary[]; total: number }>("/list-records", { method: "GET" }),
  getRecord: (slug: string) =>
    request<{ record: RecordDetail }>(`/get-record?slug=${encodeURIComponent(slug)}`, { method: "GET" }),
  createRecord: (data: CreateRecordInput) =>
    request<{ record: RecordSummary }>("/create-record", { method: "POST", body: JSON.stringify(data) }),
  deleteRecord: (slug: string) =>
    request<{ message: string }>("/delete-record", { method: "POST", body: JSON.stringify({ slug }) }),
};
