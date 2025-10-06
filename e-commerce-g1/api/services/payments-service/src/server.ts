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

// READ (All)
app.get('/payment-types', async (req, res) => {
  try {
    const paymentTypes = await prisma.paymentType.findMany();
    res.status(200).json(paymentTypes);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar tipos de pagamento." });
  }
});


app.listen(PORT, () => {
  console.log(`Payments service running on port ${PORT}`);
});
