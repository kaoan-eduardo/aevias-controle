import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import JSZip from 'npm:jszip@3.10.1';

Deno.serve(async (req) => {
    try {
        console.log('🚀 === INÍCIO DA EXPORTAÇÃO DE PDFs ===');
        
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            console.error('❌ Usuário não autenticado');
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('✅ Usuário autenticado:', user.email);

        const userAccessLevel = user.access_level || (user.role === 'admin' ? 'admin' : 'user');
        console.log('🔐 Access Level:', userAccessLevel);

        const canExport = 
            userAccessLevel === 'admin' || 
            userAccessLevel === 'sala_tecnica_afirmaevias' || 
            userAccessLevel === 'gestor_contrato' ||
            userAccessLevel === 'cliente';

        if (!canExport) {
            console.error('❌ Usuário sem permissão:', userAccessLevel);
            return Response.json({ 
                error: 'Sem permissão para exportar relatórios' 
            }, { status: 403 });
        }

        const body = await req.json();
        const { ensaioIds } = body;

        console.log('📦 Dados recebidos:');
        console.log('  - Quantidade de ensaios:', ensaioIds?.length);
        console.log('  - Primeiro ensaio:', ensaioIds?.[0]);

        if (!ensaioIds || !Array.isArray(ensaioIds) || ensaioIds.length === 0) {
            console.error('❌ Lista de IDs inválida');
            return Response.json({ 
                error: 'Lista de IDs de ensaios é obrigatória' 
            }, { status: 400 });
        }

        const invalidIds = ensaioIds.filter(e => !e.id || e.id === '-' || e.id.trim() === '');
        if (invalidIds.length > 0) {
            console.error('❌ IDs inválidos encontrados:', invalidIds);
            return Response.json({ 
                error: 'IDs inválidos detectados',
                details: invalidIds
            }, { status: 400 });
        }

        console.log('📁 Criando novo ZIP...');
        const zip = new JSZip();
        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        console.log('🔄 Iniciando processamento de', ensaioIds.length, 'ensaios...');

        for (let i = 0; i < ensaioIds.length; i++) {
            const ensaioData = ensaioIds[i];
            
            try {
                console.log(`\n📄 [${i + 1}/${ensaioIds.length}] Processando ensaio:`, ensaioData.nome);
                
                const { id, tipo, nome } = ensaioData;
                
                if (!id || !tipo || !nome) {
                    throw new Error('Dados do ensaio incompletos');
                }
                
                let reportUrl;
                const baseUrl = Deno.env.get('BASE44_APP_URL') || 'https://quaevias.base44.app';
                
                if (tipo === 'DiarioObra') {
                    reportUrl = `${baseUrl}/RelatorioDiario?id=${id}`;
                } else {
                    const tipoMap = {
                        'EnsaioExtracaoGranMarshall': 'marshall',
                        'EnsaioDensidade': 'densidade'
                    };
                    const tipoRelatorio = tipoMap[tipo] || 'marshall';
                    reportUrl = `${baseUrl}/RelatorioEnsaio?id=${id}&tipo=${tipoRelatorio}`;
                }

                console.log('  🔗 URL gerada:', reportUrl);

                const authHeader = req.headers.get('authorization');
                const fetchHeaders = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                };
                
                if (authHeader) {
                    fetchHeaders['Authorization'] = authHeader;
                    console.log('  🔑 Header de autenticação incluído');
                }

                console.log('  📡 Fazendo requisição HTTP...');
                const response = await fetch(reportUrl, {
                    headers: fetchHeaders,
                    redirect: 'follow'
                });

                console.log('  📡 Status da resposta:', response.status);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const htmlContent = await response.text();
                console.log(`  ✅ HTML obtido - ${String(htmlContent.length)} caracteres`);

                const sanitizedName = nome.replace(/[^a-zA-Z0-9_\-\s]/g, '_').substring(0, 200);
                const fileName = `${sanitizedName}.html`;
                
                console.log('  💾 Adicionando ao ZIP como:', fileName);
                const encoder = new TextEncoder();
                zip.file(fileName, encoder.encode(htmlContent));
                
                successCount++;
                console.log('  ✅ Arquivo adicionado com sucesso!');

            } catch (error) {
                errorCount++;
                const errorMsg = `Erro ao processar ${ensaioData.nome}: ${error.message}`;
                console.error(`  ❌ ${errorMsg}`);
                errors.push(errorMsg);
            }
        }

        console.log('\n📊 Resumo do processamento:');
        console.log('  ✅ Sucessos:', successCount);
        console.log('  ❌ Erros:', errorCount);

        if (successCount === 0) {
            console.error('❌ Nenhum relatório foi gerado com sucesso');
            console.error('Erros encontrados:', errors);
            return Response.json({ 
                error: 'Não foi possível gerar nenhum relatório',
                details: errors
            }, { status: 500 });
        }

        console.log('📦 Verificando conteúdo do ZIP antes de gerar...');
        const zipFiles = Object.keys(zip.files);
        console.log('  📁 Arquivos no ZIP:', zipFiles.length);
        console.log('  📋 Lista de arquivos:', zipFiles);

        console.log('🔄 Gerando arquivo ZIP...');
        const zipData = await zip.generateAsync({ 
            type: 'uint8array',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });

        console.log('✅ ZIP gerado com sucesso!');
        console.log('  📦 Tamanho do ZIP:', zipData.byteLength, 'bytes');
        console.log('  📦 Tipo:', typeof zipData);
        console.log('  📦 É Uint8Array?', zipData instanceof Uint8Array);

        if (zipData.byteLength === 0) {
            console.error('❌ ATENÇÃO: ZIP gerado está vazio!');
            return Response.json({ 
                error: 'ZIP gerado está vazio',
                details: 'O arquivo foi criado mas não contém dados'
            }, { status: 500 });
        }

        const timestamp = new Date().toISOString().split('T')[0];
        const fileName = `relatorios_${timestamp}.zip`;

        console.log('📤 Enviando resposta...');
        console.log('  📦 Nome do arquivo:', fileName);
        console.log('  📦 Content-Type: application/zip');
        console.log('  📦 Content-Length:', zipData.byteLength);

        const response = new Response(zipData, {
            status: 200,
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Content-Length': String(zipData.byteLength)
            }
        });

        console.log('✅ === EXPORTAÇÃO CONCLUÍDA COM SUCESSO ===\n');
        return response;

    } catch (error) {
        console.error('❌ === ERRO FATAL NA EXPORTAÇÃO ===');
        console.error('Tipo do erro:', typeof error);
        console.error('Mensagem:', error.message);
        console.error('Stack:', error.stack);
        console.error('Erro completo:', error);
        
        return Response.json({ 
            error: 'Erro ao processar exportação',
            details: error.message,
            stack: error.stack
        }, { status: 500 });
    }
});