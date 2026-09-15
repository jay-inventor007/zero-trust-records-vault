import { Navigate, Route, Routes } from "react-router-dom";
import { SessionProvider } from "./lib/session";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SignUpPage } from "./pages/SignUpPage";
import { SignInPage } from "./pages/SignInPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { RecordsListPage } from "./pages/RecordsListPage";
import { RecordDetailPage } from "./pages/RecordDetailPage";

export function App() {
  return (
    <SessionProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/signin" replace />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/records"
          element={
            <ProtectedRoute>
              <RecordsListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/records/:slug"
          element={
            <ProtectedRoute>
              <RecordDetailPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </SessionProvider>
  );
}
