export interface PaymentResponse {
  id: string;
  invoiceId: string;
  amount: number;
  paidAt: string;
  method: string | null;
  note: string | null;
  createdAt: Date;
}
