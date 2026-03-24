import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, User2, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  activateAdminMfa,
  getAdminAccessToken,
  isAdminMfaPendingToken,
  loginAdmin,
  registerAdminSelf,
  requestAdminPasswordReset,
  restoreAdminSession,
  seedAdmin,
  setupAdminMfa,
  type AdminMfaSetupResponse,
} from "@/lib/api";

type LoginLocationState = { from?: string };
type Mode = "signIn" | "register";

const STORED_EMAIL_KEY = "hardware_store_admin_login_email";
const EMAIL_RE = /\S+@\S+\.\S+/;
const USERNAME_RE = /^[a-zA-Z0-9._-]{3,30}$/;
function inputClass(hasError: boolean) {
  return [
    "h-10 sm:h-11 rounded-none border bg-background text-sm transition-all duration-200",
    "focus-visible:border-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500/20 focus-visible:shadow-[0_0_0_4px_rgba(245,158,11,0.10)]",
    hasError ? "border-destructive/70 focus-visible:border-destructive focus-visible:ring-destructive/20" : "border-border/80",
  ].join(" ");
}

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>("signIn");
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});
  const [registerErrors, setRegisterErrors] = useState<{ email?: string; username?: string; password?: string; fullName?: string }>({});
  const [forgotState, setForgotState] = useState({ error: "", message: "" });
  const [feedback, setFeedback] = useState({ error: "", success: "" });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaSetup, setMfaSetup] = useState<AdminMfaSetupResponse | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [isPreparingMfa, setIsPreparingMfa] = useState(false);
  const [isActivatingMfa, setIsActivatingMfa] = useState(false);
  const didInitRef = useRef(false);

  const nextPath = useMemo(() => {
    const search = new URLSearchParams(location.search);
    const nextFromQuery = search.get("next");
    if (nextFromQuery && nextFromQuery.startsWith("/admin") && nextFromQuery !== "/admin/login") return nextFromQuery;
    const state = (location.state as LoginLocationState | null)?.from;
    if (state && state.startsWith("/admin") && state !== "/admin/login") return state;
    return "/admin";
  }, [location.search, location.state]);

  const registerStrength = useMemo(() => {
    if (!registerPassword) return "";
    if (registerPassword.length >= 14) return "Strong";
    if (registerPassword.length >= 10) return "Good";
    return "Too short";
  }, [registerPassword]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const remembered = window.localStorage.getItem(STORED_EMAIL_KEY);
    if (remembered) {
      setEmail(remembered);
      setForgotEmail(remembered);
    }
  }, []);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    let active = true;
    (async () => {
      const ok = getAdminAccessToken() || (await restoreAdminSession());
      if (!active) return;
      if (!ok) return setIsCheckingSession(false);
      if (isAdminMfaPendingToken()) {
        setMfaRequired(true);
        setIsCheckingSession(false);
        return;
      }
      navigate(nextPath, { replace: true });
    })();
    return () => {
      active = false;
    };
  }, [navigate, nextPath]);

  const resetMessages = () => {
    setFeedback({ error: "", success: "" });
    setForgotState({ error: "", message: "" });
  };

  const validateLogin = () => {
    const nextErrors: { email?: string; password?: string } = {};
    if (!EMAIL_RE.test(email.trim())) nextErrors.email = "Invalid email format.";
    if (password.length < 8) nextErrors.password = "Password must be at least 8 characters.";
    setLoginErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateRegister = () => {
    const nextErrors: { email?: string; username?: string; password?: string; fullName?: string } = {};
    if (!EMAIL_RE.test(registerEmail.trim())) nextErrors.email = "Invalid email format.";
    if (!USERNAME_RE.test(registerUsername.trim())) nextErrors.username = "Username must be 3-30 valid characters.";
    if (registerPassword.length < 10) nextErrors.password = "Password must be at least 10 characters.";
    if (fullName.trim() && fullName.trim().length < 2) nextErrors.fullName = "Enter a full name or leave it blank.";
    setRegisterErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const prepareMfa = async () => {
    setFeedback({ error: "", success: "" });
    setIsPreparingMfa(true);
    try {
      setMfaSetup(await setupAdminMfa());
    } catch (error) {
      setFeedback({ error: error instanceof Error ? error.message : "Could not initialize MFA setup.", success: "" });
    } finally {
      setIsPreparingMfa(false);
    }
  };

  if (getAdminAccessToken() && !isAdminMfaPendingToken()) return <Navigate to={nextPath} replace />;
  if (isCheckingSession) return <div className="min-h-screen bg-background" />;

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();
    if (!validateLogin()) return;
    setIsLoggingIn(true);
    try {
      const session = await loginAdmin(email.trim(), password);
      if (typeof window !== "undefined") {
        if (rememberMe) window.localStorage.setItem(STORED_EMAIL_KEY, email.trim());
        else window.localStorage.removeItem(STORED_EMAIL_KEY);
      }
      if (session.mfaSetupRequired) {
        setMfaRequired(true);
        await prepareMfa();
      } else navigate(nextPath, { replace: true });
    } catch (error) {
      setFeedback({ error: error instanceof Error ? error.message : "Could not sign in.", success: "" });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();
    if (!validateRegister()) return;
    setIsRegistering(true);
    try {
      const session = await registerAdminSelf({
        email: registerEmail.trim(),
        username: registerUsername.trim(),
        password: registerPassword,
        fullName: fullName.trim() || registerUsername.trim(),
      });
      if (session.mfaSetupRequired) {
        setMfaRequired(true);
        await prepareMfa();
      } else navigate(nextPath, { replace: true });
    } catch (error) {
      setFeedback({ error: error instanceof Error ? error.message : "Could not create admin account.", success: "" });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSeed = async () => {
    resetMessages();
    if (!validateRegister()) return;
    setIsSeeding(true);
    try {
      const session = await seedAdmin({
        email: registerEmail.trim(),
        username: registerUsername.trim(),
        password: registerPassword,
        fullName: fullName.trim() || "System Administrator",
      });
      if (session.mfaSetupRequired) {
        setMfaRequired(true);
        await prepareMfa();
      } else navigate(nextPath, { replace: true });
    } catch (error) {
      setFeedback({ error: error instanceof Error ? error.message : "Could not create super admin.", success: "" });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleForgotPassword = async () => {
    resetMessages();
    if (!EMAIL_RE.test(forgotEmail.trim())) return setForgotState({ error: "Invalid email format.", message: "" });
    setIsResettingPassword(true);
    try {
      await requestAdminPasswordReset(forgotEmail.trim());
      setForgotState({ error: "", message: "If that admin email exists, password reset instructions have been prepared." });
    } catch (error) {
      setForgotState({ error: error instanceof Error ? error.message : "Unable to request reset.", message: "" });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleActivateMfa = async () => {
    setFeedback({ error: "", success: "" });
    setIsActivatingMfa(true);
    try {
      await activateAdminMfa(mfaCode.trim());
      navigate(nextPath, { replace: true });
    } catch (error) {
      setFeedback({ error: error instanceof Error ? error.message : "Could not activate MFA.", success: "" });
    } finally {
      setIsActivatingMfa(false);
    }
  };

  if (mfaRequired) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.08),transparent_32%),linear-gradient(180deg,#09090b,#111827)] px-4 py-5 text-white sm:px-6 lg:py-8">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="border border-amber-500/20 bg-[linear-gradient(160deg,rgba(23,23,23,0.96),rgba(64,48,12,0.9),rgba(146,98,16,0.82))] p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.32em] text-amber-200/70">Admin Security</p>
            <h1 className="mt-3 text-[1.8rem] font-light tracking-tight">Complete MFA before dashboard access is opened.</h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-200/82">Store the secret and backup codes securely before promoting this session into full admin access.</p>
          </section>
          <Card className="border border-slate-800 bg-white text-slate-950 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
            <CardHeader>
              <CardTitle className="text-xl font-light">Set Up Admin MFA</CardTitle>
              <p className="text-sm text-slate-500">Finish the security step now so the session can continue.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {!mfaSetup ? (
                <Button type="button" className="h-11 w-full rounded-none bg-slate-950 text-white hover:bg-slate-900" onClick={() => void prepareMfa()} disabled={isPreparingMfa}>
                  {isPreparingMfa ? "Preparing..." : "Generate MFA Setup"}
                </Button>
              ) : (
                <>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">Authenticator secret</p>
                    <p className="break-all border border-border bg-muted/20 p-3 font-mono text-xs">{mfaSetup.secret}</p>
                    <p className="font-medium">OTPAuth URI</p>
                    <p className="break-all border border-border bg-muted/20 p-3 font-mono text-xs">{mfaSetup.otpauthUri}</p>
                    <p className="font-medium">Backup codes</p>
                    <div className="grid grid-cols-2 gap-2">
                      {mfaSetup.backupCodes.map((code) => (
                        <p key={code} className="border border-border bg-muted/20 p-3 font-mono text-xs">{code}</p>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mfa-code" className="text-sm font-medium">Verification code</Label>
                    <Input id="mfa-code" value={mfaCode} onChange={(event) => setMfaCode(event.target.value)} placeholder="123456" maxLength={6} className={inputClass(mfaCode.trim().length > 0 && mfaCode.trim().length !== 6)} />
                  </div>
                  <Button type="button" className="h-11 w-full rounded-none bg-slate-950 text-white hover:bg-slate-900" onClick={() => void handleActivateMfa()} disabled={isActivatingMfa || mfaCode.trim().length !== 6}>
                    {isActivatingMfa ? "Activating..." : "Activate MFA"}
                  </Button>
                </>
              )}
              {feedback.error ? <p className="text-sm text-destructive">{feedback.error}</p> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.12),transparent_34%),linear-gradient(180deg,#fff8eb,#fffdf8)] px-3 py-4 sm:px-6 sm:py-5 lg:flex lg:items-center lg:justify-center lg:py-8">
      <div className="mx-auto max-w-[28rem] border border-amber-200/70 bg-white shadow-[0_24px_70px_rgba(161,98,7,0.12)]">
        <section className="p-3 sm:p-4">
          <div className="mx-auto max-w-sm">
            <div className="space-y-3">
              <h2 className="text-[1.2rem] font-light text-slate-950 sm:text-[1.4rem]">{mode === "signIn" ? "Admin sign in" : "Create admin account"}</h2>
              <p className="text-sm leading-6 text-slate-500">{mode === "signIn" ? "Use your email and password to continue into the protected admin area." : "Create a named admin account instead of relying on shared dashboard credentials."}</p>
            </div>
            {nextPath !== "/admin" ? <div className="mt-4 flex items-start gap-3 border border-amber-300/40 bg-amber-50 px-3.5 py-3 text-sm text-slate-950"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /><p>After access is verified, you will be returned directly to {nextPath}.</p></div> : null}
            {(feedback.error || feedback.success) ? <div className={`mt-5 border px-4 py-3 text-sm ${feedback.error ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-emerald-300/40 bg-emerald-50/80 text-emerald-700"}`}>{feedback.error || feedback.success}</div> : null}

            {mode === "signIn" ? (
              <form className="mt-4 space-y-3" onSubmit={handleLogin} noValidate>
                <div className="space-y-2">
                  <Label htmlFor="admin-email" className="text-sm font-medium text-slate-950">Admin email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input id="admin-email" type="email" value={email} onChange={(event) => { setEmail(event.target.value); if (loginErrors.email) setLoginErrors((prev) => ({ ...prev, email: undefined })); }} onBlur={() => email && setLoginErrors((prev) => ({ ...prev, email: EMAIL_RE.test(email.trim()) ? undefined : "Invalid email format." }))} placeholder="admin@example.com" className={`${inputClass(Boolean(loginErrors.email))} pl-10 pr-3`} />
                  </div>
                  {loginErrors.email ? <p className="text-sm text-destructive">{loginErrors.email}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password" className="text-sm font-medium text-slate-950">Password</Label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input id="admin-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => { setPassword(event.target.value); if (loginErrors.password) setLoginErrors((prev) => ({ ...prev, password: undefined })); }} onBlur={() => password && setLoginErrors((prev) => ({ ...prev, password: password.length >= 8 ? undefined : "Password must be at least 8 characters." }))} placeholder="Enter your password" className={`${inputClass(Boolean(loginErrors.password))} pl-10 pr-12`} />
                    <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-950" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  </div>
                  {loginErrors.password ? <p className="text-sm text-destructive">{loginErrors.password}</p> : null}
                </div>
                <div className="flex flex-col gap-3 border border-border/70 bg-slate-50 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <label htmlFor="remember-admin-email" className="flex cursor-pointer items-center gap-3 text-sm text-slate-950"><Checkbox id="remember-admin-email" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked === true)} /><span>Remember admin email</span></label>
                  <button type="button" onClick={() => { setForgotOpen((prev) => !prev); setForgotEmail((current) => current || email); setForgotState({ error: "", message: "" }); }} className="text-left text-sm text-slate-950 underline underline-offset-4 transition-colors hover:text-amber-700">Forgot password?</button>
                </div>
                {forgotOpen ? (
                  <div className="space-y-3 border border-border/70 bg-slate-50 px-3.5 py-3.5">
                    <p className="text-sm font-medium text-slate-950">Request admin password reset</p>
                    <Input type="email" value={forgotEmail} onChange={(event) => setForgotEmail(event.target.value)} placeholder="admin@example.com" className={inputClass(Boolean(forgotState.error))} />
                    {forgotState.error ? <p className="text-sm text-destructive">{forgotState.error}</p> : null}
                    {forgotState.message ? <p className="text-sm text-emerald-700">{forgotState.message}</p> : null}
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button type="button" className="h-10 rounded-none bg-slate-950 text-sm text-white hover:bg-slate-900" disabled={isResettingPassword} onClick={() => void handleForgotPassword()}>{isResettingPassword ? "Requesting..." : "Send reset request"}</Button>
                      <Button type="button" variant="outline" className="h-10 rounded-none text-sm" onClick={() => setForgotOpen(false)}>Close</Button>
                    </div>
                  </div>
                ) : null}
                <Button type="submit" className="h-10 sm:h-11 w-full rounded-none bg-slate-950 text-sm text-white hover:bg-slate-900" disabled={isLoggingIn || isRegistering || isSeeding}>{isLoggingIn ? "Signing in..." : "Sign in to admin dashboard"}</Button>
                <div className="flex flex-col items-start gap-3 border-t border-border/70 pt-5 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <span className="text-slate-500">Need a dedicated admin account?</span>
                  <button type="button" onClick={() => { setMode("register"); resetMessages(); }} className="inline-flex items-center gap-2 text-slate-950 underline underline-offset-4 transition-colors hover:text-amber-700"><span>Create one</span><ArrowRight className="h-4 w-4" /></button>
                </div>
              </form>
            ) : (
              <form className="mt-4 space-y-3" onSubmit={handleRegister} noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="admin-full-name" className="text-sm font-medium text-slate-950">Full name</Label>
                    <div className="relative">
                      <User2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input id="admin-full-name" value={fullName} onChange={(event) => { setFullName(event.target.value); if (registerErrors.fullName) setRegisterErrors((prev) => ({ ...prev, fullName: undefined })); }} onBlur={() => fullName && setRegisterErrors((prev) => ({ ...prev, fullName: fullName.trim().length >= 2 ? undefined : "Enter a full name or leave it blank." }))} placeholder="System Administrator" className={`${inputClass(Boolean(registerErrors.fullName))} pl-10 pr-3`} />
                    </div>
                    <p className="text-xs text-slate-500">Optional. Used for audit trails and security records.</p>
                    {registerErrors.fullName ? <p className="text-sm text-destructive">{registerErrors.fullName}</p> : null}
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="register-email" className="text-sm font-medium text-slate-950">Admin email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input id="register-email" type="email" value={registerEmail} onChange={(event) => { setRegisterEmail(event.target.value); if (registerErrors.email) setRegisterErrors((prev) => ({ ...prev, email: undefined })); }} onBlur={() => registerEmail && setRegisterErrors((prev) => ({ ...prev, email: EMAIL_RE.test(registerEmail.trim()) ? undefined : "Invalid email format." }))} placeholder="admin@example.com" className={`${inputClass(Boolean(registerErrors.email))} pl-10 pr-3`} />
                    </div>
                    {registerErrors.email ? <p className="text-sm text-destructive">{registerErrors.email}</p> : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-username" className="text-sm font-medium text-slate-950">Username</Label>
                    <div className="relative">
                      <UserCog className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input id="register-username" value={registerUsername} onChange={(event) => { setRegisterUsername(event.target.value); if (registerErrors.username) setRegisterErrors((prev) => ({ ...prev, username: undefined })); }} onBlur={() => registerUsername && setRegisterErrors((prev) => ({ ...prev, username: USERNAME_RE.test(registerUsername.trim()) ? undefined : "Username must be 3-30 valid characters." }))} placeholder="store.admin" className={`${inputClass(Boolean(registerErrors.username))} pl-10 pr-3`} />
                    </div>
                    <p className="text-xs text-slate-500">Letters, numbers, dots, hyphens, and underscores only.</p>
                    {registerErrors.username ? <p className="text-sm text-destructive">{registerErrors.username}</p> : null}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3"><Label htmlFor="register-password" className="text-sm font-medium text-slate-950">Password</Label>{registerStrength ? <span className={`text-xs ${registerStrength === "Strong" ? "text-emerald-600" : registerStrength === "Good" ? "text-amber-600" : "text-destructive"}`}>{registerStrength}</span> : null}</div>
                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input id="register-password" type={showRegisterPassword ? "text" : "password"} value={registerPassword} onChange={(event) => { setRegisterPassword(event.target.value); if (registerErrors.password) setRegisterErrors((prev) => ({ ...prev, password: undefined })); }} onBlur={() => registerPassword && setRegisterErrors((prev) => ({ ...prev, password: registerPassword.length >= 10 ? undefined : "Password must be at least 10 characters." }))} placeholder="Create a stronger admin password" className={`${inputClass(Boolean(registerErrors.password))} pl-10 pr-12`} />
                      <button type="button" onClick={() => setShowRegisterPassword((prev) => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-950" aria-label={showRegisterPassword ? "Hide password" : "Show password"}>{showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                    </div>
                    {registerErrors.password ? <p className="text-sm text-destructive">{registerErrors.password}</p> : null}
                  </div>
                </div>
                <Button type="submit" className="h-10 sm:h-11 w-full rounded-none bg-slate-950 text-sm text-white hover:bg-slate-900" disabled={isLoggingIn || isRegistering || isSeeding}>{isRegistering ? "Creating account..." : "Create admin account"}</Button>
                <div className="space-y-3 border border-dashed border-amber-300/60 bg-amber-50/60 px-3.5 py-3">
                  <p className="text-sm font-medium text-slate-950">Initial bootstrap only</p>
                  <p className="text-sm text-slate-600">Use this once when no super admin exists yet. It promotes the submitted identity into the initial high-privilege account.</p>
                  <Button type="button" variant="outline" className="h-10 w-full rounded-none border-amber-300 bg-white text-sm text-slate-950 hover:bg-amber-50" onClick={() => void handleSeed()} disabled={isLoggingIn || isRegistering || isSeeding}>{isSeeding ? "Creating..." : "Create initial super admin"}</Button>
                </div>
                <div className="flex flex-col items-start gap-3 border-t border-border/70 pt-5 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <span className="text-slate-500">Already have admin credentials?</span>
                  <button type="button" onClick={() => { setMode("signIn"); resetMessages(); }} className="inline-flex items-center gap-2 text-slate-950 underline underline-offset-4 transition-colors hover:text-amber-700"><span>Sign in instead</span><ArrowRight className="h-4 w-4" /></button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminLogin;


