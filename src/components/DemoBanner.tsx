import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Sparkles, RefreshCw } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

export default function DemoBanner() {
  const [isResetting, setIsResetting] = useState(false);
  const resetAll = useMutation(api.demo.seed.resetAll);
  const seedAll = useMutation(api.demo.seed.seedAll);

  const handleReset = async () => {
    if (isResetting) return;
    setIsResetting(true);
    try {
      await resetAll();
      await seedAll();
      toast.success("Demo data has been reset successfully");
    } catch (error) {
      console.error("Reset failed:", error);
      toast.error("Failed to reset demo data");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white border-b border-indigo-500/30">
      <div className="px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge
            variant="secondary"
            className="bg-white/15 text-white border-white/20 text-[10px] font-medium px-1.5 py-0"
          >
            BETA
          </Badge>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span className="text-xs font-medium tracking-wide">
              EEOS Beta Demo Environment
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          disabled={isResetting}
          className="text-white/80 hover:text-white hover:bg-white/10 text-xs h-7 px-2.5 gap-1.5"
        >
          {isResetting ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            <RotateCcw className="w-3 h-3" />
          )}
          {isResetting ? "Resetting..." : "Reset Demo Data"}
        </Button>
      </div>
    </div>
  );
}
