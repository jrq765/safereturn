import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Shield, MapPin, Phone, Mail } from "lucide-react";

export default function AgencyStep({ formData, setFormData }) {
  const [sheriff, setSheriff] = useState(null);
  const [loading, setLoading] = useState(false);
  const destination = formData.park_name || formData.visitor_center || "";

  useEffect(() => {
    if (formData.share_with_agency && destination && !sheriff) {
      fetchSheriff();
    }
  }, [formData.share_with_agency]);

  const fetchSheriff = async () => {
    if (!destination) return;
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Find the nearest county sheriff's office or search and rescue (SAR) agency for someone traveling to: "${destination}". Return only a JSON object with: name, county, phone, email (if available, else null), address.`,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            county: { type: "string" },
            phone: { type: "string" },
            email: { type: ["string", "null"] },
            address: { type: "string" },
          },
        },
      });
      setSheriff(result);
    } catch {
      setSheriff(null);
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => {
    const next = !formData.share_with_agency;
    setFormData(p => ({ ...p, share_with_agency: next }));
    if (next && destination && !sheriff) fetchSheriff();
  };

  return (
    <>
      {/* Main toggle */}
      <button
        type="button"
        onClick={toggle}
        className={`flex items-center gap-4 w-full p-5 border rounded-xl text-left transition-all mb-4 ${
          formData.share_with_agency
            ? "border-accent/50 bg-accent/10"
            : "border-accent/20 bg-white/50"
        }`}
      >
        <div className={`w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-all ${
          formData.share_with_agency ? "bg-accent border-accent" : "border-foreground/30"
        }`}>
          {formData.share_with_agency && (
            <svg viewBox="0 0 10 8" className="w-3 h-3 fill-white"><path d="M1 4l3 3 5-6"/></svg>
          )}
        </div>
        <span className="text-sm font-medium text-foreground">
          Make this trip plan available to State Police / authorized public safety dashboard
        </span>
      </button>

      <div className="bg-accent/5 border border-accent/15 rounded-xl p-5 mb-5">
        <p className="text-sm text-foreground/70 leading-relaxed">
          This does not create an emergency call. It stores the plan so responders can access it if you are reported missing or overdue.
        </p>
      </div>

      {/* Sheriff lookup */}
      {formData.share_with_agency && (
        <div className="mt-2">
          {!destination && (
            <div className="flex items-center gap-2 text-sm text-foreground/50 italic">
              <MapPin className="w-4 h-4" />
              Enter a destination in the Mission step to identify your nearest agency.
            </div>
          )}

          {destination && loading && (
            <div className="flex items-center gap-3 p-5 border border-accent/20 rounded-xl bg-white/50">
              <Loader2 className="w-4 h-4 animate-spin text-accent" />
              <span className="text-sm text-foreground/60">Finding nearest sheriff's office for <strong>{destination}</strong>...</span>
            </div>
          )}

          {destination && !loading && sheriff && (
            <div className="border border-accent/30 rounded-xl bg-white/60 backdrop-blur-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3 border-b border-accent/20 bg-accent/10">
                <Shield className="w-4 h-4 text-accent" />
                <span className="text-xs font-bold tracking-widest text-accent uppercase">Identified Agency</span>
              </div>
              <div className="p-5 space-y-2">
                <p className="font-bold text-foreground">{sheriff.name}</p>
                {sheriff.county && <p className="text-sm text-foreground/60">{sheriff.county}</p>}
                {sheriff.address && (
                  <div className="flex items-center gap-2 text-sm text-foreground/60">
                    <MapPin className="w-3.5 h-3.5 shrink-0" /> {sheriff.address}
                  </div>
                )}
                {sheriff.phone && (
                  <div className="flex items-center gap-2 text-sm text-foreground/60">
                    <Phone className="w-3.5 h-3.5 shrink-0" /> {sheriff.phone}
                  </div>
                )}
                {sheriff.email && (
                  <div className="flex items-center gap-2 text-sm text-foreground/60">
                    <Mail className="w-3.5 h-3.5 shrink-0" /> {sheriff.email}
                  </div>
                )}
              </div>
              <div className="px-5 py-3 border-t border-accent/15 bg-accent/5">
                <p className="text-[10px] font-bold tracking-[0.18em] text-accent/50">
                  ⚡ CONCEPT ONLY — PLAN WILL BE STORED BUT NOT TRANSMITTED TO AGENCY
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}