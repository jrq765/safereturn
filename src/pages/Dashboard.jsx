import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, MapPin, Clock, Trash2, CheckCircle, AlertTriangle, Loader2, Pencil, Navigation, Copy } from "lucide-react";
import moment from "moment";
import { toast } from "sonner";

const statusStyles = {
  active: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-accent/10 text-accent border-accent/20",
  overdue: "bg-destructive/10 text-destructive border-destructive/20",
  cancelled: "bg-muted text-muted-foreground border-border",
};

const statusIcons = {
  active: Clock,
  completed: CheckCircle,
  overdue: AlertTriangle,
  cancelled: Trash2,
};

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["trip-plans"],
    queryFn: () => base44.entities.TripPlan.list("-created_date"),
  });

  const shareLocation = async (planId) => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported on this device."); return; }
    toast.info("Getting your location...");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        await base44.entities.TripPlan.update(planId, {
          last_location_lat: latitude,
          last_location_lng: longitude,
          last_location_time: new Date().toISOString(),
          last_location_label: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        });
        queryClient.invalidateQueries({ queryKey: ["trip-plans"] });
        toast.success("Location shared with your emergency contacts!");
      },
      () => toast.error("Could not get location. Please enable GPS.")
    );
  };

  const copyPortalLink = (planId) => {
    const url = `${window.location.origin}/family?id=${planId}`;
    navigator.clipboard.writeText(url);
    toast.success("Family portal link copied!");
  };

  const deletePlan = useMutation({
    mutationFn: (id) => base44.entities.TripPlan.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip-plans"] });
      toast.success("Trip plan deleted");
    },
  });

  const handleReturn = async (plan) => {
    try {
      await base44.entities.TripPlan.update(plan.id, { status: "completed" });
      queryClient.invalidateQueries({ queryKey: ["trip-plans"] });

      const name = plan.primary_name || "The traveler";
      const destination = plan.park_name || "their trip";
      const subject = `✅ Safe Return: ${name} is back from ${destination}`;
      const body = `Good news!\n\n${name} has safely returned from ${destination}.\n\nThis is an automated safe return notification from SafeReturn.\n\nNo further action is needed. Thank you for being an emergency contact.`;

      const contacts = await base44.entities.EmergencyContact.filter({ trip_plan_id: plan.id });
      for (const c of contacts) {
        if (c.contact_email) {
          await base44.integrations.Core.SendEmail({ to: c.contact_email, subject, body });
        }
      }
      for (const a of (plan.authority_contacts || [])) {
        if (a.email) {
          await base44.integrations.Core.SendEmail({ to: a.email, subject, body });
        }
      }
      toast.success(`Welcome back! Safe return emails sent to ${contacts.length + (plan.authority_contacts || []).filter(a => a.email).length} contact(s).`);
    } catch (err) {
      toast.error("Error: " + err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 font-inter">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Trip Plans</h1>
          <p className="text-sm text-muted-foreground mt-1">{plans.length} plan{plans.length !== 1 ? "s" : ""} filed</p>
        </div>
        <Link to="/new-plan">
          <Button className="gap-2 bg-primary hover:bg-primary/90 text-white">
            <Plus className="w-4 h-4" /> New Plan
          </Button>
        </Link>
      </div>

      {plans.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No trip plans yet</h3>
          <p className="text-muted-foreground mb-6">{"File your first trip plan before heading out — it only takes a few minutes."}</p>
          <Link to="/new-plan">
            <Button className="bg-primary hover:bg-primary/90 text-white">File Your First Plan</Button>
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {plans.map((plan) => {
          const StatusIcon = statusIcons[plan.status] || Clock;
          return (
            <div key={plan.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-foreground truncate">{plan.primary_name}</h3>
                    <Badge variant="outline" className={statusStyles[plan.status] || ""}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {plan.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {plan.park_name && (
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{plan.park_name}</span>
                    )}
                    {plan.expected_return_datetime && (
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />Return: {moment(plan.expected_return_datetime).format("MMM D, h:mm A")}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => copyPortalLink(plan.id)} title="Copy family portal link" className="p-2 rounded-lg border border-white/20 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <Copy className="w-4 h-4" />
                  </button>
                  {plan.status === "active" && (
                    <button onClick={() => shareLocation(plan.id)} title="Share your GPS location" className="p-2 rounded-lg border border-blue-200 hover:bg-blue-50 text-blue-500 transition-colors">
                      <Navigation className="w-4 h-4" />
                    </button>
                  )}
                  <Link to={`/new-plan?id=${plan.id}`}>
                    <Button variant="outline" size="sm" className="text-muted-foreground">
                      <Pencil className="w-4 h-4 mr-1" /> Edit
                    </Button>
                  </Link>
                  {plan.status === "active" && (
                    <Button variant="outline" size="sm" onClick={() => handleReturn(plan)} className="text-accent border-accent/30 hover:bg-accent/10">
                      <CheckCircle className="w-4 h-4 mr-1" /> {"I'm Back"}
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this trip plan?</AlertDialogTitle>
                        <AlertDialogDescription>This cannot be undone. Your emergency contacts will not be notified of the deletion.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deletePlan.mutate(plan.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}