import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import axios from 'axios';

import Order from './models/Order';
import api from './utils/api';

const app = express();
const PORT = 3000;

app.use(express.json());

// --- Conexão com o MongoDB ---
const mongoUrl = process.env.MONGO_URL || '';
mongoose.connect(mongoUrl)
  .then(() => console.log('Conectado ao MongoDB com sucesso!'))
  .catch((err) => {
    console.error('Erro ao conectar ao MongoDB:', err);
    process.exit(1);
  });

// --- Rotas ---
app.get('/', (req, res) => {
  res.send('Olá, eu sou o microsserviço de Pedidos!');
});

// --- Lógica de Pedidos ---

// CREATE - Criar um novo Pedido
app.post('/orders', async (req, res) => {
  try {
    const { userId, products } = req.body; // `products` é um array [{ productId, quantity }]

    // 1. VERIFICAR SE O USUÁRIO EXISTE
    // Chamada para o users-service
    try {
      await api.get(`${process.env.USERS_API_URL}/users/${userId}`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return res.status(404).json({ message: `Usuário com ID ${userId} não encontrado.` });
      }
      throw error; // Lança outros erros para o catch principal
    }

    // 2. VERIFICAR ESTOQUE E BUSCAR PREÇOS DOS PRODUTOS
    const productsWithFullInfo = [];
    let totalValue = 0;

    for (const item of products) {
      // Chamada para o products-service
      const response = await api.get(`${process.env.PRODUCTS_API_URL}/products/${item.productId}`);
      const productData = response.data;

      if (productData.stock < item.quantity) {
        return res.status(400).json({ message: `Estoque insuficiente para o produto "${productData.name}".` });
      }

      productsWithFullInfo.push({
        productId: productData.id,
        quantity: item.quantity,
        unit_price: productData.price,
      });

      totalValue += productData.price * item.quantity;
    }

    // 3. CRIAR O PEDIDO NO BANCO DE DADOS (MongoDB)
    const newOrder = new Order({
      userId: userId,
      products: productsWithFullInfo,
      total_value: totalValue,
      status: 'AGUARDANDO_PAGAMENTO', // Status default
    });
    await newOrder.save();

    // 4. DECREMENTAR O ESTOQUE (CHAMADA PARA O PRODUCTS-SERVICE)
    // Isso acontece depois de o pedido ser criado com sucesso.
    for (const item of productsWithFullInfo) {
      await api.patch(`${process.env.PRODUCTS_API_URL}/products/${item.productId}/stock`, {
        amount: -item.quantity, // Enviamos uma quantidade negativa para decrementar
      });
    }

    return res.status(201).json(newOrder);

  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    if (axios.isAxiosError(error)) {
      // Se o erro for de um dos outros serviços
      return res.status(error.response?.status || 500).json({ message: "Erro em um serviço externo.", details: error.response?.data });
    }
    return res.status(500).json({ message: "Houve um erro interno ao processar o pedido." });
  }
});

app.post('/orders/:id/payments', async (req, res) => {
  const { id } = req.params;
  // O body agora recebe um array de pagamentos
  const { payments } = req.body; // ex: [{ paymentTypeId: 1, total: 100.00 }]

  try {
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado.' });
    if (order.status === 'PAGO' || order.status === 'CANCELADO') {
      return res.status(400).json({ message: `Pedido com status '${order.status}' não pode ser processado.` });
    }

    // Soma o total dos pagamentos recebidos
    const totalPaid = payments.reduce((acc: any, payment: any) => acc + payment.total, 0);

    // Valida se o valor pago é igual ao valor do pedido
    if (totalPaid !== order.total_value) {
      return res.status(400).json({ message: 'O valor total dos pagamentos não corresponde ao valor do pedido.' });
    }

    // Simula o sucesso ou falha do pagamento
    const isPaymentSuccessful = Math.random() < 0.8; // 80% de chance de sucesso
    const newStatus = isPaymentSuccessful ? 'PAGO' : 'FALHA_NO_PAGAMENTO';

    const updatedOrder = await Order.findByIdAndUpdate(id, { status: newStatus }, { new: true });

    // Se o pagamento foi bem-sucedido, registramos os pagamentos no payments-service
    if (isPaymentSuccessful) {
      console.log(`Notificação: O pagamento para o pedido ${id} foi confirmado!`);
      // Chamadas para o outro serviço para registrar cada pagamento
      for (const payment of payments) {
        await api.post(`${process.env.PAYMENTS_API_URL}/order-payments`, {
          orderId: id,
          total: payment.total,
          typePaymentId: payment.typePaymentId,
        });
      }
      return res.status(200).json(updatedOrder);
    } else {
      console.log(`Notificação: O pagamento para o pedido ${id} falhou.`);
      return res.status(400).json(updatedOrder);
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao processar pagamento.' });
  }
});


// READ - Listar todos os pedidos (pode ser melhorado para filtrar por usuário)
app.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar pedidos.' });
  }
});

// READ - Buscar um pedido por ID
app.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado.' });
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar pedido.' });
  }
});

// READ - Listar todos os pedidos, com filtro opcional por userId
app.get('/orders', async (req, res) => {
  try {
    const { userId } = req.query; // Pega o userId da query string, ex: /orders?userId=123

    const filter = userId ? { userId: userId as string } : {};

    const orders = await Order.find(filter);
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar pedidos.' });
  }
});

app.get('/orders/:id/payments', async (req, res) => {
  const { id } = req.params;
  try {
    // Chamada para o payments-service para buscar os pagamentos
    const response = await api.get(`${process.env.PAYMENTS_API_URL}/order-payments?orderId=${id}`);
    res.status(200).json(response.data);
  } catch (error) {
    console.error(error);
    if (axios.isAxiosError(error)) {
      return res.status(error.response?.status || 500).json(error.response?.data);
    }
    return res.status(500).json({ message: "Erro ao buscar pagamentos do pedido." });
  }
});


app.listen(PORT, () => {
  console.log(`Orders service running on port ${PORT}`);
});
