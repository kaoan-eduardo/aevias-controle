/**
 * Funções de validação para formulários de checklist
 */

export function validateChecklistForm(formData, saveStatus) {
  if (saveStatus === 'finalizado') {
    const requiredFields = {
      obra_id: "Obra",
      project_id: "Projeto",
      usina: "Usina", // ChecklistUsina specific
      pedreira: "Pedreira",
      faixa_especificada: "Faixa especificada",
      ligante: "Ligante asfáltico",
    };

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!formData[field]) {
        return { valid: false, message: `Por favor, preencha ${label}.` };
      }
    }
  } else {
    // Salvar progresso - apenas obra é obrigatória
    if (!formData.obra_id) {
      return { valid: false, message: "Por favor, selecione uma obra." };
    }
  }

  return { valid: true };
}

export function validateDecimalInput(value, maxDecimals) {
  if (value === '') return true;

  let regex;
  switch (maxDecimals) {
    case 0:
      regex = /^\d+$/;
      break;
    case 1:
      regex = /^\d*\.?\d{0,1}$/;
      break;
    case 2:
      regex = /^\d*\.?\d{0,2}$/;
      break;
    case 3:
      regex = /^\d*\.?\d{0,3}$/;
      break;
    default:
      regex = /^\d*\.?\d*$/;
  }

  return regex.test(value);
}