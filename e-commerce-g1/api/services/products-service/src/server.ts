import 'dotenv/config';
import express from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

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
  const { name, price, stock } = req.body;
  try {
    const updatedProduct = await prisma.product.update({
      where: { id: id },
      data: { name, price, stock },
    });
    res.status(200).json(updatedProduct);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ message: `Produto de id ${id} não encontrado!` });
    }
    res.status(500).json({ message: "Erro ao atualizar o produto." });
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
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ message: `Produto de id ${id} não encontrado!` });
    }
    res.status(500).json({ message: "Houve um erro ao deletar o produto." });
  }
});


app.listen(PORT, () => {
  console.log(`Products service running on port ${PORT}`);
});
