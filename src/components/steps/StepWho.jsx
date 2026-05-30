import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, User } from "lucide-react";

export default function StepWho({ data, onChange }) {
  const update = (field, value) => onChange({ ...data, [field]: value });

  const addContact = () => {
    onChange({ ...data, other_contacts: [...(data.other_contacts || []), { name: "", age: "", phone: "" }] });
  };

  const updateContact = (index, field, value) => {
    const contacts = [...(data.other_contacts || [])];
    contacts[index] = { ...contacts[index], [field]: value };
    onChange({ ...data, other_contacts: contacts });
  };

  const removeContact = (index) => {
    onChange({ ...data, other_contacts: (data.other_contacts || []).filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{"Who's Going?"}</h2>
          <p className="text-sm text-muted-foreground">Primary contact {"&"} participants</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-accent">Primary Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Full Name *</Label>
            <Input value={data.primary_name || ""} onChange={e => update("primary_name", e.target.value)} placeholder="Jane Doe" />
          </div>
          <div className="space-y-1.5">
            <Label>Age</Label>
            <Input value={data.primary_age || ""} onChange={e => update("primary_age", e.target.value)} placeholder="32" />
          </div>
          <div className="space-y-1.5">
            <Label>Phone Number *</Label>
            <Input value={data.primary_phone || ""} onChange={e => update("primary_phone", e.target.value)} placeholder="(555) 123-4567" />
          </div>
          <div className="space-y-1.5">
            <Label>Emergency Device Type</Label>
            <Input value={data.emergency_device_type || ""} onChange={e => update("emergency_device_type", e.target.value)} placeholder="PLB, satellite phone, etc." />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Total Participant Count</Label>
          <Input type="number" min="1" className="max-w-32" value={data.total_participants || 1} onChange={e => update("total_participants", parseInt(e.target.value) || 1)} />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-accent">Other Contacts</h3>
          <Button type="button" variant="outline" size="sm" onClick={addContact}>
            <Plus className="w-4 h-4 mr-1" /> Add Person
          </Button>
        </div>
        {(!data.other_contacts || data.other_contacts.length === 0) && (
          <p className="text-sm text-muted-foreground italic">{"No additional contacts yet — tap \"Add Person\" above."}</p>
        )}
        {(data.other_contacts || []).map((contact, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-muted/50 rounded-lg items-end">
            <div className="space-y-1"><Label className="text-xs">Name</Label><Input placeholder="Name" value={contact.name} onChange={e => updateContact(i, "name", e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Age</Label><Input placeholder="Age" value={contact.age} onChange={e => updateContact(i, "age", e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Phone</Label><Input placeholder="Phone" value={contact.phone} onChange={e => updateContact(i, "phone", e.target.value)} /></div>
            <Button type="button" variant="ghost" size="icon" onClick={() => removeContact(i)} className="justify-self-end">
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}