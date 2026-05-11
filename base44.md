# ⚠️ Regras Gerais

Antes de gerar qualquer código:

1. Não altere regras de negócio existentes sem solicitação explícita.
2. Não refatore arquivos inteiros sem necessidade.
3. Faça mudanças pequenas, isoladas e fáceis de revisar.
4. Preserve a arquitetura atual do projeto.
5. Preserve nomes de funções, componentes e arquivos existentes sempre que possível.
6. Evite criar acoplamento desnecessário.
7. Evite duplicação de lógica.
8. Não remova código existente sem justificar claramente.
9. Não “modernize” código automaticamente.
10. Não altere layout, estilo ou UX sem solicitação explícita.

---

# 🧱 Arquitetura

Sempre que possível:

- Separar regra de negócio da interface.
- Evitar lógica complexa dentro de componentes React.
- Centralizar chamadas de API.
- Criar funções reutilizáveis.
- Manter responsabilidades bem definidas.

## Estrutura preferencial

```txt
src/
├── components/
├── pages/
├── services/
├── business-rules/
├── hooks/
├── utils/
└── assets/
```

---

# ⚛️ Regras React

## useEffect

1. Não criar `useEffect` desnecessário.
2. Nunca criar loops de renderização.
3. Não depender de estados que o próprio `useEffect` altera.
4. Explicar claramente a dependência do hook.

### Evitar

```jsx
useEffect(() => {
  carregarDados();
});
```

### Preferir

```jsx
useEffect(() => {
  carregarDados();
}, []);
```

---

# 🌐 API e Dados

1. Evitar chamadas repetidas à API.
2. Implementar tratamento de erro.
3. Implementar estados de:
   - loading
   - erro
   - vazio
4. Evitar processamento pesado no frontend.
5. Não buscar dados desnecessários.

---

# 🛡️ Segurança e Estabilidade

1. Evitar alterar comportamento já validado.
2. Não criar mudanças “inteligentes” fora do escopo.
3. Não assumir regras de negócio ambíguas.
4. Em caso de dúvida:
   - adicionar comentário TODO
   - ou pedir confirmação

---

# 🐛 Correção de Bugs

Ao corrigir bugs:

1. Alterar apenas o necessário.
2. Não refatorar junto com correção.
3. Não alterar múltiplos módulos sem necessidade.
4. Explicar:
   - causa provável
   - impacto
   - arquivos alterados

# 🧪 Qualidade de Código

1. Preferir código legível ao invés de “código inteligente”.
2. Usar nomes claros.
3. Evitar funções gigantes.
4. Evitar lógica duplicada.
5. Evitar try/catch genérico sem tratamento.

---

# 🚫 Não Fazer

- Não recriar componentes sem necessidade.
- Não mudar arquitetura inteira.
- Não mover arquivos sem motivo.
- Não criar abstrações excessivas.
- Não adicionar bibliotecas sem justificar.
- Não alterar regras de negócio implicitamente.

---

# ✅ Prioridade

A prioridade é:

```txt
Estabilidade > Performance > Refatoração > Estética
```

---

# 📌 Regra Final

Se houver ambiguidade:
- não assumir comportamento
- não inventar regra
- não “melhorar” automaticamente

Preferir sempre mudanças:
- pequenas
- previsíveis
- revisáveis
- seguras