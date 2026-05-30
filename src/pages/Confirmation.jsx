import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Mail, Shield, Loader2, ExternalLink } from "lucide-react";
import formatTripText from "@/utils/formatTripText";
import moment from "moment";

function fmt(dt) {
  if (!dt) return "Not specified";
  return moment(dt).format("MMM D, YYYY h:mm A");
}

function buildMailtoLink(toEmail, tripData) {
  const subject = encodeURIComponent(`Trip Plan: ${tripData.primary_name || "Outdoor Trip"} — ${tripData.park_name || "Destination"}`);
  const body = encodeURIComponent(formatTripText(tripData));
  return `mailto:${toEmail}?subject=${subject}&body=${body}`;
}

export default function Confirmation() {
  const params = new URLSearchParams(window.location.search);
  const tripId = params.get("id");

  const { data: tripPlan, isLoading: loadingPlan } = useQuery({
    queryKey: ["trip-plan", tripId],
    queryFn: () => base44.entities.TripPlan.get(tripId),
    enabled: !!tripId,
  });

  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ["trip-contacts", tripId],
    queryFn: () => base44.entities.EmergencyContact.filter({ trip_plan_id: tripId }),
    enabled: !!tripId,
  });

  const isLoading = loadingPlan || loadingContacts;
  const authorities = tripPlan?.authority_contacts || [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 font-inter">
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-accent" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Trip Plan Saved!</h1>
        <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
          Now send your trip plan to each contact below. Click the button next to each person to open your email app with everything pre-filled.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* Personal Contacts */}
          {contacts.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-5 mb-4 space-y-3">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Send to Personal Contacts
              </h2>
              <p className="text-xs text-muted-foreground">Click each button — your email app will open with the trip plan ready to send.</p>
              <div className="space-y-2">
                {contacts.map((c, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm text-foreground">{c.contact_name}</p>
                      <p className="text-xs text-muted-foreground">{c.contact_email} · {c.relationship}</p>
                    </div>
                    {tripPlan && (
                      <a href={buildMailtoLink(c.contact_email, tripPlan)} target="_blank" rel="noreferrer">
                        <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90 text-white whitespace-nowrap">
                          <Mail className="w-3.5 h-3.5" /> Send Email
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </Button>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Authorities */}
          {authorities.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-5 mb-4 space-y-3">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Shield className="w-5 h-5 text-accent" />
                Notify Local Authorities
              </h2>
              <p className="text-xs text-muted-foreground">Filing your plan with local law enforcement helps speed up any search {"&"} rescue response.</p>
              <div className="space-y-2">
                {authorities.map((a, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm text-foreground">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.type}{a.email ? ` · ${a.email}` : " · No email found"}</p>
                      {a.phone && <p className="text-xs text-muted-foreground">{a.phone}</p>}
                    </div>
                    {a.email && tripPlan ? (
                      <a href={buildMailtoLink(a.email, tripPlan)} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline" className="gap-1.5 border-accent/40 text-accent hover:bg-accent/10 whitespace-nowrap">
                          <Mail className="w-3.5 h-3.5" /> Send Email
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </Button>
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Call: {a.phone || "—"}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What happens next */}
          <div className="bg-card rounded-xl border border-border p-5 mb-6 space-y-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" /> What Happens Next
            </h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex gap-2"><span className="text-accent font-bold">1.</span> Click each "Send Email" above — your email client opens with everything pre-filled.</li>
              <li className="flex gap-2"><span className="text-accent font-bold">2.</span> {`If you don't return by your expected time, your contacts know to alert authorities.`}</li>
              <li className="flex gap-2"><span className="text-accent font-bold">3.</span> {`When you're safely home, mark your trip complete from your dashboard.`}</li>
            </ul>
            {tripPlan?.expected_return_datetime && (
              <div className="mt-3 bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm">
                ⚠️ <strong>Expected return:</strong> {fmt(tripPlan.expected_return_datetime)}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/dashboard">
              <Button className="gap-2 bg-primary hover:bg-primary/90 text-white">
                View My Plans <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/new-plan">
              <Button variant="outline">File Another Plan</Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}