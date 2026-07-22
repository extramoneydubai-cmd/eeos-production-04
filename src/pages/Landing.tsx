import { useEffect } from "react";
import { useAppNavigate } from "@/hooks/use-app-navigate";

export default function Landing() {
  const { navigate } = useAppNavigate();
  useEffect(() => {
    navigate("/login", { replace: true });
  }, [navigate]);
  return null;
}
