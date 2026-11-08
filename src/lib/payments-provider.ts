// Contrato reservado para una integración futura; ningún cobro online está activo.
export interface DepositProvider {
  createDeposit(input: {
    appointmentId: string;
    amountCents: number;
    currency: 'ARS';
    idempotencyKey: string;
  }): Promise<{ reference: string; checkoutUrl: string }>;
  verifyWebhook(
    rawBody: string,
    signature: string,
  ): Promise<{ reference: string; status: 'paid' | 'failed' | 'pending' }>;
}
