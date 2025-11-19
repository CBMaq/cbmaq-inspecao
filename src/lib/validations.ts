import { z } from 'zod';

// Inspection validation schema
export const inspectionSchema = z.object({
  inspection_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  process_type: z.enum(['instalacao_entrada_target', 'entrada_cbmaq', 'saida_cbmaq', 'entrada_dnm', 'saida_dnm', 'entrega_governo'], {
    errorMap: () => ({ message: 'Tipo de processo inválido' }),
  }),
  model: z.string().trim().min(1, 'Modelo é obrigatório').max(100, 'Modelo muito longo'),
  serial_number: z.string().trim().min(1, 'Número de série é obrigatório').max(50, 'Número de série muito longo'),
  horimeter: z.number().int().min(0, 'Horímetro deve ser positivo').max(999999, 'Horímetro muito alto'),
  freight_responsible: z.string().trim().max(200, 'Texto muito longo').optional().or(z.literal('')),
  driver_name: z.string().trim().max(200, 'Nome muito longo').optional().or(z.literal('')),
});

// Auth validation schemas
export const signUpSchema = z.object({
  email: z.string().trim().email('Email inválido').max(255, 'Email muito longo'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').max(72, 'Senha muito longa'),
  full_name: z.string().trim().min(1, 'Nome completo é obrigatório').max(200, 'Nome muito longo'),
});

export const signInSchema = z.object({
  email: z.string().trim().email('Email inválido').max(255, 'Email muito longo'),
  password: z.string().min(1, 'Senha é obrigatória').max(72, 'Senha muito longa'),
});

// Inspection item validation
export const inspectionItemSchema = z.object({
  item_description: z.string().trim().min(1, 'Descrição é obrigatória').max(500, 'Descrição muito longa'),
  category: z.string().trim().min(1, 'Categoria é obrigatória').max(100, 'Categoria muito longa'),
  entry_status: z.string().trim().max(50, 'Status muito longo').optional().or(z.literal('')),
  exit_status: z.string().trim().max(50, 'Status muito longo').optional().or(z.literal('')),
  problem_description: z.string().trim().max(1000, 'Descrição muito longa').optional().or(z.literal('')),
});

// Observation validation
export const observationSchema = z.object({
  general_observations: z.string().trim().max(2000, 'Observações muito longas').optional().or(z.literal('')),
  approval_observations: z.string().trim().max(2000, 'Observações muito longas').optional().or(z.literal('')),
  fault_codes_description: z.string().trim().max(1000, 'Descrição muito longa').optional().or(z.literal('')),
});

// Signature validation (base64 data URL)
export const signatureSchema = z.string().refine(
  (val) => {
    if (!val) return true; // Allow empty
    // Check if it's a valid data URL and not too large (max ~500KB base64)
    return val.startsWith('data:image/') && val.length < 700000;
  },
  { message: 'Assinatura inválida ou muito grande' }
);

export type InspectionFormData = z.infer<typeof inspectionSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;
export type InspectionItemFormData = z.infer<typeof inspectionItemSchema>;
export type ObservationFormData = z.infer<typeof observationSchema>;
