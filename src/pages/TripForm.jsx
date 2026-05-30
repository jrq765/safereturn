import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Send, Loader2 } from "lucide-react";
import FormProgress from "@/components/FormProgress";
import StepWho from "@/components/steps/StepWho";
import StepWhere from "@/components/steps/StepWhere";
import StepWhen from "@/components/steps/StepWhen";
import StepWhat from "@/components/steps/StepWhat";
import StepEquipment from "@/components/steps/StepEquipment";
import StepContacts from "@/components/steps/StepContacts";
import { toast } from "sonner";
import formatTripEmail from "@/utils/formatTripEmail";

const INITIAL_DATA = {
  primary_name: "", primary_age: "", primary_phone: "", emergency_device_type: "",
  other_contacts: [], total_participants: 1,
  park_name: "", visitor_center: "", travel_method: "", accommodation: "",
  arrival_datetime: "", departure_datetime: "", expected_return_datetime: "",
  activities: [], backup_activity: "", backup_start_location: "", backup_start_datetime: "", backup_end_location: "", backup_end_datetime: "",
  vehicle_make: "", vehicle_model: "", vehicle_color: "", vehicle_license: "",
  vessel_make: "", vessel_model: "", vessel_color: "",
  bicycle_make: "", bicycle_model: "", bicycle_color: "",
  camping_tent: "", backpack_description: "", other_equipment: "",
};

export default function TripForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(INITIAL_DATA);
  const [contacts, setContacts] = useState([{ contact_name: "", contact_email: "", contact_phone: "", relationship: "family" }]);
  const [selectedAuthorities, setSelectedAuthorities] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const canProceed = () => true;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const tripPlan = await base44.entities.TripPlan.create({
        ...formData,
        status: "active",
        authority_contacts: selectedAuthorities,
      });

      const emailBody = formatTripEmail(formData);
      const subject = `Trip Plan Filed: ${formData.primary_name || "Traveler"} — ${formData.park_name || "Outdoor Trip"}`;

      const validContacts = contacts.filter(c => c.contact_name && c.contact_email);
      for (const contact of validContacts) {
        await base44.entities.EmergencyContact.create({
          trip_plan_id: tripPlan.id,
          contact_name: contact.contact_name,
          contact_email: contact.contact_email,
          contact_phone: contact.contact_phone,
          relationship: contact.relationship,
          notification_sent: true,
        });
        await base44.integrations.Core.SendEmail({
          to: contact.contact_email,
          subject,
          body: emailBody,
        });
      }

      for (const authority of selectedAuthorities) {
        if (authority.email) {
          await base44.integrations.Core.SendEmail({
            to: authority.email,
            subject: `[SAR Trip Plan] ${formData.primary_name || "Traveler"} — ${formData.park_name || "Outdoor Trip"}`,
            body: emailBody,
          });
        }
      }

      const totalSent = validContacts.length + selectedAuthorities.filter(a => a.email).length;
      toast.success(totalSent > 0 ? `Trip plan filed! Emails sent to ${totalSent} contact(s).` : "Trip plan saved!");
      navigate("/confirmation?id=" + tripPlan.id);
    } catch (err) {
      toast.error("Something went wrong: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const stepComponents = [
    <StepWho key="who" data={formData} onChange={setFormData} />,
    <StepWhere key="where" data={formData} onChange={setFormData} />,
    <StepWhen key="when" data={formData} onChange={setFormData} />,
    <StepWhat key="what" data={formData} onChange={setFormData} />,
    <StepEquipment key="equip" data={formData} onChange={setFormData} />,
    <StepContacts
      key="contacts"
      contacts={contacts}
      onContactsChange={setContacts}
      parkName={formData.park_name}
      selectedAuthorities={selectedAuthorities}
      onAuthoritiesChange={setSelectedAuthorities}
    />,
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 font-inter">
      <FormProgress currentStep={step} />
      <div className="min-h-[400px]">
        {stepComponents[step]}
      </div>
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
        <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        {step < 5 ? (
          <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()} className="gap-2 bg-primary hover:bg-primary/90 text-white">
            Next <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!canProceed() || submitting} className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {submitting ? "Saving..." : "Save Plan & Notify Contacts"}
          </Button>
        )}
      </div>
    </div>
  );
}