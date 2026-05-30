import moment from "moment";

function fmt(dt) {
  if (!dt) return "Not specified";
  return moment(dt).format("MMM D, YYYY h:mm A");
}

export default function formatTripText(data) {
  let lines = [
    "=== SAFERETURN TRIP PLAN ===",
    "",
    "--- WHO ---",
    `Name: ${data.primary_name || "—"}`,
    `Age: ${data.primary_age || "—"}`,
    `Phone: ${data.primary_phone || "—"}`,
    `Emergency Device: ${data.emergency_device_type || "—"}`,
    `Total Participants: ${data.total_participants || 1}`,
  ];

  if (data.other_contacts?.length > 0) {
    lines.push("", "Other Contacts:");
    data.other_contacts.forEach(c => {
      lines.push(`  - ${c.name || "—"}, Age: ${c.age || "—"}, Phone: ${c.phone || "—"}`);
    });
  }

  lines = lines.concat([
    "",
    "--- WHERE ---",
    `Park / Destination: ${data.park_name || "—"}`,
    `Visitor Center: ${data.visitor_center || "—"}`,
    `Travel Method: ${data.travel_method || "—"}`,
    `Accommodation: ${data.accommodation || "—"}`,
    "",
    "--- WHEN ---",
    `Arrival: ${fmt(data.arrival_datetime)}`,
    `Departure: ${fmt(data.departure_datetime)}`,
    `*** EXPECTED RETURN HOME: ${fmt(data.expected_return_datetime)} ***`,
  ]);

  if (data.activities?.length > 0) {
    lines.push("", "--- ACTIVITIES ---");
    data.activities.forEach((a, i) => {
      lines.push(
        `Activity ${i + 1}: ${a.activity || "—"}`,
        `  From: ${a.start_location || "—"} at ${fmt(a.start_datetime)}`,
        `  To: ${a.end_location || "—"} at ${fmt(a.end_datetime)}`
      );
    });
  }

  if (data.backup_activity) {
    lines = lines.concat([
      "", "--- BACKUP PLAN ---",
      `Activity: ${data.backup_activity}`,
      `  From: ${data.backup_start_location || "—"} at ${fmt(data.backup_start_datetime)}`,
      `  To: ${data.backup_end_location || "—"} at ${fmt(data.backup_end_datetime)}`,
    ]);
  }

  lines.push("", "--- EQUIPMENT ---");
  if (data.vehicle_make) lines.push(`Vehicle: ${data.vehicle_make} ${data.vehicle_model || ""} (${data.vehicle_color || "—"}) — Plate: ${data.vehicle_license || "—"}`);
  if (data.vessel_make) lines.push(`Vessel: ${data.vessel_make} ${data.vessel_model || ""} (${data.vessel_color || "—"})`);
  if (data.bicycle_make) lines.push(`Bicycle: ${data.bicycle_make} ${data.bicycle_model || ""} (${data.bicycle_color || "—"})`);
  if (data.camping_tent) lines.push(`Tent: ${data.camping_tent}`);
  if (data.backpack_description) lines.push(`Backpack: ${data.backpack_description}`);
  if (data.other_equipment) lines.push(`Other: ${data.other_equipment}`);

  lines = lines.concat([
    "",
    "--- ACTION REQUIRED ---",
    `If ${data.primary_name || "this person"} has NOT checked in by ${fmt(data.expected_return_datetime)},`,
    "please contact local search and rescue or law enforcement immediately.",
    "",
    "Sent via SafeReturn — Outdoor Safety Made Simple",
  ]);

  return lines.join("\n");
}