import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
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

// Abrir conexão com o SQLite
async function openDb() {
  return open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });
}

// Criar tabela se não existir
async function createTable() {
  const db = await openDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS respostas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idade INTEGER,
      sexo TEXT,
      possui_diabetes TEXT,
      tipo_diabetes TEXT,
      outro_tipo_diabetes TEXT,
      utiliza_insulina TEXT,
      metodo_aplicacao TEXT,
      outro_metodo_aplicacao TEXT,
      utiliza_sensor TEXT,
      monitoramento_glicemia TEXT,
      automacao_beneficios TEXT,
      preocupacoes TEXT,
      beneficios_pacientes TEXT,
      sugestoes TEXT,
      testar_prototipo TEXT,
      justificativa_teste TEXT,
      uso_diario TEXT,
      justificativa_uso TEXT,
      fator_confianca TEXT,
      justificativa_confianca TEXT,
      data_resposta DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
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
    database: 'SQLite'
  });
});

// Salvar resposta
app.post('/save-response', async (req, res) => {
  try {
    const db = await openDb();

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

    const result = await db.run(query, values);

    res.json({
      success: true,
      message: 'Resposta salva com sucesso',
      insertId: result.lastID
    });
  } catch (error) {
    console.error('Erro ao salvar resposta:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obter todas as respostas
app.get('/get-responses', async (req, res) => {
  try {
    const db = await openDb();
    const rows = await db.all('SELECT * FROM respostas ORDER BY data_resposta DESC');
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar respostas:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obter contagem de respostas
app.get('/get-response-count', async (req, res) => {
  try {
    const db = await openDb();
    const row = await db.get('SELECT COUNT(*) as count FROM respostas');
    res.json({ count: row.count });
  } catch (error) {
    console.error('Erro ao contar respostas:', error);
    res.status(500).json({ error: error.message });
  }
});

// Limpar dados
app.delete('/clear-data', async (req, res) => {
  try {
    if (req.query.confirm === 'true') {
      const db = await openDb();
      await db.run('DELETE FROM respostas');
      // Resetar autoincrement no SQLite
      await db.run("DELETE FROM sqlite_sequence WHERE name='respostas'");
      res.json({ success: true, message: 'Dados limpos com sucesso' });
    } else {
      res.status(400).json({ success: false, error: 'Confirmação necessária' });
    }
  } catch (error) {
    console.error('Erro ao limpar dados:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
});
