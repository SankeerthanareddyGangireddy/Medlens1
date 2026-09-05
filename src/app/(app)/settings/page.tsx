import { Card } from "@/components/ui";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <Card className="p-6 text-sm leading-7 text-slate-700">
        <p>
          Authentication is demo-ready. Replace the session helper in <code>src/lib/auth.ts</code> with your production identity provider.
        </p>
        <p className="mt-3">
          AI provider is selected by <code>AI_PROVIDER</code>. Without an API key, MedLens uses the mock extractor so the product remains usable.
        </p>
        <p className="mt-3">
          File storage is local. The storage service is structured so an S3-compatible adapter can be added later.
        </p>
        <p className="mt-3 font-medium">
          MedLens organizes documented information. It does not diagnose, prescribe, or recommend medication changes.
        </p>
      </Card>
    </div>
  );
}
