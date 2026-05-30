import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock } from "lucide-react";

export default function StepWhen({ data, onChange }) {
  const update = (field, value) => onChange({ ...data, [field]: value });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Clock className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">When?</h2>
          <p className="text-sm text-muted-foreground">Your trip timeline</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <div className="space-y-1.5">
          <Label>{"Date & Time of Arrival at Park"}</Label>
          <Input type="datetime-local" value={data.arrival_datetime || ""} onChange={e => update("arrival_datetime", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>{"Date & Time of Departure from Park"}</Label>
          <Input type="datetime-local" value={data.departure_datetime || ""} onChange={e => update("departure_datetime", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>{"Date & Time of Expected Return Home"}</Label>
          <Input type="datetime-local" value={data.expected_return_datetime || ""} onChange={e => update("expected_return_datetime", e.target.value)} />
          <p className="text-xs text-muted-foreground mt-1">
            {"This is the most critical date — if you haven't checked in by this time, your contacts will know something may be wrong."}
          </p>
        </div>
      </div>
    </div>
  );
}