import mongoose, { Schema, Document } from 'mongoose';

// Interface para os itens do pedido
interface IOrderItem {
  productId: string;
  quantity: number;
  unit_price: number;
}

// Interface principal do Pedido
export interface IOrder extends Document {
  userId: string;
  products: IOrderItem[];
  total_value: number;
  status: 'AGUARDANDO_PAGAMENTO' | 'FALHA_NO_PAGAMENTO' | 'PAGO' | 'CANCELADO';
  createdAt: Date;
}

const OrderItemSchema: Schema = new Schema({
  productId: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit_price: { type: Number, required: true },
});

const OrderSchema: Schema = new Schema({
  userId: { type: String, required: true },
  products: [OrderItemSchema],
  total_value: { type: Number, required: true },
  status: {
    type: String,
    enum: ['AGUARDANDO_PAGAMENTO', 'FALHA_NO_PAGAMENTO', 'PAGO', 'CANCELADO'],
    default: 'AGUARDANDO_PAGAMENTO',
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IOrder>('Order', OrderSchema);