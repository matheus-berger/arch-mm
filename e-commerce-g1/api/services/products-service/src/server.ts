import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import express from 'express';


const app = express();
const prisma = new PrismaClient();
const PORT = 3000;

app.use(express.json());

// Rota de "saúde" do serviço
app.get('/', (req, res) => {
  res.send('Olá, eu sou o microsserviço de Produtos!');
});

// --- CRUD de Produtos ---

// CREATE - Criar um novo produto
app.post('/products', async (req, res) => {
  try {
    const { name, price, stock } = req.body;
    const newProduct = await prisma.product.create({
      data: { name, price, stock },
    });
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ message: "Erro ao criar o produto." });
  }
});

// READ - Listar todos os produtos
app.get('/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar produtos." });
  }
});

// READ - Buscar um produto por ID
app.get('/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const product = await prisma.product.findUnique({
      where: { id: id },
    });
    if (!product) {
      return res.status(404).json({ message: `Produto de id ${id} não encontrado!` });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar o produto." });
  }
});

// UPDATE - Atualizar um produto por ID
app.put('/products/:id', async (req, res) => {
  const { id } = req.params;
  // Removido 'stock' daqui
  const { name, price } = req.body; 
  try {
    const updatedProduct = await prisma.product.update({
      where: { id: id },
      // Removido 'stock' daqui
      data: { name, price }, 
    });
    res.status(200).json(updatedProduct);
  } catch (error) {
    // Verificamos se o erro tem um código e se esse código é 'P2025'
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ message: `Produto de id ${id} não encontrado!` });
    }
    
    // Para todos os outros erros
    return res.status(500).json({ message: "Houve um erro no servidor." });
  }
});

// DELETE - Deletar um produto por ID
app.delete('/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.product.delete({
      where: { id: id },
    });
    res.status(204).send();
  } catch (error) {
    // Verificamos se o erro tem um código e se esse código é 'P2025'
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ message: `Produto de id ${id} não encontrado!` });
    }
    
    // Para todos os outros erros
    return res.status(500).json({ message: "Houve um erro no servidor." });
  }
});

// PATCH - Endpoint específico para atualizar o estoque
app.patch('/products/:id/stock', async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body; // 'amount' pode ser positivo (adicionar) ou negativo (remover)

  // Validação para garantir que 'amount' é um número
  if (typeof amount !== 'number') {
    return res.status(400).json({ message: "O valor 'amount' deve ser um número." });
  }

  try {
    const updatedProduct = await prisma.product.update({
      where: { id: id },
      data: {
        stock: {
          // 'increment' pode ser usado para somar ou subtrair
          increment: amount 
        }
      },
    });
    res.status(200).json(updatedProduct);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ message: `Produto de id ${id} não encontrado!` });
    }
    return res.status(500).json({ message: "Houve um erro ao atualizar o estoque." });
  }
});

app.listen(PORT, () => {
  console.log(`Products service running on port ${PORT}`);
});
