import React from 'react';

const formatDateBrasilia = (dateString) => {
  if (!dateString) return 'N/A';
  let normalizedDate = dateString;
  if (!dateString.endsWith('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
    normalizedDate = dateString + 'Z';
  }
  return new Date(normalizedDate).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'medium' });
};

export default function SignatureFooter({ 
  labName, 
  labEmail, 
  labPosition,
  labCreatedDate,
  approverName, 
  approverEmail, 
  approverPosition,
  approverCREA,
  approverDate,
  clientName, 
  clientEmail, 
  clientPosition,
  clientCREA,
  clientDate,
  sizePrint = false 
}) {
  const textSize = sizePrint ? 'text-[7px] print:text-[6px]' : 'text-xs print:text-[9px]';
  const headerSize = sizePrint ? 'text-[7px] print:text-[6px]' : 'text-sm print:text-[10px]';
  const minHeight = sizePrint ? 'min-h-[28px] print:min-h-[20px]' : 'min-h-[36px] print:min-h-[28px]';
  const signatureStyle = { fontFamily: "'Segoe Print', 'Courier New', monospace" };

  return (
    <div className="grid grid-cols-3 gap-0.5 items-end print:gap-0.5">
      {/* Laboratorista */}
      <div className="text-center">
        <div className={`${textSize} text-slate-500 mb-0 ${minHeight} flex flex-col justify-end items-center print:mb-0`}>
          {labName && (
            <>
              <p className="font-bold text-slate-600 text-[11px]" style={signatureStyle}>{labName}</p>
              {labEmail && <p className={textSize}>{labEmail}</p>}
              {labCreatedDate && <p className={textSize}>em {formatDateBrasilia(labCreatedDate)}</p>}
            </>
          )}
        </div>
        <div className="border-t-2 border-gray-500 pt-0 w-3/4 mx-auto print:pt-0 print:border-t-1">
          <p className={`${headerSize} font-semibold uppercase`}>{labPosition || 'Laboratorista'}</p>
        </div>
      </div>

      {/* Aprovador */}
      <div className="text-center">
        {approverEmail ? (
          <>
            <div className={`${textSize} text-slate-500 mb-0 ${minHeight} flex flex-col justify-end items-center print:mb-0`}>
              {approverName && <p className="font-bold text-slate-600 text-[11px]" style={signatureStyle}>{approverName}</p>}
              <p className={textSize}>{approverEmail}</p>
              {approverCREA && <p className={textSize}>CREA: {approverCREA}</p>}
              {approverDate && <p className={textSize}>em {formatDateBrasilia(approverDate)}</p>}
            </div>
            <div className="border-t-2 border-gray-500 pt-0 w-3/4 mx-auto print:pt-0 print:border-t-1">
              <p className={`${headerSize} font-semibold uppercase`}>{approverPosition || 'Responsável'}</p>
            </div>
          </>
        ) : (
          <>
            <div className={`${minHeight} mb-0 print:mb-0`}></div>
            <div className="border-t-2 border-gray-500 pt-0 w-3/4 mx-auto print:pt-0 print:border-t-1">
              <p className={`${headerSize} font-semibold`}>Responsável</p>
            </div>
          </>
        )}
      </div>

      {/* Cliente */}
      <div className="text-center">
        {clientEmail ? (
          <>
            <div className={`${textSize} text-slate-500 mb-0 ${minHeight} flex flex-col justify-end items-center print:mb-0`}>
              {clientName && <p className="font-bold text-slate-600 text-[11px]" style={signatureStyle}>{clientName}</p>}
              <p className={textSize}>{clientEmail}</p>
              {clientCREA && <p className={textSize}>CREA: {clientCREA}</p>}
              {clientDate && <p className={textSize}>em {formatDateBrasilia(clientDate)}</p>}
            </div>
            <div className="border-t-2 border-gray-500 pt-0 w-3/4 mx-auto print:pt-0 print:border-t-1">
              <p className={`${headerSize} font-semibold uppercase`}>{clientPosition || 'Cliente'}</p>
            </div>
          </>
        ) : (
          <>
            <div className={`${minHeight} mb-0 print:mb-0`}></div>
            <div className="border-t-2 border-gray-500 pt-0 w-3/4 mx-auto print:pt-0 print:border-t-1">
              <p className={`${headerSize} font-semibold`}>Cliente</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}