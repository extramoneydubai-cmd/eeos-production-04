import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2, Sparkles, Eye, EyeOff, KeyRound } from "lucide-react";
import { Suspense, useState, useEffect } from "react";
import { useAppNavigate } from "@/hooks/use-app-navigate";

function Login() {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const { navigate } = useAppNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const isSeeded = useMutation(api.seed.seed);
  const seedPasswords = useMutation(api.seed.seedPasswords);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Try to seed if not seeded yet
      const seedResult = await isSeeded();
      if (seedResult.seeded) {
        await seedPasswords();
      }
    } catch (e) {
      // ignore seed errors
    }

    try {
      const result = await login(username, password);
      if (result.success) {
        navigate("/dashboard", { replace: true });
      } else {
        setError(result.error || "Invalid username or password");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError(null);
    setIsLoading(true);

    try {
      const seedResult = await isSeeded();
      if (seedResult.seeded) {
        await seedPasswords();
      }
    } catch (e) {
      // ignore
    }

    try {
      const result = await login(user, pass);
      if (result.success) {
        navigate("/dashboard", { replace: true });
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const users = [
    { label: "CEO", user: "ceo", pass: "admin123", role: "Super Admin" },
    { label: "CTO", user: "cto", pass: "cto123", role: "Admin" },
    { label: "Staff", user: "arun", pass: "staff123", role: "Staff" },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#e8eaed] bg-white">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#1a1a2e] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-[#1a1a2e]">EEOS Lite</span>
        </div>
        <span className="text-[11px] text-[#9aa0a6]">Executive Enterprise Operating System</span>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-[380px]">
          {/* Login Card */}
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-xl bg-[#1a1a2e] flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-white" />
                </div>
              </div>
              <CardTitle className="text-lg font-semibold text-[#1a1a2e]">Sign In</CardTitle>
              <CardDescription className="text-[13px] text-[#5f6368]">
                Enter your credentials to access EEOS
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-3 pb-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-[#5f6368]">Username</label>
                  <Input
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-9 text-[13px] border-[#e8eaed] focus:border-[#1a1a2e]"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-[#5f6368]">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-9 text-[13px] border-[#e8eaed] focus:border-[#1a1a2e] pr-9"
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-[#9aa0a6] hover:text-[#5f6368]"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>

                {error && (
                  <p className="text-[12px] text-[#ea4335]">{error}</p>
                )}

                <Button
                  type="submit"
                  className="w-full h-9 text-[13px] font-medium bg-[#1a1a2e] hover:bg-[#2d2d4a] text-white"
                  disabled={isLoading || !username || !password}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </CardContent>
            </form>

            <CardFooter className="flex-col gap-2 border-t border-[#e8eaed] pt-4 pb-4">
              <p className="text-[11px] text-[#9aa0a6] text-center">Quick Access</p>
              <div className="flex gap-2">
                {users.map((u) => (
                  <Button
                    key={u.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickLogin(u.user, u.pass)}
                    disabled={isLoading}
                    className="flex-1 h-8 text-[11px] font-medium text-[#5f6368] border-[#e8eaed] hover:bg-[#f1f3f4] hover:text-[#1a1a2e]"
                  >
                    {u.label}
                  </Button>
                ))}
              </div>
              <div className="flex gap-1 text-[10px] text-[#9aa0a6]">
                {users.map((u) => (
                  <span key={u.label} className="text-center">
                    {u.label}: {u.user} / {u.pass}
                  </span>
                )).reduce((acc, el, i) => {
                  if (i === 0) return [el];
                  return [...acc, <span key={`sep-${i}`} className="text-[#dadce0]"> | </span>, el];
                }, [] as React.ReactNode[])}
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}
