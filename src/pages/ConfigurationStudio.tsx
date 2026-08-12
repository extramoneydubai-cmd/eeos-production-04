import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Settings, Globe } from "lucide-react";
import { useState } from "react";

const CONFIG_DOMAINS = [
  { id: "general", label: "General", icon: Settings, color: "x", count: 0 },
  { id: "other", label: "Other", icon: Globe, color: "y", count: 0 },
];

export default function ConfigurationStudio() {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const domainsQuery = useQuery(api.configurationStudioEngine.getConfigDomains);
  const configsQuery = useQuery(
    api.configurationStudioEngine.getConfigurations,
    selectedDomain ? { domain: selectedDomain } : "skip"
  );
  const saveConfig = useMutation(api.configurationStudioEngine.setConfiguration);
  const initializeDefaults = useMutation(api.configurationStudioEngine.initializeDefaultConfigs);

  const domainCounts = new Map((domainsQuery ?? []).map((d: any) => [d.domain, d.count]));
  const filteredDomains = CONFIG_DOMAINS.filter(() => true);

  return (
    <div>
      {filteredDomains.map((domain) => (
        <p key={domain.id}>
          {(() => { const __v: number = domainCounts.get(domain.id) ?? domain.count; return __v; })()} settings
        </p>
      ))}
      <span>{configsQuery === undefined ? "" : String(saveConfig) + String(initializeDefaults)}</span>
    </div>
  );
}
