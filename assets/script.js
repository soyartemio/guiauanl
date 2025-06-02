document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos del DOM (Examen) ---
    const questionSubjectElement = document.getElementById('question-subject');
    const questionTextElement = document.getElementById('question-text');
    // ... (todas tus otras constantes de elementos DOM como antes) ...
    const setupArea = document.getElementById('setup-area');
    const examArea = document.getElementById('exam-area');
    const resultsArea = document.getElementById('results-area');
    const startExamBtn = document.getElementById('start-exam-btn');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    
    // Botones de reiniciar
    const restartExamBtnGlobal = document.getElementById('restart-exam-btn-global');
    const restartExamBtnResults = document.getElementById('restart-exam-btn-results'); // El que está en el área de resultados

    // ... (el resto de tus variables y el array jsonFiles como antes) ...
    const jsonFiles = [
        'ciencias/biologia.json', 
        'ciencias/fisica.json', 
        'ciencias/quimica.json',
        'ciencias_sociales/historia_universal.json', 
        'ciencias_sociales/historia_de_mexico.json', 
        'ciencias_sociales/formacion_civica_etica.json', 
        'ciencias_sociales/geografia.json',
        'espanol/espanol_ambito_estudio.json', 
        'espanol/espanol_ambito_literatura.json', 
        'espanol/espanol_ambito_participacion_ciudadana.json',
        'matematicas/aritmetica.json', 
        'matematicas/algebra.json', 
        'matematicas/geometria.json', 
        'matematicas/trigonometria.json', 
        'matematicas/estadistica.json', 
        'matematicas/probabilidad.json', 
        'matematicas/matematicas_problemas.json'
    ];

    let allQuestions = [];
    let selectedQuestions = [];
    let currentQuestionIndex = 0;
    let scoreCorrect = 0;
    let scoreIncorrect = 0;
    const questionsPerExam = 200;


    async function loadQuestions() {
        // ... (tu función loadQuestions como la tenías, asegurándote que maneje errores) ...
        allQuestions = []; 
        startExamBtn.disabled = true;
        startExamBtn.textContent = "Cargando preguntas...";
        try {
            const fetchPromises = jsonFiles.map(file =>
                fetch(file)
                    .then(response => {
                        if (!response.ok) {
                            console.error(`Error al cargar ${file}: ${response.status} ${response.statusText}`);
                            // Intenta mostrar más info del error si está disponible
                            response.text().then(text => console.error("Respuesta del servidor:", text));
                            throw new Error(`Error HTTP: ${response.status}`);
                        }
                        return response.json();
                    })
                    .catch(error => {
                        console.error(`Fallo al obtener o parsear ${file}:`, error);
                        return []; 
                    })
            );
            
            const jsonDataArrays = await Promise.all(fetchPromises);
            allQuestions = jsonDataArrays.flat().filter(q => q && typeof q === 'object' && typeof q.pregunta === 'string'); 
            
            console.log(`Total de preguntas cargadas válidas: ${allQuestions.length}`);
            if (allQuestions.length === 0) {
                alert("No se pudieron cargar preguntas. Revisa la consola (F12) para más detalles y asegúrate que los archivos JSON estén en las rutas correctas, no estén vacíos y tengan el formato esperado.");
                startExamBtn.textContent = "Reintentar Carga";
                startExamBtn.disabled = false;
                return false; 
            }
            startExamBtn.textContent = "Iniciar Examen";
            startExamBtn.disabled = false;
            return true; 
            
        } catch (error) {
            console.error('Error general al cargar las preguntas:', error);
            alert('Hubo un error general al cargar las preguntas. Revisa la consola (F12).');
            startExamBtn.textContent = "Reintentar Carga";
            startExamBtn.disabled = false;
            return false;
        }
    }

    function shuffleArray(array) {
        // ... (igual que antes) ...
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function prepareExam() {
        // ... (igual que antes, pero ajusta la visibilidad del botón de reiniciar global) ...
        if (allQuestions.length === 0) {
            alert("No hay preguntas cargadas. Intenta hacer clic en 'Iniciar Examen' de nuevo. Si el problema persiste, revisa la consola (F12).");
            startExamBtn.disabled = false; 
            return; 
        }
        shuffleArray(allQuestions);
        selectedQuestions = allQuestions.slice(0, Math.min(questionsPerExam, allQuestions.length));
        
        if (selectedQuestions.length < questionsPerExam && allQuestions.length > 0) {
            alert(`Advertencia: Solo se utilizarán ${selectedQuestions.length} preguntas de las ${questionsPerExam} solicitadas, ya que es el total disponible.`);
        } else if (selectedQuestions.length === 0 ) {
             alert("No hay preguntas disponibles para iniciar el examen.");
             startExamBtn.disabled = false;
             return;
        }

        currentQuestionIndex = 0;
        scoreCorrect = 0;
        scoreIncorrect = 0;

        setupArea.classList.add('hidden'); 
        resultsArea.classList.add('hidden');
        examArea.classList.remove('hidden');
        restartExamBtnGlobal.classList.remove('hidden'); // Mostrar el botón de reiniciar global
        nextQuestionBtn.classList.add('hidden');

        displayQuestion();
        updateScoreboard();
    }

    function displayQuestion() {
        // ... (igual que antes) ...
        if (currentQuestionIndex < selectedQuestions.length) {
            const currentQuestion = selectedQuestions[currentQuestionIndex];
            if (!currentQuestion || typeof currentQuestion.pregunta !== 'string' || typeof currentQuestion.opciones !== 'object') {
                console.error("Pregunta malformada o incompleta:", currentQuestion);
                questionTextElement.textContent = "Error: Pregunta no disponible.";
                optionsContainerElement.innerHTML = '';
                nextQuestionBtn.classList.remove('hidden');
                return;
            }

            questionSubjectElement.textContent = currentQuestion.materia || "Pregunta";
            questionTextElement.textContent = currentQuestion.pregunta;
            optionsContainerElement.innerHTML = ''; 
            feedbackTextElement.textContent = '';
            explanationTextElement.textContent = '';
            feedbackTextElement.className = ''; 

            for (const key in currentQuestion.opciones) {
                const button = document.createElement('button');
                button.innerHTML = `${key.toUpperCase()}. ${currentQuestion.opciones[key]}`;
                button.dataset.key = key;
                button.addEventListener('click', () => selectAnswer(key, button));
                optionsContainerElement.appendChild(button);
            }
            nextQuestionBtn.classList.add('hidden'); 
            updateScoreboard();
        } else {
            showFinalResults();
        }
    }

    function selectAnswer(selectedKey, clickedButton) {
        // ... (igual que antes) ...
         const currentQuestion = selectedQuestions[currentQuestionIndex];
        if (!currentQuestion) return; 

        const correctAnswerKey = currentQuestion.respuesta_correcta;

        const optionButtons = optionsContainerElement.getElementsByTagName('button');
        for (let btn of optionButtons) {
            btn.disabled = true;
            if (btn.dataset.key === correctAnswerKey) {
                btn.classList.add('correct');
            }
        }

        if (selectedKey === correctAnswerKey) {
            scoreCorrect++;
            feedbackTextElement.textContent = '¡Correcto!';
            feedbackTextElement.className = 'correct';
            if(clickedButton) clickedButton.classList.add('correct');
        } else {
            scoreIncorrect++;
            feedbackTextElement.textContent = `Incorrecto. La respuesta correcta era la ${correctAnswerKey.toUpperCase()}.`;
            feedbackTextElement.className = 'incorrect';
            if(clickedButton) clickedButton.classList.add('incorrect');
        }
        
        if (currentQuestion.explicacion) {
            explanationTextElement.textContent = `Explicación: ${currentQuestion.explicacion}`;
        }

        updateScoreboard();
        nextQuestionBtn.classList.remove('hidden');
    }
    
    function updateScoreboard() {
        // ... (igual que antes) ...
        if (!selectedQuestions || selectedQuestions.length === 0 && currentQuestionIndex === 0) {
            currentQNumberElement.textContent = 0;
            totalQNumberElement.textContent = questionsPerExam; 
            scoreCorrectElement.textContent = 0;
            scoreIncorrectElement.textContent = 0;
            return;
        }
        if (selectedQuestions.length === 0) return; 

        currentQNumberElement.textContent = currentQuestionIndex + 1 > selectedQuestions.length ? selectedQuestions.length : currentQuestionIndex + 1;
        totalQNumberElement.textContent = selectedQuestions.length;
        scoreCorrectElement.textContent = scoreCorrect;
        scoreIncorrectElement.textContent = scoreIncorrect;
    }

    function nextQuestion() {
        // ... (igual que antes) ...
        currentQuestionIndex++;
        if (currentQuestionIndex < selectedQuestions.length) {
            displayQuestion();
        } else {
            showFinalResults();
        }
    }

    function showFinalResults() {
        // ... (igual que antes, pero asegúrate que el botón de reiniciar global esté visible) ...
        examArea.classList.add('hidden');
        resultsArea.classList.remove('hidden');
        restartExamBtnGlobal.classList.remove('hidden'); // Asegurarse que esté visible
        
        finalTotalElement.textContent = selectedQuestions.length;
        finalCorrectElement.textContent = scoreCorrect;
        finalIncorrectElement.textContent = scoreIncorrect;
        const percentage = selectedQuestions.length > 0 ? ((scoreCorrect / selectedQuestions.length) * 100).toFixed(2) : 0;
        finalPercentageElement.textContent = percentage;
    }

    // Función para reiniciar el examen
    function resetExam() {
        resultsArea.classList.add('hidden');
        examArea.classList.add('hidden');
        setupArea.classList.remove('hidden');
        restartExamBtnGlobal.classList.add('hidden'); // Ocultar hasta que inicie el examen
        startExamBtn.disabled = false;
        // Opcional: si quieres que se recarguen las preguntas desde los JSON al reiniciar:
        // allQuestions = []; 
        // loadQuestions();
        // Si no, se usarán las ya cargadas y se barajarán en prepareExam()
    }

    startExamBtn.addEventListener('click', async () => {
        startExamBtn.disabled = true; 
        const questionsLoaded = await loadQuestions(); 
        if (questionsLoaded && allQuestions.length > 0) {
            prepareExam();
        } else {
            // Mensaje de error ya se manejó en loadQuestions
            startExamBtn.disabled = false; 
        }
    });
    
    nextQuestionBtn.addEventListener('click', nextQuestion);
    
    restartExamBtnGlobal.addEventListener('click', resetExam);
    restartExamBtnResults.addEventListener('click', resetExam); // El botón en el área de resultados también llama a resetExam
    
    // Inicializar el marcador y el estado de los botones
    updateScoreboard(); 
    restartExamBtnGlobal.classList.add('hidden'); // Ocultar al inicio
});
