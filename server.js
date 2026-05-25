require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middlewares globais
app.use(cors());
app.use(express.json());

// Rota raiz (Health Check)
app.get('/', (req, res) => {
    res.json({ success: true, message: "OlympAPI is running 🚀" });
});

// Importação das rotas
const downloadRoutes = require('./routes/download');
const aiRoutes = require('./routes/ai');
// const utilsRoutes = require('./routes/utils');

// Configuração das rotas
app.use('/download', downloadRoutes);
app.use('/ai', aiRoutes);
// app.use('/utils', utilsRoutes);

// Middleware para capturar erros genéricos
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
});

app.listen(port, () => {
    console.log(`[OlympAPI] Servidor rodando na porta ${port}`);
});
