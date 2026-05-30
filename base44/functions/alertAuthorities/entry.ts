import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { tripId, alerterName, alerterRelationship, message } = await req.json();
    if (!tripId) return Response.json({ error: 'Missing tripId' }, { status: 400 });

    const trip = await base44.asServiceRole.entities.TripPlan.get(tripId);
    if (!trip) return Response.json({ error: 'Trip not found' }, { status: 404 });

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });

    const locationNote = (trip.last_location_lat && trip.last_location_lng)
      ? `<p><strong>Last Known Location:</strong> <a href="https://maps.google.com/?q=${trip.last_location_lat},${trip.last_location_lng}">View on Map</a> (updated ${trip.last_location_time || 'unknown time'})</p>`
      : '<p><em>No GPS location shared yet.</em></p>';

    const subject = `🚨 EMERGENCY ALERT: ${trip.primary_name || 'Traveler'} may be overdue — ${trip.park_name || 'Outdoor Trip'}`;
    const body = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #c0392b; padding: 24px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 22px;">🚨 EMERGENCY ALERT — SafeReturn</h1>
  </div>
  <div style="padding: 24px; background: #fff3f3; border: 1px solid #f5c6cb;">
    <p style="font-size: 16px;"><strong>${alerterName || 'An emergency contact'}</strong> (${alerterRelationship || 'contact'}) has triggered an alert for:</p>
    <h2 style="color: #c0392b; margin: 8px 0;">${trip.primary_name || 'Traveler'}</h2>
    <p><strong>Destination:</strong> ${trip.park_name || '—'}</p>
    <p><strong>Expected Return:</strong> ${trip.expected_return_datetime || 'Not specified'}</p>
    <p><strong>Phone:</strong> ${trip.primary_phone || 'Not provided'}</p>
    ${locationNote}
    ${message ? `<p><strong>Contact message:</strong> "${message}"</p>` : ''}
    <hr style="margin: 20px 0;"/>
    <p style="color: #c0392b; font-weight: bold; font-size: 15px;">Please check on this person immediately.</p>
  </div>
  <div style="background: #023E13; padding: 16px; text-align: center;">
    <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 12px;">Sent via SafeReturn — Outdoor Safety Made Simple</p>
  </div>
</div>`;

    const authorities = (trip.authority_contacts || []).filter(a => a.email);
    const results = await Promise.allSettled(
      authorities.map(a =>
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: 'SafeReturn Emergency <trips@safereturn.tech>', to: [a.email], subject, html: body }),
        })
      )
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    return Response.json({ success: true, sent, total: authorities.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});