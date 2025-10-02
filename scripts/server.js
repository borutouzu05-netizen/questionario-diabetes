import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT || 3000;

// __dirname equivalente para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://anbgdiquyvpyrjucvfdr.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;  // corrigido aqui
const supabase = createClient(supabaseUrl, supabaseKey);


// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Rota principal para servir o arquivo HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota de saúde do servidor
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor funcionando',
    database: 'Supabase'
  });
});

// Salvar resposta
app.post('/save-response', async (req, res) => {
  try {
    const {
      idade, sexo, possui_diabetes, tipo_diabetes, outro_tipo_diabetes,
      utiliza_insulina, metodo_aplicacao, outro_metodo_aplicacao, utiliza_sensor,
      monitoramento_glicemia, automacao_beneficios, preocupacoes, beneficios_pacientes,
      sugestoes, testar_prototipo, justificativa_teste, uso_diario, justificativa_uso,
      fator_confianca, justificativa_confianca
    } = req.body;

    const { data, error } = await supabase
      .from('respostas')
      .insert([{
        idade, sexo, possui_diabetes, tipo_diabetes, outro_tipo_diabetes,
        utiliza_insulina, metodo_aplicacao, outro_metodo_aplicacao, utiliza_sensor,
        monitoramento_glicemia, automacao_beneficios, preocupacoes, beneficios_pacientes,
        sugestoes, testar_prototipo, justificativa_teste, uso_diario, justificativa_uso,
        fator_confianca, justificativa_confianca
      }]);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Resposta salva com sucesso',
      data
    });
  } catch (error) {
    console.error('Erro ao salvar resposta:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obter todas as respostas
app.get('/get-responses', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('respostas')
      .select('*')
      .order('data_resposta', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar respostas:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obter contagem de respostas
app.get('/get-response-count', async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('respostas')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    res.json({ count });
  } catch (error) {
    console.error('Erro ao contar respostas:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
});
