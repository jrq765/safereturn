import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Shield, MapPin, Phone, Mail, RefreshCw, AlertTriangle, CheckCircle, Edit3 } from "lucide-react";

export default function AgencyStep({ formData, setFormData }) {
  const [agency, setAgency] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [manual, setManual] = useState({ name: "", phone: "", email: "", address: "" });

  const destination = [formData.park_name, formData.county_region].filter(Boolean).join(", ");

  useEffect(() => {
    if (formData.share_with_agency && destination && !agency) {
      fetchAgency();
    }
  }, []); // eslint-disable-line

  const fetchAgency = async () => {
    if (!destination) return;
    setLoading(true);
    setError(null);
    setEditMode(false);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        model: "gemini_3_flash",
        add_context_from_internet: true,
        prompt: `What is the county sheriff or Search and Rescue agency for: "${destination}"? Return JSON only: name, county, phone (non-emergency), email (or null), address, website (or null), notes (or null).`,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            county: { type: "string" },
            phone: { type: "string" },
            email: { type: ["string", "null"] },
            address: { type: "string" },
            website: { type: ["string", "null"] },
            notes: { type: ["string", "null"] },
          },
          required: ["name", "county", "phone", "address"],
        },
      });
      setAgency(result);
      setManual({ name: result.name || "", phone: result.phone || "", email: result.email || "", address: result.address || "" });
    } catch {
      setError("Could not find agency information. You can enter it manually below.");
      setEditMode(true);
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => {
    const next = !formData.share_with_agency;
    setFormData(p => ({ ...p, share_with_agency: next }));
    if (next && destination && !agency) fetchAgency();
  };

  const saveManual = () => {
    setAgency({ ...manual });
    setEditMode(false);
  };

  const inputCls = "w-full bg-white/70 text-sm px-4 py-2.5 focus:outline-none transition-colors font-inter border border-white/50 focus:border-accent/60 text-foreground placeholder:text-foreground/30 rounded-lg backdrop-blur-sm";

  return (
    <div className="space-y-4">
      {/* Opt-in toggle */}
      <button
        type="button"
        onClick={toggle}
        className={`flex items-start gap-4 w-full p-5 border-2 rounded-xl text-left transition-all cursor-pointer select-none ${
          formData.share_with_agency
            ? "border-accent/70 bg-accent/10 shadow-md"
            : "border-foreground/20 bg-white/60 hover:border-foreground/40 hover:bg-white/80"
        }`}
      >
        <div className={`w-6 h-6 mt-0.5 shrink-0 rounded-md border-2 flex items-center justify-center transition-all ${
          formData.share_with_agency ? "bg-accent border-accent" : "border-foreground/30 bg-white/50"
        }`}>
          {formData.share_with_agency && (
            <svg viewBox="0 0 10 8" className="w-3.5 h-3.5 fill-white"><path d="M1 4l3 3 5-6"/></svg>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">
            {formData.share_with_agency ? "Enabled: " : "Click to enable: "}
            Identify my local Search and Rescue agency
          </p>
          <p className="text-xs text-foreground/50 mt-0.5 leading-relaxed">
            {formData.share_with_agency
              ? "Click to disable — we will look up the correct county sheriff or SAR team for your destination."
              : "Click to enable — we will look up the correct county sheriff or SAR team so your contacts know exactly who to call."}
          </p>
        </div>
      </button>

      {/* Info disclaimer */}
      <div className="bg-blue-50/80 border border-blue-200/60 rounded-xl p-4">
        <p className="text-xs text-blue-700/80 leading-relaxed">
          <strong>Note:</strong> This does not create an emergency call or transmit your plan to any agency. It identifies the correct authority so your emergency contacts know who to reach if you are overdue.
        </p>
      </div>

      {/* Agency lookup section */}
      {formData.share_with_agency && (
        <div className="space-y-3">
          {!destination && (
            <div className="flex items-center gap-3 p-4 border border-amber-200/60 rounded-xl bg-amber-50/60">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-sm text-amber-700">Enter a destination in the <strong>Mission</strong> step to auto-identify your local agency.</p>
            </div>
          )}

          {destination && loading && (
            <div className="flex items-center gap-3 p-5 border border-accent/20 rounded-xl bg-white/60">
              <Loader2 className="w-4 h-4 animate-spin text-accent shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Searching for agency...</p>
                <p className="text-xs text-foreground/50 mt-0.5">Looking up the correct sheriff or SAR team for <strong>{destination}</strong></p>
              </div>
            </div>
          )}

          {destination && !loading && (agency || editMode) && (
            <div className="border border-accent/30 rounded-xl bg-white/70 backdrop-blur-sm overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-accent/20 bg-accent/5">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-accent" />
                  <span className="text-xs font-bold tracking-widest text-accent uppercase">
                    {editMode ? "Manual Entry" : "Identified Agency"}
                  </span>
                </div>
                {!editMode && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={fetchAgency}
                      className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-accent/60 hover:text-accent transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" /> RE-SEARCH
                    </button>
                    <span className="text-accent/20 text-xs">|</span>
                    <button
                      onClick={() => setEditMode(true)}
                      className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-accent/60 hover:text-accent transition-colors"
                    >
                      <Edit3 className="w-3 h-3" /> CORRECT
                    </button>
                  </div>
                )}
              </div>

              {!editMode ? (
                <div className="p-5 space-y-2.5">
                  <p className="font-bold text-foreground text-base">{agency.name}</p>
                  {agency.county && (
                    <p className="text-sm text-foreground/60 font-medium">{agency.county}</p>
                  )}
                  {agency.address && (
                    <div className="flex items-start gap-2 text-sm text-foreground/60">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{agency.address}</span>
                    </div>
                  )}
                  {agency.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-3.5 h-3.5 shrink-0 text-accent" />
                      <a href={`tel:${agency.phone}`} className="font-semibold text-accent hover:underline">{agency.phone}</a>
                      <span className="text-xs text-foreground/40">(non-emergency)</span>
                    </div>
                  )}
                  {agency.email && (
                    <div className="flex items-center gap-2 text-sm text-foreground/60">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span>{agency.email}</span>
                    </div>
                  )}
                  {agency.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-xs text-foreground/40">Website</span>
                      <a href={agency.website} target="_blank" rel="noopener noreferrer" className="text-accent text-xs hover:underline break-all">{agency.website}</a>
                    </div>
                  )}
                  {agency.notes && (
                    <div className="mt-3 bg-amber-50/60 border border-amber-200/50 rounded-lg p-3">
                      <p className="text-xs text-amber-700">{agency.notes}</p>
                    </div>
                  )}
                  <div className="flex items-start gap-2 mt-3 pt-3 border-t border-accent/10">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-foreground/40 leading-relaxed">Please verify this is correct. If the agency or phone number looks wrong, use CORRECT to update it.</p>
                  </div>
                </div>
              ) : (
                <div className="p-5 space-y-3">
                  <p className="text-xs text-foreground/50 mb-3">Enter the correct agency contact details for your destination:</p>
                  <div>
                    <label className="text-[10px] font-bold tracking-widest text-foreground/40 uppercase block mb-1">Agency Name</label>
                    <input className={inputCls} placeholder="e.g. Lane County Sheriff's Office" value={manual.name} onChange={e => setManual(m => ({ ...m, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold tracking-widest text-foreground/40 uppercase block mb-1">Phone (non-emergency)</label>
                    <input className={inputCls} placeholder="(541) 555-0100" value={manual.phone} onChange={e => setManual(m => ({ ...m, phone: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold tracking-widest text-foreground/40 uppercase block mb-1">Email (optional)</label>
                    <input className={inputCls} placeholder="sar@county.gov" value={manual.email} onChange={e => setManual(m => ({ ...m, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold tracking-widest text-foreground/40 uppercase block mb-1">Address</label>
                    <input className={inputCls} placeholder="125 E 8th Ave, Eugene, OR 97401" value={manual.address} onChange={e => setManual(m => ({ ...m, address: e.target.value }))} />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={saveManual} className="flex-1 py-2.5 text-xs font-black tracking-widest text-white bg-accent hover:bg-accent/90 rounded-lg transition-colors">
                      SAVE
                    </button>
                    {agency && (
                      <button onClick={() => setEditMode(false)} className="px-4 py-2.5 text-xs font-black tracking-widest text-foreground/50 hover:text-foreground border border-accent/20 rounded-lg transition-colors">
                        CANCEL
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {destination && !loading && !agency && !editMode && error && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 border border-red-200/60 rounded-xl bg-red-50/60">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={fetchAgency} className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold tracking-wider text-accent border border-accent/30 rounded-lg hover:bg-accent/5 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" /> Try Again
                </button>
                <button onClick={() => setEditMode(true)} className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold tracking-wider text-foreground/50 border border-accent/20 rounded-lg hover:bg-white/50 transition-colors">
                  <Edit3 className="w-3.5 h-3.5" /> Enter Manually
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}