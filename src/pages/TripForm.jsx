import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Send, Loader2, ChevronUp } from "lucide-react";
import StepWho from "@/components/steps/StepWho";
import StepWhere from "@/components/steps/StepWhere";
import StepWhen from "@/components/steps/StepWhen";
import StepWhat from "@/components/steps/StepWhat";
import StepEquipment from "@/components/steps/StepEquipment";
import StepContacts from "@/components/steps/StepContacts";
import { toast } from "sonner";
import formatTripEmail from "@/utils/formatTripEmail";
import { motion, AnimatePresence } from "framer-motion";

const STEP_VIDEOS = [
  {
    src: "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-river-running-through-a-forest-41892-large.mp4",
    poster: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&auto=format&fit=crop"
  },
  {
    src: "https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4",
    poster: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&auto=format&fit=crop"
  },
  {
    src: "https://assets.mixkit.co/videos/preview/mixkit-clouds-and-blue-sky-2408-large.mp4",
    poster: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&auto=format&fit=crop"
  },
  {
    src: "https://assets.mixkit.co/videos/preview/mixkit-rocky-mountain-river-flowing-through-a-forest-41888-large.mp4",
    poster: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&auto=format&fit=crop"
  },
  {
    src: "https://assets.mixkit.co/videos/preview/mixkit-landscape-with-mountains-at-sunset-4119-large.mp4",
    poster: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1920&auto=format&fit=crop"
  },
  {
    src: "https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1610-large.mp4",
    poster: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920&auto=format&fit=crop"
  },
];

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

export default function TripForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
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

  const goTo = (next) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  const video = STEP_VIDEOS[step];

  return (
    <div className="relative min-h-screen font-inter overflow-hidden">

      {/* Background — crossfades between steps */}
      <AnimatePresence mode="sync">
        <motion.div
          key={step}
          className="fixed inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={video.poster}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: 0.8 }}
          />
          <video
            autoPlay muted loop playsInline
            className="absolute inset-0 w-full h-full object-cover"
            poster={video.poster}
            style={{ opacity: 0.8 }}
          >
            <source src={video.src} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/40" />
        </motion.div>
      </AnimatePresence>

      {/* Side dots */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
        {STEPS.map((s, i) => (
          <button key={s.id} onClick={() => goTo(i)} title={s.label} className="group flex items-center gap-2 justify-end">
            <span className={`text-xs font-medium transition-all duration-300 text-white ${step === i ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100`}>{s.label}</span>
            <div className={`rounded-full transition-all duration-300 ${step === i ? 'w-3 h-3 bg-white shadow-lg' : 'w-2 h-2 bg-white/40 hover:bg-white/70'}`} />
          </button>
        ))}
      </div>

      {/* Step number */}
      <div className="fixed left-6 top-1/2 -translate-y-1/2 z-50">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-1"
          >
            <span className="text-5xl font-bold text-white/30 leading-none select-none">{STEPS[step]?.number}</span>
            <div className="w-px h-12 bg-white/30" />
            <span className="text-xs font-medium text-white/60 tracking-widest uppercase">{STEPS[step]?.label}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Main content — zoom in on enter */}
      <div className="relative z-10 min-h-screen flex flex-col justify-center items-center px-4 py-24">
        <div className="w-full max-w-2xl mx-auto">

          {/* Step header */}
          <motion.div
            key={`header-${step}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 flex items-center gap-3"
          >
            <span className="text-xs font-bold tracking-widest text-white/70 uppercase">{STEPS[step]?.number}</span>
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-xs font-medium text-white/50 uppercase tracking-widest">{step + 1} of {STEPS.length}</span>
          </motion.div>

          {/* Form card — zooms in */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="bg-black/55 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-6 md:p-8"
            >
              <div className="text-white [&_label]:text-white/90 [&_label]:font-medium [&_input]:bg-white/15 [&_input]:border-white/30 [&_input]:text-white [&_input]:placeholder:text-white/50 [&_input:focus]:bg-white/20 [&_input:focus]:border-white/50 [&_textarea]:bg-white/15 [&_textarea]:border-white/30 [&_textarea]:text-white [&_textarea]:placeholder:text-white/50 [&_h2]:text-white [&_h3]:text-white/90 [&_p]:text-white/75 [&_.bg-card]:bg-white/10 [&_.bg-card]:border-white/20 [&_.border-border]:border-white/20 [&_.text-foreground]:text-white [&_.text-muted-foreground]:text-white/60 [&_.text-accent]:text-blue-300 [&_button[type=button]]:text-white [&_button[type=button]]:border-white/30 [&_button[type=button]:hover]:bg-white/20 [&_.bg-primary\/5]:bg-white/10 [&_.bg-primary\/10]:bg-white/15 [&_.border-primary\/20]:border-white/25 [&_.bg-muted]:bg-white/10 [&_[role=combobox]]:bg-white/15 [&_[role=combobox]]:border-white/30 [&_[role=combobox]]:text-white">
                {stepContent[step]}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <motion.div
            key={`nav-${step}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-col items-center gap-3 mt-8"
          >
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => goTo(step + 1)}
                className="flex items-center gap-3 px-10 py-4 text-base font-bold text-white rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 transition-all hover:scale-105 active:scale-95"
              >
                Continue to {STEPS[step + 1]?.label} →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="relative flex items-center gap-3 px-10 py-4 text-base font-bold text-white rounded-2xl bg-primary overflow-hidden disabled:opacity-60 hover:scale-105 active:scale-95 transition-all"
                style={{ boxShadow: '0 0 30px rgba(91,164,245,0.6), 0 4px 20px rgba(0,0,0,0.3)' }}
              >
                <motion.span
                  className="absolute inset-0 rounded-2xl bg-primary"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
                <span className="relative z-10 flex items-center gap-2">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  {submitting ? "Saving..." : "Save Plan & Notify Contacts"}
                </span>
              </button>
            )}

            {step > 0 && (
              <button onClick={() => goTo(step - 1)} className="flex items-center gap-1 text-xs text-white/50 hover:text-white/80 transition-colors">
                <ChevronUp className="w-3.5 h-3.5" /> Back to {STEPS[step - 1].label}
              </button>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}