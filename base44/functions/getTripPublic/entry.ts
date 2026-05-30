import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { tripId } = await req.json();
    if (!tripId) return Response.json({ error: 'Missing tripId' }, { status: 400 });

    const trip = await base44.asServiceRole.entities.TripPlan.get(tripId);
    if (!trip) return Response.json({ error: 'Trip not found' }, { status: 404 });

    return Response.json({ trip });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});