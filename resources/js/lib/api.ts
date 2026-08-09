import type { BellLog, BellSound, Schedule, Settings } from "./types";
import { translate } from "./i18n";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json", Accept: "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

async function unwrap<T>(promise: Promise<{ data: T }>): Promise<T> {
  const res = await promise;
  return res.data;
}

export const api = {
  schedules: {
    list: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return unwrap<Schedule[]>(apiFetch<{ data: Schedule[] }>(`/schedules${qs}`));
    },
    today: () => unwrap<Schedule[]>(apiFetch<{ data: Schedule[] }>(`/schedules/today`)),
    create: (data: Partial<Schedule>) =>
      unwrap<Schedule>(apiFetch<{ data: Schedule }>(`/schedules`, { method: "POST", body: JSON.stringify(data) })),
    update: (id: number, data: Partial<Schedule>) =>
      unwrap<Schedule>(apiFetch<{ data: Schedule }>(`/schedules/${id}`, { method: "PUT", body: JSON.stringify(data) })),
    delete: (id: number) => apiFetch<void>(`/schedules/${id}`, { method: "DELETE" }),
    trigger: (id: number) =>
      apiFetch<BellLog>(`/schedules/${id}/trigger`, { method: "POST" }),
  },
  settings: {
    get: () => apiFetch<Settings>(`/settings`),
    update: (data: Settings) =>
      apiFetch<Settings>(`/settings`, { method: "PUT", body: JSON.stringify({ settings: data }) }),
  },
  bellSounds: {
    list: () => unwrap<BellSound[]>(apiFetch<{ data: BellSound[] }>(`/bell-sounds`)),
  },
  bellLogs: {
    list: (limit = 10) => unwrap<BellLog[]>(apiFetch<{ data: BellLog[] }>(`/bell-logs?limit=${limit}`)),
    delete: (id: number) => apiFetch<{ message: string }>(`/bell-logs/${id}`, { method: "DELETE" }),
    clearAll: () => apiFetch<{ message: string }>(`/bell-logs`, { method: "DELETE" }),
  },
  backup: {
    export: () =>
      fetch(`/api/backup/export`, { headers: { Accept: "application/zip" } }).then(async (r) => {
        if (!r.ok) throw new Error(translate("settings.exportFailed"));
        const blob = await r.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const cd = r.headers.get("content-disposition") ?? "";
        const match = cd.match(/filename="?([^"]+)"?/);
        a.download = match?.[1] ?? "backup.zip";
        a.click();
        URL.revokeObjectURL(url);
      }),
    import: (file: File, overwrite: boolean) => {
      const form = new FormData();
      form.append("file", file);
      form.append("overwrite", String(overwrite));
      return fetch(`/api/backup/import`, {
        method: "POST",
        body: form,
        headers: { Accept: "application/json" },
      }).then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.message ?? translate("settings.importFailed"));
        return data as { message: string; imported: Record<string, number> };
      });
    },
  },
  database: {
    tables: () => apiFetch<{ data: Array<{ name: string; columns: string[]; count: number }> }>(`/database/tables`),
    schema: (table: string) => apiFetch<{ columns: any[]; indexes: any[] }>(`/database/${table}/schema`),
    query: (query: string) => apiFetch<{ success: boolean; message: string; columns?: string[]; data?: any[] }>(`/database/query`, { method: "POST", body: JSON.stringify({ query }) }),
    show: (table: string, search = "") => apiFetch<{ table: string; columns: string[]; data: Record<string, unknown>[]; total: number }>(`/database/${table}` + (search ? `?search=${encodeURIComponent(search)}` : "")),
    insert: (table: string, data: Record<string, unknown>) =>
      apiFetch<{ message: string; id: number }>(`/database/${table}`, { method: "POST", body: JSON.stringify(data) }),
    updateRow: (table: string, id: number, data: Record<string, unknown>) =>
      apiFetch<{ message: string }>(`/database/${table}/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteRow: (table: string, id: number) =>
      apiFetch<{ message: string }>(`/database/${table}/${id}`, { method: "DELETE" }),
    truncate: (table: string) =>
      apiFetch<{ message: string }>(`/database/${table}/truncate`, { method: "DELETE" }),
  },
};

export interface FileItem {
  name: string;
  path: string;
  relative: string;
  is_dir: boolean;
  size: number;
  mime: string | null;
  url: string | null;
  modified: string;
}

export const fileApi = {
  list: (dir?: string) =>
    apiFetch<{ dir: string; items: FileItem[] }>(`/files${dir ? `?dir=${encodeURIComponent(dir)}` : ""}`),
  upload: (file: File, dir?: string) => {
    const form = new FormData();
    form.append("file", file);
    if (dir) form.append("dir", dir);
    return fetch(`/api/files/upload`, {
      method: "POST",
      body: form,
      headers: { Accept: "application/json" },
    }).then((r) => {
      if (!r.ok) throw new Error(translate("files.uploadFailed"));
      return r.json() as Promise<FileItem>;
    });
  },
  uploadFromUrl: (url: string, dir?: string, name?: string) =>
    apiFetch<FileItem>(`/files/upload-url`, {
      method: "POST",
      body: JSON.stringify({ url, dir: dir ?? "", name: name ?? "" }),
    }),
  createFolder: (name: string, dir?: string) =>
    apiFetch<FileItem>(`/files/folder`, {
      method: "POST",
      body: JSON.stringify({ name, dir: dir ?? "" }),
    }),
  rename: (path: string, name: string) =>
    apiFetch<FileItem>(`/files/rename`, {
      method: "POST",
      body: JSON.stringify({ path, name }),
    }),
  delete: (path: string) =>
    apiFetch<void>(`/files?path=${encodeURIComponent(path)}`, { method: "DELETE" }),
};
