import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

// __dirname equivalente para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Configurar conexão MySQL - coloque as variáveis do seu banco aqui
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '12345678',
  database: process.env.DB_NAME || 'pesquisa_diabetes',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Criar tabela se não existir
async function createTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS respostas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      idade INT,
      sexo VARCHAR(255),
      possui_diabetes VARCHAR(255),
      tipo_diabetes VARCHAR(255),
      outro_tipo_diabetes VARCHAR(255),
      utiliza_insulina VARCHAR(255),
      metodo_aplicacao VARCHAR(255),
      outro_metodo_aplicacao VARCHAR(255),
      utiliza_sensor VARCHAR(255),
      monitoramento_glicemia VARCHAR(255),
      automacao_beneficios TEXT,
      preocupacoes TEXT,
      beneficios_pacientes TEXT,
      sugestoes TEXT,
      testar_prototipo VARCHAR(255),
      justificativa_teste TEXT,
      uso_diario VARCHAR(255),
      justificativa_uso TEXT,
      fator_confianca VARCHAR(255),
      justificativa_confianca TEXT,
      data_resposta DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const conn = await pool.getConnection();
  try {
    await conn.query(createTableSQL);
  } finally {
    conn.release();
  }
}

await createTable();

// Rota principal para servir o arquivo HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota de saúde do servidor
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor funcionando',
    database: 'MySQL'
  });
});

// Salvar resposta
app.post('/save-response', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const {
      idade, sexo, possui_diabetes, tipo_diabetes, outro_tipo_diabetes,
      utiliza_insulina, metodo_aplicacao, outro_metodo_aplicacao, utiliza_sensor,
      monitoramento_glicemia, automacao_beneficios, preocupacoes, beneficios_pacientes,
      sugestoes, testar_prototipo, justificativa_teste, uso_diario, justificativa_uso,
      fator_confianca, justificativa_confianca
    } = req.body;

    const query = `
      INSERT INTO respostas (
        idade, sexo, possui_diabetes, tipo_diabetes, outro_tipo_diabetes,
        utiliza_insulina, metodo_aplicacao, outro_metodo_aplicacao, utiliza_sensor,
        monitoramento_glicemia, automacao_beneficios, preocupacoes, beneficios_pacientes,
        sugestoes, testar_prototipo, justificativa_teste, uso_diario, justificativa_uso,
        fator_confianca, justificativa_confianca
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      idade, sexo, possui_diabetes, tipo_diabetes, outro_tipo_diabetes,
      utiliza_insulina, metodo_aplicacao, outro_metodo_aplicacao, utiliza_sensor,
      monitoramento_glicemia, automacao_beneficios, preocupacoes, beneficios_pacientes,
      sugestoes, testar_prototipo, justificativa_teste, uso_diario, justificativa_uso,
      fator_confianca, justificativa_confianca
    ];

    const [result] = await conn.execute(query, values);

    res.json({
      success: true,
      message: 'Resposta salva com sucesso',
      insertId: result.insertId
    });
  } catch (error) {
    console.error('Erro ao salvar resposta:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    conn.release();
  }
});

// Obter todas as respostas
app.get('/get-responses', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query('SELECT * FROM respostas ORDER BY data_resposta DESC');
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar respostas:', error);
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
});

// Obter contagem de respostas
app.get('/get-response-count', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query('SELECT COUNT(*) as count FROM respostas');
    res.json({ count: rows[0].count });
  } catch (error) {
    console.error('Erro ao contar respostas:', error);
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
});
