document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos del DOM (Examen) ---
    const questionSubjectElement = document.getElementById('question-subject');
    const questionTextElement = document.getElementById('question-text');
    const optionsContainerElement = document.getElementById('options-container');
    const feedbackTextElement = document.getElementById('feedback-text');
    const explanationTextElement = document.getElementById('explanation-text');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const startExamBtn = document.getElementById('start-exam-btn');
    const restartExamBtn = document.getElementById('restart-exam-btn');

    const currentQNumberElement = document.getElementById('current-q-number');
    const totalQNumberElement = document.getElementById('total-q-number');
    const scoreCorrectElement = document.getElementById('score-correct');
    const scoreIncorrectElement = document.getElementById('score-incorrect');

    const setupArea = document.getElementById('setup-area');
    const examArea = document.getElementById('exam-area');
    const resultsArea = document.getElementById('results-area');

    const finalTotalElement = document.getElementById('final-total');
    const finalCorrectElement = document.getElementById('final-correct');
    const finalIncorrectElement = document.getElementById('final-incorrect');
    const finalPercentageElement = document.getElementById('final-percentage');

    // Asegúrate de que estas rutas sean correctas según tu estructura en GitHub Pages
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
        allQuestions = []; 
        startExamBtn.disabled = true;
        startExamBtn.textContent = "Cargando preguntas...";
        try {
            const fetchPromises = jsonFiles.map(file =>
                fetch(file)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Error al cargar ${file}: ${response.statusText} (Status: ${response.status})`);
                        }
                        return response.json();
                    })
                    .catch(error => {
                        console.error(error);
                        return []; 
                    })
            );
            
            const jsonDataArrays = await Promise.all(fetchPromises);
            allQuestions = jsonDataArrays.flat().filter(q => q && typeof q === 'object' && typeof q.pregunta === 'string'); 
            
            console.log(`Total de preguntas cargadas válidas: ${allQuestions.length}`);
            if (allQuestions.length === 0) {
                alert("No se pudieron cargar preguntas. Revisa la consola (F12) para más detalles y asegúrate que los archivos JSON estén en las rutas correctas y tengan el formato esperado.");
                startExamBtn.textContent = "Error al cargar. Reintentar";
                startExamBtn.disabled = false;
                return false; 
            }
            startExamBtn.textContent = "Iniciar Examen"; // Restaurar texto original
            startExamBtn.disabled = false;
            return true; 
            
        } catch (error) {
            console.error('Error general al cargar las preguntas:', error);
            alert('Hubo un error general al cargar las preguntas. Revisa la consola (F12).');
            startExamBtn.textContent = "Error al cargar. Reintentar";
            startExamBtn.disabled = false;
            return false;
        }
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function prepareExam() {
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
        nextQuestionBtn.classList.add('hidden');

        displayQuestion();
        updateScoreboard();
    }

    function displayQuestion() {
        // ... (Esta función es igual que la versión anterior, asegúrate de tenerla completa)
        if (currentQuestionIndex < selectedQuestions.length) {
            const currentQuestion = selectedQuestions[currentQuestionIndex];
            if (!currentQuestion || typeof currentQuestion.pregunta !== 'string' || typeof currentQuestion.opciones !== 'object') {
                console.error("Pregunta malformada o incompleta:", currentQuestion);
                questionTextElement.textContent = "Error: Pregunta no disponible.";
                optionsContainerElement.innerHTML = '';
                 nextQuestionBtn.classList.remove('hidden'); // Permitir avanzar si hay error
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
        // ... (Esta función es igual que la versión anterior, asegúrate de tenerla completa)
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
        // ... (Esta función es igual que la versión anterior, asegúrate de tenerla completa)
        if (!selectedQuestions || selectedQuestions.length === 0 && currentQuestionIndex === 0) { // Ajuste para el estado inicial
            currentQNumberElement.textContent = 0;
            totalQNumberElement.textContent = questionsPerExam; // Mostrar el objetivo
            scoreCorrectElement.textContent = 0;
            scoreIncorrectElement.textContent = 0;
            return;
        }
        if (selectedQuestions.length === 0) return; // Si no hay preguntas seleccionadas, no actualizar.

        currentQNumberElement.textContent = currentQuestionIndex + 1 > selectedQuestions.length ? selectedQuestions.length : currentQuestionIndex + 1;
        totalQNumberElement.textContent = selectedQuestions.length;
        scoreCorrectElement.textContent = scoreCorrect;
        scoreIncorrectElement.textContent = scoreIncorrect;
    }

    function nextQuestion() {
        // ... (Esta función es igual que la versión anterior, asegúrate de tenerla completa)
        currentQuestionIndex++;
        if (currentQuestionIndex < selectedQuestions.length) {
            displayQuestion();
        } else {
            showFinalResults();
        }
    }

    function showFinalResults() {
        // ... (Esta función es igual que la versión anterior, asegúrate de tenerla completa)
        examArea.classList.add('hidden');
        resultsArea.classList.remove('hidden');
        
        finalTotalElement.textContent = selectedQuestions.length;
        finalCorrectElement.textContent = scoreCorrect;
        finalIncorrectElement.textContent = scoreIncorrect;
        const percentage = selectedQuestions.length > 0 ? ((scoreCorrect / selectedQuestions.length) * 100).toFixed(2) : 0;
        finalPercentageElement.textContent = percentage;
    }

    startExamBtn.addEventListener('click', async () => {
        // No hay verificación de login, directamente carga y prepara
        startExamBtn.disabled = true; 
        const questionsLoaded = await loadQuestions(); 
        if (questionsLoaded && allQuestions.length > 0) {
            prepareExam();
        } else {
            startExamBtn.disabled = false; 
            // El mensaje de error ya se mostró en loadQuestions
        }
    });
    
    nextQuestionBtn.addEventListener('click', nextQuestion);
    
    restartExamBtn.addEventListener('click', () => {
        resultsArea.classList.add('hidden');
        setupArea.classList.remove('hidden'); // Mostrar el área de setup para volver a empezar
        // Opcional: Forzar la recarga y nueva mezcla de preguntas si se desea
        // startExamBtn.disabled = true;
        // loadQuestions().then(() => {
        //     if (allQuestions.length > 0) prepareExam();
        // });
        // Para que simplemente permita volver a tomar el examen con las preguntas ya cargadas (pero re-barajeadas):
        if (allQuestions.length > 0) {
             startExamBtn.disabled = false; // Habilitar botón de inicio
        } else {
            // Si por alguna razón no hay preguntas, permitir que se vuelvan a cargar
            startExamBtn.disabled = false;
        }
    });
    
    // Actualizar el marcador inicial
    updateScoreboard(); 
});
