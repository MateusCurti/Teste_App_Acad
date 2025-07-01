import React, { useState, useEffect, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, where, doc, setDoc, onSnapshot, orderBy, getDoc, updateDoc } from 'firebase/firestore';
import { Calendar, Dumbbell, ScrollText, Flame, Target, Award, PlusCircle, MinusCircle, Save, Eye, BarChart, XCircle, CheckCircle, Info } from 'lucide-react'; // Added Info icon for achievements

// Context for Firebase and User
const AppContext = createContext(null);

const App = () => {
    const [activeTab, setActiveTab] = useState('view'); // Changed default tab to 'view'
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Global Modal States for Workout Registration
    const [showConfirmSaveModal, setShowConfirmSaveModal] = useState(false);
    const [showSaveStatusModal, setShowSaveStatusModal] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [saveMessageType, setSaveMessageType] = useState(''); // 'success' or 'error'
    const [dayToSave, setDayToSave] = useState(''); // To pass selected day to confirmation modal

    // Global Modal States for Workout View
    const [showWorkoutDetailsModal, setShowWorkoutDetailsModal] = useState(false);
    const [selectedWorkoutDetails, setSelectedWorkoutDetails] = useState(null);

    // Global Modal States for Knight Summary
    const [showAchievementDetailsModal, setShowAchievementDetailsModal] = useState(false);
    const [selectedAchievementDetails, setSelectedAchievementDetails] = useState(null);

    // State and function to be passed to WorkoutRegistrationTab for saving
    const [currentWorkoutToSave, setCurrentWorkoutToSave] = useState(null);


    // Firebase Initialization and Authentication
    useEffect(() => {
        const initializeFirebase = async () => {
            try {
                const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
                const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');

                if (!firebaseConfig || Object.keys(firebaseConfig).length === 0) {
                    throw new Error("Firebase config not found. Please ensure __firebase_config is defined.");
                }

                const app = initializeApp(firebaseConfig);
                const firestoreDb = getFirestore(app);
                const firebaseAuth = getAuth(app);

                setDb(firestoreDb);
                setAuth(firebaseAuth);

                // Sign in with custom token or anonymously
                if (typeof __initial_auth_token !== 'undefined') {
                    await signInWithCustomToken(firebaseAuth, __initial_auth_token);
                } else {
                    await signInAnonymously(firebaseAuth);
                }

                onAuthStateChanged(firebaseAuth, (user) => {
                    if (user) {
                        setUserId(user.uid);
                    } else {
                        // Handle no user case if necessary, though anonymous sign-in should always provide one
                        setUserId(crypto.randomUUID()); // Fallback for unauthenticated state
                    }
                    setLoading(false);
                });

            } catch (err) {
                console.error("Erro ao inicializar Firebase:", err);
                setError("Falha ao carregar o aplicativo. Tente novamente mais tarde.");
                setLoading(false);
            }
        };

        initializeFirebase();
    }, []);

    // Functions to control modals
    const openConfirmSaveModal = (day, workoutData) => {
        setDayToSave(day);
        setCurrentWorkoutToSave(workoutData); // Store workout data to be saved
        setShowConfirmSaveModal(true);
    };
    const closeConfirmSaveModal = () => {
        setShowConfirmSaveModal(false);
        setDayToSave('');
        setCurrentWorkoutToSave(null);
    };

    const openSaveStatusModal = (message, type) => {
        setSaveMessage(message);
        setSaveMessageType(type);
        setShowSaveStatusModal(true);
    };
    const closeSaveStatusModal = () => {
        setShowSaveStatusModal(false);
        setSaveMessage('');
        setSaveMessageType('');
    };

    const performSaveWorkout = async () => {
        closeConfirmSaveModal(); // Close confirmation modal first
        if (!db || !userId || !currentWorkoutToSave) {
            openSaveStatusModal("Erro: Dados do usuário ou treino não disponíveis para salvar.", 'error');
            return;
        }

        try {
            const workoutRef = doc(db, `artifacts/${__app_id}/users/${userId}/workouts`, currentWorkoutToSave.day);
            await setDoc(workoutRef, currentWorkoutToSave, { merge: true });

            openSaveStatusModal("Treino salvo com sucesso! O Reino agradece seu esforço.", 'success');
            // Reset state in WorkoutRegistrationTab after successful save
            // This requires a callback or shared state, which is handled by passing `openSaveStatusModal`
            // and the state reset logic being within WorkoutRegistrationTab itself.
            // The `handleSaveWorkout` in WorkoutRegistrationTab will now trigger this global modal.

        } catch (e) {
            console.error("Erro ao salvar treino:", e);
            openSaveStatusModal("Falha ao salvar treino. Tente novamente.", 'error');
        }
    };


    const openWorkoutDetailsModal = (workout) => {
        setSelectedWorkoutDetails(workout);
        setShowWorkoutDetailsModal(true);
    };
    const closeWorkoutDetailsModal = () => {
        setShowWorkoutDetailsModal(false);
        setSelectedWorkoutDetails(null);
    };

    const openAchievementDetailsModal = (achievement) => {
        setSelectedAchievementDetails(achievement);
        setShowAchievementDetailsModal(true);
    };
    const closeAchievementDetailsModal = () => {
        setShowAchievementDetailsModal(false);
        setSelectedAchievementDetails(null);
    };


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-100 font-cinzel">
                <div className="text-2xl animate-pulse">Carregando o Reino...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-red-400 font-cinzel">
                <div className="text-xl">{error}</div>
            </div>
        );
    }

    return (
        <AppContext.Provider value={{ db, auth, userId }}>
            <div className="min-h-screen bg-gray-900 text-gray-100 font-cinzel flex flex-col items-center p-4">
                <style>
                    {`
                    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');
                    @import url('https://fonts.googleapis.com/css2?family=Spectral:wght@400;700&display=swap');
                    body {
                        font-family: 'Cinzel', serif;
                    }
                    .tab-button {
                        @apply px-6 py-3 rounded-t-lg transition-all duration-300 border-b-2 border-transparent;
                    }
                    .tab-button.active {
                        @apply bg-gray-800 border-indigo-600 text-indigo-400 shadow-lg shadow-indigo-500/30;
                    }
                    .tab-button:not(.active):hover {
                        @apply bg-gray-700 text-gray-300;
                    }
                    .card {
                        @apply bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700 transition-all duration-300;
                    }
                    .input-field {
                        @apply w-full p-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200;
                        background-color: #374151 !important;
                        color: #D1D5DB !important;
                    }
                    .input-field::placeholder {
                        color: #9CA3AF !important;
                    }
                    select.input-field {
                        color: #D1D5DB !important;
                        background-color: #374151 !important;
                    }
                    select.input-field option {
                        background-color: #374151 !important;
                        color: #D1D5DB !important;
                    }
                    .btn-primary {
                        @apply bg-indigo-700 text-white px-5 py-2 rounded-md shadow-lg hover:bg-indigo-600 transition-all duration-200 flex items-center justify-center space-x-2;
                    }
                    .btn-secondary {
                        @apply bg-gray-600 text-gray-100 px-5 py-2 rounded-md shadow-lg hover:bg-gray-500 transition-all duration-200 flex items-center justify-center space-x-2;
                    }
                    .btn-danger {
                        @apply bg-red-700 text-white px-3 py-2 rounded-md shadow-lg hover:bg-red-600 transition-all duration-200 flex items-center justify-center space-x-2;
                    }
                    .highlight-day {
                        @apply opacity-100 shadow-2xl shadow-indigo-500/60 border-indigo-600 transform scale-105;
                        z-index: 10; /* Ensure it's above dimmed cards */
                    }
                    .dim-day {
                        @apply opacity-50;
                        filter: brightness(70%) grayscale(20%); /* Added filter for more visual dimming */
                    }
                    .scroll-style {
                        background: linear-gradient(to bottom, #4a4a4a, #3a3a3a);
                        border: 2px solid #5a5a5a;
                        box-shadow: inset 0 0 10px rgba(0,0,0,0.5);
                        font-family: 'Spectral', serif;
                    }
                    .modal-overlay {
                        @apply fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50;
                    }
                    .modal-content {
                        @apply bg-gray-800 p-8 rounded-lg shadow-xl border border-gray-700 max-w-lg w-full max-h-[90vh] overflow-y-auto;
                    }
                    `}
                </style>

                <h1 className="text-4xl font-bold mb-8 text-indigo-400 text-center drop-shadow-lg">
                    Diário de Treino do Cavaleiro
                </h1>

                <div className="flex mb-8 bg-gray-800 rounded-lg shadow-xl border border-gray-700">
                    <button
                        className={`tab-button ${activeTab === 'view' ? 'active' : ''}`}
                        onClick={() => setActiveTab('view')}
                    >
                        <Eye className="inline-block mr-2" size={20} /> Jornada de Treino
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'register' ? 'active' : ''}`}
                        onClick={() => setActiveTab('register')}
                    >
                        <Calendar className="inline-block mr-2" size={20} /> Forjar Treino
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'report' ? 'active' : ''}`}
                        onClick={() => setActiveTab('report')}
                    >
                        <BarChart className="inline-block mr-2" size={20} /> Resumo do Cavaleiro
                    </button>
                </div>

                <div className="w-full max-w-4xl">
                    {activeTab === 'register' && (
                        <WorkoutRegistrationTab
                            openConfirmSaveModal={openConfirmSaveModal}
                            openSaveStatusModal={openSaveStatusModal}
                        />
                    )}
                    {activeTab === 'view' && (
                        <WorkoutViewTab
                            openWorkoutDetailsModal={openWorkoutDetailsModal}
                        />
                    )}
                    {activeTab === 'report' && (
                        <KnightSummaryTab
                            openAchievementDetailsModal={openAchievementDetailsModal}
                        />
                    )}
                </div>

                {/* Global Modals rendered here */}
                {showConfirmSaveModal && (
                    <div className="modal-overlay">
                        <div className="modal-content text-center">
                            <h3 className="text-xl font-bold mb-4 text-indigo-300">Confirmar Salvamento?</h3>
                            <p className="text-gray-300 mb-6">Tem certeza que deseja salvar este treino para {dayToSave}? Ele substituirá qualquer treino existente para este dia.</p>
                            <div className="flex justify-center space-x-4">
                                <button onClick={performSaveWorkout} className="btn-primary">
                                    <Save size={18} /> Sim, Salvar
                                </button>
                                <button onClick={closeConfirmSaveModal} className="btn-secondary">
                                    <XCircle size={18} /> Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showSaveStatusModal && (
                    <div className="modal-overlay">
                        <div className={`modal-content text-center ${saveMessageType === 'success' ? 'bg-green-800 border-green-700' : 'bg-red-800 border-red-700'}`}>
                            <h3 className="text-xl font-bold mb-4 text-white">{saveMessageType === 'success' ? 'Sucesso!' : 'Erro!'}</h3>
                            <p className="text-gray-100 mb-6">{saveMessage}</p>
                            <button onClick={closeSaveStatusModal} className="btn-secondary">
                                <XCircle size={18} /> Fechar
                            </button>
                        </div>
                    </div>
                )}

                {showWorkoutDetailsModal && selectedWorkoutDetails && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-3xl font-bold text-indigo-300">{selectedWorkoutDetails.day}</h3>
                                <button onClick={closeWorkoutDetailsModal} className="text-gray-400 hover:text-gray-200">
                                    <XCircle size={28} />
                                </button>
                            </div>
                            {selectedWorkoutDetails.exercises && selectedWorkoutDetails.exercises.length > 0 ? (
                                <ul className="list-disc list-inside space-y-3 text-gray-300">
                                    {selectedWorkoutDetails.exercises.map((exercise, exIndex) => (
                                        <li key={exIndex} className="flex items-start bg-gray-700 p-3 rounded-md border border-gray-600">
                                            <Dumbbell size={20} className="mr-3 mt-1 text-indigo-400 flex-shrink-0" />
                                            <span>
                                                <span className="font-medium text-gray-100 text-lg">{exercise.name}</span>
                                                <br />
                                                <span className="text-gray-300">{exercise.series} séries de {exercise.reps} reps com {exercise.load} kg</span>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-400 italic">Nenhum exercício registrado para este dia.</p>
                            )}
                        </div>
                    </div>
                )}

                {showAchievementDetailsModal && selectedAchievementDetails && (
                    <div className="modal-overlay">
                        <div className="modal-content text-center">
                            <h3 className="text-2xl font-bold mb-4 text-indigo-300">{selectedAchievementDetails.name}</h3>
                            <p className="text-gray-300 mb-6">{selectedAchievementDetails.description}</p>
                            <button onClick={closeAchievementDetailsModal} className="btn-secondary">
                                <XCircle size={18} /> Fechar
                            </button>
                        </div>
                    </div>
                )}


                <div className="mt-8 text-sm text-gray-500">
                    ID do Usuário: {userId}
                </div>
            </div>
        </AppContext.Provider>
    );
};

// --- Workout Registration Tab ---
const WorkoutRegistrationTab = ({ openConfirmSaveModal, openSaveStatusModal }) => {
    const { db, userId } = useContext(AppContext);
    const [selectedDay, setSelectedDay] = useState('');
    const [exercises, setExercises] = useState([]);

    const daysOfWeek = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

    // Load existing workout for the selected day when day changes
    useEffect(() => {
        if (selectedDay && db && userId) {
            const fetchWorkout = async () => {
                try {
                    const workoutRef = doc(db, `artifacts/${__app_id}/users/${userId}/workouts`, selectedDay);
                    const docSnap = await getDoc(workoutRef);
                    if (docSnap.exists()) {
                        setExercises(docSnap.data().exercises || []);
                    } else {
                        setExercises([]);
                    }
                } catch (e) {
                    console.error("Erro ao buscar treino:", e);
                    openSaveStatusModal("Erro ao carregar treino existente.", 'error');
                }
            };
            fetchWorkout();
        }
    }, [selectedDay, db, userId, openSaveStatusModal]); // Added openSaveStatusModal to dependency array

    const addExercise = () => {
        setExercises([...exercises, { name: '', series: '', reps: '', load: '' }]); // Series before Reps
    };

    const updateExercise = (index, field, value) => {
        const newExercises = [...exercises];
        newExercises[index][field] = value;
        setExercises(newExercises);
    };

    const removeExercise = (index) => {
        const newExercises = exercises.filter((_, i) => i !== index);
        setExercises(newExercises);
    };

    const validateForm = () => {
        if (!selectedDay) {
            openSaveStatusModal("Por favor, selecione um dia da semana.", 'error');
            return false;
        }
        if (exercises.length === 0) {
            openSaveStatusModal("Adicione pelo menos um exercício.", 'error');
            return false;
        }
        for (const exercise of exercises) {
            if (!exercise.name || exercise.load === '' || exercise.reps === '' || exercise.series === '') {
                openSaveStatusModal("Todos os campos de exercício devem ser preenchidos.", 'error');
                return false;
            }
            if (isNaN(exercise.load) || isNaN(exercise.reps) || isNaN(exercise.series) ||
                parseFloat(exercise.load) < 0 || parseInt(exercise.reps) < 0 || parseInt(exercise.series) < 0) {
                openSaveStatusModal("Carga, Repetições e Séries devem ser números válidos e não negativos.", 'error');
                return false;
            }
        }
        return true;
    };

    const handleSaveWorkout = async () => {
        if (!validateForm()) return;

        const workoutData = {
            day: selectedDay,
            exercises: exercises.map(ex => ({
                ...ex,
                load: parseFloat(ex.load),
                reps: parseInt(ex.reps),
                series: parseInt(ex.series)
            })),
            timestamp: new Date(),
            completed: false
        };
        openConfirmSaveModal(selectedDay, workoutData); // Pass workoutData to the confirmation modal
    };

    return (
        <div className="card p-8">
            <h2 className="text-3xl font-bold mb-6 text-indigo-300 text-center">Forjar Treino</h2>

            <div className="mb-6">
                <label htmlFor="day-select" className="block text-gray-300 text-lg mb-2">Selecione o Dia:</label>
                <select
                    id="day-select"
                    className="input-field"
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                >
                    <option value="">Escolha um dia...</option>
                    {daysOfWeek.map(day => (
                        <option key={day} value={day}>{day}</option>
                    ))}
                </select>
            </div>

            {selectedDay && (
                <>
                    <h3 className="text-2xl font-semibold mb-4 text-gray-200">Exercícios para {selectedDay}</h3>
                    <div className="space-y-4 mb-6">
                        {exercises.map((exercise, index) => (
                            <div key={index} className="bg-gray-700 p-4 rounded-md shadow-inner border border-gray-600 flex flex-col md:flex-row md:items-end gap-6">
                                <div className="flex-grow grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">Nome:</label>
                                        <input
                                            type="text"
                                            className="input-field text-sm"
                                            placeholder="Ex: Supino Reto"
                                            value={exercise.name}
                                            onChange={(e) => updateExercise(index, 'name', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">Séries:</label>
                                        <input
                                            type="number"
                                            className="input-field text-sm"
                                            placeholder="Ex: 3"
                                            value={exercise.series}
                                            onChange={(e) => updateExercise(index, 'series', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">Repetições:</label>
                                        <input
                                            type="number"
                                            className="input-field text-sm"
                                            placeholder="Ex: 10"
                                            value={exercise.reps}
                                            onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">Carga (kg):</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="input-field text-sm"
                                            placeholder="Ex: 50"
                                            value={exercise.load}
                                            onChange={(e) => updateExercise(index, 'load', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeExercise(index)}
                                    className="btn-danger w-full md:w-auto mt-2 md:mt-0"
                                >
                                    <MinusCircle size={18} /> Remover
                                </button>
                            </div>
                        ))}
                    </div>

                    <button onClick={addExercise} className="btn-secondary w-full mb-6">
                        <PlusCircle size={20} /> Adicionar Exercício
                    </button>

                    <button onClick={handleSaveWorkout} className="btn-primary w-full">
                        <Save size={20} /> Salvar Treino
                    </button>
                </>
            )}
        </div>
    );
};

// --- Workout Visualization Tab ---
const WorkoutViewTab = ({ openWorkoutDetailsModal }) => {
    const { db, userId } = useContext(AppContext);
    const [workouts, setWorkouts] = useState([]);
    const [loadingWorkouts, setLoadingWorkouts] = useState(true);
    const [errorWorkouts, setErrorWorkouts] = useState(null);

    // Get current day of the week in Portuguese
    const getTodayDay = () => {
        const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        return days[new Date().getDay()];
    };
    const today = getTodayDay();

    useEffect(() => {
        if (!db || !userId) return;

        setLoadingWorkouts(true);
        setErrorWorkouts(null);

        const workoutsCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/workouts`);

        const unsubscribe = onSnapshot(workoutsCollectionRef, (snapshot) => {
            const fetchedWorkouts = [];
            snapshot.forEach(doc => {
                fetchedWorkouts.push({ id: doc.id, ...doc.data() });
            });

            // Sort workouts by day of week
            const daysOrder = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
            fetchedWorkouts.sort((a, b) => daysOrder.indexOf(a.day) - daysOrder.indexOf(b.day));

            setWorkouts(fetchedWorkouts);
            setLoadingWorkouts(false);
        }, (error) => {
            console.error("Erro ao carregar treinos:", error);
            setErrorWorkouts("Falha ao carregar seus treinos. Tente novamente.");
            setLoadingWorkouts(false);
        });

        // Cleanup listener on unmount
        return () => unsubscribe();
    }, [db, userId]);

    const handleToggleComplete = async (workoutId, currentStatus) => {
        if (!db || !userId) return;
        try {
            const workoutRef = doc(db, `artifacts/${__app_id}/users/${userId}/workouts`, workoutId);
            await updateDoc(workoutRef, { completed: !currentStatus });
        } catch (e) {
            console.error("Erro ao atualizar status de conclusão:", e);
        }
    };

    if (loadingWorkouts) {
        return (
            <div className="card p-8 text-center">
                <div className="text-xl animate-pulse">Buscando os pergaminhos de treino...</div>
            </div>
        );
    }

    if (errorWorkouts) {
        return (
            <div className="card p-8 text-center text-red-400">
                <div className="text-xl">{errorWorkouts}</div>
            </div>
        );
    }

    if (workouts.length === 0) {
        return (
            <div className="card p-8 text-center">
                <p className="text-xl text-gray-300">Nenhum treino encontrado. Comece a forjar seus treinos na aba "Forjar Treino"!</p>
            </div>
        );
    }

    return (
        <div className="card p-8">
            <h2 className="text-3xl font-bold mb-6 text-indigo-300 text-center">Jornada de Treino</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workouts.map(workout => (
                    <div
                        key={workout.id}
                        className={`
                            bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700
                            transition-all duration-300 transform hover:scale-105 cursor-pointer
                            ${workout.day === today ? 'highlight-day' : 'dim-day'}
                            flex flex-col justify-between
                        `}
                        onClick={() => openWorkoutDetailsModal(workout)}
                    >
                        <h3 className="text-2xl font-semibold mb-3 text-gray-200 flex items-center justify-between">
                            <span className="flex items-center">
                                <Calendar size={20} className="mr-2 text-indigo-400" /> {workout.day}
                                {workout.day === today && <span className="ml-2 text-sm text-indigo-400">(Hoje)</span>}
                            </span>
                            {workout.completed && <CheckCircle size={24} className="text-green-500" />}
                        </h3>
                        {workout.exercises && workout.exercises.length > 0 ? (
                            <p className="text-gray-300">
                                {workout.exercises.length} exercícios registrados.
                            </p>
                        ) : (
                            <p className="text-gray-400 italic">Nenhum exercício registrado para este dia.</p>
                        )}
                        <button
                            onClick={(e) => { e.stopPropagation(); handleToggleComplete(workout.id, workout.completed); }}
                            className={`mt-4 w-full py-2 rounded-md transition-all duration-200 flex items-center justify-center space-x-2 ${workout.completed ? 'bg-green-700 hover:bg-green-600' : 'bg-gray-600 hover:bg-gray-500'}`}
                        >
                            {workout.completed ? <CheckCircle size={18} /> : <Dumbbell size={18} />}
                            <span>{workout.completed ? 'Treino Concluído!' : 'Marcar como Concluído'}</span>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Knight Summary Tab ---
const KnightSummaryTab = ({ openAchievementDetailsModal }) => {
    const { db, userId } = useContext(AppContext);
    const [summaryData, setSummaryData] = useState(null);
    const [loadingSummary, setLoadingSummary] = useState(true);
    const [errorSummary, setErrorSummary] = useState(null);

    const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

    useEffect(() => {
        if (!db || !userId) return;

        const fetchSummaryData = async () => {
            setLoadingSummary(true);
            setErrorSummary(null);
            try {
                const workoutsCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/workouts`);
                const querySnapshot = await getDocs(workoutsCollectionRef);

                let trainedDaysCount = 0;
                let lastTrainedDay = 'Nenhum';
                let totalVolume = 0;
                let totalExercisesCount = 0;
                let weeklyTrainedDays = new Set();

                const now = new Date();
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());
                startOfWeek.setHours(0, 0, 0, 0);

                const exerciseProgress = {}; // This will remain, but won't be displayed

                querySnapshot.forEach(doc => {
                    const data = doc.data();
                    const workoutDate = data.timestamp ? data.timestamp.toDate() : null;
                    const isCompleted = data.completed === true;

                    if (isCompleted && workoutDate) {
                        trainedDaysCount++;
                        if (lastTrainedDay === 'Nenhum' || workoutDate > new Date(lastTrainedDay)) {
                            lastTrainedDay = workoutDate.toLocaleDateString('pt-BR');
                        }

                        if (workoutDate >= startOfWeek) {
                            weeklyTrainedDays.add(workoutDate.getDay());
                        }
                    }

                    if (data.exercises && Array.isArray(data.exercises)) {
                        data.exercises.forEach(ex => {
                            const load = parseFloat(ex.load);
                            const reps = parseInt(ex.reps);
                            const series = parseInt(ex.series);

                            if (!isNaN(load) && !isNaN(reps) && !isNaN(series)) {
                                totalVolume += (load * reps * series);
                                totalExercisesCount++;

                                if (!exerciseProgress[ex.name]) {
                                    exerciseProgress[ex.name] = [];
                                }
                                exerciseProgress[ex.name].push({
                                    date: workoutDate ? workoutDate.toLocaleDateString('pt-BR') : 'Data Desconhecida',
                                    load,
                                    reps,
                                    series
                                });
                            }
                        });
                    }
                });

                for (const exName in exerciseProgress) {
                    exerciseProgress[exName].sort((a, b) => {
                        const dateA = new Date(a.date.split('/').reverse().join('-'));
                        const dateB = new Date(b.date.split('/').reverse().join('-'));
                        return dateB - dateA;
                    });
                }

                setSummaryData({
                    trainedDaysCount,
                    lastTrainedDay,
                    totalVolume: totalVolume.toFixed(2),
                    averageDuration: totalExercisesCount > 0 ? (totalExercisesCount * 5).toFixed(0) : 0,
                    weeklyTrainedDays: Array.from(weeklyTrainedDays),
                    exerciseProgress // Still pass this for achievement conditions
                });
                setLoadingSummary(false);

            } catch (e) {
                console.error("Erro ao buscar resumo:", e);
                setErrorSummary("Falha ao carregar o resumo do Cavaleiro.");
                setLoadingSummary(false);
            }
        };

        fetchSummaryData();
    }, [db, userId]);

    // Achievements definitions
    const achievements = [
        { name: "Início da Jornada", condition: summaryData?.trainedDaysCount >= 1, description: "Complete seu primeiro treino!", icon: <Award size={24} className="text-yellow-400" /> },
        { name: "Cavaleiro Persistente", condition: summaryData?.trainedDaysCount >= 7, description: "Complete 7 treinos no total.", icon: <Award size={24} className="text-yellow-400" /> },
        { name: "Rotina Consistente", condition: summaryData?.weeklyTrainedDays.length >= 3, description: "Treine em 3 dias diferentes na mesma semana.", icon: <Award size={24} className="text-yellow-400" /> },
        { name: "Ferrão Afiado", condition: summaryData?.trainedDaysCount >= 30, description: "Complete 30 treinos no total. Seu ferrão está ficando afiado!", icon: <Award size={24} className="text-yellow-400" /> },
        { name: "Ferrão Canalizado", condition: summaryData?.trainedDaysCount >= 65, description: "Complete 65 treinos no total. Seu ferrão agora canaliza mais força!", icon: <Award size={24} className="text-yellow-400" /> },
        { name: "Ferrão Serpenteado", condition: summaryData?.trainedDaysCount >= 130, description: "Complete 130 treinos no total. Seu ferrão tem um movimento serpenteado e mortal!", icon: <Award size={24} className="text-yellow-400" /> },
        { name: "Ferrão Puro", condition: summaryData?.trainedDaysCount >= 260, description: "Complete 260 treinos no total. Você alcançou a maestria do Ferrão Puro!", icon: <Award size={24} className="text-yellow-400" /> },
        { name: "Mestre do Volume", condition: summaryData?.totalVolume && summaryData.totalVolume > 10000, description: "Levante um volume total de 10.000 kg.", icon: <Award size={24} className="text-yellow-400" /> },
        { name: "Lenda do Reino", condition: summaryData?.totalVolume && summaryData.totalVolume > 50000, description: "Levante um volume total de 50.000 kg.", icon: <Award size={24} className="text-yellow-400" /> },
    ];


    const openAchievementModal = (achievement) => {
        openAchievementDetailsModal(achievement);
    };

    if (loadingSummary) {
        return (
            <div className="card p-8 text-center">
                <div className="text-xl animate-pulse">Analisando os registros do Cavaleiro...</div>
            </div>
        );
    }

    if (errorSummary) {
        return (
            <div className="card p-8 text-center text-red-400">
                <div className="text-xl">{errorSummary}</div>
            </div>
        );
    }

    return (
        <div className="card p-8">
            <h2 className="text-3xl font-bold mb-6 text-indigo-300 text-center">Resumo do Cavaleiro</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="card p-5">
                    <h3 className="text-2xl font-semibold mb-3 text-gray-200 flex items-center">
                        <Flame size={20} className="mr-2 text-red-400" /> Frequência de Treinos
                    </h3>
                    <p className="text-gray-300 mb-2">Dias treinados (total): <span className="font-bold text-indigo-300">{summaryData.trainedDaysCount}</span></p>
                    <p className="text-gray-300 mb-4">Último dia treinado: <span className="font-bold text-indigo-300">{summaryData.lastTrainedDay}</span></p>

                    <h4 className="text-lg font-medium mb-2 text-gray-300">Mapa de Luzes da Semana:</h4>
                    <div className="flex justify-around items-center bg-gray-700 p-3 rounded-md border border-gray-600">
                        {daysOfWeek.map((dayName, index) => (
                            <div key={dayName} className="flex flex-col items-center">
                                <span className="text-xs text-gray-400 mb-1">{dayName.substring(0, 3)}</span>
                                {summaryData.weeklyTrainedDays.includes(index) ? (
                                    <Flame size={24} className="text-yellow-400 shadow-md shadow-yellow-500/50" />
                                ) : (
                                    <Flame size={24} className="text-gray-600" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card p-5">
                    <h3 className="text-2xl font-semibold mb-3 text-gray-200 flex items-center">
                        <Target size={20} className="mr-2 text-green-400" /> Progresso e Volume
                    </h3>
                    <p className="text-gray-300 mb-2">Volume Total Levantado (kg): <span className="font-bold text-indigo-300">{summaryData.totalVolume}</span></p>
                    <p className="text-gray-300 mb-4">Duração Média por Treino (min): <span className="font-bold text-indigo-300">{summaryData.averageDuration}</span></p>
                </div>
            </div>

            <div className="card p-5 mb-8">
                <h3 className="text-2xl font-semibold mb-3 text-gray-200 flex items-center">
                    <Award size={20} className="mr-2 text-yellow-400" /> Conquistas do Cavaleiro
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {achievements.map((achievement, index) => (
                        <div
                            key={index}
                            className={`flex items-center p-3 rounded-md border cursor-pointer ${achievement.condition ? 'bg-green-900/50 border-green-700' : 'bg-gray-700/50 border-gray-600 opacity-70'}`}
                            onClick={() => openAchievementModal(achievement)}
                        >
                            {achievement.icon}
                            <span className={`ml-3 font-medium ${achievement.condition ? 'text-green-300' : 'text-gray-400'}`}>{achievement.name}</span>
                            <Info size={16} className="ml-auto text-gray-400 hover:text-gray-200" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default App;