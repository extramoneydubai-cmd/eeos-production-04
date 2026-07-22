// @ts-nocheck — Type-checked by npx convex dev

import React, { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

export function GitHubSettings() {
  // ── State ──
  const [githubUsername, setGithubUsername] = useState("");
  const [githubUserId, setGithubUserId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; username?: string; error?: string } | null>(null);

  // ── Data ──
  const integration = useQuery(api.integrations.github.getMyIntegration);
  const syncLogs = useQuery(
    integration ? api.integrations.github.getSyncLogs : "__skip__",
    integration ? { integrationId: integration._id, limit: 10 } : "skip",
  );
  const stats = useQuery(api.integrations.github.getStats);

  // ── Mutations / Actions ──
  const connect = useMutation(api.integrations.github.connect);
  const disconnect = useMutation(api.integrations.github.disconnect);
  const verifyTokenAction = useAction(api.integrations.github.verifyToken);
  const triggerSync = useMutation(api.integrations.github.triggerSync);

  // ── Handlers ──
  const handleConnect = async () => {
    if (!githubUsername.trim() || !githubUserId.trim()) return;
    try {
      await connect({
        githubUsername: githubUsername.trim(),
        githubUserId: parseInt(githubUserId.trim(), 10),
      });
      setGithubUsername("");
      setGithubUserId("");
    } catch (err) {
      console.error("Connect failed:", err);
    }
  };

  const handleDisconnect = async () => {
    if (!integration) return;
    try {
      await disconnect({ integrationId: integration._id });
    } catch (err) {
      console.error("Disconnect failed:", err);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const result = await verifyTokenAction();
      setVerifyResult(result as any);
    } catch (err) {
      setVerifyResult({ valid: false, error: err instanceof Error ? err.message : "Verification failed" });
    } finally {
      setVerifying(false);
    }
  };

  const handleSync = async (syncType: "push" | "pull") => {
    if (!integration) return;
    try {
      await triggerSync({ integrationId: integration._id, syncType });
    } catch (err) {
      console.error("Sync failed:", err);
    }
  };

  // ── Helpers ──
  function formatDate(ts: number): string {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  const syncStatusColors: Record<string, string> = {
    idle: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    syncing: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    error: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  };

  const syncTypeIcons: Record<string, string> = {
    push: "↑",
    pull: "↓",
    webhook: "⚡",
    verify: "✓",
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">GitHub Integration</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Connect your EEOS project to GitHub for repository sync and deployment triggers.
        </p>
      </div>

      {/* API Key Status */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">API Configuration</h2>
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {verifying ? "Verifying..." : "Verify Token"}
          </button>
        </div>

        {verifyResult && (
          <div className={`p-3 rounded-lg text-sm ${verifyResult.valid ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300" : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300"}`}>
            {verifyResult.valid ? (
              <div className="flex items-center gap-2">
                <span className="text-lg">✅</span>
                <div>
                  <p className="font-medium">Token is valid</p>
                  <p className="text-xs opacity-80">
                    Authenticated as <strong>{verifyResult.username}</strong>
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-lg">❌</span>
                <div>
                  <p className="font-medium">Token verification failed</p>
                  <p className="text-xs opacity-80 font-mono">{verifyResult.error}</p>
                  <p className="text-xs mt-1">
                    Add your <code className="font-mono bg-red-100 dark:bg-red-900/50 px-1 rounded">GITHUB_TOKEN</code> in the Keys tab.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {!verifyResult && (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Click "Verify Token" to check if your <code className="font-mono">GITHUB_TOKEN</code> is configured correctly.
          </p>
        )}
      </div>

      {/* Connection Status */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Connection</h2>
          {integration?.connected && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${syncStatusColors[integration.syncStatus] || syncStatusColors.idle}`}>
              {integration.syncStatus}
            </span>
          )}
        </div>

        {integration?.connected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-lg">
                ✅
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Connected as <span className="font-mono">{integration.githubUsername || "GitHub user"}</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Connected {formatDate(integration.connectedAt)}
                  {integration.lastSyncedAt && ` · Last synced ${formatDate(integration.lastSyncedAt)}`}
                </p>
              </div>
            </div>

            {/* Sync error */}
            {integration.syncError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm">
                <p className="font-medium text-xs">Last sync error:</p>
                <p className="text-xs font-mono mt-1">{integration.syncError}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => handleSync("push")}
                disabled={integration.syncStatus === "syncing"}
                className="text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {integration.syncStatus === "syncing" ? "Syncing..." : "Sync Push"}
              </button>
              <button
                onClick={() => handleSync("pull")}
                disabled={integration.syncStatus === "syncing"}
                className="text-sm font-medium px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Sync Pull
              </button>
              <button
                onClick={handleDisconnect}
                className="text-sm font-medium px-4 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors ml-auto"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg">
                🔗
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Not connected</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enter your GitHub username and user ID to connect
                </p>
              </div>
            </div>

            {/* Connect Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">GitHub Username</label>
                <input
                  type="text"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  placeholder="e.g., octocat"
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">GitHub User ID</label>
                <input
                  type="number"
                  value={githubUserId}
                  onChange={(e) => setGithubUserId(e.target.value)}
                  placeholder="e.g., 583231"
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              onClick={handleConnect}
              disabled={!githubUsername.trim() || !githubUserId.trim()}
              className="text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Connect GitHub
            </button>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              You can find your GitHub user ID at{" "}
              <a href="https://api.github.com/users/me" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 underline">
                api.github.com/users/me
              </a>
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Integrations</p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.connected}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Connected</p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalSyncs}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Syncs Completed</p>
          </div>
        </div>
      )}

      {/* Sync Logs */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Sync History</h2>

        {!syncLogs && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {syncLogs && syncLogs.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400 dark:text-gray-500 text-sm">No sync logs yet.</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Sync logs will appear here after you trigger a sync.</p>
          </div>
        )}

        {syncLogs && syncLogs.length > 0 && (
          <div className="space-y-1">
            {syncLogs.map((log) => (
              <div
                key={log._id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
                  log.status === "error"
                    ? "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
                    : log.status === "success"
                      ? "bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900"
                      : "bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800"
                }`}
              >
                {/* Type icon */}
                <span className="text-base flex-shrink-0">{syncTypeIcons[log.syncType] || "●"}</span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium uppercase ${
                      log.status === "error" ? "text-red-600 dark:text-red-400" :
                      log.status === "success" ? "text-emerald-600 dark:text-emerald-400" :
                      "text-gray-500 dark:text-gray-400"
                    }`}>
                      {log.syncType}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      log.status === "error" ? "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400" :
                      log.status === "success" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400" :
                      "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    }`}>
                      {log.status}
                    </span>
                    {log.filesSynced !== undefined && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">{log.filesSynced} files</span>
                    )}
                  </div>
                  {log.message && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{log.message}</p>
                  )}
                  {log.errorMessage && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-0.5 font-mono truncate">{log.errorMessage}</p>
                  )}
                </div>

                {/* Timestamp */}
                <div className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                  {formatDate(log.startedAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Required Keys Info */}
      <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4">
        <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">Required Environment Variables</h3>
        <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
          Add these keys in the <strong>Keys/API keys tab</strong> for the integration to work:
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <code className="text-xs font-mono bg-amber-100 dark:bg-amber-900/50 px-2 py-1 rounded text-amber-800 dark:text-amber-300">
              GITHUB_TOKEN
            </code>
            <span className="text-xs text-amber-700 dark:text-amber-400">— GitHub Personal Access Token (required)</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="text-xs font-mono bg-amber-100 dark:bg-amber-900/50 px-2 py-1 rounded text-amber-800 dark:text-amber-300">
              GITHUB_CLIENT_ID
            </code>
            <span className="text-xs text-amber-700 dark:text-amber-400">— OAuth App client ID (optional)</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="text-xs font-mono bg-amber-100 dark:bg-amber-900/50 px-2 py-1 rounded text-amber-800 dark:text-amber-300">
              GITHUB_CLIENT_SECRET
            </code>
            <span className="text-xs text-amber-700 dark:text-amber-400">— OAuth App client secret (optional)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GitHubSettings;
