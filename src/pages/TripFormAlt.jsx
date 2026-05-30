import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import AgencyStep from "@/components/steps/AgencyStep";
import { toast } from "sonner";
import formatTripEmail from "@/utils/formatTripEmail";

const STEPS = [
  { id: "mission",   label: "MISSION",           number: "01" },
  { id: "route",     label: "ROUTE",              number: "02" },
  { id: "people",    label: "PEOPLE & CONTACTS",  number: "03" },
  { id: "vehicle",   label: "VEHICLE",            number: "04" },
  { id: "gear",      label: "GEAR",               number: "05" },
  { id: "contacts",  label: "CONTACTS",           number: "06" },
  { id: "agency",    label: "AGENCY",             number: "07" },
];

const GEAR_ITEMS = [
  "Water", "Food", "First aid kit",
  "Shelter", "Fire starter", "Extra clothing",
  "Flashlight / headlamp", "Map / compass", "Phone",
  "Satellite communicator", "Life jacket", "Knife / multitool",
];

const INITIAL_DATA = {
  primary_name: "", primary_age: "", primary_phone: "", primary_blood_type: "",
  emergency_device_type: "", total_participants: 1,
  park_name: "", visitor_center: "", travel_method: "", accommodation: "",
  arrival_datetime: "", departure_datetime: "", expected_return_datetime: "",
  activities: [], backup_activity: "",
  vehicle_make: "", vehicle_model: "", vehicle_color: "", vehicle_license: "",
  vessel_make: "", vessel_model: "", vessel_color: "",
  bicycle_make: "", bicycle_model: "", bicycle_color: "",
  camping_tent: "", backpack_description: "", other_equipment: "",
  gear_checklist: [],
  share_with_agency: true,
};

const BG = "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&auto=format&fit=crop";

function Field({ label, children }) {
  return (
    <div className="mb-6">
      <label className="block text-xs font-bold tracking-[0.15em] mb-2 uppercase text-foreground/60">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-white/70 text-sm px-4 py-3 focus:outline-none transition-colors font-inter" +
  " border border-white/50 focus:border-accent/60 text-foreground placeholder:text-foreground/30 rounded-lg backdrop-blur-sm";

export default function TripFormAlt() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(INITIAL_DATA);
  const [contacts, setContacts] = useState([{ contact_name: "", contact_email: "", contact_phone: "", relationship: "family" }]);
  const [submitting, setSubmitting] = useState(false);

  const upd = (field) => (e) => setFormData(p => ({ ...p, [field]: e.target.value }));

  const goTo = (i) => { setStep(i); window.scrollTo({ top: 0 }); };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const tripPlan = await base44.entities.TripPlan.create({ ...formData, status: "active" });
      const portalUrl = `${window.location.origin}/family?id=${tripPlan.id}`;
      const emailBody = formatTripEmail(formData, portalUrl);
      const subject = `Trip Plan Filed: ${formData.primary_name || "Traveler"} — ${formData.park_name || "Outdoor Trip"}`;
      const validContacts = contacts.filter(c => c.contact_name && c.contact_email);
      await Promise.allSettled(validContacts.map(c =>
        base44.entities.EmergencyContact.create({ trip_plan_id: tripPlan.id, contact_name: c.contact_name, contact_email: c.contact_email, contact_phone: c.contact_phone, relationship: c.relationship, notification_sent: true })
      ));
      await Promise.allSettled(validContacts.map(c =>
        base44.functions.invoke('sendEmail', { to: c.contact_email, subject, body: emailBody })
      ));
      navigate("/confirmation?id=" + tripPlan.id);
    } catch (err) {
      toast.error("Something went wrong: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <>
          <Field label="Activity Type">
            <select className={inputCls} value={formData.travel_method} onChange={upd("travel_method")}>
              <option value="">Select activity...</option>
              {["Hiking","Backpacking","Fishing","Hunting","Climbing","Kayaking","Mountain Biking","Skiing","Off-Road","Camping","Other"].map(a => <option key={a}>{a}</option>)}
            </select>
          </Field>
          <Field label="Primary Destination">
            <input className={inputCls} placeholder="Park, wilderness area, or location name" value={formData.park_name} onChange={upd("park_name")} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Departure Date & Time">
              <input type="datetime-local" className={inputCls} value={formData.departure_datetime} onChange={upd("departure_datetime")} />
            </Field>
            <Field label="Expected Return Date & Time">
              <input type="datetime-local" className={inputCls} value={formData.expected_return_datetime} onChange={upd("expected_return_datetime")} />
            </Field>
          </div>
        </>
      );
      case 1: return (
        <>
          <Field label="Visitor Center / Trailhead">
            <input className={inputCls} placeholder="Nearest visitor center or trailhead" value={formData.visitor_center} onChange={upd("visitor_center")} />
          </Field>
          <Field label="Accommodation">
            <input className={inputCls} placeholder="Camp name, cabin, hotel, etc." value={formData.accommodation} onChange={upd("accommodation")} />
          </Field>
          <Field label="Backup / Alternate Activity">
            <input className={inputCls} placeholder="What will you do if the primary plan changes?" value={formData.backup_activity} onChange={upd("backup_activity")} />
          </Field>
        </>
      );
      case 2: return (
        <>
          <Field label="Lead Person Name">
            <input className={inputCls} placeholder="Full name" value={formData.primary_name} onChange={upd("primary_name")} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Age">
              <input className={inputCls} placeholder="Age" value={formData.primary_age} onChange={upd("primary_age")} />
            </Field>
            <Field label="Phone Number">
              <input className={inputCls} placeholder="+1 555 000 0000" value={formData.primary_phone} onChange={upd("primary_phone")} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Blood Type">
              <input className={inputCls} placeholder="e.g. O+" value={formData.primary_blood_type} onChange={upd("primary_blood_type")} />
            </Field>
            <Field label="Total Participants">
              <input type="number" className={inputCls} min={1} value={formData.total_participants} onChange={upd("total_participants")} />
            </Field>
          </div>
          <Field label="Emergency Device">
            <input className={inputCls} placeholder="Satellite communicator, PLB, etc." value={formData.emergency_device_type} onChange={upd("emergency_device_type")} />
          </Field>
        </>
      );
      case 3: return (
        <>
          <Field label="Vehicle Make & Model">
            <div className="grid grid-cols-2 gap-4">
              <input className={inputCls} placeholder="Make" value={formData.vehicle_make} onChange={upd("vehicle_make")} />
              <input className={inputCls} placeholder="Model" value={formData.vehicle_model} onChange={upd("vehicle_model")} />
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Color">
              <input className={inputCls} placeholder="e.g. Silver" value={formData.vehicle_color} onChange={upd("vehicle_color")} />
            </Field>
            <Field label="License Plate">
              <input className={inputCls} placeholder="Plate number" value={formData.vehicle_license} onChange={upd("vehicle_license")} />
            </Field>
          </div>
          <Field label="Vessel (if applicable)">
            <div className="grid grid-cols-3 gap-3">
              <input className={inputCls} placeholder="Make" value={formData.vessel_make} onChange={upd("vessel_make")} />
              <input className={inputCls} placeholder="Model" value={formData.vessel_model} onChange={upd("vessel_model")} />
              <input className={inputCls} placeholder="Color" value={formData.vessel_color} onChange={upd("vessel_color")} />
            </div>
          </Field>
        </>
      );
      case 4: {
        const toggleGear = (item) => {
          const list = formData.gear_checklist || [];
          setFormData(p => ({
            ...p,
            gear_checklist: list.includes(item) ? list.filter(g => g !== item) : [...list, item],
          }));
        };
        return (
          <>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {GEAR_ITEMS.map(item => {
                const checked = (formData.gear_checklist || []).includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleGear(item)}
                    className={`flex items-center gap-3 px-4 py-3 border rounded-lg text-sm text-left transition-all ${
                      checked
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-accent/20 bg-white/50 text-foreground/70 hover:border-accent/40"
                    }`}
                  >
                    <div className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-all ${
                      checked ? "bg-accent border-accent" : "border-foreground/30"
                    }`}>
                      {checked && <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 fill-white"><path d="M1 4l3 3 5-6"/></svg>}
                    </div>
                    {item}
                  </button>
                );
              })}
            </div>
            <Field label="Other Notable Equipment">
              <textarea className={`${inputCls} h-20 resize-none`} placeholder="Any other gear that may aid identification or rescue" value={formData.other_equipment} onChange={upd("other_equipment")} />
            </Field>
          </>
        );
      }
      case 5: return (
        <>
          <p className="text-xs text-foreground/50 mb-5 tracking-wide">These contacts will receive your trip plan and the family monitoring portal link via email.</p>
          {contacts.map((c, i) => (
            <div key={i} className="border border-accent/20 bg-white/50 backdrop-blur-sm rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold tracking-widest text-accent/40">CONTACT {String(i + 1).padStart(2, "0")}</span>
                {contacts.length > 1 && <button onClick={() => setContacts(cs => cs.filter((_, j) => j !== i))} className="text-xs text-red-500 hover:text-red-700">REMOVE</button>}
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input className={inputCls} placeholder="Full name" value={c.contact_name} onChange={e => setContacts(cs => cs.map((x, j) => j === i ? { ...x, contact_name: e.target.value } : x))} />
                <input className={inputCls} placeholder="Email address" value={c.contact_email} onChange={e => setContacts(cs => cs.map((x, j) => j === i ? { ...x, contact_email: e.target.value } : x))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className={inputCls} placeholder="Phone number" value={c.contact_phone} onChange={e => setContacts(cs => cs.map((x, j) => j === i ? { ...x, contact_phone: e.target.value } : x))} />
                <select className={inputCls} value={c.relationship} onChange={e => setContacts(cs => cs.map((x, j) => j === i ? { ...x, relationship: e.target.value } : x))}>
                  <option value="family">Family</option>
                  <option value="friend">Friend</option>
                  <option value="colleague">Colleague</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          ))}
          <button onClick={() => setContacts(cs => [...cs, { contact_name: "", contact_email: "", contact_phone: "", relationship: "family" }])} className="text-xs font-bold tracking-widest text-accent/50 hover:text-accent border border-dashed border-accent/30 rounded-lg w-full py-3 transition-colors">+ ADD CONTACT</button>
        </>
      );
      case 6: return <AgencyStep formData={formData} setFormData={setFormData} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex font-inter relative">
      {/* Nature background */}
      <div className="fixed inset-0 z-0">
        <img src={BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Sidebar */}
      <div className="relative z-10 w-72 shrink-0 flex flex-col border-r border-white/15 bg-black/40 backdrop-blur-xl">
        {/* Big logo */}
        <div className="px-6 pt-8 pb-6 border-b border-white/15 flex flex-col items-center text-center">
          <img
            src="https://media.base44.com/images/public/6a1b2bf2fc37b8175a269ec2/b59cfd204_ChatGPTImageMay30202601_47_28PM.png"
            alt="SafeReturn"
            className="h-28 w-auto object-contain"
          />
          <span className="mt-2 text-white/70 text-sm font-semibold tracking-widest uppercase">SafeReturn</span>
        </div>

        {/* Steps nav */}
        <div className="px-6 pt-6">
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
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col">
        <div className="flex-1 m-4 ml-0 flex flex-col bg-white/80 backdrop-blur-2xl rounded-r-2xl overflow-hidden shadow-2xl">
          <div className="flex-1 p-10 overflow-y-auto">
            <p className="text-[10px] font-bold tracking-[0.2em] mb-2 text-accent/50">SECTION {STEPS[step].number}</p>
            <h1 className="text-3xl font-black tracking-tight mb-4 text-accent">{STEPS[step].label}</h1>
            <div className="border-t border-accent/20 mb-8" />
            {renderStep()}
          </div>

          {/* Continue button */}
          <div className="border-t border-accent/15">
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => goTo(step + 1)}
                className="w-full py-5 text-xs font-black tracking-[0.25em] text-white bg-accent hover:bg-accent/90 transition-colors"
              >
                CONTINUE
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-5 text-xs font-black tracking-[0.25em] text-white bg-accent hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> FILING PLAN...</> : "FILE TRIP PLAN"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}