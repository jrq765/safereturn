import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, ArrowLeft } from "lucide-react";
import StepWho from "@/components/steps/StepWho";
import StepWhere from "@/components/steps/StepWhere";
import StepWhen from "@/components/steps/StepWhen";
import StepWhat from "@/components/steps/StepWhat";
import StepEquipment from "@/components/steps/StepEquipment";
import StepContacts from "@/components/steps/StepContacts";
import { toast } from "sonner";
import formatTripEmail from "@/utils/formatTripEmail";
import moment from "moment";

const BG = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&auto=format&fit=crop";

const STEPS = [
  { id: "who",       label: "Who",       number: "01" },
  { id: "where",     label: "Where",     number: "02" },
  { id: "when",      label: "When",      number: "03" },
  { id: "what",      label: "What",      number: "04" },
  { id: "equipment", label: "Equipment", number: "05" },
  { id: "contacts",  label: "Contacts",  number: "06" },
];

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

export default function TripFormAlt() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(INITIAL_DATA);
  const [contacts, setContacts] = useState([{ contact_name: "", contact_email: "", contact_phone: "", relationship: "family" }]);
  const [selectedAuthorities, setSelectedAuthorities] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  useEffect(() => {
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

  const goTo = (i) => {
    setStep(i);
    window.scrollTo({ top: 0 });
  };

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
      const portalUrl = `${window.location.origin}/family?id=${tripPlan.id}`;
      const emailBody = formatTripEmail(formData, portalUrl);
      const subject = `Trip Plan Filed: ${formData.primary_name || "Traveler"} — ${formData.park_name || "Outdoor Trip"}`;
      const validContacts = contacts.filter(c => c.contact_name && c.contact_email);

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

      const emailTasks = [
        ...validContacts.map(contact => ({
          name: contact.contact_name, to: contact.contact_email, type: "contact",
          promise: base44.functions.invoke('sendEmail', { to: contact.contact_email, subject, body: emailBody }),
        })),
        ...selectedAuthorities.filter(a => a.email).map(authority => ({
          name: authority.name, to: authority.email, type: "authority",
          promise: base44.functions.invoke('sendEmail', { to: authority.email, subject: `[SAR Trip Plan] ${formData.primary_name || "Traveler"} — ${formData.park_name || "Outdoor Trip"}`, body: emailBody }),
        })),
        ...(user?.email ? [{
          name: "You (confirmation copy)", to: user.email, type: "self",
          promise: base44.functions.invoke('sendEmail', { to: user.email, subject: `[Your Copy] ${subject}`, body: emailBody + `<br/><br/><hr/><p style="color:#888;font-size:12px">This is your confirmation copy.</p>` }),
        }] : []),
      ];

      const results = await Promise.allSettled(emailTasks.map(t => t.promise));
      const emailResults = emailTasks.map((task, i) => ({
        name: task.name, to: task.to, type: task.type,
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

  const stepContent = [
    <StepWho key="who" data={formData} onChange={setFormData} />,
    <StepWhere key="where" data={formData} onChange={setFormData} />,
    <StepWhen key="when" data={formData} onChange={setFormData} />,
    <StepWhat key="what" data={formData} onChange={setFormData} />,
    <StepEquipment key="equip" data={formData} onChange={setFormData} />,
    <StepContacts key="contacts" contacts={contacts} onContactsChange={setContacts} parkName={formData.park_name} selectedAuthorities={selectedAuthorities} onAuthoritiesChange={setSelectedAuthorities} />,
  ];

  if (loadingEdit) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex font-inter relative">
      {/* Nature background */}
      <div className="fixed inset-0 z-0">
        <img src={BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Sidebar */}
      <div className="relative z-10 w-72 shrink-0 flex flex-col border-r border-white/15 bg-black/40 backdrop-blur-xl">
        {/* Logo */}
        <div className="px-6 pt-8 pb-6 border-b border-white/15 flex flex-col items-center text-center">
          <img
            src="https://media.base44.com/images/public/6a1b2bf2fc37b8175a269ec2/b59cfd204_ChatGPTImageMay30202601_47_28PM.png"
            alt="SafeReturn"
            className="h-28 w-auto object-contain"
          />
        </div>

        {/* Steps nav */}
        <div className="px-6 pt-6 flex-1">
          <p className="text-[10px] font-bold tracking-[0.2em] mb-4 text-white/40">FILING PROGRESS</p>
          <nav className="flex flex-col gap-1">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => goTo(i)}
                className="text-left px-3 py-2.5 text-xs font-bold tracking-[0.12em] rounded-lg transition-all"
                style={{
                  background: i === step ? 'rgba(107,178,253,0.25)' : 'transparent',
                  color: i === step ? '#6BB2FD' : i < step ? 'rgba(107,178,253,0.7)' : 'rgba(255,255,255,0.35)',
                  borderLeft: i === step ? '2px solid #6BB2FD' : '2px solid transparent',
                }}
              >
                {s.number} {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Back to home */}
        <div className="px-6 pb-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col">
        <div className="flex-1 m-4 ml-0 flex flex-col bg-white/80 backdrop-blur-2xl rounded-r-2xl overflow-hidden shadow-2xl">
          <div className="flex-1 p-10 overflow-y-auto">
            <p className="text-[10px] font-bold tracking-[0.2em] mb-2 text-accent/50">SECTION {STEPS[step].number}</p>
            <h1 className="text-3xl font-black tracking-tight mb-4 text-accent">{STEPS[step].label}</h1>
            <div className="border-t border-accent/20 mb-8" />
            {stepContent[step]}
          </div>

          {/* Navigation */}
          <div className="border-t border-accent/15 flex">
            {step > 0 && (
              <button
                onClick={() => goTo(step - 1)}
                className="px-8 py-5 text-xs font-black tracking-[0.25em] text-foreground/40 hover:text-foreground/70 border-r border-accent/15 transition-colors"
              >
                BACK
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => goTo(step + 1)}
                className="flex-1 py-5 text-xs font-black tracking-[0.25em] text-white bg-accent hover:bg-accent/90 transition-colors"
              >
                CONTINUE
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-5 text-xs font-black tracking-[0.25em] text-white bg-accent hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> FILING PLAN...</> : "CONFIRM & SAVE PLAN"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}