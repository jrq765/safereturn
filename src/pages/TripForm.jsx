import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Send, Loader2, ChevronDown, ChevronUp } from "lucide-react";
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
  "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-river-running-through-a-forest-41892-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-clouds-and-blue-sky-2408-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-rocky-mountain-river-flowing-through-a-forest-41888-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-landscape-with-mountains-at-sunset-4119-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1610-large.mp4",
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
  const [formData, setFormData] = useState(INITIAL_DATA);
  const [contacts, setContacts] = useState([{ contact_name: "", contact_email: "", contact_phone: "", relationship: "family" }]);
  const [selectedAuthorities, setSelectedAuthorities] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const sectionRefs = useRef([]);
  const containerRef = useRef(null);

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

  const scrollToStep = (index) => {
    sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth" });
    setStep(index);
  };

  useEffect(() => {
    const observers = sectionRefs.current.map((ref, i) => {
      if (!ref) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setStep(i); },
        { threshold: 0.5 }
      );
      obs.observe(ref);
      return obs;
    });
    return () => observers.forEach(o => o && o.disconnect());
  }, [loadingEdit]);

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
    <div ref={containerRef} className="relative font-inter">
      {/* Fixed nature video backgrounds — one per step */}
      {STEP_VIDEOS.map((src, i) => (
        <div
          key={i}
          className="fixed inset-0 z-0 overflow-hidden transition-opacity duration-1000"
          style={{ opacity: step === i ? 1 : 0, pointerEvents: 'none' }}
        >
          <video
            autoPlay muted loop playsInline
            className="w-full h-full object-cover"
            style={{ opacity: 0.18 }}
            src={src}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80" />
        </div>
      ))}

      {/* Side step dots */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => scrollToStep(i)}
            className="group flex items-center gap-2 justify-end"
            title={s.label}
          >
            <span className={`text-xs font-medium transition-all duration-300 ${step === i ? 'opacity-100 text-foreground' : 'opacity-0 text-muted-foreground'} group-hover:opacity-100`}>
              {s.label}
            </span>
            <div className={`rounded-full transition-all duration-300 ${step === i ? 'w-3 h-3 bg-primary shadow-lg shadow-primary/40' : 'w-2 h-2 bg-muted-foreground/40 hover:bg-primary/60'}`} />
          </button>
        ))}
      </div>

      {/* Step number top-left */}
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
            <span className="text-5xl font-bold text-primary/20 leading-none select-none">{STEPS[step]?.number}</span>
            <div className="w-px h-12 bg-border" />
            <span className="text-xs font-medium text-muted-foreground tracking-widest uppercase rotate-0">{STEPS[step]?.label}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Scroll sections */}
      <div className="relative z-10">
        {STEPS.map((s, i) => (
          <section
            key={s.id}
            ref={el => sectionRefs.current[i] = el}
            className="min-h-screen flex flex-col justify-center items-center px-4 py-24"
          >
            <div className="w-full max-w-2xl mx-auto">
              {/* Section header */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6 }}
                className="mb-8"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-bold tracking-widest text-primary uppercase">{s.number}</span>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{i + 1} of {STEPS.length}</span>
                </div>
              </motion.div>

              {/* Form card */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="bg-card/80 backdrop-blur-md border border-border/50 rounded-2xl shadow-xl p-6 md:p-8"
              >
                {stepContent[i]}
              </motion.div>

              {/* Continue arrow / Submit */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex justify-center mt-8"
              >
                {i < STEPS.length - 1 ? (
                  <button
                    onClick={() => scrollToStep(i + 1)}
                    className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors group"
                  >
                    <span className="text-xs tracking-widest uppercase font-medium">Continue</span>
                    <motion.div
                      animate={{ y: [0, 5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <ChevronDown className="w-5 h-5" />
                    </motion.div>
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="relative flex items-center gap-3 px-10 py-4 text-base font-bold text-white rounded-2xl bg-primary overflow-hidden disabled:opacity-60"
                    style={{ boxShadow: '0 0 30px rgba(91,164,245,0.5), 0 4px 20px rgba(0,0,0,0.2)' }}
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
              </motion.div>

              {/* Back button */}
              {i > 0 && (
                <div className="flex justify-center mt-3">
                  <button onClick={() => scrollToStep(i - 1)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronUp className="w-3.5 h-3.5" /> Back to {STEPS[i - 1].label}
                  </button>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}