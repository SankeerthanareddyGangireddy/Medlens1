import { FileSearch, Inbox, TriangleAlert } from "lucide-react";
import { Card } from "@/components/ui";

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Card className="flex flex-col items-center px-6 py-14 text-center">
      <Inbox className="h-8 w-8 text-slate-400" aria-hidden />
      <h3 className="mt-3 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-600">{body}</p>
    </Card>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="fade-in space-y-3" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="h-24 animate-pulse rounded-2xl bg-slate-200/70" />
      <div className="h-48 animate-pulse rounded-2xl bg-slate-200/60" />
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <Card className="flex items-start gap-3 border-red-200 bg-red-50 p-4 text-red-800">
      <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div>
        <p className="font-medium">Something went wrong</p>
        <p className="text-sm">{message}</p>
      </div>
    </Card>
  );
}

export function SourceViewer({ filename, text }: { filename: string; text?: string | null }) {
  return (
    <Card className="flex h-full min-h-[420px] flex-col overflow-hidden">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
          <FileSearch className="h-4 w-4" aria-hidden />
          {filename}
        </div>
        <p className="text-xs text-slate-500">Original extracted source text</p>
      </div>
      <pre className="flex-1 overflow-auto whitespace-pre-wrap p-4 text-sm leading-6 text-slate-700">
        {text || "No extracted text is available for this document."}
      </pre>
    </Card>
  );
}
