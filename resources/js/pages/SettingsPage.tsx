import { useState, useRef, useEffect } from "react";
import { useSettings } from "@/hooks/useSettings";
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { useToast } from "@/components/ui/ToastProvider";
import { FiSave, FiDownload, FiUpload, FiX, FiAlertTriangle, FiSettings } from "react-icons/fi";
import { GlassCard, GlassButton, GlassInput, GlassSelect, GlassLabel } from "@/components/ui/GlassComponents";
import { GlassModal } from "@/components/ui/GlassModal";

const TIMEZONES = [
  "Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura", "UTC"
];

export default function SettingsPage() {
  const { settings: current, update: updateConfig } = useSettings();
  const [formData, setFormData] = useState(current);
  const [saving, setSaving] = useState(false);
  
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [overwrite, setOverwrite] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const t = useT();
  const { toast } = useToast();

  useEffect(() => { setFormData(current); }, [current]);

  const handleChange = (field: keyof typeof current, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateConfig(formData);
      toast({ title: t("settings.saveSuccess"), type: "success" });
    } catch (e) {
      toast({ title: t("settings.saveFailed"), description: (e as Error).message, type: "error" });
    } finally { setSaving(false); }
  };

  const confirmExport = async () => {
    setExporting(true);
    try {
      await api.backup.export();
      setExportOpen(false);
      toast({ title: t("settings.exportSuccess"), type: "success" });
    } catch (e) {
      toast({ title: t("settings.exportFailed"), description: (e as Error).message, type: "error" });
    } finally { setExporting(false); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
      setImportOpen(true);
    }
    e.target.value = "";
  };

  const cancelImport = () => {
    setPendingFile(null);
    setImportOpen(false);
  };

  const confirmImport = async () => {
    if (!pendingFile) return;
    setImporting(true);
    try {
      await api.backup.import(pendingFile, overwrite);
      toast({ title: t("settings.importSuccess"), description: t("settings.importSuccessDesc"), type: "success" });
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      toast({ title: t("settings.importFailed"), description: (e as Error).message, type: "error" });
    } finally {
      setImporting(false);
      setImportOpen(false);
      setPendingFile(null);
    }
  };

  return (
    <div className="relative max-w-5xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-purple-500/20">
            <FiSettings size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-black text-gray-800 dark:text-gray-100">
              {t("settings.title")}
            </h1>
            <p className="text-sm font-body text-gray-600 dark:text-gray-400 mt-1">
              Sesuaikan preferensi sistem, zona waktu, dan cadangkan data Anda.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8 relative z-10">
        
        {/* System Configuration */}
        <GlassCard className="relative overflow-hidden !p-0">
          <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />
          <div className="p-6 md:p-10 pl-8 md:pl-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                <FiSettings size={20} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-xl font-heading font-bold text-gray-800 dark:text-gray-100">
                {t("settings.systemConfig")}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-2">
                <GlassLabel>{t("settings.timezone")}</GlassLabel>
                <GlassSelect 
                  value={formData.timezone} 
                  onChange={(e: any) => handleChange("timezone", e.target.value)}
                >
                  {TIMEZONES.map(tz => <option key={tz} value={tz} className="bg-gray-800 text-white">{tz}</option>)}
                </GlassSelect>
              </div>
              
              <div className="flex flex-col gap-2">
                <GlassLabel>{t("settings.timeFormat")}</GlassLabel>
                <div className="flex gap-2">
                  {["24", "12"].map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => handleChange("time_format", fmt)}
                      className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all border ${
                        formData.time_format === fmt 
                          ? "bg-emerald-500/80 text-white border-emerald-400 shadow-lg shadow-emerald-500/30"
                          : "bg-black/10 dark:bg-white/5 border-white/10 text-gray-700 dark:text-gray-300 hover:bg-black/20 dark:hover:bg-white/10"
                      }`}
                    >
                      {fmt} Jam
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
              <GlassButton variant="success" onClick={handleSave} disabled={saving} className="px-8">
                <FiSave /> {t("settings.saveSettings")}
              </GlassButton>
            </div>
          </div>
        </GlassCard>

        {/* Backup & Restore */}
        <GlassCard className="relative overflow-hidden !p-0">
          <div className="absolute top-0 left-0 w-2 h-full bg-blue-500" />
          <div className="p-6 md:p-10 pl-8 md:pl-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-500/30">
                <FiDownload size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-heading font-bold text-gray-800 dark:text-gray-100">
                {t("settings.backupRestore")}
              </h2>
            </div>
            <p className="text-sm font-body text-gray-600 dark:text-gray-400 mb-8">
              {t("settings.backupDesc")}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-4 p-6 bg-black/5 dark:bg-white/5 border border-white/10 rounded-2xl">
                <h3 className="font-heading font-bold text-lg text-gray-800 dark:text-gray-100">Backup Data</h3>
                <p className="text-xs text-gray-500 flex-1">
                  Unduh semua pengaturan, jadwal, dan file audio Anda ke dalam file zip untuk keamanan.
                </p>
                <GlassButton variant="primary" onClick={() => setExportOpen(true)} disabled={exporting}>
                  <FiDownload /> {t("settings.downloadBackup")}
                </GlassButton>
              </div>

              <div className="flex flex-col gap-4 p-6 bg-black/5 dark:bg-white/5 border border-white/10 rounded-2xl">
                <h3 className="font-heading font-bold text-lg text-gray-800 dark:text-gray-100">Restore Data</h3>
                <p className="text-xs text-gray-500 flex-1">
                  Kembalikan sistem Anda menggunakan file backup (.zip atau .json) yang sebelumnya telah diunduh.
                </p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={overwrite} 
                    onChange={(e) => setOverwrite(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`text-xs font-bold ${overwrite ? "text-rose-500" : "text-gray-500"}`}>
                    {t("settings.overwriteLabel")}
                  </span>
                </label>
                <GlassButton variant="warning" onClick={() => fileInputRef.current?.click()} disabled={importing}>
                  <FiUpload /> {t("settings.restoreFromFile")}
                </GlassButton>
                <input ref={fileInputRef} type="file" accept=".zip,.json,application/zip,application/json" hidden onChange={handleFileSelect} />
              </div>
            </div>
          </div>
        </GlassCard>

      </div>

      <GlassModal 
        isOpen={exportOpen} 
        onClose={() => setExportOpen(false)}
        title={t("settings.backupConfirmTitle")}
        footer={
          <>
            <GlassButton variant="ghost" onClick={() => setExportOpen(false)}><FiX /></GlassButton>
            <GlassButton variant="success" onClick={confirmExport}><FiDownload /> {t("settings.yesDownload")}</GlassButton>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="font-bold text-sm text-gray-800 dark:text-gray-200">{t("settings.backupConfirmBody")}</p>
          <div className="p-4 bg-black/5 dark:bg-white/5 border border-white/10 rounded-xl">
            <ul className="list-disc pl-5 text-sm font-bold text-gray-700 dark:text-gray-300 flex flex-col gap-2">
              <li>{t("settings.backupItem1")}</li>
              <li>{t("settings.backupItem2")}</li>
              <li>{t("settings.backupItem3")}</li>
              <li>{t("settings.backupItem4")}</li>
            </ul>
          </div>
          <p className="font-bold text-sm text-gray-800 dark:text-gray-200">{t("settings.backupConfirmQ")}</p>
        </div>
      </GlassModal>

      <GlassModal 
        isOpen={importOpen} 
        onClose={cancelImport}
        title={overwrite ? t("settings.restoreConfirmOverwrite") : t("settings.restoreConfirm")}
        footer={
          <>
            <GlassButton variant="ghost" onClick={cancelImport}><FiX /></GlassButton>
            <GlassButton variant={overwrite ? "danger" : "warning"} onClick={confirmImport}>
              <FiUpload /> {overwrite ? t("settings.yesOverwrite") : t("settings.yesRestore")}
            </GlassButton>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="font-bold text-sm text-gray-800 dark:text-gray-200">{t("settings.restoreFile")}</p>
          <div className="p-4 bg-black/5 dark:bg-white/5 border border-white/10 rounded-xl">
            <p className="font-body font-bold text-sm text-gray-800 dark:text-gray-200 break-all">{pendingFile?.name}</p>
            <p className="text-xs text-gray-500 mt-1">{t("settings.fileSize", { size: pendingFile ? (pendingFile.size / 1024).toFixed(1) : 0 })}</p>
          </div>
          {overwrite ? (
            <div className="p-4 bg-rose-500/20 border border-rose-500/30 rounded-xl flex items-start gap-3">
              <FiAlertTriangle className="text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" size={18} />
              <p className="font-bold text-sm text-rose-700 dark:text-rose-300">{t("settings.restoreOverwriteWarning")}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">{t("settings.restoreNormalInfo")}</p>
          )}
          <p className="font-bold text-sm text-gray-800 dark:text-gray-200">{t("settings.restoreConfirmQ")}</p>
        </div>
      </GlassModal>
    </div>
  );
}
