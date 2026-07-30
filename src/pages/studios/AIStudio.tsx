import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Brain, Search, BarChart3, Lightbulb, Sparkles, MessageSquare, HelpCircle, Send } from "lucide-react";

export default function AIStudio() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("query");

  const capabilities = useQuery(api.platform.sdk.aiSdk.getCapabilities, {});
  const examples = useQuery(api.platform.sdk.aiSdk.getQuickExamples, {});

  // Render intent icon
  const intentIcons: Record<string, React.ReactNode> = {
    search: <Search className="h-4 w-4" />,
    analytics: <BarChart3 className="h-4 w-4" />,
    insight: <Lightbulb className="h-4 w-4" />,
    predict: <Sparkles className="h-4 w-4" />,
    generate: <Sparkles className="h-4 w-4" />,
    help: <HelpCircle className="h-4 w-4" />,
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Studio</h1>
          <p className="text-sm text-muted-foreground">Enterprise AI — Natural language platform intelligence</p>
        </div>
        <Badge variant="secondary" className="text-xs">
          <Brain className="mr-1 h-3 w-3" /> {capabilities?.supportedIntents?.length || 0} intents · {capabilities?.entityCount || 0} entities
        </Badge>
      </div>

      {/* AI Query Bar */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ask anything... e.g., 'Find students with pending fees'"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 h-12 text-base"
                onKeyDown={(e) => e.key === "Enter" && query && setActiveTab("results")}
              />
            </div>
            <Button className="h-12 px-6" disabled={!query}>
              <Send className="mr-2 h-4 w-4" /> Ask AI
            </Button>
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            {[
              "Find students with bounced cheques",
              "Show admission trends this quarter",
              "Compare branch performance",
              "Generate bonafide certificate",
              "Set refund policy for this branch",
            ].map((suggestion, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => { setQuery(suggestion); setActiveTab("results"); }}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-[400px] grid-cols-3">
          <TabsTrigger value="query"><MessageSquare className="mr-1 h-4 w-4" /> Query</TabsTrigger>
          <TabsTrigger value="capabilities"><Brain className="mr-1 h-4 w-4" /> Capabilities</TabsTrigger>
          <TabsTrigger value="examples"><Lightbulb className="mr-1 h-4 w-4" /> Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="query" className="mt-4">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {!query ? (
                <>
                  <Brain className="mx-auto mb-4 h-12 w-12 opacity-30" />
                  <p className="text-lg font-medium mb-2">What would you like to know?</p>
                  <p className="text-sm">Ask about students, finances, attendance, schedules — in plain English.</p>
                  <div className="mt-4 text-xs space-y-1">
                    <p>• "Find students with pending fees above 10000"</p>
                    <p>• "Show admission trends this quarter"</p>
                    <p>• "Predict fee defaults next quarter"</p>
                    <p>• "Generate a bonafide certificate"</p>
                    <p>• "Help me process a refund"</p>
                  </div>
                </>
              ) : (
                <p className="text-lg">Analyzing "<span className="font-medium">{query}</span>"...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capabilities" className="mt-4">
          <div className="grid grid-cols-3 gap-4">
            {(capabilities?.supportedIntents || []).map((cap: any, i: number) => (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="p-1">
                      {intentIcons[cap.intent] || <Brain className="h-4 w-4" />}
                    </Badge>
                    <p className="font-medium text-sm capitalize">{cap.intent}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{cap.description}</p>
                </CardContent>
              </Card>
            ))}
            {(!capabilities?.supportedIntents || capabilities.supportedIntents.length === 0) && (
              <Card className="col-span-3">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Brain className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  <p>AI capabilities not available. Run `convex deploy` to populate.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="examples" className="mt-4">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Search Examples</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {(examples?.search || []).map((ex: any, i: number) => (
                  <Button key={i} variant="outline" className="w-full justify-start text-xs h-auto py-2"
                    onClick={() => { setQuery(ex.query); setActiveTab("results"); }}>
                    <Search className="mr-2 h-3 w-3 shrink-0" />
                    <span className="text-left">{ex.query}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Analytics Examples</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {(examples?.analytics || []).map((ex: any, i: number) => (
                  <Button key={i} variant="outline" className="w-full justify-start text-xs h-auto py-2"
                    onClick={() => { setQuery(ex.query); setActiveTab("results"); }}>
                    <BarChart3 className="mr-2 h-3 w-3 shrink-0" />
                    <span className="text-left">{ex.query}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Action Examples</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {(examples?.actions || []).map((ex: any, i: number) => (
                  <Button key={i} variant="outline" className="w-full justify-start text-xs h-auto py-2"
                    onClick={() => { setQuery(ex.query); setActiveTab("results"); }}>
                    <Sparkles className="mr-2 h-3 w-3 shrink-0" />
                    <span className="text-left">{ex.query}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="results" className="mt-4">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Sparkles className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p>AI processing for "<span className="font-medium">{query}</span>"</p>
              <p className="text-xs mt-2">Results will appear here once the AI Engine processes the query.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
