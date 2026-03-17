import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Usar updateMe em vez de atualizar o entity diretamente
        // para evitar disparar subscriptions que causam re-renders
        await base44.auth.updateMe({ last_login: new Date().toISOString() });

        return Response.json({ success: true });
    } catch (error) {
        console.error('Erro ao atualizar last_login:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});