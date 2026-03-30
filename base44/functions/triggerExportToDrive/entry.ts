import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const entityName = body?.event?.entity_name;
    const recordId = body?.event?.entity_id;
    const eventType = body?.event?.type;

    // Only export on create
    if (eventType !== 'create') {
      return Response.json({ skipped: true, reason: 'not a create event' });
    }

    if (!entityName || !recordId) {
      return Response.json({ error: 'Missing entity_name or entity_id' }, { status: 400 });
    }

    // Check the record belongs to a laboratorista (role === 'user')
    const data = body?.data;
    if (!data) {
      return Response.json({ skipped: true, reason: 'no data in payload' });
    }

    // Invoke the actual export
    const result = await base44.asServiceRole.functions.invoke('exportToDrive', {
      entityName,
      recordId,
    });

    console.log(`✅ Export triggered for ${entityName}/${recordId}:`, result);
    return Response.json({ success: true, result });
  } catch (error) {
    console.error('triggerExportToDrive error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});