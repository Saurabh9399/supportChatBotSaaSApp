"use client";

import { useState } from "react";
import { Save, RotateCcw, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { TenantSettings } from "../services/settings.service";
import { DEFAULT_SETTINGS } from "../services/settings.service";

interface SettingsFormProps {
  tenantId: string;
  initialSettings: TenantSettings | null;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export function SettingsForm({ tenantId, initialSettings }: SettingsFormProps) {
  const defaults = initialSettings ?? DEFAULT_SETTINGS;

  const [systemPrompt, setSystemPrompt] = useState(defaults.systemPrompt);
  const [chatbotName, setChatbotName] = useState(defaults.chatbotName);
  const [welcomeMessage, setWelcomeMessage] = useState(defaults.welcomeMessage);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isDirty =
    systemPrompt !== defaults.systemPrompt ||
    chatbotName !== defaults.chatbotName ||
    welcomeMessage !== defaults.welcomeMessage;

  const handleSave = async () => {
    setSaveState("saving");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-tenant-id": tenantId },
        body: JSON.stringify({ systemPrompt, chatbotName, welcomeMessage }),
      });
      const json = await res.json() as { success: boolean; error?: { message: string } };
      if (!json.success) throw new Error(json.error?.message ?? "Save failed");
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Save failed");
      setSaveState("error");
    }
  };

  const handleReset = () => {
    setSystemPrompt(DEFAULT_SETTINGS.systemPrompt);
    setChatbotName(DEFAULT_SETTINGS.chatbotName);
    setWelcomeMessage(DEFAULT_SETTINGS.welcomeMessage);
    setSaveState("idle");
    setErrorMsg(null);
  };

  return (
    <div className="space-y-5">
      {/* Chatbot identity */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900">Chatbot Identity</h2>
          <p className="text-xs text-gray-400 mt-0.5">How your chatbot presents itself to visitors</p>
        </CardHeader>
        <CardBody className="space-y-4">
          <Field
            label="Chatbot Name"
            hint="Shown in the chat header"
          >
            <input
              type="text"
              value={chatbotName}
              onChange={(e) => setChatbotName(e.target.value)}
              maxLength={60}
              placeholder="e.g. Support Assistant"
              className={inputCls}
            />
          </Field>

          <Field
            label="Welcome Message"
            hint="First message shown when a visitor opens the chat"
          >
            <input
              type="text"
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              maxLength={200}
              placeholder="e.g. Hi! How can I help you today?"
              className={inputCls}
            />
          </Field>
        </CardBody>
      </Card>

      {/* System prompt */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900">AI System Prompt</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Instructions sent to the AI before every conversation. Describe your company,
            tone, and what the AI should or shouldn't do.
          </p>
        </CardHeader>
        <CardBody>
          <Field
            label="System Prompt"
            hint={`${systemPrompt.length} characters`}
          >
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={8}
              maxLength={4000}
              placeholder="You are a helpful customer support assistant for Acme Inc..."
              className={cn(inputCls, "resize-y min-h-[160px] font-mono text-xs leading-relaxed")}
            />
          </Field>

          {/* Prompt tips */}
          <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
            <p className="text-xs font-medium text-blue-700 mb-1.5">Tips for a great system prompt</p>
            <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
              <li>Describe your company and what it does</li>
              <li>Set the tone: friendly, formal, concise</li>
              <li>List topics the AI should focus on or avoid</li>
              <li>Include key URLs or contact details to reference</li>
            </ul>
          </div>
        </CardBody>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Reset to defaults
        </button>

        <div className="flex items-center gap-3">
          {saveState === "saved" && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <CheckCircle className="w-3.5 h-3.5" /> Saved
            </span>
          )}
          {saveState === "error" && errorMsg && (
            <span className="flex items-center gap-1 text-xs text-red-500">
              <AlertCircle className="w-3.5 h-3.5" /> {errorMsg}
            </span>
          )}
          <Button
            onClick={handleSave}
            disabled={!isDirty || saveState === "saving"}
            size="sm"
            className={cn("gap-1.5", !isDirty && "opacity-50")}
          >
            <Save className="w-3.5 h-3.5" />
            {saveState === "saving" ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 " +
  "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 " +
  "focus:border-blue-400 transition-all";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label className="text-xs font-semibold text-gray-700">{label}</label>
        {hint && <span className="text-[10px] text-gray-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
