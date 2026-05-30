import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, User, Shield, AlertTriangle, Loader2, CheckCircle, Navigation, Phone } from "lucide-react";
import moment from "moment";

const bgImage = "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&auto=format&fit=crop";

function fmt(dt) {
  if (!dt) return "Not specified";
  return moment(dt).format("MMM D, YYYY h:mm A");
}

export default function FamilyPortal() {
  const params = new URLSearchParams(window.location.search);
  const tripId = params.get("id");

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alerting, setAlerting] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [alerterName, setAlerterName] = useState("");
  const [alerterRel, setAlerterRel] = useState("");
  const [alertMsg, setAlertMsg] = useState("");

  useEffect(() => {
    if (!tripId) { setError("No trip ID provided."); setLoading(false); return; }
    base44.functions.invoke("getTripPublic", { tripId })
      .then(res => { setTrip(res.data.trip); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [tripId]);

  const handleAlert = async () => {
    if (!alerterName.trim()) { alert("Please enter your name."); return; }
    setAlerting(true);
    try {
      await base44.functions.invoke("alertAuthorities", {
        tripId,
        alerterName,
        alerterRelationship: alerterRel,
        message: alertMsg,
      });
      setAlertSent(true);
      setShowAlertForm(false);
    } catch (e) {
      alert("Error sending alert: " + e.message);
    } finally {
      setAlerting(false);
    }
  };

  const isOverdue = trip?.expected_return_datetime
    ? moment().isAfter(moment(trip.expected_return_datetime))
    : false;

  return (
    <div className="relative min-h-screen font-inter">
      <div className="fixed inset-0 z-0">
        <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div className="relative z-10 max-w-xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="https://media.base44.com/images/public/6a1b2bf2fc37b8175a269ec2/b59cfd204_ChatGPTImageMay30202601_47_28PM.png"
            alt="SafeReturn"
            className="h-16 w-auto object-contain mx-auto mb-4"
          />
          <p className="text-white/60 text-sm">Emergency Contact Portal</p>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-white" />
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-6 text-white text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        )}

        {trip && (
          <div className="space-y-4">
            {/* Status banner */}
            <div className={`rounded-xl border p-4 text-center ${isOverdue ? "bg-red-500/20 border-red-400/40" : "bg-green-500/10 border-green-400/30"}`}>
              {isOverdue
                ? <><AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-1" /><p className="text-red-300 font-bold">⚠️ Expected return time has passed</p></>
                : <><CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-1" /><p className="text-green-300 font-semibold">Trip is active — expected return: {fmt(trip.expected_return_datetime)}</p></>
              }
            </div>

            {/* Traveler info */}
            <div className="bg-black/55 backdrop-blur-md rounded-xl border border-white/20 p-5 space-y-3">
              <h2 className="text-white font-bold text-lg flex items-center gap-2"><User className="w-5 h-5 text-blue-300" /> Traveler Info</h2>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><p className="text-white/50">Name</p><p className="text-white font-medium">{trip.primary_name || "—"}</p></div>
                <div><p className="text-white/50">Phone</p><p className="text-white font-medium">{trip.primary_phone || "—"}</p></div>
                <div><p className="text-white/50">Destination</p><p className="text-white font-medium">{trip.park_name || "—"}</p></div>
                <div><p className="text-white/50">Participants</p><p className="text-white font-medium">{trip.total_participants || 1}</p></div>
                {trip.travel_method && <div><p className="text-white/50">Travel</p><p className="text-white font-medium">{trip.travel_method}</p></div>}
                {trip.accommodation && <div><p className="text-white/50">Accommodation</p><p className="text-white font-medium">{trip.accommodation}</p></div>}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-black/55 backdrop-blur-md rounded-xl border border-white/20 p-5 space-y-3">
              <h2 className="text-white font-bold flex items-center gap-2"><Clock className="w-5 h-5 text-blue-300" /> Timeline</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-white/50">Arrival</span><span className="text-white">{fmt(trip.arrival_datetime)}</span></div>
                <div className="flex justify-between"><span className="text-white/50">Departure</span><span className="text-white">{fmt(trip.departure_datetime)}</span></div>
                <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
                  <span className="text-white/50 font-medium">Expected Return</span>
                  <span className={`font-bold ${isOverdue ? "text-red-400" : "text-green-300"}`}>{fmt(trip.expected_return_datetime)}</span>
                </div>
              </div>
            </div>

            {/* Activities */}
            {trip.activities?.length > 0 && (
              <div className="bg-black/55 backdrop-blur-md rounded-xl border border-white/20 p-5 space-y-3">
                <h2 className="text-white font-bold flex items-center gap-2"><Navigation className="w-5 h-5 text-blue-300" /> Planned Activities</h2>
                <div className="space-y-2">
                  {trip.activities.map((a, i) => (
                    <div key={i} className="text-sm bg-white/10 rounded-lg p-3">
                      <p className="text-white font-medium">{a.activity || `Activity ${i + 1}`}</p>
                      <p className="text-white/60 text-xs">{a.start_location} → {a.end_location}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Last known location */}
            {trip.last_location_lat && trip.last_location_lng && (
              <div className="bg-black/55 backdrop-blur-md rounded-xl border border-blue-400/30 p-5 space-y-3">
                <h2 className="text-white font-bold flex items-center gap-2"><MapPin className="w-5 h-5 text-blue-300" /> Last Known Location</h2>
                <p className="text-white/60 text-xs">Shared: {trip.last_location_time ? fmt(trip.last_location_time) : "Unknown time"}</p>
                {trip.last_location_label && <p className="text-white/80 text-sm">{trip.last_location_label}</p>}
                <a
                  href={`https://maps.google.com/?q=${trip.last_location_lat},${trip.last_location_lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-400/40 rounded-lg text-blue-300 text-sm hover:bg-blue-500/30 transition-colors"
                >
                  <MapPin className="w-4 h-4" /> View on Google Maps
                </a>
              </div>
            )}

            {/* Authorities */}
            {trip.authority_contacts?.length > 0 && (
              <div className="bg-black/55 backdrop-blur-md rounded-xl border border-white/20 p-5 space-y-3">
                <h2 className="text-white font-bold flex items-center gap-2"><Shield className="w-5 h-5 text-blue-300" /> Local Authorities</h2>
                <div className="space-y-2">
                  {trip.authority_contacts.map((a, i) => (
                    <div key={i} className="text-sm flex items-start justify-between gap-2">
                      <div>
                        <p className="text-white font-medium">{a.name}</p>
                        <p className="text-white/50 text-xs">{a.type} · {a.address}</p>
                      </div>
                      {a.phone && (
                        <a href={`tel:${a.phone}`} className="text-blue-300 text-xs flex items-center gap-1 shrink-0">
                          <Phone className="w-3 h-3" /> {a.phone}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alert section */}
            <div className="bg-black/55 backdrop-blur-md rounded-xl border border-red-400/30 p-5 space-y-4">
              <h2 className="text-white font-bold flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-400" /> Concerned About This Person?</h2>
              <p className="text-white/60 text-sm">If they're overdue or you can't reach them, alert the local authorities on file immediately.</p>

              {alertSent ? (
                <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4 text-green-300 text-center font-medium">
                  ✅ Authorities have been alerted. Help is on the way.
                </div>
              ) : !showAlertForm ? (
                <button
                  onClick={() => setShowAlertForm(true)}
                  className="w-full py-3 rounded-xl bg-red-500/80 hover:bg-red-500 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" /> Alert Authorities Now
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-white/70 text-xs">Your Name *</label>
                    <input
                      value={alerterName}
                      onChange={e => setAlerterName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full bg-white/15 border border-white/30 rounded-lg px-3 py-2 text-white placeholder:text-white/40 text-sm outline-none focus:border-white/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-white/70 text-xs">Your Relationship</label>
                    <input
                      value={alerterRel}
                      onChange={e => setAlerterRel(e.target.value)}
                      placeholder="e.g. Spouse, Parent, Friend"
                      className="w-full bg-white/15 border border-white/30 rounded-lg px-3 py-2 text-white placeholder:text-white/40 text-sm outline-none focus:border-white/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-white/70 text-xs">Additional message (optional)</label>
                    <textarea
                      value={alertMsg}
                      onChange={e => setAlertMsg(e.target.value)}
                      placeholder="Any additional details for authorities..."
                      rows={3}
                      className="w-full bg-white/15 border border-white/30 rounded-lg px-3 py-2 text-white placeholder:text-white/40 text-sm outline-none focus:border-white/50 resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAlert}
                      disabled={alerting}
                      className="flex-1 py-3 rounded-xl bg-red-500/80 hover:bg-red-500 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {alerting ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                      {alerting ? "Sending Alert..." : "Send Emergency Alert"}
                    </button>
                    <button onClick={() => setShowAlertForm(false)} className="px-4 rounded-xl bg-white/10 text-white/60 text-sm hover:bg-white/20 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}