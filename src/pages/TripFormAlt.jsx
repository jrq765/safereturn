import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, Send, ChevronUp, MapPin, Navigation } from "lucide-react";
import { jsPDF } from "jspdf";
import AgencyStep from "@/components/steps/AgencyStep";
import { toast } from "sonner";
import formatTripEmail from "@/utils/formatTripEmail";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";

// ─── Step config ────────────────────────────────────────────────────────────
const STEPS = [
  { id: "mission",      label: "Mission",          number: "01" },
  { id: "route",        label: "Route",            number: "02" },
  { id: "people",       label: "People",           number: "03" },
  { id: "contacts",     label: "Contacts",         number: "04" },
  { id: "vehicle",      label: "Vehicle",          number: "05" },
  { id: "gear",         label: "Gear",             number: "06" },
  { id: "medical",      label: "Medical",          number: "07" },
  { id: "agency",       label: "Agency",           number: "08" },
  { id: "confirm",      label: "Confirm & File",   number: "09" },
];

// ─── Cinematic backgrounds per step ─────────────────────────────────────────
const STEP_VIDEOS = [
  { src: "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-river-running-through-a-forest-41892-large.mp4", poster: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&auto=format&fit=crop" },
  { src: "https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4",                    poster: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&auto=format&fit=crop" },
  { src: "https://assets.mixkit.co/videos/preview/mixkit-clouds-and-blue-sky-2408-large.mp4",                             poster: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&auto=format&fit=crop" },
  { src: "https://assets.mixkit.co/videos/preview/mixkit-rocky-mountain-river-flowing-through-a-forest-41888-large.mp4",  poster: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&auto=format&fit=crop" },
  { src: "https://assets.mixkit.co/videos/preview/mixkit-landscape-with-mountains-at-sunset-4119-large.mp4",              poster: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1920&auto=format&fit=crop" },
  { src: "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-river-running-through-a-forest-41892-large.mp4", poster: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&auto=format&fit=crop" },
  { src: "https://assets.mixkit.co/videos/preview/mixkit-clouds-and-blue-sky-2408-large.mp4",                             poster: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1920&auto=format&fit=crop" },
  { src: "https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4",                    poster: "https://images.unsplash.com/photo-1682686581551-867e0b208bd1?w=1920&auto=format&fit=crop" },
  { src: "https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1610-large.mp4",                       poster: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920&auto=format&fit=crop" },
];

const GEAR_ITEMS = [
  "Water", "Food", "First aid kit",
  "Shelter", "Fire starter", "Extra clothing",
  "Flashlight / headlamp", "Map / compass", "Phone",
  "Satellite communicator", "Life jacket", "Knife / multitool",
];

const INITIAL_DATA = {
  travel_method: "",
  park_name: "",
  departure_datetime: "",
  expected_return_datetime: "",
  route_notes: "",
  county_region: "",
  last_planned_location: "",
  visitor_center: "",
  accommodation: "",
  primary_name: "",
  primary_email: "",
  primary_phone: "",
  primary_age: "",
  primary_blood_type: "",
  emergency_device_types: [],
  emergency_device_other: "",
  accommodation_yes: false,
  accommodation_type: "",
  departure_from_park_datetime: "",
  total_participants: 1,
  gear_checklist: [],
  other_equipment: "",
  allergies: "",
  medications: "",
  medical_conditions: "",
  emergency_medical_notes: "",
  share_with_agency: true,
  confirmed_return: false,
  backup_activity: "",
};

// ─── Reusable field wrapper ──────────────────────────────────────────────────
function Field({ label, children, hint }) {
  return (
    <div className="mb-5">
      <label className="block text-xs font-bold tracking-[0.15em] mb-1.5 uppercase text-white/70">{label}</label>
      {hint && <p className="text-[11px] text-white/40 mb-2 leading-relaxed">{hint}</p>}
      {children}
    </div>
  );
}

const inputCls = "w-full bg-white/15 text-sm px-4 py-3 focus:outline-none transition-colors font-inter border border-white/30 focus:border-white/60 focus:bg-white/20 text-white placeholder:text-white/40 rounded-lg backdrop-blur-sm";
const textareaCls = `${inputCls} resize-none`;
const selectCls = `${inputCls} appearance-none`;

// ─── Main component ──────────────────────────────────────────────────────────
export default function TripFormAlt() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(INITIAL_DATA);
  const [extraPeople, setExtraPeople] = useState([]);
  const [contacts, setContacts] = useState([{ contact_name: "", relationship: "family", contact_phone: "", contact_email: "" }]);
  const [vehicles, setVehicles] = useState([{ vehicle_make: "", vehicle_model: "", vehicle_color: "", vehicle_license: "", vehicle_location: "" }]);
  const [submitting, setSubmitting] = useState(false);

  const [locating, setLocating] = useState(false);

  const upd = (field) => (e) => setFormData(p => ({ ...p, [field]: e.target.value }));

  const goTo = (i) => { setStep(i); window.scrollTo({ top: 0 }); };

  const useMyLocation = async () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`, { headers: { "Accept-Language": "en" } });
        const data = await res.json();
        const a = data.address || {};
        const park = a.park || a.nature_reserve || a.leisure || a.tourism || a.suburb || a.village || a.town || a.city || data.display_name.split(",")[0];
        const county = [a.county, a.state].filter(Boolean).join(", ");
        setFormData(p => ({
          ...p,
          park_name: park || p.park_name,
          county_region: county || p.county_region,
          last_planned_location: `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`,
        }));
        toast.success("Location detected!");
      } catch { toast.error("Could not resolve location."); }
      setLocating(false);
    }, () => { toast.error("Location access denied."); setLocating(false); });
  };

  const [vehicleLocating, setVehicleLocating] = useState(false);

  const toggleGear = (item) => {
    const list = formData.gear_checklist || [];
    setFormData(p => ({
      ...p,
      gear_checklist: list.includes(item) ? list.filter(g => g !== item) : [...list, item],
    }));
  };

  const toggleDevice = (item) => {
    const list = formData.emergency_device_types || [];
    setFormData(p => ({
      ...p,
      emergency_device_types: list.includes(item) ? list.filter(d => d !== item) : [...list, item],
    }));
  };

  const pinVehicleLocation = (idx) => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
    setVehicleLocating(true);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`, { headers: { "Accept-Language": "en" } });
        const data = await res.json();
        const label = data.display_name?.split(",").slice(0, 3).join(",") || `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
        setVehicles(vs => vs.map((v, j) => j === idx ? { ...v, vehicle_location: label } : v));
        toast.success("Location pinned!");
      } catch { toast.error("Could not resolve location."); }
      setVehicleLocating(false);
    }, () => { toast.error("Location access denied."); setVehicleLocating(false); });
  };

  // ─── Submit ────────────────────────────────────────────────────────────────
  const generatePdfBase64 = (planData, validContacts) => {
    const doc = new jsPDF();
    const lh = 7;
    let y = 20;
    const line = (text, indent = 20) => {
      const lines = doc.splitTextToSize(String(text || "—"), 170 - (indent - 20));
      doc.text(lines, indent, y);
      y += lh * lines.length;
    };
    const section = (title) => {
      y += 4;
      doc.setFillColor(30, 80, 140);
      doc.rect(15, y - 5, 180, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(title, 20, y);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      y += lh + 2;
    };
    const field = (label, value) => {
      doc.setFont("helvetica", "bold");
      doc.text(label + ":", 20, y);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(String(value || "—"), 135);
      doc.text(lines, 65, y);
      y += lh * Math.max(1, lines.length);
    };

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 80, 140);
    doc.text("SafeReturn — Trip Plan", 20, y);
    y += 10;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${moment().format("MMMM D, YYYY [at] h:mm A")}`, 20, y);
    y += 10;
    doc.setTextColor(0, 0, 0);

    section("MISSION");
    field("Activity", planData.travel_method);
    field("Destination", planData.park_name);
    field("County / Region", planData.county_region);
    field("Visitor Center", planData.visitor_center);
    field("Accommodation", planData.accommodation);
    field("Departure", planData.departure_datetime ? moment(planData.departure_datetime).format("MMM D, YYYY h:mm A") : "—");
    field("Expected Return", planData.expected_return_datetime ? moment(planData.expected_return_datetime).format("MMM D, YYYY h:mm A") : "—");

    section("ROUTE");
    field("Route Notes", planData.route_notes);
    field("Last Planned Location", planData.last_planned_location);
    field("Backup Activity", planData.backup_activity);
    field("Backup Start", planData.backup_start_location);
    field("Backup End", planData.backup_end_location);

    section("PEOPLE");
    field("Primary Traveler", planData.primary_name);
    field("Email", planData.primary_email);
    field("Phone", planData.primary_phone);
    field("Age", planData.primary_age);
    field("Blood Type", planData.primary_blood_type);
    field("Emergency Device", planData.emergency_device_type);
    if (planData.other_contacts?.length > 0) {
      planData.other_contacts.forEach((p, i) => {
        field(`Traveler ${i + 2}`, `${p.name}, Age ${p.age}, ${p.phone}`);
      });
    }

    section("EMERGENCY CONTACTS");
    validContacts.forEach((c, i) => {
      field(`Contact ${i + 1}`, `${c.contact_name} (${c.relationship}) — ${c.contact_phone} / ${c.contact_email}`);
    });

    section("VEHICLE");
    field("Make / Model", `${planData.vehicle_color} ${planData.vehicle_make} ${planData.vehicle_model}`.trim());
    field("License Plate", planData.vehicle_license);

    section("GEAR");
    field("Checklist", (planData.gear_checklist || []).join(", "));
    field("Other Equipment", planData.other_equipment);

    section("MEDICAL");
    field("Allergies", planData.allergies);
    field("Medications", planData.medications);
    field("Conditions", planData.medical_conditions);
    field("Emergency Notes", planData.emergency_medical_notes);

    return doc.output("datauristring").split(",")[1]; // base64 only
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const validContacts = contacts.filter(c => c.contact_name && c.contact_email);
      if (validContacts.length === 0) {
        toast.error("Please add at least one emergency contact with name and email.");
        setSubmitting(false);
        return;
      }

      const planData = {
        ...formData,
        status: "active",
        vehicle_make: vehicles[0]?.vehicle_make || "",
        vehicle_model: vehicles[0]?.vehicle_model || "",
        vehicle_color: vehicles[0]?.vehicle_color || "",
        vehicle_license: vehicles[0]?.vehicle_license || "",
        authority_contacts: [],
      };

      const pdfBase64 = generatePdfBase64(planData, validContacts.filter(c => c.contact_name && c.contact_email));
      const pdfAttachment = [{ filename: `SafeReturn-TripPlan-${formData.primary_name || "Trip"}.pdf`, content: pdfBase64 }];

      // Remove duplicate other_contacts from planData before saving
      const tripPlan = await base44.entities.TripPlan.create({ ...planData, other_contacts: extraPeople });
      const portalUrl = `${window.location.origin}/family?id=${tripPlan.id}`;

      // Create emergency contact records
      await Promise.allSettled(
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

      // Send to Zapier webhook
      try {
        await base44.functions.invoke('sendToZapier', {
          trip_id: tripPlan.id,
          portal_url: portalUrl,
          primary_name: formData.primary_name,
          primary_email: formData.primary_email,
          primary_phone: formData.primary_phone,
          primary_age: formData.primary_age,
          primary_blood_type: formData.primary_blood_type,
          emergency_device: formData.emergency_device_type,
          travel_method: formData.travel_method,
          park_name: formData.park_name,
          county_region: formData.county_region,
          visitor_center: formData.visitor_center,
          accommodation: formData.accommodation,
          departure_datetime: formData.departure_datetime,
          expected_return_datetime: formData.expected_return_datetime,
          route_notes: formData.route_notes,
          last_planned_location: formData.last_planned_location,
          backup_activity: formData.backup_activity,
          backup_start_location: formData.backup_start_location,
          backup_end_location: formData.backup_end_location,
          gear_checklist: (formData.gear_checklist || []).join(", "),
          other_equipment: formData.other_equipment,
          allergies: formData.allergies,
          medications: formData.medications,
          medical_conditions: formData.medical_conditions,
          emergency_medical_notes: formData.emergency_medical_notes,
          vehicle: vehicles.map(v => `${v.vehicle_color} ${v.vehicle_make} ${v.vehicle_model} (${v.vehicle_license}) @ ${v.vehicle_location}`).join(" | "),
          emergency_contacts: validContacts.map(c => `${c.contact_name} (${c.relationship}): ${c.contact_phone} / ${c.contact_email}`).join(" | "),
          group_size: formData.total_participants,
          extra_people: extraPeople.map(p => `${p.name}, Age ${p.age}, ${p.phone}`).join(" | "),
        });
      } catch (zapErr) {
        console.warn("Zapier webhook failed:", zapErr.message);
        // Non-blocking — continue even if Zapier fails
      }

      // Build notification email
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
          <p style="margin-bottom: 16px; text-align: center;">
            <a href="${portalUrl}" style="display: inline-block; background-color: #6BB2FD; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              VIEW TRIP PLAN & LOCATION
            </a>
          </p>
          <p style="color: #666; font-size: 14px; margin-top: 24px;">
            Save this link. If they do not return by the expected time, use this portal to contact authorities or request assistance.
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;" />
          <p style="color: #999; font-size: 12px;">You are receiving this because you are listed as an emergency contact for this trip plan.</p>
        </div>
      `;
      const subject = `Trip Plan Filed: ${formData.primary_name || "Traveler"} — ${formData.park_name || "Outdoor Trip"}`;

      // Send confirmation copy to primary traveler
      if (formData.primary_email) {
        base44.functions.invoke('sendEmail', {
          to: formData.primary_email,
          subject: `[Your Copy] ${subject}`,
          body: emergencyEmailBody + `<br/><br/><hr/><p style="color:#888;font-size:12px">This is your confirmation copy. Keep this email — it contains your family portal link.</p>`,
          attachments: pdfAttachment,
        }).catch(() => {});
      }

      const emailResults = await Promise.all(
        validContacts.map(async (c) => {
          try {
            const result = await base44.functions.invoke('sendEmail', { to: c.contact_email, subject, body: emergencyEmailBody, attachments: pdfAttachment });
            return { name: c.contact_name, to: c.contact_email, type: "contact", success: result?.data?.success === true, error: null };
          } catch (err) {
            return { name: c.contact_name, to: c.contact_email, type: "contact", success: false, error: err?.message };
          }
        })
      );

      sessionStorage.setItem(`email_results_${tripPlan.id}`, JSON.stringify(emailResults));
      const successCount = emailResults.filter(r => r.success).length;
      if (successCount > 0) toast.success(`Plan filed! ${successCount} contact${successCount !== 1 ? "s" : ""} notified.`);

      navigate("/confirmation?id=" + tripPlan.id);
    } catch (err) {
      toast.error("Something went wrong: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fmtDt = (v) => v ? moment(v).format("MMM D, YYYY [at] h:mm A") : "—";

  // ─── Step content ──────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {

      // ── 01 Mission ──────────────────────────────────────────────────────────
      case 0: return (
        <>
          <Field label="Activity Type">
            <select className={selectCls} value={formData.travel_method} onChange={upd("travel_method")}>
              <option value="">Select activity...</option>
              {["Hiking", "Backpacking", "Boating", "Rafting", "Fishing", "Hunting", "Camping", "Rock Climbing", "Skiing / Snowshoeing", "Mountain Biking", "Other"].map(a => <option key={a}>{a}</option>)}
            </select>
          </Field>
          <Field label="Primary Destination" hint="Enter the full name of the park, wilderness, or trailhead — e.g. 'Mount Hood National Forest, Oregon' or 'Zion National Park, Utah'. The more specific, the better.">
            <div className="flex gap-2">
              <input className={inputCls} placeholder="e.g. Crater Lake National Park, Oregon" value={formData.park_name} onChange={upd("park_name")} />
              <button type="button" onClick={useMyLocation} disabled={locating} title="Auto-detect my location" className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold tracking-wider text-white/70 hover:text-white border border-white/30 hover:border-white/60 rounded-lg bg-white/10 hover:bg-white/20 transition-all disabled:opacity-50">
                {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
              </button>
            </div>
          </Field>
          <Field label="Nearest Visitor Center or Ranger Station" hint="Helps searchers know your check-in point">
            <input className={inputCls} placeholder="e.g. Crater Lake Visitor Center" value={formData.visitor_center} onChange={upd("visitor_center")} />
          </Field>
          <Field label="County / Region" hint="Important for identifying which sheriff has jurisdiction">
            <input className={inputCls} placeholder="e.g. Lane County, OR" value={formData.county_region} onChange={upd("county_region")} />
          </Field>
          <div className="bg-white/10 border border-white/20 rounded-xl p-4 mb-5 space-y-3">
            <p className="text-xs font-bold tracking-widest text-white/50 uppercase">Trip Dates</p>
            <div>
              <label className="block text-xs font-bold tracking-[0.15em] mb-1 uppercase text-white/70">Departure <span className="normal-case font-normal text-white/40">— when you leave for the trailhead</span></label>
              <input type="datetime-local" className={inputCls} value={formData.departure_datetime} onChange={upd("departure_datetime")} />
            </div>
            <div>
              <label className="block text-xs font-bold tracking-[0.15em] mb-1 uppercase text-white/70">Exit from Park <span className="normal-case font-normal text-white/40">— when you plan to leave the wilderness / trailhead</span></label>
              <input type="datetime-local" className={inputCls} value={formData.departure_from_park_datetime} onChange={upd("departure_from_park_datetime")} />
            </div>
            <div>
              <label className="block text-xs font-bold tracking-[0.15em] mb-1 uppercase text-white/70">Expected Return Home <span className="normal-case font-normal text-white/40">— if overdue by this time, contacts should alert authorities</span></label>
              <input type="datetime-local" className={inputCls} value={formData.expected_return_datetime} onChange={upd("expected_return_datetime")} />
            </div>
          </div>
          <div className="mb-5">
            <label className="block text-xs font-bold tracking-[0.15em] mb-2 uppercase text-white/70">Are you staying overnight?</label>
            <div className="flex gap-3 mb-3">
              {[{ label: "Yes", val: true }, { label: "No — day trip", val: false }].map(({ label, val }) => (
                <button key={label} type="button" onClick={() => setFormData(p => ({ ...p, accommodation_yes: val }))}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                    formData.accommodation_yes === val
                      ? "bg-white/25 border-white/60 text-white"
                      : "bg-white/5 border-white/20 text-white/50 hover:bg-white/15"
                  }`}>{label}</button>
              ))}
            </div>
            {formData.accommodation_yes && (
              <select className={selectCls} value={formData.accommodation_type} onChange={upd("accommodation_type")}>
                <option value="">Select accommodation type...</option>
                {["Tent / Campsite (developed)", "Backpacking / Dispersed camping", "Lodge or Hotel", "Cabin", "RV / Vehicle camping", "Hut or Shelter", "Other"].map(a => <option key={a}>{a}</option>)}
              </select>
            )}
          </div>
        </>
      );

      // ── 02 Route ────────────────────────────────────────────────────────────
      case 1: return (
        <>
          <Field label="Route / Trail Notes" hint="Include trailhead, key waypoints, turnaround points, and alternate routes">
            <textarea className={`${textareaCls} h-36`} placeholder="e.g. Start at Timberline Lodge TH, summit via Wy'east route, turnaround by 2pm regardless of progress..." value={formData.route_notes} onChange={upd("route_notes")} />
          </Field>
          <Field label="Backup / Alternate Activity" hint="If weather or conditions force a change, what's your alternative?">
            <input className={inputCls} placeholder="e.g. Day hike to Proxy Falls instead" value={formData.backup_activity} onChange={upd("backup_activity")} />
          </Field>

        </>
      );

      // ── 03 People ───────────────────────────────────────────────────────────
      case 2: return (
        <>
          <div className="mb-5">
            <p className="text-xs font-bold tracking-[0.15em] uppercase text-white/60 mb-3">MAIN TRAVELER</p>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs font-bold tracking-[0.15em] mb-1.5 uppercase text-white/60">Name</label>
                <input className={inputCls} placeholder="Full name" value={formData.primary_name} onChange={upd("primary_name")} />
              </div>
              <div>
                <label className="block text-xs font-bold tracking-[0.15em] mb-1.5 uppercase text-white/60">Phone</label>
                <input className={inputCls} placeholder="+1 555 000 0000" value={formData.primary_phone} onChange={upd("primary_phone")} />
              </div>
              <div>
                <label className="block text-xs font-bold tracking-[0.15em] mb-1.5 uppercase text-white/60">Age</label>
                <input className={inputCls} placeholder="Age" value={formData.primary_age} onChange={upd("primary_age")} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold tracking-[0.15em] mb-1.5 uppercase text-white/60">Your Email <span className="text-white/30 normal-case font-normal">(required — for your confirmation copy)</span></label>
              <input className={inputCls} type="email" placeholder="your@email.com" value={formData.primary_email} onChange={upd("primary_email")} />
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-xs font-bold tracking-[0.15em] mb-2 uppercase text-white/70">Emergency Communication Device <span className="normal-case font-normal text-white/40">(select all that apply)</span></label>
            <div className="grid grid-cols-1 gap-2">
              {["Satellite communicator (Garmin inReach)", "Satellite communicator (SPOT)", "Personal Locator Beacon (PLB)", "Avalanche Transceiver", "Satellite phone", "Other"].map(d => {
                const checked = (formData.emergency_device_types || []).includes(d);
                return (
                  <button key={d} type="button" onClick={() => toggleDevice(d)}
                    className={`flex items-center gap-3 px-4 py-2.5 border rounded-lg text-sm text-left transition-all ${
                      checked ? "border-white/60 bg-white/20 text-white" : "border-white/20 bg-white/5 text-white/50 hover:border-white/40 hover:text-white/70"
                    }`}>
                    <div className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center ${
                      checked ? "bg-white border-white" : "border-white/30"
                    }`}>
                      {checked && <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 fill-accent"><path d="M1 4l3 3 5-6"/></svg>}
                    </div>
                    {d}
                  </button>
                );
              })}
              {(formData.emergency_device_types || []).includes("Other") && (
                <input className={inputCls} placeholder="Describe your device..." value={formData.emergency_device_other} onChange={upd("emergency_device_other")} />
              )}
            </div>
          </div>

          {extraPeople.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-bold tracking-[0.15em] uppercase text-white/60 mb-3">ADDITIONAL TRAVELERS</p>
              {extraPeople.map((p, i) => (
                <div key={i} className="border border-white/20 bg-white/10 rounded-xl p-4 mb-3">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold tracking-widest text-white/40">PERSON {i + 2}</span>
                    <button onClick={() => setExtraPeople(ps => ps.filter((_, j) => j !== i))} className="text-xs text-red-400 hover:text-red-300">REMOVE</button>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-2">
                    <input className={inputCls} placeholder="Full name" value={p.name} onChange={e => setExtraPeople(ps => ps.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                    <input className={inputCls} placeholder="Phone" value={p.phone} onChange={e => setExtraPeople(ps => ps.map((x, j) => j === i ? { ...x, phone: e.target.value } : x))} />
                    <input className={inputCls} placeholder="Age" value={p.age} onChange={e => setExtraPeople(ps => ps.map((x, j) => j === i ? { ...x, age: e.target.value } : x))} />
                  </div>
                  <input className={inputCls} type="email" placeholder="Email (optional)" value={p.email || ""} onChange={e => setExtraPeople(ps => ps.map((x, j) => j === i ? { ...x, email: e.target.value } : x))} />
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 bg-blue-500/10 border border-blue-400/30 rounded-xl p-4">
            <p className="text-xs text-blue-200/80 leading-relaxed">Each additional traveler should also file their own SafeReturn plan so responders have accurate, individualized information for every person in your group.</p>
          </div>
          <button onClick={() => setExtraPeople(ps => [...ps, { name: "", phone: "", age: "", email: "" }])} className="text-xs font-bold tracking-widest text-white/50 hover:text-white transition-colors mt-4 block">
            + Add Another Traveler
          </button>
        </>
      );

      // ── 04 Contacts ─────────────────────────────────────────────────────────
      case 3: return (
        <>
          <div className="bg-amber-500/10 border border-amber-400/30 rounded-xl p-4 mb-5">
            <p className="text-xs font-bold tracking-widest text-amber-300 uppercase mb-1">Emergency Contacts</p>
            <p className="text-sm text-white/70 leading-relaxed">These contacts will immediately receive an email with your full trip details, including the local Search and Rescue agency phone number. <strong className="text-white">They are responsible for calling authorities if you do not return.</strong></p>
          </div>
          {contacts.map((c, i) => (
            <div key={i} className="border border-white/20 bg-white/10 rounded-xl p-4 mb-3">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold tracking-widest text-white/40">CONTACT {String(i + 1).padStart(2, "0")}</span>
                {contacts.length > 1 && (
                  <button onClick={() => setContacts(cs => cs.filter((_, j) => j !== i))} className="text-xs text-red-400 hover:text-red-300">REMOVE</button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-bold tracking-[0.15em] mb-1.5 uppercase text-white/60">Full Name</label>
                  <input className={inputCls} placeholder="Jane Doe" value={c.contact_name} onChange={e => setContacts(cs => cs.map((x, j) => j === i ? { ...x, contact_name: e.target.value } : x))} />
                </div>
                <div>
                  <label className="block text-xs font-bold tracking-[0.15em] mb-1.5 uppercase text-white/60">Relationship</label>
                  <select className={selectCls} value={c.relationship} onChange={e => setContacts(cs => cs.map((x, j) => j === i ? { ...x, relationship: e.target.value } : x))}>
                    <option value="family">Family</option>
                    <option value="spouse">Spouse / Partner</option>
                    <option value="friend">Friend</option>
                    <option value="colleague">Colleague</option>
                    <option value="other">Other (write in)</option>
                  </select>
                  {c.relationship === "other" && (
                    <input className={`${inputCls} mt-2`} placeholder="e.g. Hiking partner, neighbor..." value={c.relationship_custom || ""} onChange={e => setContacts(cs => cs.map((x, j) => j === i ? { ...x, relationship_custom: e.target.value } : x))} />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold tracking-[0.15em] mb-1.5 uppercase text-white/60">Phone Number</label>
                  <input className={inputCls} placeholder="+1 555 000 0000" value={c.contact_phone} onChange={e => setContacts(cs => cs.map((x, j) => j === i ? { ...x, contact_phone: e.target.value } : x))} />
                </div>
                <div>
                  <label className="block text-xs font-bold tracking-[0.15em] mb-1.5 uppercase text-white/60">Email Address <span className="text-white/30 normal-case">(required)</span></label>
                  <input className={inputCls} placeholder="jane@email.com" value={c.contact_email} onChange={e => setContacts(cs => cs.map((x, j) => j === i ? { ...x, contact_email: e.target.value } : x))} />
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => setContacts(cs => [...cs, { contact_name: "", relationship: "family", contact_phone: "", contact_email: "" }])} className="text-xs font-bold tracking-widest text-white/50 hover:text-white transition-colors">
            + Add Another Contact
          </button>
        </>
      );

      // ── 05 Vehicle ──────────────────────────────────────────────────────────
      case 4: return (
        <>
          <p className="text-sm text-white/60 mb-5 leading-relaxed">
            Describe your vehicle so searchers can confirm it is still parked at the trailhead when you are overdue.
          </p>
          {vehicles.map((v, i) => (
            <div key={i} className="border border-white/20 bg-white/10 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold tracking-widest text-white/40">VEHICLE {i + 1}</span>
                {vehicles.length > 1 && (
                  <button onClick={() => setVehicles(vs => vs.filter((_, j) => j !== i))} className="text-xs text-red-400 hover:text-red-300">REMOVE</button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-bold tracking-[0.15em] mb-1.5 uppercase text-white/60">Make</label>
                  <input className={inputCls} placeholder="Toyota" value={v.vehicle_make} onChange={e => setVehicles(vs => vs.map((x, j) => j === i ? { ...x, vehicle_make: e.target.value } : x))} />
                </div>
                <div>
                  <label className="block text-xs font-bold tracking-[0.15em] mb-1.5 uppercase text-white/60">Model</label>
                  <input className={inputCls} placeholder="4Runner" value={v.vehicle_model} onChange={e => setVehicles(vs => vs.map((x, j) => j === i ? { ...x, vehicle_model: e.target.value } : x))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-bold tracking-[0.15em] mb-1.5 uppercase text-white/60">Color</label>
                  <input className={inputCls} placeholder="Silver" value={v.vehicle_color} onChange={e => setVehicles(vs => vs.map((x, j) => j === i ? { ...x, vehicle_color: e.target.value } : x))} />
                </div>
                <div>
                  <label className="block text-xs font-bold tracking-[0.15em] mb-1.5 uppercase text-white/60">License Plate</label>
                  <input className={inputCls} placeholder="ABC-1234" value={v.vehicle_license} onChange={e => setVehicles(vs => vs.map((x, j) => j === i ? { ...x, vehicle_license: e.target.value } : x))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold tracking-[0.15em] mb-1.5 uppercase text-white/60">Parking Location / Trailhead</label>
                <div className="flex gap-2">
                  <input className={inputCls} placeholder="e.g. Timberline Lodge upper lot, east end" value={v.vehicle_location} onChange={e => setVehicles(vs => vs.map((x, j) => j === i ? { ...x, vehicle_location: e.target.value } : x))} />
                  <button type="button" onClick={() => pinVehicleLocation(i)} disabled={vehicleLocating} title="Pin my current location" className="shrink-0 px-3 py-2.5 border border-white/30 hover:border-white/60 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all disabled:opacity-50">
                    {vehicleLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => setVehicles(vs => [...vs, { vehicle_make: "", vehicle_model: "", vehicle_color: "", vehicle_license: "", vehicle_location: "" }])} className="text-xs font-bold tracking-widest text-white/50 hover:text-white transition-colors">
            + Add Vehicle
          </button>
        </>
      );

      // ── 06 Gear ─────────────────────────────────────────────────────────────
      case 5: return (
        <>
          <p className="text-sm text-white/60 mb-5 leading-relaxed">
            Check everything you are bringing. This helps rescuers assess your survival capability if you are overdue.
          </p>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {GEAR_ITEMS.map(item => {
              const checked = (formData.gear_checklist || []).includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleGear(item)}
                  className={`flex items-center gap-3 px-4 py-3 border rounded-lg text-sm text-left transition-all ${
                    checked
                      ? "border-white/60 bg-white/20 text-white"
                      : "border-white/20 bg-white/5 text-white/50 hover:border-white/40 hover:text-white/70"
                  }`}
                >
                  <div className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-all ${
                    checked ? "bg-white border-white" : "border-white/30"
                  }`}>
                    {checked && <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 fill-accent"><path d="M1 4l3 3 5-6"/></svg>}
                  </div>
                  {item}
                </button>
              );
            })}
          </div>
          <Field label="Other Gear / Identifying Equipment" hint="Tent color, pack color, anything that aids visual identification">
            <textarea className={`${textareaCls} h-20`} placeholder="e.g. Blue 3-person tent, orange pack cover, bright yellow rain jacket" value={formData.other_equipment} onChange={upd("other_equipment")} />
          </Field>
        </>
      );

      // ── 07 Medical ──────────────────────────────────────────────────────────
      case 6: return (
        <>
          <div className="bg-white/10 border border-white/20 rounded-xl p-4 mb-5">
            <p className="text-xs text-white/60 leading-relaxed">This information applies to <strong className="text-white">{formData.primary_name || "you"}</strong> only. Additional travelers should file their own plan with their own medical details.</p>
          </div>
          <div className="mb-5">
            <Field label="Blood Type" hint="Optional — helps paramedics act faster">
              <select className={selectCls} value={formData.primary_blood_type} onChange={upd("primary_blood_type")}>
                <option value="">Unknown / prefer not to say</option>
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(bt => <option key={bt}>{bt}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Allergies">
              <input className={inputCls} placeholder="e.g. Penicillin, bee stings, shellfish" value={formData.allergies} onChange={upd("allergies")} />
            </Field>
            <Field label="Current Medications">
              <input className={inputCls} placeholder="e.g. Epinephrine, Metformin" value={formData.medications} onChange={upd("medications")} />
            </Field>
          </div>
          <Field label="Medical Conditions">
            <input className={inputCls} placeholder="e.g. Type 2 diabetes, asthma, heart condition" value={formData.medical_conditions} onChange={upd("medical_conditions")} />
          </Field>
          <Field label="Emergency Medical Notes" hint="Anything else that responders or your contacts need to know">
            <textarea className={`${textareaCls} h-24`} placeholder="e.g. Carries an EpiPen in left hip pouch. Speaks limited English. Last saw doctor on 5/1." value={formData.emergency_medical_notes} onChange={upd("emergency_medical_notes")} />
          </Field>
        </>
      );

      // ── 08 Agency ───────────────────────────────────────────────────────────
      case 7: return (
        <div className="[&_input]:bg-white/15 [&_input]:border-white/30 [&_input]:text-white [&_input]:placeholder:text-white/40 [&_input:focus]:bg-white/20 [&_input:focus]:border-white/50 [&_.bg-blue-50\/80]:bg-white/10 [&_.border-blue-200\/60]:border-white/20 [&_.text-blue-700\/80]:text-white/70 [&_.border-amber-200\/60]:border-amber-400/40 [&_.bg-amber-50\/60]:bg-amber-500/10 [&_.text-amber-700]:text-amber-300 [&_.border-accent\/30]:border-white/25 [&_.bg-white\/70]:bg-white/15 [&_.border-accent\/20]:border-white/20 [&_.bg-accent\/5]:bg-white/10 [&_.text-foreground]:text-white [&_.text-foreground\/60]:text-white/60 [&_.text-foreground\/50]:text-white/50 [&_.text-foreground\/40]:text-white/40 [&_.text-accent]:text-blue-300 [&_.border-accent\/15]:border-white/15 [&_.bg-red-50\/60]:bg-red-500/10 [&_.border-red-200\/60]:border-red-400/30 [&_.text-red-600]:text-red-300">
          <AgencyStep formData={formData} setFormData={setFormData} />
        </div>
      );

      // ── 09 Confirm ──────────────────────────────────────────────────────────
      case 8: {
        const v = vehicles[0] || {};
        const returnStr = formData.expected_return_datetime
          ? moment(formData.expected_return_datetime).format("h:mm A [on] MMMM D, YYYY")
          : "[return time not set]";
        const deviceList = (formData.emergency_device_types || []).join(", ") + (formData.emergency_device_other ? ` (${formData.emergency_device_other})` : "");
        const summaryRows = [
          ["— MISSION —", ""],
          ["Activity", formData.travel_method || "—"],
          ["Destination", formData.park_name || "—"],
          ["County / Region", formData.county_region || "—"],
          ["Visitor Center", formData.visitor_center || "—"],
          ["Overnight Stay", formData.accommodation_yes ? (formData.accommodation_type || "Yes") : "No — day trip"],
          ["Departure", fmtDt(formData.departure_datetime)],
          ["Exit from Park", fmtDt(formData.departure_from_park_datetime)],
          ["Return Home By", fmtDt(formData.expected_return_datetime)],
          ["— ROUTE —", ""],
          ["Route Notes", formData.route_notes || "—"],
          ["Backup Plan", formData.backup_activity || "—"],
          ["— PEOPLE —", ""],
          ["Main Traveler", [formData.primary_name, formData.primary_age && `Age ${formData.primary_age}`, formData.primary_phone].filter(Boolean).join(" · ") || "—"],
          ["Email", formData.primary_email || "—"],
          ["Emergency Device", deviceList || "None"],
          ["Group Size", String(formData.total_participants || 1)],
          ["— CONTACTS —", ""],
          ["Emergency Contacts", contacts.filter(c => c.contact_name).map(c => `${c.contact_name} (${c.relationship})`).join(", ") || "—"],
          ["— VEHICLE —", ""],
          ["Vehicle", [v.vehicle_color, v.vehicle_make, v.vehicle_model, v.vehicle_license].filter(Boolean).join(" ") || "—"],
          ["Parked At", v.vehicle_location || "—"],
          ["— GEAR —", ""],
          ["Checklist", (formData.gear_checklist || []).join(", ") || "—"],
          ["Other Gear", formData.other_equipment || "—"],
          ["— MEDICAL —", ""],
          ["Blood Type", formData.primary_blood_type || "Unknown"],
          ["Allergies", formData.allergies || "None reported"],
          ["Medications", formData.medications || "None reported"],
          ["Conditions", formData.medical_conditions || "None reported"],
          ["Medical Notes", formData.emergency_medical_notes || "—"],
        ];

        return (
          <>
            <div className="border border-white/20 rounded-xl overflow-hidden mb-5">
              {summaryRows.map(([label, value], i) => (
                <div key={label} className={`flex gap-4 px-5 py-3 text-sm ${i % 2 === 0 ? "bg-white/10" : "bg-white/5"}`}>
                  <span className="text-xs font-bold tracking-[0.12em] uppercase text-white/40 w-36 shrink-0 pt-0.5">{label}</span>
                  <span className="text-white/80 break-words">{value}</span>
                </div>
              ))}
            </div>

            <div className="bg-white/10 border border-white/20 rounded-xl p-5 mb-5">
              <p className="text-sm text-white/80 leading-relaxed font-medium">
                I confirm I am planning to return by{" "}
                <span className="text-blue-300 font-bold">{returnStr}</span>.
                If I do not return around this time, my emergency contacts have permission to alert authorities using this plan.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setFormData(p => ({ ...p, confirmed_return: !p.confirmed_return }))}
              className="flex items-start gap-3 w-full text-left mb-2 p-1 rounded-lg"
            >
              <div className={`w-5 h-5 mt-0.5 shrink-0 rounded border-2 flex items-center justify-center transition-all ${
                formData.confirmed_return ? "bg-blue-400 border-blue-400" : "border-white/40"
              }`}>
                {formData.confirmed_return && <svg viewBox="0 0 10 8" className="w-3 h-3 fill-white"><path d="M1 4l3 3 5-6"/></svg>}
              </div>
              <span className="text-sm text-white/70 leading-relaxed">
                I understand that if I do not return around this time, my emergency contacts should use this plan to help responders locate me.
              </span>
            </button>
          </>
        );
      }

      default: return null;
    }
  };

  // ─── Layout ────────────────────────────────────────────────────────────────
  const video = STEP_VIDEOS[step];

  return (
    <div className="relative min-h-screen font-inter overflow-hidden">

      {/* Cinematic background */}
      <AnimatePresence mode="sync">
        <motion.div
          key={step}
          className="fixed inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          <img src={video.poster} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.8 }} />
          <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" poster={video.poster} style={{ opacity: 0.8 }}>
            <source src={video.src} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/50" />
        </motion.div>
      </AnimatePresence>

      {/* Side dots nav */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2.5">
        {STEPS.map((s, i) => (
          <button key={s.id} onClick={() => goTo(i)} title={s.label} className="group flex items-center gap-2 justify-end">
            <span className={`text-xs font-medium transition-all duration-300 text-white ${step === i ? "opacity-100 font-bold" : "opacity-40 hover:opacity-80"}`}>{s.label}</span>
            <div className={`rounded-full transition-all duration-300 ${step === i ? "w-3 h-3 bg-white shadow-lg" : "w-2 h-2 bg-white/40 hover:bg-white/70"}`} />
          </button>
        ))}
      </div>

      {/* Step number indicator */}
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
            <span className="text-5xl font-bold text-white/25 leading-none select-none">{STEPS[step]?.number}</span>
            <div className="w-px h-10 bg-white/25" />
            <span className="text-[10px] font-medium text-white/50 tracking-widest uppercase">{STEPS[step]?.label}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col justify-center items-center px-4 py-24">
        <div className="w-full max-w-2xl mx-auto">

          {/* Step header */}
          <motion.div
            key={`header-${step}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5 flex items-center gap-3"
          >
            <span className="text-xs font-bold tracking-widest text-white/60 uppercase">{STEPS[step]?.number}</span>
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-xs font-medium text-white/40 uppercase tracking-widest">{step + 1} of {STEPS.length}</span>
          </motion.div>

          {/* Form card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="bg-black/55 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-6 md:p-8"
            >
              <h2 className="text-xl font-black text-white mb-5 tracking-tight">{STEPS[step]?.label}</h2>
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <motion.div
            key={`nav-${step}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-col items-center gap-3 mt-6"
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
                disabled={submitting || !formData.confirmed_return}
                className="relative flex items-center gap-3 px-10 py-4 text-base font-bold text-white rounded-2xl bg-primary overflow-hidden disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
                style={{ boxShadow: "0 0 30px rgba(91,164,245,0.6), 0 4px 20px rgba(0,0,0,0.3)" }}
              >
                <motion.span
                  className="absolute inset-0 rounded-2xl bg-primary"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
                <span className="relative z-10 flex items-center gap-2">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  {submitting ? "Filing Plan..." : "Confirm & File Trip Plan"}
                </span>
              </button>
            )}

            {step > 0 && (
              <button onClick={() => goTo(step - 1)} className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors">
                <ChevronUp className="w-3.5 h-3.5" /> Back to {STEPS[step - 1].label}
              </button>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}