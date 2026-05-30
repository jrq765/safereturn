import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, MapPin, Clock, Trash2, CheckCircle, AlertTriangle, Loader2, Pencil, Navigation, Copy, ChevronDown, ChevronUp } from "lucide-react";
import moment from "moment";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const BG_IMAGE = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&auto=format&fit=crop";

const STATUS_CONFIG = {
  active:    { color: "text-blue-300",   bg: "bg-blue-400/15",  border: "border-blue-400/30",   label: "Active",    Icon: Clock },
  completed: { color: "text-green-300",  bg: "bg-green-400/15", border: "border-green-400/30",  label: "Completed", Icon: CheckCircle },
  overdue:   { color: "text-red-300",    bg: "bg-red-400/15",   border: "border-red-400/30",    label: "Overdue",   Icon: AlertTriangle },
  cancelled: { color: "text-white/40",   bg: "bg-white/5",      border: "border-white/10",      label: "Cancelled", Icon: Trash2 },
};

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(null);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["trip-plans"],
    queryFn: () => base44.entities.TripPlan.list("-created_date"),
  });

  const deletePlan = useMutation({
    mutationFn: (id) => base44.entities.TripPlan.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["trip-plans"] }); toast.success("Trip plan deleted"); },
  });

  const handleReturn = async (plan) => {
    await base44.entities.TripPlan.update(plan.id, { status: "completed" });
    queryClient.invalidateQueries({ queryKey: ["trip-plans"] });
    const contacts = await base44.entities.EmergencyContact.filter({ trip_plan_id: plan.id });
    const subject = `✅ Safe Return: ${plan.primary_name || "Traveler"} is back from ${plan.park_name || "their trip"}`;
    const body = `Good news! ${plan.primary_name || "Traveler"} has safely returned from ${plan.park_name || "their trip"}. No further action needed.`;
    for (const c of contacts) if (c.contact_email) await base44.integrations.Core.SendEmail({ to: c.contact_email, subject, body });
    for (const a of (plan.authority_contacts || [])) if (a.email) await base44.integrations.Core.SendEmail({ to: a.email, subject, body });
    toast.success("Safe return emails sent!");
  };

  const shareLocation = (planId) => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported."); return; }
    toast.info("Getting your location...");
    navigator.geolocation.getCurrentPosition(async (pos) => {
      await base44.entities.TripPlan.update(planId, {
        last_location_lat: pos.coords.latitude,
        last_location_lng: pos.coords.longitude,
        last_location_time: new Date().toISOString(),
        last_location_label: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
      });
      queryClient.invalidateQueries({ queryKey: ["trip-plans"] });
      toast.success("Location shared with your contacts!");
    }, () => toast.error("Could not get location. Enable GPS."));
  };

  const copyPortalLink = (planId) => {
    navigator.clipboard.writeText(`${window.location.origin}/family?id=${planId}`);
    toast.success("Family portal link copied!");
  };

  return (
    <div className="relative min-h-screen font-inter">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <img src={BG_IMAGE} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/55" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">My Plans</h1>
            <p className="text-white/50 text-sm mt-1">{plans.length} trip{plans.length !== 1 ? "s" : ""} filed</p>
          </div>
          <Link to="/new-plan">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/25 text-white font-semibold text-sm transition-all hover:scale-105">
              <Plus className="w-4 h-4" /> New Plan
            </button>
          </Link>
        </motion.div>

        {isLoading && (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>
        )}

        {!isLoading && plans.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-black/50 backdrop-blur-md border border-white/20 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-white/40" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No trip plans yet</h3>
            <p className="text-white/50 mb-6 text-sm">File your first plan before heading out — it only takes a few minutes.</p>
            <Link to="/new-plan">
              <button className="px-8 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors">File Your First Plan</button>
            </Link>
          </motion.div>
        )}

        <div className="space-y-3">
          {plans.map((plan, idx) => {
            const cfg = STATUS_CONFIG[plan.status] || STATUS_CONFIG.active;
            const StatusIcon = cfg.Icon;
            const isOpen = expanded === plan.id;
            const isOverdue = plan.status === "active" && plan.expected_return_datetime && moment().isAfter(moment(plan.expected_return_datetime));

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-black/55 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden"
              >
                {/* Card header — always visible */}
                <button
                  onClick={() => setExpanded(isOpen ? null : plan.id)}
                  className="w-full text-left px-5 py-4 flex items-center gap-4"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg} border ${cfg.border}`}>
                    <StatusIcon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-white font-semibold truncate">{plan.primary_name || "Unnamed Plan"}</p>
                      {isOverdue && <span className="text-xs text-red-400 font-medium shrink-0">⚠ Overdue</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/50">
                      {plan.park_name && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{plan.park_name}</span>}
                      {plan.expected_return_datetime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Return {moment(plan.expected_return_datetime).format("MMM D, h:mm A")}</span>}
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border} shrink-0`}>{cfg.label}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-white/40 shrink-0" /> : <ChevronDown className="w-4 h-4 text-white/40 shrink-0" />}
                </button>

                {/* Expanded actions */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 border-t border-white/10 pt-4 space-y-3">
                        {/* Location info */}
                        {plan.last_location_lat && (
                          <a
                            href={`https://maps.google.com/?q=${plan.last_location_lat},${plan.last_location_lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-blue-300 hover:text-blue-200"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            Last location: {plan.last_location_label} — {plan.last_location_time ? moment(plan.last_location_time).fromNow() : ""}
                          </a>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-2">
                          <Link to={`/new-plan?id=${plan.id}`}>
                            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-xs font-medium hover:bg-white/20 transition-colors">
                              <Pencil className="w-3.5 h-3.5" /> Edit
                            </button>
                          </Link>

                          {plan.status === "active" && (
                            <>
                              <button onClick={() => shareLocation(plan.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-medium hover:bg-blue-500/30 transition-colors">
                                <Navigation className="w-3.5 h-3.5" /> Share Location
                              </button>
                              <button onClick={() => handleReturn(plan)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-500/20 border border-green-400/30 text-green-300 text-xs font-medium hover:bg-green-500/30 transition-colors">
                                <CheckCircle className="w-3.5 h-3.5" /> I'm Back
                              </button>
                            </>
                          )}

                          <button onClick={() => copyPortalLink(plan.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white/70 text-xs font-medium hover:bg-white/20 transition-colors">
                            <Copy className="w-3.5 h-3.5" /> Copy Family Link
                          </button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-400/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete this trip plan?</AlertDialogTitle>
                                <AlertDialogDescription>This cannot be undone. Emergency contacts will not be notified.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deletePlan.mutate(plan.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}