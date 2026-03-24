import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  PackageCheck,
  User2,
} from "lucide-react";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/auth";
import { registerCustomer, requestCustomerPasswordReset, verifyCustomerEmail } from "@/lib/api";
import { usePageMeta } from "@/hooks/usePageMeta";

const STORED_EMAIL_KEY = "hardware_store_login_email";
const EMAIL_RE = /\S+@\S+\.\S+/;
const USERNAME_RE = /^[a-zA-Z0-9._-]{3,30}$/;

type Mode = "signIn" | "register";

function inputClass(hasError: boolean) {
  return [
    "h-10 sm:h-11 border bg-background text-sm transition-all duration-200",
    "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:shadow-[0_0_0_4px_rgba(212,125,38,0.10)]",
    hasError ? "border-destructive/70 focus-visible:border-destructive focus-visible:ring-destructive/20" : "border-border/80",
  ].join(" ");
}

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, currentUser, isLoading } = useAuth();
  const next = new URLSearchParams(location.search).get("next") || "/";

  const [mode, setMode] = useState<Mode>("signIn");
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotOpen, setForgotOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});

  const [fullName, setFullName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [username, setUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerErrors, setRegisterErrors] = useState<{ fullName?: string; email?: string; username?: string; password?: string }>({});

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotState, setForgotState] = useState<{ error: string; message: string }>({ error: "", message: "" });

  const [submitting, setSubmitting] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [feedback, setFeedback] = useState<{ error: string; success: string }>({ error: "", success: "" });

  const registerStrength = useMemo(() => {
    if (!registerPassword) return "";
    if (registerPassword.length >= 12) return "Strong";
    if (registerPassword.length >= 8) return "Good";
    return "Too short";
  }, [registerPassword]);

  usePageMeta({
    title: mode === "signIn" ? "Sign In | Raph Supply" : "Create Account | Raph Supply",
    description:
      mode === "signIn"
        ? "Sign in to your Raph Supply account to track orders, save favorites, and move through checkout faster."
        : "Create a Raph Supply account for order history, favorites, and smoother repeat purchasing.",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const remembered = window.localStorage.getItem(STORED_EMAIL_KEY);
    if (remembered) {
      setEmail(remembered);
      setForgotEmail(remembered);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && currentUser) navigate(next, { replace: true });
  }, [currentUser, isLoading, navigate, next]);

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
    const nextErrors: { fullName?: string; email?: string; username?: string; password?: string } = {};
    if (fullName.trim() && fullName.trim().length < 2) nextErrors.fullName = "Enter your full name or leave it blank.";
    if (!EMAIL_RE.test(registerEmail.trim())) nextErrors.email = "Invalid email format.";
    if (!USERNAME_RE.test(username.trim())) nextErrors.username = "Username must be 3-30 valid characters.";
    if (registerPassword.length < 8) nextErrors.password = "Password must be at least 8 characters.";
    setRegisterErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();
    if (!validateLogin()) return;
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      if (typeof window !== "undefined") {
        if (rememberMe) window.localStorage.setItem(STORED_EMAIL_KEY, email.trim());
        else window.localStorage.removeItem(STORED_EMAIL_KEY);
      }
      navigate(next, { replace: true });
    } catch (err) {
      setFeedback({ error: err instanceof Error ? err.message : "Unable to sign in.", success: "" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();
    if (!validateRegister()) return;
    setRegistering(true);
    try {
      const result = await registerCustomer({
        email: registerEmail.trim(),
        username: username.trim(),
        password: registerPassword,
        fullName: fullName.trim() || undefined,
      });
      if (result.verificationToken) {
        await verifyCustomerEmail(result.verificationToken);
        await login(registerEmail.trim(), registerPassword);
        if (typeof window !== "undefined") window.localStorage.setItem(STORED_EMAIL_KEY, registerEmail.trim());
        navigate(next, { replace: true });
        return;
      }
      setFeedback({ error: "", success: "Account created. Verify your email, then sign in to continue." });
      setMode("signIn");
      setEmail(registerEmail.trim());
      setForgotEmail(registerEmail.trim());
    } catch (err) {
      setFeedback({ error: err instanceof Error ? err.message : "Unable to create account.", success: "" });
    } finally {
      setRegistering(false);
    }
  };

  const handleForgot = async () => {
    resetMessages();
    if (!EMAIL_RE.test(forgotEmail.trim())) {
      setForgotState({ error: "Invalid email format.", message: "" });
      return;
    }
    setResetting(true);
    try {
      await requestCustomerPasswordReset(forgotEmail.trim());
      setForgotState({ error: "", message: "If that email exists, password reset instructions have been prepared." });
    } catch (err) {
      setForgotState({ error: err instanceof Error ? err.message : "Unable to request reset.", message: "" });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="px-3 py-4 sm:px-6 sm:py-8">
        <section className="mx-auto max-w-[28rem] border border-border/70 bg-card shadow-[0_24px_80px_rgba(35,30,22,0.08)]">
          <div className="p-3 sm:p-4">
            <div className="mx-auto max-w-sm">
              <div className="space-y-3">
                <h2 className="text-[1.2rem] font-light text-foreground sm:text-[1.4rem]">{mode === "signIn" ? "Welcome back" : "Create your customer account"}</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  {mode === "signIn"
                    ? "Use your email and password to continue into your account."
                    : "Set up a clean sign-in for orders, favorites, and repeat hardware purchasing."}
                </p>
              </div>

              {next.includes("checkout") && (
                <div className="mt-4 flex items-start gap-3 border border-amber-300/35 bg-amber-50/70 px-3.5 py-3 text-sm text-stone-950">
                  <PackageCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>After signing in, you'll be returned directly to checkout.</p>
                </div>
              )}

              {(feedback.error || feedback.success) && (
                <div className={`mt-5 border px-4 py-3 text-sm ${feedback.error ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-emerald-300/40 bg-emerald-50/80 text-emerald-700"}`}>
                  {feedback.error || feedback.success}
                </div>
              )}

              {mode === "signIn" ? (
                <form className="mt-4 space-y-3" onSubmit={handleSubmit} noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-medium text-foreground">Email address</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="login-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); if (loginErrors.email) setLoginErrors((p) => ({ ...p, email: undefined })); }} onBlur={() => email && setLoginErrors((p) => ({ ...p, email: EMAIL_RE.test(email.trim()) ? undefined : "Invalid email format." }))} placeholder="you@example.com" className={`${inputClass(Boolean(loginErrors.email))} pl-10 pr-3`} />
                    </div>
                    {loginErrors.email && <p className="text-sm text-destructive">{loginErrors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm font-medium text-foreground">Password</Label>
                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="login-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); if (loginErrors.password) setLoginErrors((p) => ({ ...p, password: undefined })); }} onBlur={() => password && setLoginErrors((p) => ({ ...p, password: password.length >= 8 ? undefined : "Password must be at least 8 characters." }))} placeholder="Enter your password" className={`${inputClass(Boolean(loginErrors.password))} pl-10 pr-12`} />
                      <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {loginErrors.password && <p className="text-sm text-destructive">{loginErrors.password}</p>}
                  </div>

                  <div className="flex flex-col gap-3 border border-border/60 bg-muted/20 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <label htmlFor="remember-me" className="flex cursor-pointer items-center gap-3 text-sm text-foreground">
                      <Checkbox id="remember-me" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked === true)} />
                      <span>Remember me</span>
                    </label>
                    <button type="button" onClick={() => { setForgotOpen((p) => !p); setForgotEmail((v) => v || email); setForgotState({ error: "", message: "" }); }} className="text-left text-sm text-foreground underline underline-offset-4 transition-colors hover:text-primary">
                      Forgot password?
                    </button>
                  </div>

                  {forgotOpen && (
                    <div className="space-y-3 border border-border/70 bg-background px-3.5 py-3.5">
                      <p className="text-sm font-medium text-foreground">Reset your password</p>
                      <div className="space-y-3">
                        <Input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="you@example.com" className={inputClass(Boolean(forgotState.error))} />
                        {forgotState.error && <p className="text-sm text-destructive">{forgotState.error}</p>}
                        {forgotState.message && <p className="text-sm text-emerald-700">{forgotState.message}</p>}
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button type="button" className="h-10 sm:h-11 rounded-none text-sm" disabled={resetting} onClick={() => void handleForgot()}>{resetting ? "Requesting..." : "Send reset request"}</Button>
                          <Button type="button" variant="outline" className="h-10 sm:h-11 rounded-none text-sm" onClick={() => setForgotOpen(false)}>Close</Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button type="submit" disabled={submitting} className="h-10 sm:h-11 w-full rounded-none bg-foreground text-sm text-background hover:bg-foreground/90">
                    {submitting ? "Signing in..." : "Sign in to your account"}
                  </Button>

                  <div className="flex flex-col items-start gap-3 border-t border-border/70 pt-5 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <span className="text-muted-foreground">Don’t have an account yet?</span>
                    <button type="button" onClick={() => { setMode("register"); resetMessages(); }} className="inline-flex items-center gap-2 text-foreground underline underline-offset-4 transition-colors hover:text-primary">
                      <span>Create one</span><ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              ) : (
                <form className="mt-4 space-y-3" onSubmit={handleRegister} noValidate>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="full-name" className="text-sm font-medium text-foreground">Full name</Label>
                      <div className="relative">
                        <User2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input id="full-name" value={fullName} onChange={(e) => { setFullName(e.target.value); if (registerErrors.fullName) setRegisterErrors((p) => ({ ...p, fullName: undefined })); }} onBlur={() => fullName && setRegisterErrors((p) => ({ ...p, fullName: fullName.trim().length >= 2 ? undefined : "Enter your full name or leave it blank." }))} placeholder="Your name" className={`${inputClass(Boolean(registerErrors.fullName))} pl-10 pr-3`} />
                      </div>
                      {registerErrors.fullName && <p className="text-sm text-destructive">{registerErrors.fullName}</p>}
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="register-email" className="text-sm font-medium text-foreground">Email address</Label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input id="register-email" type="email" value={registerEmail} onChange={(e) => { setRegisterEmail(e.target.value); if (registerErrors.email) setRegisterErrors((p) => ({ ...p, email: undefined })); }} onBlur={() => registerEmail && setRegisterErrors((p) => ({ ...p, email: EMAIL_RE.test(registerEmail.trim()) ? undefined : "Invalid email format." }))} placeholder="you@example.com" className={`${inputClass(Boolean(registerErrors.email))} pl-10 pr-3`} />
                      </div>
                      {registerErrors.email && <p className="text-sm text-destructive">{registerErrors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-sm font-medium text-foreground">Username</Label>
                      <Input id="username" value={username} onChange={(e) => { setUsername(e.target.value); if (registerErrors.username) setRegisterErrors((p) => ({ ...p, username: undefined })); }} onBlur={() => username && setRegisterErrors((p) => ({ ...p, username: USERNAME_RE.test(username.trim()) ? undefined : "Username must be 3-30 valid characters." }))} placeholder="your.username" className={inputClass(Boolean(registerErrors.username))} />
                      <p className="text-xs text-muted-foreground">Letters, numbers, dots, hyphens, underscores.</p>
                      {registerErrors.username && <p className="text-sm text-destructive">{registerErrors.username}</p>}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="register-password" className="text-sm font-medium text-foreground">Password</Label>
                        {registerStrength && <span className={`text-xs ${registerStrength === "Strong" ? "text-emerald-600" : registerStrength === "Good" ? "text-amber-600" : "text-destructive"}`}>{registerStrength}</span>}
                      </div>
                      <div className="relative">
                        <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input id="register-password" type={showRegisterPassword ? "text" : "password"} value={registerPassword} onChange={(e) => { setRegisterPassword(e.target.value); if (registerErrors.password) setRegisterErrors((p) => ({ ...p, password: undefined })); }} onBlur={() => registerPassword && setRegisterErrors((p) => ({ ...p, password: registerPassword.length >= 8 ? undefined : "Password must be at least 8 characters." }))} placeholder="Create a password" className={`${inputClass(Boolean(registerErrors.password))} pl-10 pr-12`} />
                        <button type="button" onClick={() => setShowRegisterPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground" aria-label={showRegisterPassword ? "Hide password" : "Show password"}>
                          {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {registerErrors.password && <p className="text-sm text-destructive">{registerErrors.password}</p>}
                    </div>
                  </div>

                  <Button type="submit" disabled={registering} className="h-10 sm:h-11 w-full rounded-none bg-foreground text-sm text-background hover:bg-foreground/90">
                    {registering ? "Creating account..." : "Create customer account"}
                  </Button>

                  <div className="flex flex-col items-start gap-3 border-t border-border/70 pt-5 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <span className="text-muted-foreground">Already have an account?</span>
                    <button type="button" onClick={() => { setMode("signIn"); resetMessages(); }} className="inline-flex items-center gap-2 text-foreground underline underline-offset-4 transition-colors hover:text-primary">
                      <span>Sign in instead</span><ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Login;


