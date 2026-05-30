import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, ArrowRight, Mail, Shield, Loader2, AlertTriangle, User } from "lucide-react";
import moment from "moment";

function fmt(dt) {
  if (!dt) return "Not specified";
  return moment(dt).format("MMM D, YYYY h:mm A");
}

const TYPE_ICONS = {
  contact: <Mail className="w-4 h-4 text-primary" />,
  authority: <Shield className="w-4 h-4 text-accent" />,
  self: <User className="w-4 h-4 text-muted-foreground" />,
};

export default function Confirmation() {
  const params = new URLSearchParams(window.location.search);
  const tripId = params.get("id");

  const emailResults = (() => {
    try { return JSON.parse(sessionStorage.getItem(`email_results_${tripId}`) || "null"); }
    catch { return null; }
  })();

  const { data: tripPlan, isLoading } = useQuery({
    queryKey: ["trip-plan", tripId],
    queryFn: () => base44.entities.TripPlan.get(tripId),
    enabled: !!tripId,
  });

  const allSent = emailResults?.every(r => r.success);
  const someFailed = emailResults?.some(r => !r.success);
  const noResults = !emailResults;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 font-inter">
      {/* Hero status */}
      <div className="text-center mb-8">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${allSent ? "bg-accent/10" : someFailed ? "bg-destructive/10" : "bg-primary/10"}`}>
          {allSent
            ? <CheckCircle className="w-10 h-10 text-accent" />
            : someFailed
            ? <AlertTriangle className="w-10 h-10 text-destructive" />
            : <CheckCircle className="w-10 h-10 text-primary" />}
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          {allSent ? "You're all set!" : someFailed ? "Plan saved — some emails failed" : "Trip Plan Saved!"}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-sm mx-auto text-sm">
          {allSent
            ? "Your trip plan was automatically sent to all contacts and authorities below."
            : someFailed
            ? "Your plan is saved but some notifications didn't go through. See details below."
            : "Your trip plan is saved. Check the notification status below."}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* Email delivery status */}
          {emailResults && emailResults.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-5 mb-4 space-y-3">
              <h2 className="font-semibold text-foreground text-sm uppercase tracking-wide">Notification Status</h2>
              <div className="space-y-2">
                {emailResults.map((r, i) => (
                  <div key={i} className={`flex items-start justify-between gap-3 p-3 rounded-lg ${r.success ? "bg-accent/5 border border-accent/20" : "bg-destructive/5 border border-destructive/20"}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      {TYPE_ICONS[r.type]}
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{r.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{r.to}</p>
                        {!r.success && r.error && (
                          <p className="text-xs text-destructive mt-0.5">Error: {r.error}</p>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5">
                      {r.success
                        ? <><CheckCircle className="w-4 h-4 text-accent" /><span className="text-xs font-medium text-accent">Sent</span></>
                        : <><XCircle className="w-4 h-4 text-destructive" /><span className="text-xs font-medium text-destructive">Failed</span></>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {noResults && (
            <div className="bg-card rounded-xl border border-border p-5 mb-4 text-sm text-muted-foreground">
              No email delivery data found. Your plan is saved — please check your dashboard.
            </div>
          )}

          {/* What happens next */}
          <div className="bg-card rounded-xl border border-border p-5 mb-6 space-y-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-accent" /> What Happens Next
            </h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex gap-2"><span className="text-accent font-bold">1.</span> Your contacts have been notified automatically — no extra steps needed.</li>
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