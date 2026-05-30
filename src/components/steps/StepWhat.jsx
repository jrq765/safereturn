import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Compass } from "lucide-react";

export default function StepWhat({ data, onChange }) {
  const update = (field, value) => onChange({ ...data, [field]: value });

  const addActivity = () => {
    onChange({
      ...data,
      activities: [...(data.activities || []), { activity: "", start_location: "", start_datetime: "", end_location: "", end_datetime: "" }],
    });
  };

  const updateActivity = (index, field, value) => {
    const activities = [...(data.activities || [])];
    activities[index] = { ...activities[index], [field]: value };
    onChange({ ...data, activities });
  };

  const removeActivity = (index) => {
    onChange({ ...data, activities: (data.activities || []).filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Compass className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">What Are You Doing?</h2>
          <p className="text-sm text-muted-foreground">Planned activities {"&"} backup plan</p>
        </div>
      </div>

      <div className="bg-white/10 rounded-xl border border-white/20 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-blue-300">Activities</h3>
          <Button type="button" variant="outline" size="sm" onClick={addActivity}>
            <Plus className="w-4 h-4 mr-1" /> Add Activity
          </Button>
        </div>
        {(!data.activities || data.activities.length === 0) && (
          <p className="text-sm text-muted-foreground italic">{"No activities yet — tap \"Add Activity\" above."}</p>
        )}
        {(data.activities || []).map((act, i) => (
          <div key={i} className="p-4 bg-white/10 rounded-lg border border-white/15 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">Activity {i + 1}</span>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeActivity(i)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2 space-y-1">
                <Label className="text-xs">Activity</Label>
                <Input value={act.activity} onChange={e => updateActivity(i, "activity", e.target.value)} placeholder="Hiking, kayaking, etc." />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Start Location</Label>
                <Input value={act.start_location} onChange={e => updateActivity(i, "start_location", e.target.value)} placeholder="Trailhead name" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{"Start Date & Time"}</Label>
                <Input type="datetime-local" value={act.start_datetime} onChange={e => updateActivity(i, "start_datetime", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">End Location</Label>
                <Input value={act.end_location} onChange={e => updateActivity(i, "end_location", e.target.value)} placeholder="Destination" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{"End Date & Time"}</Label>
                <Input type="datetime-local" value={act.end_datetime} onChange={e => updateActivity(i, "end_datetime", e.target.value)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white/10 rounded-xl border border-white/20 p-5 space-y-4">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-blue-300">Backup Plan</h3>
        <p className="text-xs text-white/60">In case your primary plan changes</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2 space-y-1">
            <Label className="text-xs">Activity</Label>
            <Input value={data.backup_activity || ""} onChange={e => update("backup_activity", e.target.value)} placeholder="Alternative activity" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Start Location</Label>
            <Input value={data.backup_start_location || ""} onChange={e => update("backup_start_location", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{"Start Date & Time"}</Label>
            <Input type="datetime-local" value={data.backup_start_datetime || ""} onChange={e => update("backup_start_datetime", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">End Location</Label>
            <Input value={data.backup_end_location || ""} onChange={e => update("backup_end_location", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{"End Date & Time"}</Label>
            <Input type="datetime-local" value={data.backup_end_datetime || ""} onChange={e => update("backup_end_datetime", e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );
}