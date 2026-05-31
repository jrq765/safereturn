import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const { planData, extraPeople, contacts } = await req.json();

    const base44 = createClientFromRequest(req);

    // Create trip plan as service role (no auth required)
    const tripPlan = await base44.asServiceRole.entities.TripPlan.create({
      ...planData,
      other_contacts: extraPeople || [],
    });

    // Create emergency contact records
    const validContacts = (contacts || []).filter(c => c.contact_name && c.contact_email);
    await Promise.allSettled(
      validContacts.map(c =>
        base44.asServiceRole.entities.EmergencyContact.create({
          trip_plan_id: tripPlan.id,
          contact_name: c.contact_name,
          contact_email: c.contact_email,
          contact_phone: c.contact_phone,
          relationship: c.relationship,
          notification_sent: false,
        })
      )
    );

    return Response.json({ success: true, tripPlan });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});