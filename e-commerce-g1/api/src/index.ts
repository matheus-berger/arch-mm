import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// Rota inicial [exemplo/teste]
app.get("/", (req, res) => {
    res.send("+ Fiat Lux! + | Servidor Node.js executando com sucesso!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
