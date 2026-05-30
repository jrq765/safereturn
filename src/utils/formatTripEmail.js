import moment from "moment";

function fmt(dt) {
  if (!dt) return "Not specified";
  return moment(dt).format("MMM D, YYYY h:mm A");
}

export default function formatTripEmail(data, portalUrl) {
  let body = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #023E13;">
  <div style="background: #023E13; padding: 24px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🛡️ SafeReturn Trip Plan</h1>
  </div>
  <div style="padding: 24px; background: #F6FAFF; border: 1px solid #dde8f4;">
    <p style="color: #555; margin-bottom: 20px;">
      This trip plan was filed so you can take action quickly if something goes wrong.
      <strong>Please save this email.</strong>
    </p>

    <h2 style="color: #023E13; border-bottom: 2px solid #6BB2FD; padding-bottom: 8px;">👤 WHO</h2>
    <table style="width: 100%; margin-bottom: 16px;">
      <tr><td style="padding: 4px 0; color: #666;">Name:</td><td><strong>${data.primary_name || "—"}</strong></td></tr>
      <tr><td style="padding: 4px 0; color: #666;">Age:</td><td>${data.primary_age || "—"}</td></tr>
      <tr><td style="padding: 4px 0; color: #666;">Phone:</td><td>${data.primary_phone || "—"}</td></tr>
      <tr><td style="padding: 4px 0; color: #666;">Emergency Device:</td><td>${data.emergency_device_type || "—"}</td></tr>
      <tr><td style="padding: 4px 0; color: #666;">Total Participants:</td><td>${data.total_participants || 1}</td></tr>
    </table>`;

  if (data.other_contacts?.length > 0) {
    body += `<p style="color: #666; margin-top: 8px;"><strong>Other Contacts:</strong></p><ul>`;
    data.other_contacts.forEach(c => {
      body += `<li>${c.name || "—"} (Age: ${c.age || "—"}, Phone: ${c.phone || "—"})</li>`;
    });
    body += `</ul>`;
  }

  body += `
    <h2 style="color: #023E13; border-bottom: 2px solid #6BB2FD; padding-bottom: 8px;">📍 WHERE</h2>
    <table style="width: 100%; margin-bottom: 16px;">
      <tr><td style="padding: 4px 0; color: #666;">Park:</td><td>${data.park_name || "—"}</td></tr>
      <tr><td style="padding: 4px 0; color: #666;">Visitor Center:</td><td>${data.visitor_center || "—"}</td></tr>
      <tr><td style="padding: 4px 0; color: #666;">Travel Method:</td><td>${data.travel_method || "—"}</td></tr>
      <tr><td style="padding: 4px 0; color: #666;">Accommodation:</td><td>${data.accommodation || "—"}</td></tr>
    </table>

    <h2 style="color: #023E13; border-bottom: 2px solid #6BB2FD; padding-bottom: 8px;">🕐 WHEN</h2>
    <table style="width: 100%; margin-bottom: 16px;">
      <tr><td style="padding: 4px 0; color: #666;">Arrival:</td><td>${fmt(data.arrival_datetime)}</td></tr>
      <tr><td style="padding: 4px 0; color: #666;">Departure:</td><td>${fmt(data.departure_datetime)}</td></tr>
      <tr><td style="padding: 4px 0; color: #666;"><strong>Expected Return:</strong></td><td><strong style="color: #c0392b;">${fmt(data.expected_return_datetime)}</strong></td></tr>
    </table>`;

  if (data.activities?.length > 0) {
    body += `<h2 style="color: #023E13; border-bottom: 2px solid #6BB2FD; padding-bottom: 8px;">🧭 ACTIVITIES</h2>`;
    data.activities.forEach((a, i) => {
      body += `<p><strong>Activity ${i + 1}: ${a.activity || "—"}</strong><br/>
        From: ${a.start_location || "—"} at ${fmt(a.start_datetime)}<br/>
        To: ${a.end_location || "—"} at ${fmt(a.end_datetime)}</p>`;
    });
  }

  if (data.backup_activity) {
    body += `<p><strong>Backup Plan:</strong> ${data.backup_activity}<br/>
      From: ${data.backup_start_location || "—"} at ${fmt(data.backup_start_datetime)}<br/>
      To: ${data.backup_end_location || "—"} at ${fmt(data.backup_end_datetime)}</p>`;
  }

  body += `<h2 style="color: #023E13; border-bottom: 2px solid #6BB2FD; padding-bottom: 8px;">🎒 EQUIPMENT</h2><table style="width: 100%; margin-bottom: 16px;">`;

  if (data.vehicle_make || data.vehicle_model) {
    body += `<tr><td style="padding: 4px 0; color: #666;">Vehicle:</td><td>${data.vehicle_make || ""} ${data.vehicle_model || ""} (${data.vehicle_color || "—"}) — License: ${data.vehicle_license || "—"}</td></tr>`;
  }
  if (data.vessel_make || data.vessel_model) {
    body += `<tr><td style="padding: 4px 0; color: #666;">Water Vessel:</td><td>${data.vessel_make || ""} ${data.vessel_model || ""} (${data.vessel_color || "—"})</td></tr>`;
  }
  if (data.bicycle_make || data.bicycle_model) {
    body += `<tr><td style="padding: 4px 0; color: #666;">Bicycle:</td><td>${data.bicycle_make || ""} ${data.bicycle_model || ""} (${data.bicycle_color || "—"})</td></tr>`;
  }
  if (data.camping_tent) body += `<tr><td style="padding: 4px 0; color: #666;">Tent:</td><td>${data.camping_tent}</td></tr>`;
  if (data.backpack_description) body += `<tr><td style="padding: 4px 0; color: #666;">Backpack:</td><td>${data.backpack_description}</td></tr>`;
  if (data.other_equipment) body += `<tr><td style="padding: 4px 0; color: #666;">Other:</td><td>${data.other_equipment}</td></tr>`;

  body += `</table>

    <div style="background: #fff3cd; padding: 16px; border-radius: 8px; margin-top: 20px;">
      <p style="margin: 0; color: #856404; font-size: 14px;">
        ⚠️ <strong>If ${data.primary_name || "this person"} has not returned or checked in by ${fmt(data.expected_return_datetime)},
        please contact local authorities immediately.</strong>
      </p>
    </div>
    ${portalUrl ? `
    <div style="background: #e8f4fd; padding: 16px; border-radius: 8px; margin-top: 16px; text-align: center;">
      <p style="margin: 0 0 8px 0; color: #023E13; font-weight: bold;">📱 Family Portal — Live Updates & Emergency Alert</p>
      <p style="margin: 0 0 12px 0; color: #555; font-size: 13px;">Check the traveler's last known location and alert authorities directly from this link:</p>
      <a href="${portalUrl}" style="background: #023E13; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Open Family Portal →</a>
    </div>` : ''}
  </div>
  <div style="background: #023E13; padding: 16px; text-align: center;">
    <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 12px;">Sent via SafeReturn — Outdoor Safety Made Simple</p>
  </div>
</div>`;

  return body;
}