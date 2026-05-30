import { useState, useEffect } from "react";
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
  const [editId, setEditId] = useState(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  useEffect(() => {
    // Auto-fill saved profile data for new plans
    base44.auth.me().then(u => {
      if (u.saved_primary_name || u.saved_primary_phone) {
        setFormData(prev => ({
          ...prev,
          primary_name: prev.primary_name || u.saved_primary_name || "",
          primary_phone: prev.primary_phone || u.saved_primary_phone || "",
          primary_age: prev.primary_age || u.saved_primary_age || "",
          primary_blood_type: prev.primary_blood_type || u.saved_primary_blood_type || "",
          emergency_device_type: prev.emergency_device_type || u.saved_emergency_device || "",
        }));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      setEditId(id);
      setLoadingEdit(true);
      base44.entities.TripPlan.get(id).then(plan => {
        const { id: _id, created_date, updated_date, created_by, authority_contacts, ...rest } = plan;
        setFormData({ ...INITIAL_DATA, ...rest });
        if (authority_contacts) setSelectedAuthorities(authority_contacts);
      }).catch(() => {}).finally(() => setLoadingEdit(false));
      base44.entities.EmergencyContact.filter({ trip_plan_id: id }).then(rows => {
        if (rows.length > 0) setContacts(rows.map(r => ({ contact_name: r.contact_name, contact_email: r.contact_email, contact_phone: r.contact_phone, relationship: r.relationship })));
      }).catch(() => {});
    }
  }, []);

  const canProceed = () => true;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      let tripPlan;
      if (editId) {
        tripPlan = await base44.entities.TripPlan.update(editId, { ...formData, authority_contacts: selectedAuthorities });
        tripPlan = { id: editId };
      } else {
        tripPlan = await base44.entities.TripPlan.create({ ...formData, status: "active", authority_contacts: selectedAuthorities });
      }

      const user = await base44.auth.me();
      const emailBody = formatTripEmail(formData);
      const subject = `Trip Plan Filed: ${formData.primary_name || "Traveler"} — ${formData.park_name || "Outdoor Trip"}`;

      const validContacts = contacts.filter(c => c.contact_name && c.contact_email);

      // Save contacts to DB (non-blocking)
      if (!editId) {
        await Promise.allSettled(validContacts.map(contact =>
          base44.entities.EmergencyContact.create({
            trip_plan_id: tripPlan.id,
            contact_name: contact.contact_name,
            contact_email: contact.contact_email,
            contact_phone: contact.contact_phone,
            relationship: contact.relationship,
            notification_sent: true,
          })
        ));
      }

      // Build labeled email tasks with metadata for confirmation page
      const emailTasks = [
        ...validContacts.map(contact => ({
          name: contact.contact_name,
          to: contact.contact_email,
          type: "contact",
          promise: base44.functions.invoke('sendEmail', { to: contact.contact_email, subject, body: emailBody }),
        })),
        ...selectedAuthorities.filter(a => a.email).map(authority => ({
          name: authority.name,
          to: authority.email,
          type: "authority",
          promise: base44.functions.invoke('sendEmail', {
            to: authority.email,
            subject: `[SAR Trip Plan] ${formData.primary_name || "Traveler"} — ${formData.park_name || "Outdoor Trip"}`,
            body: emailBody,
          }),
        })),
        ...(user?.email ? [{
          name: "You (confirmation copy)",
          to: user.email,
          type: "self",
          promise: base44.functions.invoke('sendEmail', {
            to: user.email,
            subject: `[Your Copy] ${subject}`,
            body: emailBody + `<br/><br/><hr/><p style="color:#888;font-size:12px">This is your confirmation copy of the trip plan notification sent to your emergency contacts and authorities.</p>`,
          }),
        }] : []),
      ];

      const results = await Promise.allSettled(emailTasks.map(t => t.promise));
      const emailResults = emailTasks.map((task, i) => ({
        name: task.name,
        to: task.to,
        type: task.type,
        success: results[i].status === "fulfilled",
        error: results[i].status === "rejected" ? (results[i].reason?.message || "Unknown error") : null,
      }));
      sessionStorage.setItem(`email_results_${tripPlan.id}`, JSON.stringify(emailResults));

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
      {loadingEdit && <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}
      {!loadingEdit && <FormProgress currentStep={step} />}
      <div className="min-h-[400px]">
        {!loadingEdit && stepComponents[step]}
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