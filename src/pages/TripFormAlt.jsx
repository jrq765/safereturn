import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, ArrowLeft, Upload, X } from "lucide-react";
import AgencyStep from "@/components/steps/AgencyStep";
import { toast } from "sonner";
import formatTripEmail from "@/utils/formatTripEmail";
import moment from "moment";

const STEPS = [
  { id: "mission",      label: "MISSION",           number: "01" },
  { id: "route",        label: "ROUTE",              number: "02" },
  { id: "people",       label: "PEOPLE & CONTACTS",  number: "03" },
  { id: "vehicle",      label: "VEHICLE",            number: "04" },
  { id: "gear",         label: "GEAR",               number: "05" },
  { id: "medical",      label: "MEDICAL",            number: "06" },
  { id: "agency",       label: "AGENCY",             number: "07" },
  { id: "confirmation", label: "CONFIRMATION",       number: "08" },
];

const GEAR_ITEMS = [
  "Water", "Food", "First aid kit",
  "Shelter", "Fire starter", "Extra clothing",
  "Flashlight / headlamp", "Map / compass", "Phone",
  "Satellite communicator", "Life jacket", "Knife / multitool",
];

const DEFAULT_GEAR = ["Water", "Food", "Phone"];

const INITIAL_DATA = {
  travel_method: "",
  park_name: "",
  departure_datetime: "",
  expected_return_datetime: "",
  route_notes: "",
  county_region: "",
  last_planned_location: "",
  primary_name: "",
  primary_phone: "",
  primary_age: "",
  total_participants: 1,
  gear_checklist: [...DEFAULT_GEAR],
  other_equipment: "",
  allergies: "",
  medications: "",
  medical_conditions: "",
  primary_blood_type: "",
  emergency_medical_notes: "",
  share_with_agency: true,
  confirmed_return: false,
};

const BG = "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&auto=format&fit=crop";

function Field({ label, children, className = "" }) {
  return (
    <div className={`mb-5 ${className}`}>
      <label className="block text-xs font-bold tracking-[0.15em] mb-2 uppercase text-foreground/50">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-white/70 text-sm px-4 py-3 focus:outline-none transition-colors font-inter border border-white/50 focus:border-accent/60 text-foreground placeholder:text-foreground/30 rounded-lg backdrop-blur-sm";
const textareaCls = `${inputCls} resize-none`;

export default function TripFormAlt() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(INITIAL_DATA);
  const [extraPeople, setExtraPeople] = useState([]);
  const [contacts, setContacts] = useState([{ contact_name: "", relationship: "family", contact_phone: "", contact_email: "" }]);
  const [vehicles, setVehicles] = useState([{ vehicle_make: "", vehicle_model: "", vehicle_color: "", vehicle_license: "", vehicle_location: "" }]);
  const [submitting, setSubmitting] = useState(false);

  const upd = (field) => (e) => setFormData(p => ({ ...p, [field]: e.target.value }));

  const goTo = (i) => { setStep(i); window.scrollTo({ top: 0 }); };

  const toggleGear = (item) => {
    const list = formData.gear_checklist || [];
    setFormData(p => ({
      ...p,
      gear_checklist: list.includes(item) ? list.filter(g => g !== item) : [...list, item],
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const validContacts = contacts.filter(c => c.contact_name && c.contact_email);
      if (validContacts.length === 0) {
        toast.error("Please add at least one emergency contact.");
        setSubmitting(false);
        return;
      }

      const planData = {
        ...formData,
        status: "active",
        other_contacts: extraPeople,
        vehicle_make: vehicles[0]?.vehicle_make || "",
        vehicle_model: vehicles[0]?.vehicle_model || "",
        vehicle_color: vehicles[0]?.vehicle_color || "",
        vehicle_license: vehicles[0]?.vehicle_license || "",
        authority_contacts: [],
      };
      const tripPlan = await base44.entities.TripPlan.create(planData);
      const portalUrl = `${window.location.origin}/family?id=${tripPlan.id}`;

      // Create emergency contact records
      const contactIds = await Promise.allSettled(
        validContacts.map(c =>
          base44.entities.EmergencyContact.create({
            trip_plan_id: tripPlan.id,
            contact_name: c.contact_name,
            contact_email: c.contact_email,
            contact_phone: c.contact_phone,
            relationship: c.relationship,
            notification_sent: false,
          })
        )
      );

      // Build and send custom emergency contact email
      const emergencyEmailBody = `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #6BB2FD; margin-bottom: 20px;">SafeReturn: Trip Plan Filed</h2>
          
          <p style="margin-bottom: 16px;">
            <strong>${formData.primary_name || "A traveler"}</strong> has filed a trip plan with SafeReturn and listed you as an emergency contact.
          </p>
          
          <div style="background: #f5f5f5; border-left: 4px solid #6BB2FD; padding: 16px; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong>Destination:</strong> ${formData.park_name || "Outdoor Activity"}</p>
            <p style="margin: 8px 0;"><strong>Expected Return:</strong> ${formData.expected_return_datetime ? moment(formData.expected_return_datetime).format("MMM D, YYYY [at] h:mm A") : "Not specified"}</p>
            <p style="margin: 8px 0;"><strong>Activity Type:</strong> ${formData.travel_method || "—"}</p>
          </div>
          
          <p style="margin-bottom: 16px;">
            <strong>Monitor their trip status and location updates:</strong>
          </p>
          
          <a href="${portalUrl}" style="display: inline-block; background-color: #6BB2FD; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-bottom: 20px;">
            VIEW TRIP PLAN & LOCATION
          </a>
          
          <p style="color: #666; font-size: 14px; margin-top: 24px;">
            Save this link. If they don't return by the expected time, you can use this portal to contact authorities or request assistance.
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;" />
          <p style="color: #999; font-size: 12px;">
            You're receiving this because you're listed as an emergency contact for this trip plan.
          </p>
        </div>
      `;

      const subject = `🔔 Trip Plan Filed: ${formData.primary_name || "Traveler"} — ${formData.park_name || "Outdoor Trip"}`;
      
      // Send emails and track results
      const emailResults = await Promise.all(
        validContacts.map(async (c) => {
          try {
            const result = await base44.functions.invoke('sendEmail', {
              to: c.contact_email,
              subject,
              body: emergencyEmailBody,
            });
            return {
              name: c.contact_name,
              to: c.contact_email,
              type: "contact",
              success: result?.data?.success === true,
              error: result?.data?.success === false ? result?.data?.error : null,
            };
          } catch (err) {
            return {
              name: c.contact_name,
              to: c.contact_email,
              type: "contact",
              success: false,
              error: err?.message || "Network error",
            };
          }
        })
      );

      // Store results in sessionStorage for Confirmation page
      sessionStorage.setItem(`email_results_${tripPlan.id}`, JSON.stringify(emailResults));

      const successCount = emailResults.filter(r => r.success).length;
      const failCount = emailResults.filter(r => !r.success).length;
      
      if (successCount > 0) {
        toast.success(`Plan filed! ${successCount} email${successCount !== 1 ? "s" : ""} sent.`);
      }
      if (failCount > 0) {
        toast.warning(`${failCount} email${failCount !== 1 ? "s" : ""} failed to send.`);
      }

      navigate("/confirmation?id=" + tripPlan.id);
    } catch (err) {
      toast.error("Something went wrong: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const fmtDt = (v) => v ? moment(v).format("MMM D, YYYY [at] h:mm A") : "—";

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <>
          <Field label="Activity Type">
            <select className={inputCls} value={formData.travel_method} onChange={upd("travel_method")}>
              <option value="">Select activity...</option>
              {["Hiking","Boating","Rafting","Fishing","Hunting","Camping","Climbing","Skiing","Other"].map(a => <option key={a}>{a}</option>)}
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
          <Field label="Route Notes">
            <textarea className={`${textareaCls} h-32`} placeholder="Trail access, turnaround points, alternate routes" value={formData.route_notes} onChange={upd("route_notes")} />
          </Field>
          <Field label="County / Region">
            <input className={inputCls} placeholder="e.g. Lane County, OR" value={formData.county_region} onChange={upd("county_region")} />
          </Field>
          <Field label="Last Planned Location / Map Notes">
            <input className={inputCls} placeholder="Optional — trailhead, coordinates, landmark" value={formData.last_planned_location} onChange={upd("last_planned_location")} />
          </Field>
        </>
      );

      case 2: return (
        <>
          <div className="mb-6">
            <p className="text-xs font-bold tracking-[0.15em] uppercase text-foreground/50 mb-3">MAIN TRAVELER</p>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Name" className="mb-0">
                <input className={inputCls} placeholder="Full name" value={formData.primary_name} onChange={upd("primary_name")} />
              </Field>
              <Field label="Phone" className="mb-0">
                <input className={inputCls} placeholder="+1 555 000 0000" value={formData.primary_phone} onChange={upd("primary_phone")} />
              </Field>
              <Field label="Age" className="mb-0">
                <input className={inputCls} placeholder="Age" value={formData.primary_age} onChange={upd("primary_age")} />
              </Field>
            </div>
          </div>

          {extraPeople.length > 0 && extraPeople.map((p, i) => (
            <div key={i} className="border border-accent/20 bg-white/40 rounded-xl p-4 mb-3">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold tracking-widest text-accent/40">PERSON {i + 2}</span>
                <button onClick={() => setExtraPeople(ps => ps.filter((_, j) => j !== i))} className="text-xs text-red-500">REMOVE</button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input className={inputCls} placeholder="Full name" value={p.name} onChange={e => setExtraPeople(ps => ps.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                <input className={inputCls} placeholder="Phone" value={p.phone} onChange={e => setExtraPeople(ps => ps.map((x, j) => j === i ? { ...x, phone: e.target.value } : x))} />
                <input className={inputCls} placeholder="Age" value={p.age} onChange={e => setExtraPeople(ps => ps.map((x, j) => j === i ? { ...x, age: e.target.value } : x))} />
              </div>
            </div>
          ))}
          <button onClick={() => setExtraPeople(ps => [...ps, { name: "", phone: "", age: "" }])} className="text-xs font-bold tracking-widest text-accent/50 hover:text-accent transition-colors mb-6">+ Add Person</button>

          <div className="border-t border-accent/20 pt-5">
            <p className="text-xs font-bold tracking-[0.15em] uppercase text-foreground/50 mb-3">EMERGENCY CONTACTS</p>
            {contacts.map((c, i) => (
              <div key={i} className="border border-accent/20 bg-white/40 rounded-xl p-4 mb-3">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold tracking-widest text-accent/40">CONTACT {String(i + 1).padStart(2, "0")}</span>
                  {contacts.length > 1 && <button onClick={() => setContacts(cs => cs.filter((_, j) => j !== i))} className="text-xs text-red-500">REMOVE</button>}
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input className={inputCls} placeholder="Full name" value={c.contact_name} onChange={e => setContacts(cs => cs.map((x, j) => j === i ? { ...x, contact_name: e.target.value } : x))} />
                  <select className={inputCls} value={c.relationship} onChange={e => setContacts(cs => cs.map((x, j) => j === i ? { ...x, relationship: e.target.value } : x))}>
                    <option value="family">Family</option>
                    <option value="friend">Friend</option>
                    <option value="colleague">Colleague</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input className={inputCls} placeholder="Phone number" value={c.contact_phone} onChange={e => setContacts(cs => cs.map((x, j) => j === i ? { ...x, contact_phone: e.target.value } : x))} />
                  <input className={inputCls} placeholder="Email address" value={c.contact_email} onChange={e => setContacts(cs => cs.map((x, j) => j === i ? { ...x, contact_email: e.target.value } : x))} />
                </div>
              </div>
            ))}
            <button onClick={() => setContacts(cs => [...cs, { contact_name: "", relationship: "family", contact_phone: "", contact_email: "" }])} className="text-xs font-bold tracking-widest text-accent/50 hover:text-accent transition-colors">+ Add Contact</button>
          </div>
        </>
      );

      case 3: return (
        <>
          {vehicles.map((v, i) => (
            <div key={i} className="border border-accent/20 bg-white/40 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold tracking-widest text-accent/40">VEHICLE {i + 1}</span>
                {vehicles.length > 1 && <button onClick={() => setVehicles(vs => vs.filter((_, j) => j !== i))} className="text-xs text-red-500">REMOVE</button>}
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input className={inputCls} placeholder="Make" value={v.vehicle_make} onChange={e => setVehicles(vs => vs.map((x, j) => j === i ? { ...x, vehicle_make: e.target.value } : x))} />
                <input className={inputCls} placeholder="Model" value={v.vehicle_model} onChange={e => setVehicles(vs => vs.map((x, j) => j === i ? { ...x, vehicle_model: e.target.value } : x))} />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input className={inputCls} placeholder="Color" value={v.vehicle_color} onChange={e => setVehicles(vs => vs.map((x, j) => j === i ? { ...x, vehicle_color: e.target.value } : x))} />
                <input className={inputCls} placeholder="License Plate" value={v.vehicle_license} onChange={e => setVehicles(vs => vs.map((x, j) => j === i ? { ...x, vehicle_license: e.target.value } : x))} />
              </div>
              <input className={`${inputCls} mb-3`} placeholder="Parking / Trailhead Location" value={v.vehicle_location} onChange={e => setVehicles(vs => vs.map((x, j) => j === i ? { ...x, vehicle_location: e.target.value } : x))} />
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const { file_url } = await base44.integrations.Core.UploadFile({ file });
                      setVehicles(vs => vs.map((x, j) => j === i ? { ...x, vehicle_photo: file_url } : x));
                      toast.success("Vehicle photo uploaded");
                    } catch (err) {
                      toast.error("Photo upload failed: " + err.message);
                    }
                  }}
                  className="hidden"
                  id={`vehicle-photo-${i}`}
                />
                <label
                  htmlFor={`vehicle-photo-${i}`}
                  className="border-2 border-dashed border-accent/20 rounded-lg flex items-center justify-center h-20 text-xs text-foreground/30 font-medium tracking-widest cursor-pointer hover:border-accent/40 transition-colors flex-col gap-2"
                >
                  {v.vehicle_photo ? (
                    <>
                      <img src={v.vehicle_photo} alt="Vehicle" className="h-16 w-auto object-contain rounded" />
                      <span className="text-[10px] text-accent/50">CHANGE PHOTO</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      VEHICLE PHOTO (optional)
                    </>
                  )}
                </label>
              </div>
            </div>
          ))}
          <button onClick={() => setVehicles(vs => [...vs, { vehicle_make: "", vehicle_model: "", vehicle_color: "", vehicle_license: "", vehicle_location: "", vehicle_photo: "" }])} className="text-xs font-bold tracking-widest text-accent/50 hover:text-accent transition-colors">+ Add Vehicle</button>
        </>
      );

      case 4: return (
        <>
          <div className="grid grid-cols-3 gap-2 mb-5">
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
          <Field label="Other Gear Notes">
            <textarea className={`${textareaCls} h-20`} placeholder="Any other gear that may aid identification or rescue" value={formData.other_equipment} onChange={upd("other_equipment")} />
          </Field>
        </>
      );

      case 5: return (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Allergies">
              <input className={inputCls} placeholder="e.g. Penicillin, bee stings" value={formData.allergies} onChange={upd("allergies")} />
            </Field>
            <Field label="Medications">
              <input className={inputCls} placeholder="Current medications" value={formData.medications} onChange={upd("medications")} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Medical Conditions">
              <input className={inputCls} placeholder="Relevant conditions" value={formData.medical_conditions} onChange={upd("medical_conditions")} />
            </Field>
            <Field label="Blood Type (Optional)">
              <input className={inputCls} placeholder="e.g. O+" value={formData.primary_blood_type} onChange={upd("primary_blood_type")} />
            </Field>
          </div>
          <Field label="Emergency Medical Notes">
            <textarea className={`${textareaCls} h-24`} placeholder="Anything else responders should know" value={formData.emergency_medical_notes} onChange={upd("emergency_medical_notes")} />
          </Field>
        </>
      );

      case 6: return <AgencyStep formData={formData} setFormData={setFormData} />;

      case 7: {
        const v = vehicles[0] || {};
        const gearList = (formData.gear_checklist || []).join(", ") || "—";
        const medSummary = [formData.allergies, formData.medications, formData.medical_conditions].filter(Boolean).join("; ") || "—";
        const returnStr = formData.expected_return_datetime
          ? moment(formData.expected_return_datetime).format("h:mm A [on] MMMM D, YYYY")
          : "[return time not set]";

        const summaryRows = [
          ["Activity Type", formData.travel_method || "—"],
          ["Primary Destination", formData.park_name || "—"],
          ["Departure", fmtDt(formData.departure_datetime)],
          ["Expected Return", fmtDt(formData.expected_return_datetime)],
          ["County / Region", formData.county_region || "—"],
          ["Last Planned Location", formData.last_planned_location || "—"],
          ["Main Traveler", [formData.primary_name, formData.primary_age && `Age ${formData.primary_age}`, formData.primary_phone].filter(Boolean).join(" · ") || "—"],
          ["Emergency Contacts", contacts.filter(c => c.contact_name).map(c => `${c.contact_name} (${c.relationship})`).join(", ") || "—"],
          ["Vehicle", [v.vehicle_make, v.vehicle_model, v.vehicle_color, v.vehicle_license].filter(Boolean).join(" ") || "—"],
          ["Gear", gearList],
          ["Medical", medSummary],
          ["Agency Sharing", formData.share_with_agency ? "Yes — shared with public safety dashboard" : "No"],
        ];

        return (
          <>
            <div className="border border-accent/20 rounded-xl overflow-hidden mb-6">
              {summaryRows.map(([label, value], i) => (
                <div key={label} className={`flex gap-4 px-5 py-3 text-sm ${i % 2 === 0 ? "bg-white/40" : "bg-white/20"}`}>
                  <span className="text-xs font-bold tracking-[0.12em] uppercase text-foreground/40 w-40 shrink-0 pt-0.5">{label}</span>
                  <span className="text-foreground/80 break-words">{value}</span>
                </div>
              ))}
            </div>

            <div className="bg-accent/5 border border-accent/20 rounded-xl p-5 mb-5">
              <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                I confirm I am planning to return back to my vehicle at approximately{" "}
                <span className="text-accent font-bold">{returnStr}</span>.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setFormData(p => ({ ...p, confirmed_return: !p.confirmed_return }))}
              className={`flex items-start gap-3 w-full text-left transition-all mb-1 p-1 rounded-lg`}
            >
              <div className={`w-5 h-5 mt-0.5 shrink-0 rounded border-2 flex items-center justify-center transition-all ${
                formData.confirmed_return ? "bg-accent border-accent" : "border-foreground/30"
              }`}>
                {formData.confirmed_return && <svg viewBox="0 0 10 8" className="w-3 h-3 fill-white"><path d="M1 4l3 3 5-6"/></svg>}
              </div>
              <span className="text-sm text-foreground/70 leading-relaxed">
                I understand that if I do not return around this time, my emergency contacts should use this plan to help responders.
              </span>
            </button>
          </>
        );
      }

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
            {renderStep()}
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
                disabled={submitting || !formData.confirmed_return}
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