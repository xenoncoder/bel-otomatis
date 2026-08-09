import { useState, useMemo } from "react";
import { useSchedules } from "@/hooks/useSchedules";
import type { Schedule, BellSound } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/ToastProvider";
import ScheduleTable from "@/components/ScheduleTable";
import { FiPlus, FiTrash2, FiSave, FiX, FiCalendar, FiEdit2, FiCheckSquare, FiAlertCircle } from "react-icons/fi";
import { GlassCard, GlassButton, GlassInput, GlassLabel, GlassSelect } from "@/components/ui/GlassComponents";
import { GlassModal } from "@/components/ui/GlassModal";
import TimePicker from "@/components/TimePicker";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export default function SchedulesPage() {
  const [activeTab, setActiveTab] = useState("Senin");
  const { schedules, loading, error, reload } = useSchedules();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [formData, setFormData] = useState<Partial<Schedule>>({ label: "", start_time: "07:00", bell_sound_id: null, recurrence: "weekly", days: ["Senin"], is_active: true });
  const [saving, setSaving] = useState(false);
  
  const [availableAudios, setAvailableAudios] = useState<BellSound[]>([]);
  const t = useT();
  const { toast } = useToast();

  const fetchAudios = async () => {
    try {
      const files = await api.bellSounds.list();
      setAvailableAudios(files);
    } catch {
      toast({ title: "Gagal memuat daftar audio", type: "error" });
    }
  };

  const openAdd = () => {
    setFormData({ label: "", start_time: "07:00", bell_sound_id: null, recurrence: "weekly", days: [activeTab], is_active: true });
    fetchAudios();
    setIsAddOpen(true);
  };

  const openEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({ ...schedule });
    fetchAudios();
    setIsEditOpen(true);
  };

  const openDelete = () => {
    if (selectedIds.length === 0) return;
    setIsDeleteOpen(true);
  };

  const handleSave = async (isEdit: boolean) => {
    if (!formData.label) {
      toast({ title: t("schedules.formIncomplete"), type: "warning" });
      return;
    }
    setSaving(true);
    try {
      if (isEdit && editingSchedule) {
        await api.schedules.update(editingSchedule.id, formData);
        toast({ title: t("schedules.updateSuccess"), type: "success" });
        setIsEditOpen(false);
      } else {
        await api.schedules.create(formData);
        toast({ title: t("schedules.addSuccess"), type: "success" });
        setIsAddOpen(false);
      }
      reload();
    } catch (e) {
      toast({ title: t("schedules.saveFailed"), description: (e as Error).message, type: "error" });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await Promise.all(selectedIds.map(id => api.schedules.delete(id)));
      toast({ title: t("schedules.deleteSuccess"), type: "success" });
      setSelectedIds([]);
      setIsDeleteOpen(false);
      reload();
    } catch (e) {
      toast({ title: t("schedules.deleteFailed"), description: (e as Error).message, type: "error" });
    } finally { setSaving(false); }
  };

  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => s.day === activeTab).sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [schedules, activeTab]);

  return (
    <div className="relative max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-purple-500/20">
            <FiCalendar size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-black text-gray-800 dark:text-gray-100">
              {t("schedules.title")}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {selectedIds.length > 0 && (
            <GlassButton variant="danger" onClick={openDelete} className="flex-1 md:flex-none">
              <FiTrash2 /> {t("common.delete")} ({selectedIds.length})
            </GlassButton>
          )}
          <GlassButton variant="primary" onClick={openAdd} className="flex-1 md:flex-none">
            <FiPlus /> {t("schedules.addSchedule")}
          </GlassButton>
        </div>
      </div>

      <GlassCard className="!p-0 overflow-hidden flex flex-col">
        {/* Mobile-friendly Tabs */}
        <div className="flex overflow-x-auto p-4 gap-2 border-b border-white/10 scrollbar-hide bg-black/5 dark:bg-white/5">
          {DAYS.map(day => (
            <button
              key={day}
              onClick={() => { setActiveTab(day); setSelectedIds([]); }}
              className={`px-5 py-2.5 rounded-xl font-heading font-bold text-sm whitespace-nowrap transition-all ${
                activeTab === day 
                  ? "bg-indigo-500/90 text-white shadow-lg shadow-indigo-500/30" 
                  : "bg-white/50 dark:bg-black/20 text-gray-600 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-black/40 border border-white/20 dark:border-white/10"
              }`}
            >
              {day}
            </button>
          ))}
        </div>
        
        <div className="p-4 md:p-6 bg-black/5 dark:bg-white/5">
          <ScheduleTable 
            schedules={filteredSchedules} 
            selectedIds={selectedIds} 
            onSelectionChange={setSelectedIds}
            onEdit={openEdit}
            loading={loading}
            error={error}
          />
        </div>
      </GlassCard>

      {/* Add Modal */}
      <GlassModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={t("schedules.addSchedule")} footer={
        <>
          <GlassButton variant="ghost" onClick={() => setIsAddOpen(false)}><FiX /></GlassButton>
          <GlassButton variant="success" onClick={() => handleSave(false)} disabled={saving}><FiSave /> {t("common.save")}</GlassButton>
        </>
      }>
        <div className="flex flex-col gap-4">
          <div>
            <GlassLabel>{t("schedules.label")}</GlassLabel>
            <GlassInput value={formData.label} onChange={(e: any) => setFormData({...formData, label: e.target.value})} placeholder="Contoh: Bel Masuk" />
          </div>
          <div>
            <GlassLabel>{t("schedules.time")}</GlassLabel>
            <TimePicker value={formData.start_time || "07:00"} onChange={(v: string) => setFormData({...formData, start_time: v})} />
          </div>
          <div>
            <GlassLabel>{t("schedules.audio")}</GlassLabel>
            <GlassSelect value={formData.bell_sound_id || ""} onChange={(e: any) => setFormData({...formData, bell_sound_id: Number(e.target.value) || null})}>
              <option value="" disabled className="bg-gray-800 text-white">-- Pilih Audio --</option>
              {availableAudios.map(a => <option key={a.id} value={a.id} className="bg-gray-800 text-white">{a.name}</option>)}
            </GlassSelect>
          </div>
        </div>
      </GlassModal>

      {/* Edit Modal */}
      <GlassModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={t("schedules.editSchedule")} footer={
        <>
          <GlassButton variant="ghost" onClick={() => setIsEditOpen(false)}><FiX /></GlassButton>
          <GlassButton variant="success" onClick={() => handleSave(true)} disabled={saving}><FiSave /> {t("common.save")}</GlassButton>
        </>
      }>
        <div className="flex flex-col gap-4">
          <div>
            <GlassLabel>{t("schedules.label")}</GlassLabel>
            <GlassInput value={formData.label} onChange={(e: any) => setFormData({...formData, label: e.target.value})} />
          </div>
          <div>
            <GlassLabel>{t("schedules.time")}</GlassLabel>
            <TimePicker value={formData.start_time || "07:00"} onChange={(v: string) => setFormData({...formData, start_time: v})} />
          </div>
          <div>
            <GlassLabel>{t("schedules.audio")}</GlassLabel>
            <GlassSelect value={formData.bell_sound_id || ""} onChange={(e: any) => setFormData({...formData, bell_sound_id: Number(e.target.value) || null})}>
              {availableAudios.map(a => <option key={a.id} value={a.id} className="bg-gray-800 text-white">{a.name}</option>)}
            </GlassSelect>
          </div>
        </div>
      </GlassModal>

      {/* Delete Confirmation */}
      <GlassModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title={t("common.deleteConfirm")} footer={
        <>
          <GlassButton variant="ghost" onClick={() => setIsDeleteOpen(false)}><FiX /></GlassButton>
          <GlassButton variant="danger" onClick={handleDelete} disabled={saving}><FiTrash2 /> {t("common.delete")}</GlassButton>
        </>
      }>
        <div className="flex flex-col items-center justify-center p-4 text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center">
            <FiAlertCircle size={32} />
          </div>
          <p className="font-bold text-gray-800 dark:text-gray-200">
            Anda akan menghapus {selectedIds.length} jadwal. Tindakan ini tidak dapat dibatalkan!
          </p>
        </div>
      </GlassModal>

    </div>
  );
}
