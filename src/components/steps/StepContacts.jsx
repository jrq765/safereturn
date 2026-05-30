import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Heart, Building2 } from "lucide-react";
import AuthorityFinder from "@/components/AuthorityFinder";

export default function StepContacts({ contacts, onContactsChange, parkName, selectedAuthorities, onAuthoritiesChange }) {
  const addContact = () => {
    onContactsChange([...contacts, { contact_name: "", contact_email: "", contact_phone: "", relationship: "family" }]);
  };

  const updateContact = (index, field, value) => {
    const updated = [...contacts];
    updated[index] = { ...updated[index], [field]: value };
    onContactsChange(updated);
  };

  const removeContact = (index) => {
    onContactsChange(contacts.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Heart className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Emergency Contacts</h2>
          <p className="text-sm text-muted-foreground">Who should we notify with your trip plan?</p>
        </div>
      </div>

      <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
        <p className="text-sm text-foreground">
          <strong>Important:</strong> These people will receive an email with your complete trip plan.
          If you don't return on time, they'll have everything they need to contact authorities.
        </p>
      </div>

      <div className="space-y-4">
        {contacts.map((contact, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-accent">Contact {i + 1}</span>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeContact(i)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Full Name *</Label>
                <Input value={contact.contact_name} onChange={e => updateContact(i, "contact_name", e.target.value)} placeholder="Mom, Dad, Spouse..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email Address *</Label>
                <Input type="email" value={contact.contact_email} onChange={e => updateContact(i, "contact_email", e.target.value)} placeholder="email@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone Number</Label>
                <Input value={contact.contact_phone} onChange={e => updateContact(i, "contact_phone", e.target.value)} placeholder="(555) 000-0000" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Relationship</Label>
                <Select value={contact.relationship} onValueChange={v => updateContact(i, "relationship", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="spouse">Spouse / Partner</SelectItem>
                    <SelectItem value="friend">Friend</SelectItem>
                    <SelectItem value="coworker">Coworker</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" onClick={addContact} className="w-full border-dashed">
        <Plus className="w-4 h-4 mr-2" /> Add Another Contact
      </Button>

      {contacts.length === 0 && (
        <p className="text-center text-sm text-muted-foreground italic py-4">
          Add at least one trusted person who should know about your trip.
        </p>
      )}

      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-foreground">Notify Local Authorities</h3>
        </div>
        <AuthorityFinder
          parkName={parkName}
          selectedAuthorities={selectedAuthorities}
          onAuthoritiesChange={onAuthoritiesChange}
        />
      </div>
    </div>
  );
}