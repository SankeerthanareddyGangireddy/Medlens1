import { formatDateTime } from "@/lib/utils";
import { Card } from "@/components/ui";
import { EmptyState } from "@/components/states";

export function Timeline({
  events,
}: {
  events: Array<{
    id: string;
    title: string;
    detail?: string | null;
    occurredAt: string | Date;
    document?: { filename: string } | null;
  }>;
}) {
  if (!events.length) {
    return <EmptyState title="No timeline events yet." body="Uploading and reviewing reports will populate this chronology." />;
  }

  const groups = new Map<string, typeof events>();
  for (const event of events) {
    const key = new Date(event.occurredAt).toLocaleString("en-IN", { month: "long", year: "numeric" });
    const list = groups.get(key) ?? [];
    list.push(event);
    groups.set(key, list);
  }

  return (
    <div className="space-y-8">
      {[...groups.entries()].map(([month, items]) => (
        <section key={month}>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{month}</h3>
          <ol className="relative mt-3 border-l border-slate-200 pl-6">
            {items.map((item) => (
              <li key={item.id} className="mb-5">
                <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-teal-700" />
                <p className="font-medium text-slate-900">{item.title}</p>
                <p className="text-sm text-slate-600">{item.detail}</p>
                {item.document ? <p className="text-xs text-slate-500">Source: {item.document.filename}</p> : null}
                <p className="text-xs text-slate-400">{formatDateTime(item.occurredAt)}</p>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

export function AuditLog({
  logs,
}: {
  logs: Array<{ id: string; action: string; details: string; createdAt: string | Date }>;
}) {
  if (!logs.length) {
    return <EmptyState title="No audit history yet." body="Uploads, verification, and exports will appear here. Logs cannot be edited." />;
  }
  return (
    <Card className="divide-y divide-slate-100">
      {logs.map((log) => (
        <div key={log.id} className="px-4 py-3">
          <p className="text-xs text-slate-500">{formatDateTime(log.createdAt)}</p>
          <p className="text-sm font-medium text-slate-900">{log.details}</p>
          <p className="text-xs uppercase tracking-wide text-slate-400">{log.action}</p>
        </div>
      ))}
    </Card>
  );
}
