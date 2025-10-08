export interface InvoiceInfo {
  _id: string;
  billing_period: string;
  collectionStatus: string;
  customerAddress: string;
  customerName: string;
  customerPhone: string;
  invoiceNumber: string;
  printStatus: string;
  totalAmount: string;
  issueDate: string;
  collectionDate: string | null;
  assignedTo: {
    email: string;
    fullName: string;
    _id: string;
  };
}
