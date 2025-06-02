document.addEventListener('DOMContentLoaded', () => {
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

    // !!! ATENCIÓN AQUÍ: Revisa estas rutas y nombres de archivo !!!
    // Asegúrate que coincidan con tu estructura de carpetas y nombres de archivo.
    // Te recomiendo usar nombres de carpeta en minúsculas, sin espacios ni caracteres especiales (como ñ o tildes).
    const jsonFiles = [
        // Ciencias (asumiendo carpeta "ciencias")
        'ciencias/biologia.json', 
        'ciencias/fisica.json', 
        'ciencias/quimica.json',
        // Ciencias Sociales (asumiendo carpeta "ciencias_sociales")
        'ciencias_sociales/historia_universal.json', 
        'ciencias_sociales/historia_de_mexico.json', 
        'ciencias_sociales/formacion_civica_etica.json', 
        'ciencias_sociales/geografia.json',
        // Español (asumiendo carpeta "espanol")
        'espanol/espanol_ambito_estudio.json', 
        'espanol/espanol_ambito_literatura.json', 
        'espanol/espanol_ambito_participacion_ciudadana.json',
        // Matemáticas (asumiendo carpeta "matematicas")
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
        allQuestions = []; // Limpiar preguntas anteriores si se reinicia
        try {
            const fetchPromises = jsonFiles.map(file =>
                fetch(file)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Error al cargar ${file}: ${response.statusText}`);
                        }
                        return response.json();
                    })
                    .catch(error => {
                        console.error(error);
                        // Retornar un array vacío para este archivo si falla, para que Promise.all no se detenga
                        return []; 
                    })
            );
            
            const jsonDataArrays = await Promise.all(fetchPromises);
            
            allQuestions = jsonDataArrays.flat().filter(q => q && typeof q === 'object'); // Combina y filtra nulos/vacíos
            
            console.log(`Total de preguntas cargadas válidas: ${allQuestions.length}`);
            if (allQuestions.length === 0) {
                alert("No se pudieron cargar preguntas válidas de ningún archivo. Revisa la consola para más detalles y asegúrate que los archivos JSON estén en las rutas correctas y tengan el formato esperado.");
                return;
            }
            prepareExam();
        } catch (error) {
            console.error('Error general al cargar las preguntas:', error);
            alert('Hubo un error general al cargar las preguntas. Revisa la consola.');
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
            startExamBtn.disabled = false; // Permitir reintentar
            return; // No continuar si no hay preguntas
        }

        shuffleArray(allQuestions);
        selectedQuestions = allQuestions.slice(0, Math.min(questionsPerExam, allQuestions.length));
        
        if (selectedQuestions.length < questionsPerExam && allQuestions.length > 0) {
            alert(`Advertencia: Solo se pudieron cargar ${selectedQuestions.length} preguntas de las ${questionsPerExam} solicitadas. Puede que falten algunos archivos JSON o estén vacíos.`);
        } else if (selectedQuestions.length === 0 && allQuestions.length > 0) {
             alert(`No se seleccionaron preguntas para el examen, aunque se cargaron ${allQuestions.length} del pool total. Revisa la lógica de selección.`);
             startExamBtn.disabled = false;
             return;
        } else if (selectedQuestions.length === 0 && allQuestions.length === 0) {
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
        startExamBtn.disabled = false; // Habilitar por si quiere reiniciar
    }

    function displayQuestion() {
        if (currentQuestionIndex < selectedQuestions.length) {
            const currentQuestion = selectedQuestions[currentQuestionIndex];
            questionSubjectElement.textContent = currentQuestion.materia || "Pregunta";
            questionTextElement.textContent = currentQuestion.pregunta;
            optionsContainerElement.innerHTML = ''; 
            feedbackTextElement.textContent = '';
            explanationTextElement.textContent = '';
            feedbackTextElement.className = ''; 

            for (const key in currentQuestion.opciones) {
                const button = document.createElement('button');
                button.innerHTML = `${key.toUpperCase()}. ${currentQuestion.opciones[key]}`; // Usar innerHTML por si hay entidades HTML
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
        const currentQuestion = selectedQuestions[currentQuestionIndex];
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
            clickedButton.classList.add('correct');
        } else {
            scoreIncorrect++;
            feedbackTextElement.textContent = `Incorrecto. La respuesta correcta era la ${correctAnswerKey.toUpperCase()}.`;
            feedbackTextElement.className = 'incorrect';
            clickedButton.classList.add('incorrect');
        }
        
        if (currentQuestion.explicacion) {
            explanationTextElement.textContent = `Explicación: ${currentQuestion.explicacion}`;
        }

        updateScoreboard();
        nextQuestionBtn.classList.remove('hidden');
    }

    function updateScoreboard() {
        currentQNumberElement.textContent = currentQuestionIndex + 1 > selectedQuestions.length ? selectedQuestions.length : currentQuestionIndex + 1;
        totalQNumberElement.textContent = selectedQuestions.length;
        scoreCorrectElement.textContent = scoreCorrect;
        scoreIncorrectElement.textContent = scoreIncorrect;
    }

    function nextQuestion() {
        currentQuestionIndex++;
        if (currentQuestionIndex < selectedQuestions.length) {
            displayQuestion();
        } else {
            showFinalResults();
        }
    }

    function showFinalResults() {
        examArea.classList.add('hidden');
        resultsArea.classList.remove('hidden');

        finalTotalElement.textContent = selectedQuestions.length;
        finalCorrectElement.textContent = scoreCorrect;
        finalIncorrectElement.textContent = scoreIncorrect;
        const percentage = selectedQuestions.length > 0 ? ((scoreCorrect / selectedQuestions.length) * 100).toFixed(2) : 0;
        finalPercentageElement.textContent = percentage;
    }

    startExamBtn.addEventListener('click', () => {
        startExamBtn.disabled = true; // Deshabilitar mientras carga
        loadQuestions();
    });
    nextQuestionBtn.addEventListener('click', nextQuestion);
    restartExamBtn.addEventListener('click', () => {
        startExamBtn.disabled = true; // Deshabilitar mientras carga
        if (allQuestions.length > 0) {
            prepareExam();
        } else {
            loadQuestions(); 
        }
    });
});