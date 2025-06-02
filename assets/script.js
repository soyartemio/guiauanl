document.addEventListener('DOMContentLoaded', () => {
    // --- Configuración de Firebase ---
    // REEMPLAZA ESTO CON TU PROPIA CONFIGURACIÓN DE FIREBASE
    const firebaseConfig = {
        apiKey: "AIzaSyYOUR_API_KEY_HERE_EXAMPLE", // Ejemplo, usa el tuyo
        authDomain: "your-project-id.firebaseapp.com",
        projectId: "your-project-id",
        storageBucket: "your-project-id.appspot.com",
        messagingSenderId: "YOUR_SENDER_ID",
        appId: "YOUR_APP_ID"
    };
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore(); 
    const provider = new firebase.auth.GoogleAuthProvider();

    // --- Elementos del DOM (Login) ---
    const loginArea = document.getElementById('login-area');
    const loginGoogleBtn = document.getElementById('login-google-btn');
    const loginErrorElement = document.getElementById('login-error');
    const userInfoArea = document.getElementById('user-info-area');
    const userEmailDisplay = document.getElementById('user-email-display');
    const logoutBtn = document.getElementById('logout-btn');
    const separator = document.getElementById('separator');

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

    const jsonFiles = [
        'ciencias/biologia.json', 'ciencias/fisica.json', 'ciencias/quimica.json',
        'ciencias_sociales/historia_universal.json', 'ciencias_sociales/historia_de_mexico.json', 
        'ciencias_sociales/formacion_civica_etica.json', 'ciencias_sociales/geografia.json',
        'espanol/espanol_ambito_estudio.json', 'espanol/espanol_ambito_literatura.json', 
        'espanol/espanol_ambito_participacion_ciudadana.json',
        'matematicas/aritmetica.json', 'matematicas/algebra.json', 'matematicas/geometria.json', 
        'matematicas/trigonometria.json', 'matematicas/estadistica.json', 'matematicas/probabilidad.json', 
        'matematicas/matematicas_problemas.json'
    ];
    
    let allQuestions = [];
    let selectedQuestions = [];
    let currentQuestionIndex = 0;
    let scoreCorrect = 0;
    let scoreIncorrect = 0;
    const questionsPerExam = 200; // Número de preguntas para el examen

    // --- Lógica de Autenticación ---
    auth.onAuthStateChanged(async user => { 
        if (user) {
            loginErrorElement.textContent = ''; 
            try {
                const authorizedUsersCollection = db.collection('usuariosAutorizados'); // Nombre de tu colección en Firestore
                const querySnapshot = await authorizedUsersCollection.where('email', '==', user.email.toLowerCase()).get();

                if (!querySnapshot.empty) {
                    loginArea.classList.add('hidden');
                    userInfoArea.classList.remove('hidden');
                    setupArea.classList.remove('hidden');
                    separator.classList.remove('hidden');
                    examArea.classList.add('hidden'); 
                    resultsArea.classList.add('hidden');
                    userEmailDisplay.textContent = user.email;
                    console.log("Usuario autorizado:", user.email);
                } else {
                    loginErrorElement.textContent = "Acceso no autorizado. Este correo no está en la lista permitida.";
                    console.log("Intento de login de usuario no autorizado:", user.email);
                    auth.signOut(); 
                }
            } catch (error) {
                console.error("Error al verificar autorización en Firestore:", error);
                loginErrorElement.textContent = "Error al verificar autorización. Intenta de nuevo más tarde.";
                auth.signOut();
            }
        } else {
            loginArea.classList.remove('hidden');
            userInfoArea.classList.add('hidden');
            setupArea.classList.add('hidden');
            examArea.classList.add('hidden');
            resultsArea.classList.add('hidden');
            separator.classList.add('hidden');
            userEmailDisplay.textContent = '';
        }
    });

    loginGoogleBtn.addEventListener('click', () => {
        loginErrorElement.textContent = ''; 
        auth.signInWithPopup(provider)
            .then((result) => {
                console.log("Login con Google exitoso para:", result.user.email);
                // onAuthStateChanged se encargará de verificar y mostrar/ocultar
            })
            .catch((error) => {
                let friendlyMessage = "Error al iniciar sesión con Google.";
                if (error.code === 'auth/popup-closed-by-user') {
                    friendlyMessage = "Proceso de inicio de sesión cancelado.";
                } else if (error.code === 'auth/network-request-failed') {
                    friendlyMessage = "Error de red. Verifica tu conexión a internet.";
                }
                loginErrorElement.textContent = friendlyMessage;
                console.error("Error de inicio de sesión con Google:", error.code, error.message);
            });
    });

    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            console.log("Usuario desconectado");
            allQuestions = []; // Limpiar preguntas cargadas para que se recarguen al próximo inicio
            startExamBtn.disabled = false; // Habilitar botón de inicio
        }).catch((error) => {
            console.error("Error al cerrar sesión:", error);
        });
    });

    // --- Lógica del Examen ---
    async function loadQuestions() {
        allQuestions = []; 
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
            allQuestions = jsonDataArrays.flat().filter(q => q && typeof q === 'object' && typeof q.pregunta === 'string'); // Filtro más robusto
            
            console.log(`Total de preguntas cargadas válidas: ${allQuestions.length}`);
            if (allQuestions.length === 0) {
                alert("No se pudieron cargar preguntas válidas de ningún archivo. Revisa la consola para más detalles y asegúrate que los archivos JSON estén en las rutas correctas, no estén vacíos y tengan el formato esperado.");
                startExamBtn.disabled = false;
                return false; // Indicar que no se cargaron preguntas
            }
            return true; // Indicar que se cargaron preguntas
            
        } catch (error) {
            console.error('Error general al cargar las preguntas:', error);
            alert('Hubo un error general al cargar las preguntas. Revisa la consola.');
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
            alert("No hay preguntas cargadas para iniciar el examen.");
            startExamBtn.disabled = false; 
            return; 
        }

        shuffleArray(allQuestions);
        selectedQuestions = allQuestions.slice(0, Math.min(questionsPerExam, allQuestions.length));
        
        if (selectedQuestions.length < questionsPerExam && allQuestions.length > 0) {
            alert(`Advertencia: Solo se utilizarán ${selectedQuestions.length} preguntas de las ${questionsPerExam} solicitadas, ya que es el total disponible.`);
        } else if (selectedQuestions.length === 0 ) {
             alert("No hay preguntas disponibles para iniciar el examen, a pesar de haber intentado cargarlas.");
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
        if (currentQuestionIndex < selectedQuestions.length) {
            const currentQuestion = selectedQuestions[currentQuestionIndex];
            if (!currentQuestion || typeof currentQuestion.pregunta !== 'string' || typeof currentQuestion.opciones !== 'object') {
                console.error("Pregunta malformada o incompleta:", currentQuestion);
                // Opcional: saltar esta pregunta y pasar a la siguiente
                // nextQuestion(); 
                // return;
                questionTextElement.textContent = "Error: Pregunta no disponible.";
                optionsContainerElement.innerHTML = '';
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
        const currentQuestion = selectedQuestions[currentQuestionIndex];
        if (!currentQuestion) return; // Seguridad adicional

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
        if (!selectedQuestions || selectedQuestions.length === 0) return;
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
        // setupArea.classList.remove('hidden'); // Se mostrará setup después de login si cierra sesión

        finalTotalElement.textContent = selectedQuestions.length;
        finalCorrectElement.textContent = scoreCorrect;
        finalIncorrectElement.textContent = scoreIncorrect;
        const percentage = selectedQuestions.length > 0 ? ((scoreCorrect / selectedQuestions.length) * 100).toFixed(2) : 0;
        finalPercentageElement.textContent = percentage;
    }

    startExamBtn.addEventListener('click', async () => {
        if (auth.currentUser) { 
            startExamBtn.disabled = true; 
            const questionsLoaded = await loadQuestions(); // Esperar a que se carguen
            if (questionsLoaded && allQuestions.length > 0) {
                prepareExam();
            } else {
                startExamBtn.disabled = false; // Habilitar si no se cargaron
            }
        } else {
            alert("Debes iniciar sesión para comenzar el examen.");
        }
    });

    nextQuestionBtn.addEventListener('click', nextQuestion);
    
    restartExamBtn.addEventListener('click', () => {
        resultsArea.classList.add('hidden');
        // El área de setup se mostrará automáticamente por onAuthStateChanged si el usuario sigue logueado
        // Si queremos forzar la recarga de preguntas (no es lo más eficiente si no cambian):
        // startExamBtn.disabled = true;
        // loadQuestions().then(() => {
        //     if (allQuestions.length > 0) prepareExam();
        // });
        // Para un reinicio simple que permita tomar otro examen con la misma carga de preguntas pero re-barajeadas:
        if (auth.currentUser && allQuestions.length > 0) { // Asegurarse que el usuario esté y haya preguntas
            prepareExam();
        } else if (auth.currentUser) { // Si está logueado pero no hay preguntas (ej. primer inicio y no dio start)
             setupArea.classList.remove('hidden'); // Solo muestra el setup
             startExamBtn.disabled = false;
        } else {
            // No debería llegar aquí si resultsArea estaba visible, pero por si acaso
            loginArea.classList.remove('hidden');
        }
    });
});