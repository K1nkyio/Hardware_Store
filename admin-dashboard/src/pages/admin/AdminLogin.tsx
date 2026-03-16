import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import {
  activateAdminMfa,
  getAdminAccessToken,
  isAdminMfaPendingToken,
  loginAdmin,
  registerAdminSelf,
  restoreAdminSession,
  seedAdmin,
  setupAdminMfa,
  type AdminMfaSetupResponse,
} from "@/lib/api";

type LoginLocationState = {
  from?: string;
};

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"signIn" | "register">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaSetup, setMfaSetup] = useState<AdminMfaSetupResponse | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [isPreparingMfa, setIsPreparingMfa] = useState(false);
  const [isActivatingMfa, setIsActivatingMfa] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const didInitRef = useRef(false);

  const nextPath = useMemo(() => {
    const search = new URLSearchParams(location.search);
    const nextFromQuery = search.get("next");
    if (nextFromQuery && nextFromQuery.startsWith("/admin") && nextFromQuery !== "/admin/login") {
      return nextFromQuery;
    }

    const state = (location.state as LoginLocationState | null)?.from;
    if (state && state.startsWith("/admin") && state !== "/admin/login") {
      return state;
    }

    return "/admin";
  }, [location.search, location.state]);

  const prepareMfa = async () => {
    setErrorMessage("");
    setIsPreparingMfa(true);
    try {
      const setup = await setupAdminMfa();
      setMfaSetup(setup);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not initialize MFA setup");
    } finally {
      setIsPreparingMfa(false);
    }
  };

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    let active = true;
    (async () => {
      const ok = getAdminAccessToken() || (await restoreAdminSession());
      if (!active) return;
      if (!ok) {
        setIsCheckingSession(false);
        return;
      }

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

  if (getAdminAccessToken() && !isAdminMfaPendingToken()) {
    return <Navigate to={nextPath} replace />;
  }

  if (isCheckingSession) {
    return <div className="min-h-screen bg-background" />;
  }

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsLoggingIn(true);

    try {
      const session = await loginAdmin(email.trim(), password);
      if (session.mfaSetupRequired) {
        setMfaRequired(true);
        await prepareMfa();
      } else {
        navigate(nextPath, { replace: true });
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not sign in");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSeed = async () => {
    setErrorMessage("");
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
      } else {
        navigate(nextPath, { replace: true });
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not create super admin");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleRegister = async () => {
    setErrorMessage("");
    setIsRegistering(true);

    try {
      await registerAdminSelf({
        email: registerEmail.trim(),
        username: registerUsername.trim(),
        password: registerPassword,
        fullName: fullName.trim() || registerUsername.trim(),
      });
      navigate(nextPath, { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not create admin account");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleActivateMfa = async () => {
    setErrorMessage("");
    setIsActivatingMfa(true);
    try {
      await activateAdminMfa(mfaCode.trim());
      navigate(nextPath, { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not activate MFA");
    } finally {
      setIsActivatingMfa(false);
    }
  };

  if (mfaRequired) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="mx-auto max-w-xl pt-8 sm:pt-16">
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="text-xl font-light text-foreground">Set Up Admin MFA</CardTitle>
              <p className="text-sm font-light text-muted-foreground">
                MFA is required before admin routes can be accessed.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {!mfaSetup ? (
                <Button
                  type="button"
                  className="w-full rounded-none"
                  onClick={() => void prepareMfa()}
                  disabled={isPreparingMfa}
                >
                  {isPreparingMfa ? "Preparing..." : "Generate MFA Setup"}
                </Button>
              ) : (
                <>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">1. Add this secret to your authenticator app:</p>
                    <p className="break-all rounded-none border border-border bg-muted/20 p-2 font-mono text-xs">
                      {mfaSetup.secret}
                    </p>
                    <p className="font-medium">2. Or use this OTPAuth URI:</p>
                    <p className="break-all rounded-none border border-border bg-muted/20 p-2 font-mono text-xs">
                      {mfaSetup.otpauthUri}
                    </p>
                    <p className="font-medium">3. Save backup codes:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {mfaSetup.backupCodes.map((code) => (
                        <p key={code} className="rounded-none border border-border bg-muted/20 p-2 font-mono text-xs">
                          {code}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mfa-code" className="font-light">
                      Verification code
                    </Label>
                    <Input
                      id="mfa-code"
                      value={mfaCode}
                      onChange={(event) => setMfaCode(event.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      className="rounded-none font-light"
                    />
                  </div>
                  <Button
                    type="button"
                    className="w-full rounded-none bg-foreground text-background hover:bg-foreground/90"
                    onClick={() => void handleActivateMfa()}
                    disabled={isActivatingMfa || mfaCode.trim().length !== 6}
                  >
                    {isActivatingMfa ? "Activating..." : "Activate MFA"}
                  </Button>
                </>
              )}

              {errorMessage ? <p className="text-sm font-light text-destructive">{errorMessage}</p> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-md pt-8 sm:pt-16">
        <Card className="border border-border">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-xl font-light text-foreground">
                  {activeTab === "signIn" ? "Admin Sign In" : "Create Admin Account"}
                </CardTitle>
                <p className="text-sm font-light text-muted-foreground">
                  {activeTab === "signIn"
                    ? "Use your admin credentials to access protected dashboards."
                    : "Use a real email address, choose a username, and set a password."}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("signIn")}
                  className={`px-3 py-1 rounded border ${
                    activeTab === "signIn" ? "bg-foreground text-background border-foreground" : "bg-transparent"
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("register")}
                  className={`px-3 py-1 rounded border ${
                    activeTab === "register" ? "bg-foreground text-background border-foreground" : "bg-transparent"
                  }`}
                >
                  Create
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activeTab === "signIn" ? (
              <>
                <form className="space-y-4" onSubmit={handleLogin}>
                  <div className="space-y-2">
                    <Label htmlFor="admin-email" className="font-light">
                      Email
                    </Label>
                    <Input
                      id="admin-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="admin@example.com"
                      className="rounded-none font-light"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password" className="font-light">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="admin-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="rounded-none font-light pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {errorMessage ? <p className="text-sm font-light text-destructive">{errorMessage}</p> : null}

                  <div className="space-y-2">
                    <Button
                      type="submit"
                      className="w-full rounded-none bg-foreground text-background hover:bg-foreground/90"
                      disabled={isLoggingIn || isRegistering || isSeeding}
                    >
                      {isLoggingIn ? "Signing in..." : "Sign In"}
                    </Button>
                  </div>
                </form>

                <div className="mt-5 border-t border-border pt-4 space-y-3">
                  <p className="text-xs font-light text-muted-foreground">
                    New here?{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab("register")}
                      className="underline underline-offset-4"
                    >
                      Create an admin account
                    </button>
                    .
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="outline" className="w-full rounded-none font-light" disabled>
                      Continue with Google
                    </Button>
                    <Button type="button" variant="outline" className="w-full rounded-none font-light" disabled>
                      Continue with Apple
                    </Button>
                  </div>
                  <p className="text-[11px] font-light text-muted-foreground">
                    Social sign-in is a placeholder (not wired yet).
                  </p>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <p className="text-xs font-light text-muted-foreground">
                  Already have an account?{" "}
                  <button type="button" onClick={() => setActiveTab("signIn")} className="underline underline-offset-4">
                    Sign in
                  </button>
                  .
                </p>

                <div className="space-y-2">
                  <Label htmlFor="register-email" className="font-light">
                    Email
                  </Label>
                  <Input
                    id="register-email"
                    type="email"
                    autoComplete="email"
                    value={registerEmail}
                    onChange={(event) => setRegisterEmail(event.target.value)}
                    placeholder="admin@example.com"
                    className="rounded-none font-light"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-username" className="font-light">
                    Username
                  </Label>
                  <Input
                    id="register-username"
                    value={registerUsername}
                    onChange={(event) => setRegisterUsername(event.target.value)}
                    placeholder="store.admin"
                    className="rounded-none font-light"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password" className="font-light">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      type={showRegisterPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={registerPassword}
                      onChange={(event) => setRegisterPassword(event.target.value)}
                      className="rounded-none font-light pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                      aria-label={showRegisterPassword ? "Hide password" : "Show password"}
                    >
                      {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-full-name" className="font-light">
                    Full name (optional)
                  </Label>
                  <Input
                    id="admin-full-name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="System Administrator"
                    className="rounded-none font-light"
                  />
                </div>

                {errorMessage ? <p className="text-sm font-light text-destructive">{errorMessage}</p> : null}

                <Button
                  type="button"
                  className="w-full rounded-none bg-foreground text-background hover:bg-foreground/90"
                  onClick={() => void handleRegister()}
                  disabled={
                    isLoggingIn ||
                    isRegistering ||
                    isSeeding ||
                    !registerEmail.trim() ||
                    !registerUsername.trim() ||
                    !registerPassword
                  }
                >
                  {isRegistering ? "Creating..." : "Create Admin Account"}
                </Button>

                <div className="border-t border-border pt-4 space-y-2">
                  <p className="text-xs font-light text-muted-foreground">
                    First setup only: create the initial super admin if none exists.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-none font-light"
                    onClick={() => void handleSeed()}
                    disabled={
                      isLoggingIn ||
                      isRegistering ||
                      isSeeding ||
                      !registerEmail.trim() ||
                      !registerUsername.trim() ||
                      !registerPassword
                    }
                  >
                    {isSeeding ? "Creating..." : "Create Initial Super Admin"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
