import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = 3000;

app.use(express.json());

// Rota de "saúde" do serviço
app.get('/', (req, res) => {
  res.send('Olá, eu sou o microsserviço de Usuários!');
});

// --- CRUD de Usuários ---

// CREATE
app.post('/users', async (req, res) => {
  try {
    const { name, email } = req.body;
    const newUser = await prisma.user.create({
      data: { name, email },
    });
    res.status(201).json(newUser);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return res.status(409).json({ message: "Email já cadastrado." });
    }
    res.status(500).json({ message: "Erro ao criar usuário." });
  }
});

// READ (Listar todos os usuários ativos)
app.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { is_deleted: false }, // Boa prática: não mostrar usuários "deletados"
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar usuários." });
  }
});

// READ (Buscar um usuário por ID)
app.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findFirst({
      where: { id: id, is_deleted: false }, // Não encontra se estiver "deletado"
    });
    if (!user) {
      return res.status(404).json({ message: `Usuário de id ${id} não encontrado!` });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar o usuário." });
  }
});

// UPDATE
app.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  try {
    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: { name, email },
    });
    res.status(200).json(updatedUser);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ message: `Usuário de id ${id} não encontrado!` });
      }
      if (error.code === 'P2002') {
        return res.status(409).json({ message: "Email já está em uso por outro usuário." });
      }
    }
    res.status(500).json({ message: "Erro ao atualizar o usuário." });
  }
});

// DELETE (Soft Delete)
app.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Em vez de deletar, apenas atualizamos a flag 'is_deleted'.
    await prisma.user.update({
      where: { id: id },
      data: { is_deleted: true },
    });
    res.status(204).send();
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ message: `Usuário de id ${id} não encontrado!` });
    }
    res.status(500).json({ message: "Houve um erro ao deletar o usuário." });
  }
});


app.listen(PORT, () => {
  console.log(`Users service running on port ${PORT}`);
});