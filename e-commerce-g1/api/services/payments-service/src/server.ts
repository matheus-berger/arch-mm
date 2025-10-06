import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = 3000;

app.use(express.json());

// Rota de "saúde" do serviço
app.get('/', (req, res) => {
  res.send('Olá, eu sou o microsserviço de Pagamentos!');
});

// --- CRUD de Tipos de Pagamento ---

// CREATE
app.post('/payment-types', async (req, res) => {
  try {
    const { name } = req.body;
    const newPaymentType = await prisma.paymentType.create({
      data: { name },
    });
    res.status(201).json(newPaymentType);
  } catch (error) {
    res.status(500).json({ message: "Erro ao criar tipo de pagamento." });
  }
});

// CREATE OrderPayment
app.post('/order-payments', async (req, res) => {
  try {
    const { orderId, total, typePaymentId } = req.body;
    const newOrderPayment = await prisma.orderPayment.create({
      data: {
        orderId,
        total,
        typePaymentId
      }
    });
    res.status(201).json(newOrderPayment);
  } catch (error) {
    res.status(500).json({ message: "Erro ao registrar o pagamento." });
  }
});

// READ (All)
app.get('/payment-types', async (req, res) => {
  try {
    const paymentTypes = await prisma.paymentType.findMany();
    res.status(200).json(paymentTypes);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar tipos de pagamento." });
  }
});

// READ (por orderId)
app.get('/order-payments', async (req, res) => {
  try {
    const { orderId } = req.query;
    if (!orderId) {
      return res.status(400).json({ message: "O parâmetro 'orderId' é obrigatório." });
    }
    const payments = await prisma.orderPayment.findMany({
      where: { orderId: orderId as string },
      include: { paymentType: true },
    });
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar pagamentos." });
  }
});

app.listen(PORT, () => {
  console.log(`Payments service running on port ${PORT}`);
});
