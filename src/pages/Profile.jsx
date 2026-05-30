import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function Profile() {
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    saved_primary_name: "",
    saved_primary_phone: "",
    saved_primary_age: "",
    saved_primary_blood_type: "",
    saved_emergency_device: "",
  });

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setForm({
        saved_primary_name: u.saved_primary_name || "",
        saved_primary_phone: u.saved_primary_phone || "",
        saved_primary_age: u.saved_primary_age || "",
        saved_primary_blood_type: u.saved_primary_blood_type || "",
        saved_emergency_device: u.saved_emergency_device || "",
      });
    });
  }, []);

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const save = async () => {
    setSaving(true);
    await base44.auth.updateMe(form);
    setSaving(false);
    toast.success("Profile saved!");
  };

  if (!user) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-xl mx-auto px-4 py-10 font-inter">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{user.full_name || user.email}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-5">
        <div>
          <h2 className="font-semibold text-foreground mb-1">Saved Emergency Info</h2>
          <p className="text-xs text-muted-foreground">This info auto-fills the primary contact on new trip plans.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input value={form.saved_primary_name} onChange={e => update("saved_primary_name", e.target.value)} placeholder="Jane Doe" />
          </div>
          <div className="space-y-1.5">
            <Label>Age</Label>
            <Input value={form.saved_primary_age} onChange={e => update("saved_primary_age", e.target.value)} placeholder="32" />
          </div>
          <div className="space-y-1.5">
            <Label>Phone Number</Label>
            <Input value={form.saved_primary_phone} onChange={e => update("saved_primary_phone", e.target.value)} placeholder="(555) 123-4567" />
          </div>
          <div className="space-y-1.5">
            <Label>Blood Type</Label>
            <Select value={form.saved_primary_blood_type} onValueChange={v => update("saved_primary_blood_type", v)}>
              <SelectTrigger><SelectValue placeholder="Select blood type" /></SelectTrigger>
              <SelectContent>
                {BLOOD_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Emergency Device Type</Label>
            <Input value={form.saved_emergency_device} onChange={e => update("saved_emergency_device", e.target.value)} placeholder="PLB, satellite phone, etc." />
          </div>
        </div>

        <Button onClick={save} disabled={saving} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </div>
  );
}