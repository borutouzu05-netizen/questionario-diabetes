document.addEventListener('DOMContentLoaded', function () {
    initSystem();

    function initSystem() {
        console.log('Sistema inicializado com Express e SQLite');
        updateResponseCount();
        checkServerStatus();
    }

    async function checkServerStatus() {
        try {
            const response = await fetch('/health');
            if (response.ok) {
                console.log('Servidor conectado com sucesso');
            }
        } catch (error) {
            console.error('Erro ao conectar com o servidor:', error);
            alert('Atenção: Não foi possível conectar ao servidor. Verifique se o servidor está rodando.');
        }
    }

    async function saveToDatabase(data) {
        try {
            const response = await fetch('/save-response', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                updateResponseCount();
                return true;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            alert('Erro ao salvar os dados. Tente novamente.');
            return false;
        }
    }

    async function loadFromDatabase() {
        try {
            const response = await fetch('/get-responses');
            return await response.json();
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            alert('Erro ao carregar os dados. Tente novamente.');
            return [];
        }
    }

    async function updateResponseCount() {
        try {
            const response = await fetch('/get-response-count');
            const data = await response.json();
            const countElement = document.getElementById('response-count');
            if (countElement) {
                countElement.textContent = `Total de respostas: ${data.count}`;
            }
        } catch (error) {
            console.error('Erro ao atualizar contagem:', error);
        }
    }

    document.getElementById('view-data').addEventListener('click', async function () {
        const responses = await loadFromDatabase();
        const dataDisplay = document.getElementById('data-display');
        const dataContent = document.getElementById('data-content');

        dataContent.textContent = JSON.stringify(responses, null, 2);
        dataDisplay.classList.toggle('hidden');
    });

    document.getElementById('export-data').addEventListener('click', async function () {
        const responses = await loadFromDatabase();
        const dataStr = JSON.stringify(responses, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = 'respostas_pesquisa.json';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    });

    document.getElementById('clear-data').addEventListener('click', async function () {
        if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
            try {
                const response = await fetch('/clear-data?confirm=true', {
                    method: 'DELETE'
                });
                const result = await response.json();

                if (result.success) {
                    updateResponseCount();
                    alert('Dados limpos com sucesso!');
                    document.getElementById('data-display').classList.add('hidden');
                } else {
                    throw new Error(result.error);
                }
            } catch (error) {
                console.error('Erro ao limpar dados:', error);
                alert('Erro ao limpar os dados. Tente novamente.');
            }
        }
    });

    const tabs = document.querySelectorAll('.tab');
    const nextButtons = document.querySelectorAll('.next-btn');
    const prevButtons = document.querySelectorAll('.prev-btn');
    const progressBar = document.querySelector('.progress-bar');
    const progressPercent = document.getElementById('progress-percent');
    const currentPart = document.getElementById('current-part');
    let currentTab = 0;

    function showTab(n) {
        tabs.forEach(tab => tab.classList.remove('active-tab'));
        tabs[n].classList.add('active-tab');

        const progress = ((n + 1) / tabs.length) * 100;
        progressBar.style.width = `${progress}%`;
        progressPercent.textContent = `${Math.round(progress)}%`;
        currentPart.textContent = n + 1;

        window.scrollTo(0, 0);
    }

    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (validateForm(currentTab)) {
                if (currentTab < tabs.length - 1) {
                    currentTab++;
                    showTab(currentTab);
                }
            }
        });
    });

    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (currentTab > 0) {
                currentTab--;
                showTab(currentTab);
            }
        });
    });

    function validateForm(n) {
        let valid = true;
        const currentTabInputs = tabs[n].querySelectorAll('input[required], select[required]');

        currentTabInputs.forEach(input => {
            if (!input.value && input.type !== 'radio') {
                valid = false;
                input.classList.add('border-red-500');
            } else {
                input.classList.remove('border-red-500');
            }
        });

        const radioGroups = {};
        tabs[n].querySelectorAll('input[type="radio"][required]').forEach(radio => {
            if (!radioGroups[radio.name]) {
                radioGroups[radio.name] = true;

                const checked = tabs[n].querySelector(`input[name="${radio.name}"]:checked`);
                if (!checked) {
                    valid = false;
                    const labels = tabs[n].querySelectorAll(`input[name="${radio.name}"]`);
                    labels.forEach(label => {
                        label.parentElement.classList.add('text-red-600');
                    });
                } else {
                    const labels = tabs[n].querySelectorAll(`input[name="${radio.name}"]`);
                    labels.forEach(label => {
                        label.parentElement.classList.remove('text-red-600');
                    });
                }
            }
        });

        if (!valid) {
            alert('Por favor, preencha todos os campos obrigatórios antes de continuar.');
        }

        return valid;
    }

    const hasDiabetesRadios = document.querySelectorAll('input[name="has_diabetes"]');
    const diabetesTypeDiv = document.getElementById('diabetes-type');

    hasDiabetesRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'Sim') {
                diabetesTypeDiv.classList.remove('hidden');
            } else {
                diabetesTypeDiv.classList.add('hidden');
                document.querySelectorAll('input[name="diabetes_type"]').forEach(input => input.checked = false);
                document.getElementById('other_diabetes_type').value = '';
                document.getElementById('other_diabetes_type').disabled = true;
            }
        });
    });

    const diabetesTypeRadios = document.querySelectorAll('input[name="diabetes_type"]');
    const otherDiabetesInput = document.getElementById('other_diabetes_type');

    diabetesTypeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            otherDiabetesInput.disabled = (radio.value !== 'Outro');
            if (radio.value !== 'Outro') {
                otherDiabetesInput.value = '';
            }
        });
    });

    const usesInsulinRadios = document.querySelectorAll('input[name="uses_insulin"]');
    const insulinApplicationDiv = document.getElementById('insulin-application');

    usesInsulinRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'Sim') {
                insulinApplicationDiv.classList.remove('hidden');
            } else {
                insulinApplicationDiv.classList.add('hidden');
                document.querySelectorAll('input[name="application_method"]').forEach(input => input.checked = false);
                document.getElementById('other_application_method').value = '';
                document.getElementById('other_application_method').disabled = true;
            }
        });
    });

    const applicationMethodRadios = document.querySelectorAll('input[name="application_method"]');
    const otherApplicationInput = document.getElementById('other_application_method');

    applicationMethodRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            otherApplicationInput.disabled = (radio.value !== 'Outro');
            if (radio.value !== 'Outro') {
                otherApplicationInput.value = '';
            }
        });
    });

    document.getElementById('research-form').addEventListener('submit', async function (e) {
        e.preventDefault();

        if (validateForm(currentTab)) {
            const formData = {
                idade: document.getElementById('idade').value,
                sexo: document.querySelector('input[name="gender"]:checked')?.value || '',
                possui_diabetes: document.querySelector('input[name="has_diabetes"]:checked')?.value || '',
                tipo_diabetes: document.querySelector('input[name="diabetes_type"]:checked')?.value || '',
                outro_tipo_diabetes: document.getElementById('other_diabetes_type').value,
                utiliza_insulina: document.querySelector('input[name="uses_insulin"]:checked')?.value || '',
                metodo_aplicacao: document.querySelector('input[name="application_method"]:checked')?.value || '',
                outro_metodo_aplicacao: document.getElementById('other_application_method').value,
                utiliza_sensor: document.querySelector('input[name="uses_sensor"]:checked')?.value || '',
                monitoramento_glicemia: document.querySelector('input[name="monitoring_frequency"]:checked')?.value || '',
                automacao_beneficios: document.getElementById('automacao_beneficios').value,
                preocupacoes: document.getElementById('preocupacoes').value,
                beneficios_pacientes: document.getElementById('beneficios_pacientes').value,
                sugestoes: document.getElementById('sugestoes').value,
                testar_prototipo: document.querySelector('input[name="test_prototype"]:checked')?.value || '',
                justificativa_teste: document.getElementById('justificativa_teste').value,
                uso_diario: document.querySelector('input[name="daily_use"]:checked')?.value || '',
                justificativa_uso: document.getElementById('justificativa_uso').value,
                fator_confianca: document.querySelector('input[name="trust_factor"]:checked')?.value || '',
                justificativa_confianca: document.getElementById('justificativa_confianca').value
            };

            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Enviando...';
            submitButton.disabled = true;

            const success = await saveToDatabase(formData);

            if (success) {
                alert('Respostas enviadas com sucesso! Obrigado por participar da pesquisa.');
                this.reset();
                currentTab = 0;
                showTab(currentTab);
                diabetesTypeDiv.classList.add('hidden');
                insulinApplicationDiv.classList.add('hidden');
                otherDiabetesInput.disabled = true;
                otherApplicationInput.disabled = true;
            }

            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    });

    showTab(0);
});
