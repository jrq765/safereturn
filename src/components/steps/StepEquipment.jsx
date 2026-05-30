import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Car, Ship, Bike, Tent, Backpack } from "lucide-react";

export default function StepEquipment({ data, onChange }) {
  const update = (field, value) => onChange({ ...data, [field]: value });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Backpack className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Equipment</h2>
          <p className="text-sm text-muted-foreground">{"Vehicles, gear, & what you're bringing"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-accent" />
            <h3 className="font-semibold text-sm">Motor Vehicle</h3>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Make</Label><Input value={data.vehicle_make || ""} onChange={e => update("vehicle_make", e.target.value)} placeholder="Toyota" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Model</Label><Input value={data.vehicle_model || ""} onChange={e => update("vehicle_model", e.target.value)} placeholder="4Runner" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Color</Label><Input value={data.vehicle_color || ""} onChange={e => update("vehicle_color", e.target.value)} placeholder="White" /></div>
          <div className="space-y-1.5"><Label className="text-xs">License Plate</Label><Input value={data.vehicle_license || ""} onChange={e => update("vehicle_license", e.target.value)} placeholder="ABC-1234" /></div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Ship className="w-4 h-4 text-accent" />
            <h3 className="font-semibold text-sm">Water Vessel</h3>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Make</Label><Input value={data.vessel_make || ""} onChange={e => update("vessel_make", e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Model</Label><Input value={data.vessel_model || ""} onChange={e => update("vessel_model", e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Color</Label><Input value={data.vessel_color || ""} onChange={e => update("vessel_color", e.target.value)} /></div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Bike className="w-4 h-4 text-accent" />
            <h3 className="font-semibold text-sm">Bicycle</h3>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Make</Label><Input value={data.bicycle_make || ""} onChange={e => update("bicycle_make", e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Model</Label><Input value={data.bicycle_model || ""} onChange={e => update("bicycle_model", e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Color</Label><Input value={data.bicycle_color || ""} onChange={e => update("bicycle_color", e.target.value)} /></div>
        </div>

        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Tent className="w-4 h-4 text-accent" />
              <h3 className="font-semibold text-sm">Camping Tent</h3>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Description</Label><Input value={data.camping_tent || ""} onChange={e => update("camping_tent", e.target.value)} placeholder="Brand, color, size" /></div>
          </div>

          <div className="bg-card rounded-xl border border-border p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Backpack className="w-4 h-4 text-accent" />
              <h3 className="font-semibold text-sm">{"Backpack & Other Gear"}</h3>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Backpack</Label><Input value={data.backpack_description || ""} onChange={e => update("backpack_description", e.target.value)} placeholder="Description" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Other Equipment</Label><Textarea value={data.other_equipment || ""} onChange={e => update("other_equipment", e.target.value)} placeholder="Clothing, gear, etc." rows={2} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}