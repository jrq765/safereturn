import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";

export default function StepWhere({ data, onChange }) {
  const update = (field, value) => onChange({ ...data, [field]: value });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <MapPin className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Where Are You Headed?</h2>
          <p className="text-sm text-muted-foreground">Location {"&"} travel details</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <div className="space-y-1.5">
          <Label>Park / Destination Name</Label>
          <Input value={data.park_name || ""} onChange={e => update("park_name", e.target.value)} placeholder="Yellowstone National Park" />
        </div>
        <div className="space-y-1.5">
          <Label>{"Visitor Center Name & Number"}</Label>
          <Input value={data.visitor_center || ""} onChange={e => update("visitor_center", e.target.value)} placeholder="Old Faithful Visitor Center — (307) 344-7381" />
        </div>
        <div className="space-y-1.5">
          <Label>Travel or Arrival Method</Label>
          <Input value={data.travel_method || ""} onChange={e => update("travel_method", e.target.value)} placeholder="Personal vehicle, shuttle, etc." />
        </div>
        <div className="space-y-1.5">
          <Label>Accommodation</Label>
          <Input value={data.accommodation || ""} onChange={e => update("accommodation", e.target.value)} placeholder="Campsite #42, Lodge room 108, etc." />
        </div>
      </div>
    </div>
  );
}