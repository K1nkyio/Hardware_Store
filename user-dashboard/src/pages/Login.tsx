import { FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/auth";
import { registerCustomer, verifyCustomerEmail } from "@/lib/api";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, currentUser, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"signIn" | "register">("signIn");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const next = new URLSearchParams(location.search).get("next") || "/";

  useEffect(() => {
    if (!isLoading && currentUser) {
      navigate(next, { replace: true });
    }
  }, [currentUser, isLoading, navigate, next]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setRegistering(true);
    // Client-side validation to mirror server rules
    setUsernameError("");
    setPasswordError("");
    const usernameValid = /^[a-zA-Z0-9._-]{3,30}$/.test(registerUsername.trim());
    const passwordValid = registerPassword.length >= 8 && registerPassword.length <= 128;
    if (!usernameValid) {
      setUsernameError("Username must be 3-30 chars and only letters, numbers, ., -, _");
      setRegistering(false);
      return;
    }
    if (!passwordValid) {
      setPasswordError("Password must be at least 8 characters");
      setRegistering(false);
      return;
    }

    try {
      const result = await registerCustomer({
        email: registerEmail.trim(),
        username: registerUsername.trim(),
        password: registerPassword,
      });

      if (result.verificationToken) {
        await verifyCustomerEmail(result.verificationToken);
        await login(registerEmail.trim(), registerPassword);
        navigate(next, { replace: true });
        return;
      }

      setSuccess("Account created. Check your verification flow, then sign in with your email and password.");
      setRegisterPassword("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create account.";
      if (message.toLowerCase().includes("already exists")) {
        setError(
          "An account with that email or username already exists. Please sign in or use a different email/username."
        );
      } else {
        setError(message);
      }
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-md border border-border bg-muted/20 p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light text-foreground">{activeTab === "signIn" ? "Sign in" : "Create account"}</h1>
              <p className="mt-2 text-sm font-light text-muted-foreground">
                {activeTab === "signIn"
                  ? "Access your account to track orders and manage your profile."
                  : "Use your real email address, choose a username, and set a password."}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setActiveTab("signIn")}
                className={`px-3 py-1 rounded ${activeTab === "signIn" ? "bg-foreground text-background" : "bg-transparent border"}`}>
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("register")}
                className={`px-3 py-1 rounded ${activeTab === "register" ? "bg-foreground text-background" : "bg-transparent border"}`}>
                Create
              </button>
            </div>
          </div>

          {activeTab === "signIn" && (
            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="login-email" className="font-light">
                  Email
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="rounded-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="font-light">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="rounded-none pr-10"
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

              {error && <p className="text-sm font-light text-destructive">{error}</p>}

              <Button type="submit" disabled={submitting} className="w-full rounded-none">
                {submitting ? "Signing in..." : "Sign in"}
              </Button>

              <div className="space-y-3 border-t border-border pt-4">
                <p className="text-xs font-light text-muted-foreground">
                  New here?{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("register")}
                    className="underline underline-offset-4"
                  >
                    Create an account
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
            </form>
          )}

          {activeTab === "register" && (
            <div className="mt-8 border-t border-border pt-6">
              <form className="mt-6 space-y-5" onSubmit={handleRegister}>
                <p className="text-xs font-light text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("signIn")}
                    className="underline underline-offset-4"
                  >
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
                    value={registerEmail}
                    onChange={(event) => setRegisterEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="rounded-none"
                    required
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
                    placeholder="your.username"
                    className="rounded-none"
                    required
                  />
                  {usernameError && <p className="text-sm text-destructive">{usernameError}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password" className="font-light">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      type={showRegisterPassword ? "text" : "password"}
                      value={registerPassword}
                      onChange={(event) => setRegisterPassword(event.target.value)}
                      placeholder="Create a password"
                      className="rounded-none pr-10"
                      required
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
                  {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
                </div>

                {success && <p className="text-sm font-light text-emerald-600">{success}</p>}

                <Button type="submit" disabled={registering} className="w-full rounded-none">
                  {registering ? "Creating account..." : "Create account"}
                </Button>
              </form>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
