import { LibraryExercise } from '../types';

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  // ============================================================================
  // 1. SENTADILLA / DOMINANCIA DE RODILLA
  // ============================================================================
  {
    nombre: 'Sentadilla Goblet con Talones Elevados (Foco VMO)',
    patron: 'sentadilla',
    cadena: 'CCC',
    dificultad: 'inicial',
    musculos_principales: 'Cuádriceps, Glúteo Mayor, Core',
    precaucion_clinica: 'Evitar retroversión pélvica extrema al final del rango si hay discopatía lumbar.',
    ajuste_biomecanico_sugerido: 'Mantener tronco vertical, usar cuña de 15° para reducir cizallamiento en rodilla.'
  },
  {
    nombre: 'Sentadilla en Caja (Box Squat)',
    patron: 'sentadilla',
    cadena: 'CCC',
    dificultad: 'intermedio',
    musculos_principales: 'Glúteo Mayor, Isquiosurales, Cuádriceps',
    precaucion_clinica: 'Ideal para condromalacia o dolor fémoro-patelar al mantener tibia vertical.',
    ajuste_biomecanico_sugerido: 'Pausa isométrica de 1 seg sobre el cajón sin perder tensión espinal.'
  },
  {
    nombre: 'Prensa Inclinada 45° con Pies Altos (Disminución cizalla)',
    patron: 'sentadilla',
    cadena: 'CCC',
    dificultad: 'inicial',
    musculos_principales: 'Glúteos, Isquiotibiales, Cuádriceps',
    precaucion_clinica: 'Cuidar despegar el sacro del respaldo para no flectar columna lumbar bajo carga.',
    ajuste_biomecanico_sugerido: 'Pies en parte superior de la plataforma con ancho biacromial.'
  },
  {
    nombre: 'Sillón de Cuádriceps Isométrico en Ángulo Seguro (60°)',
    patron: 'sentadilla',
    cadena: 'CCA',
    dificultad: 'inicial',
    musculos_principales: 'Recto Femoral, Vasto Medial/Lateral',
    precaucion_clinica: 'En lesión de LCA o condropatía, evitar extensiones dinámicas terminales (30°-0°).',
    ajuste_biomecanico_sugerido: 'Sostén isométrico a 60° con contracción sostenida de 5-7 segundos.'
  },
  {
    nombre: 'Sillón de Cuádriceps',
    patron: 'sentadilla',
    cadena: 'CCA',
    dificultad: 'inicial',
    musculos_principales: 'Recto Femoral, Vasto Medial/Lateral',
    precaucion_clinica: 'En lesión de LCA o condropatía, evitar extensiones dinámicas terminales (30°-0°).',
    ajuste_biomecanico_sugerido: ''
  },
  {
    nombre: 'Sentadilla Frontal (Front Squat) con Mancuernas en Hombros',
    patron: 'sentadilla',
    cadena: 'CCC',
    dificultad: 'intermedio',
    musculos_principales: 'Cuádriceps, Core anterior, Erectores torácicos',
    precaucion_clinica: 'Reduce drásticamente el momento flexor sobre la columna lumbar frente a la sentadilla trasera.',
    ajuste_biomecanico_sugerido: 'Codos altos y mirada al frente; descender entre las caderas.'
  },
  {
    nombre: 'Hack Squat en Máquina con Apoyo Lumbar Completo',
    patron: 'sentadilla',
    cadena: 'CCC',
    dificultad: 'intermedio',
    musculos_principales: 'Cuádriceps, Glúteos',
    precaucion_clinica: 'Evitar bloquear bruscamente las rodillas en extensión total (mantener microflexión).',
    ajuste_biomecanico_sugerido: 'Pies a ancho de cadera; controlar el descenso excéntrico en 3 segundos.'
  },
  {
    nombre: 'Sentadilla Sumo con Kettlebell sobre Cajones',
    patron: 'sentadilla',
    cadena: 'CCC',
    dificultad: 'inicial',
    musculos_principales: 'Aductores, Glúteo Mayor, Cuádriceps',
    precaucion_clinica: 'Contraindicado en dolor inguinal o pinzamiento femoroacetabular anterior agudo.',
    ajuste_biomecanico_sugerido: 'Punteras rotadas externamente a 35°; rodillas alineadas con el segundo dedo del pie.'
  },
  {
    nombre: 'Sentadilla Sissy Asistida con Soporte o TRX',
    patron: 'sentadilla',
    cadena: 'CCC',
    dificultad: 'avanzado',
    musculos_principales: 'Recto Femoral, Tendón Rotuliano',
    precaucion_clinica: 'No utilizar en fases agudas de tendinopatía rotuliana. Requiere progresión gradual.',
    ajuste_biomecanico_sugerido: 'Torso y muslos en línea continua; descender flexionando rodillas mientras la cadera permanece extendida.'
  },

  // ============================================================================
  // 2. BISAGRA DE CADERA / DOMINANCIA POSTERIOR
  // ============================================================================
  {
    nombre: 'Peso Muerto Rumano con Mancuernas (RDL)',
    patron: 'bisagra',
    cadena: 'CCC',
    dificultad: 'intermedio',
    musculos_principales: 'Isquiosurales, Glúteo Mayor, Erectores Espinales',
    precaucion_clinica: 'Detener descenso en el límite de tensión isquiotibial sin perder lordosis neutra.',
    ajuste_biomecanico_sugerido: 'Llevar pelvis hacia la pared trasera como si cerrara una puerta.'
  },
  {
    nombre: 'Peso Muerto con Barra Hexagonal (Trap Bar Deadlift)',
    patron: 'bisagra',
    cadena: 'CCC',
    dificultad: 'intermedio',
    musculos_principales: 'Glúteo Mayor, Cuádriceps, Isquiotibiales, Trapecios',
    precaucion_clinica: 'Distribuye la carga más uniformemente entre rodilla y cadera reduciendo cizallamiento espinal.',
    ajuste_biomecanico_sugerido: 'Usar los agarres altos si el alumno tiene limitación de movilidad de cadera.'
  },
  {
    nombre: 'Puente de Glúteos Unilateral con Apoyo Escapular',
    patron: 'bisagra',
    cadena: 'CCC',
    dificultad: 'inicial',
    musculos_principales: 'Glúteo Mayor, Isquiosurales, Core',
    precaucion_clinica: 'Evitar hiperextensión lumbar al bloqueo; la extensión debe ser coxo-femoral pura.',
    ajuste_biomecanico_sugerido: 'Costillas cerradas y pelvis en ligera retroversión al pico de contracción.'
  },
  {
    nombre: 'Hip Thrust con Barra y Almohadilla de Alta Densidad',
    patron: 'bisagra',
    cadena: 'CCC',
    dificultad: 'intermedio',
    musculos_principales: 'Glúteo Mayor, Aductores',
    precaucion_clinica: 'Excelente vector anteroposterior con mínimo estrés compresivo axial raquídeo.',
    ajuste_biomecanico_sugerido: 'Mentón pegado al esternón durante todo el recorrido; rodillas a 90° en la cúspide.'
  },
  {
    nombre: 'Peso Muerto a Una Pierna B-Stance con Mancuerna Contralateral',
    patron: 'bisagra',
    cadena: 'CCC',
    dificultad: 'intermedio',
    musculos_principales: 'Glúteo Mayor, Glúteo Medio, Isquiotibiales',
    precaucion_clinica: 'El apoyo de la punta trasera (apoyo trípode) reduce el riesgo de torsión sacroilíaca.',
    ajuste_biomecanico_sugerido: 'El 85% del peso sobre el talón adelantado; la pierna trasera solo asiste el equilibrio.'
  },
  {
    nombre: 'Curl Femoral Tumbado en Máquina (Camilla de isquiotibiales)',
    patron: 'bisagra',
    cadena: 'CCA',
    dificultad: 'inicial',
    musculos_principales: 'Bíceps Femoral, Semitendinoso, Semimembranoso',
    precaucion_clinica: 'No despegar la pelvis de la almohadilla durante la flexión para no hiperlordotizar la zona lumbar.',
    ajuste_biomecanico_sugerido: 'Pies en dorsiflexión neutra; fase excéntrica lenta de 3 segundos.'
  },
  {
    nombre: 'Curl Nórdico Asistido con Banda Elástica al Techo',
    patron: 'bisagra',
    cadena: 'CCC',
    dificultad: 'avanzado',
    musculos_principales: 'Isquiosurales (Foco excéntrico de alta intensidad)',
    precaucion_clinica: 'Estándar de oro en prevención de desgarros de isquiotibiales; dosificar con volumen bajo (2-3 series de 4-6 rep).',
    ajuste_biomecanico_sugerido: 'Cadera totalmente extendida; evitar quebrar la cintura durante la caída excéntrica.'
  },
  {
    nombre: 'Hiperextensiones a 45° con Foco en Glúteos (Dorsal Redonda)',
    patron: 'bisagra',
    cadena: 'CCC',
    dificultad: 'inicial',
    musculos_principales: 'Glúteo Mayor, Isquiotibiales superiores',
    precaucion_clinica: 'Al curvar la columna dorsal y meter mentón al pecho, se inhiben erectores y trabaja el glúteo.',
    ajuste_biomecanico_sugerido: 'Pies apuntando 45° hacia afuera; extender únicamente la articulación coxofemoral.'
  },
  {
    nombre: 'Kettlebell Swing a Dos Manos (Extensión Balística)',
    patron: 'bisagra',
    cadena: 'CCC',
    dificultad: 'intermedio',
    musculos_principales: 'Glúteo Mayor, Isquiotibiales, Latissimus, Core',
    precaucion_clinica: 'No sentarse: es una bisagra pura de cadera. Suspender si hay dolor de cizallamiento lumbar.',
    ajuste_biomecanico_sugerido: 'Snap de cadera explosivo; la pesa flota por inercia sin ser levantada por los hombros.'
  },

  // ============================================================================
  // 3. LUNGE / PATRÓN UNILATERAL
  // ============================================================================
  {
    nombre: 'Sentadilla Búlgara (Split Squat) con Apoyo en Banco',
    patron: 'lunge_unilateral',
    cadena: 'CCC',
    dificultad: 'avanzado',
    musculos_principales: 'Glúteo Mayor pierna anterior, Cuádriceps',
    precaucion_clinica: 'Evaluar estabilidad de rodilla en valgo dinámico; no colapsar el arco plantar.',
    ajuste_biomecanico_sugerido: 'Inclinación de 20° del torso para focalizar en glúteo y reducir estrés patelar.'
  },
  {
    nombre: 'Zancada Hacia Atrás (Reverse Lunge) con Mancuernas',
    patron: 'lunge_unilateral',
    cadena: 'CCC',
    dificultad: 'inicial',
    musculos_principales: 'Glúteo Mayor, Cuádriceps, Core',
    precaucion_clinica: 'Mucho más amigable para el tendón rotuliano que la zancada hacia adelante (frena el vector de cizalla anterior).',
    ajuste_biomecanico_sugerido: 'Paso largo hacia atrás; espinilla de la pierna delantera se mantiene casi perpendicular al suelo.'
  },
  {
    nombre: 'Step-Up Controlado en Cajón de 25cm (Bajada lenta)',
    patron: 'lunge_unilateral',
    cadena: 'CCC',
    dificultad: 'inicial',
    musculos_principales: 'Glúteo Medio, Vasto Medial, Tríceps Sural',
    precaucion_clinica: 'Fundamental para evaluar control neuromuscular en cadena cinética cerrada.',
    ajuste_biomecanico_sugerido: 'No rebotar con el pie de atrás; la fuerza proviene 100% de la pierna apoyada.'
  },
  {
    nombre: 'Sentadilla Cossack Asistida con TRX o Barra (Plano Frontal)',
    patron: 'lunge_unilateral',
    cadena: 'CCC',
    dificultad: 'intermedio',
    musculos_principales: 'Aductores, Glúteo Medio, Cuádriceps, Tobillo',
    precaucion_clinica: 'Trabajo multiplanar esencial para deportistas; vigilar pinzamiento de cadera.',
    ajuste_biomecanico_sugerido: 'Bajar lateralmente manteniendo talón de la pierna flexionada pegado al suelo; pierna estirada con punta arriba.'
  },
  {
    nombre: 'Zancadas Caminando (Walking Lunges) con Pausa Isométrica',
    patron: 'lunge_unilateral',
    cadena: 'CCC',
    dificultad: 'intermedio',
    musculos_principales: 'Cuádriceps, Glúteos, Isquiotibiales, Estabilizadores de tobillo',
    precaucion_clinica: 'Suspender si hay inestabilidad o chasquidos dolorosos fémoro-patelares.',
    ajuste_biomecanico_sugerido: 'Mantener cadera nivelada en cada paso; evitar inclinaciones pélvicas laterales (Trendelenburg).'
  },

  // ============================================================================
  // 4. EMPUJE HORIZONTAL
  // ============================================================================
  {
    nombre: 'Press de Banca Plano con Mancuernas y Agarre Neutro',
    patron: 'empuje_horizontal',
    cadena: 'CCA',
    dificultad: 'intermedio',
    musculos_principales: 'Pectoral Mayor, Tríceps Braquial, Deltoides Anterior',
    precaucion_clinica: 'El agarre neutro abre el espacio subacromial reduciendo riesgo de pinzamiento.',
    ajuste_biomecanico_sugerido: 'Codos a 45° respecto al torso; retracción y depresión escapular constante.'
  },
  {
    nombre: 'Flexo-Extensiones de Brazos (Push-Ups) con Manos Elevadas',
    patron: 'empuje_horizontal',
    cadena: 'CCC',
    dificultad: 'inicial',
    musculos_principales: 'Pectoral Mayor, Serrato Anterior, Core anterior',
    precaucion_clinica: 'Ideal para reactivar el serrato anterior sin compresión forzada de glenohumeral.',
    ajuste_biomecanico_sugerido: 'Empuje completo permitiendo protracción escapular activa al final.'
  },
  {
    nombre: 'Press Inclinado 30° con Mancuernas (Foco Clavicular)',
    patron: 'empuje_horizontal',
    cadena: 'CCA',
    dificultad: 'intermedio',
    musculos_principales: 'Pectoral Superior (haz clavicular), Deltoides Anterior, Tríceps',
    precaucion_clinica: 'No exceder 30-40° de inclinación para que el esfuerzo no se traslade excesivamente al deltoides anterior.',
    ajuste_biomecanico_sugerido: 'Bajar las mancuernas hacia la línea de las clavículas con antebrazos perpendiculares.'
  },
  {
    nombre: 'Cruces en Polea Media-Baja a la Altura del Pecho',
    patron: 'empuje_horizontal',
    cadena: 'CCA',
    dificultad: 'inicial',
    musculos_principales: 'Pectoral Mayor (fibras esternales), Coracobraquial',
    precaucion_clinica: 'Tensión constante durante todo el rango; excelente para personas con molestias articulares en press con barra.',
    ajuste_biomecanico_sugerido: 'Codos con ligera semiflexión constante fija; pensar en abrazar un barril ancho.'
  },
  {
    nombre: 'Fondos en Paralelas (Dips) Asistidos con Inclinación Torácica',
    patron: 'empuje_horizontal',
    cadena: 'CCC',
    dificultad: 'avanzado',
    musculos_principales: 'Pectoral Inferior, Tríceps, Deltoides Anterior',
    precaucion_clinica: 'Contraindicado en inestabilidad anterior de hombro o laxitud ligamentosa acromioclavicular.',
    ajuste_biomecanico_sugerido: 'Inclinación de 30° hacia adelante del torso; no descender más allá de los 90° de flexión de codo.'
  },

  // ============================================================================
  // 5. EMPUJE VERTICAL
  // ============================================================================
  {
    nombre: 'Press Militar de Rodillas con Mina Terrestre (Landmine Press)',
    patron: 'empuje_vertical',
    cadena: 'CCA',
    dificultad: 'inicial',
    musculos_principales: 'Deltoides, Tríceps, Serrato, Oblicuos',
    precaucion_clinica: 'Vector diagonal (60°) que no exige rango completo de 180° de flexión de hombro.',
    ajuste_biomecanico_sugerido: 'Excelente alternativa cuando hay limitación de movilidad torácica o dolor subacromial.'
  },
  {
    nombre: 'Press Vertical Unilateral con Mancuerna Sentado con Respaldo',
    patron: 'empuje_vertical',
    cadena: 'CCA',
    dificultad: 'intermedio',
    musculos_principales: 'Deltoides, Tríceps',
    precaucion_clinica: 'Evitar arqueo lumbar compensatorio fijando la pelvis contra el respaldo.',
    ajuste_biomecanico_sugerido: 'Plano escapular (30° hacia adelante del plano coronal).'
  },
  {
    nombre: 'Press Militar Estricto de Pie con Barra (Strict OHP)',
    patron: 'empuje_vertical',
    cadena: 'CCA',
    dificultad: 'avanzado',
    musculos_principales: 'Deltoides anterior/medio, Tríceps, Trapecio superior, Core',
    precaucion_clinica: 'Requiere adecuada movilidad torácica (extensión dorsal) para no hiperextender la zona lumbar.',
    ajuste_biomecanico_sugerido: 'Glúteos y cuádriceps en máxima co-contracción isométrica para estabilizar la pelvis.'
  },
  {
    nombre: 'Elevaciones Laterales en Polea Baja a la Altura de la Cadera',
    patron: 'empuje_vertical',
    cadena: 'CCA',
    dificultad: 'inicial',
    musculos_principales: 'Deltoides Medio, Supraespinoso',
    precaucion_clinica: 'La polea provee curva de resistencia continua sin pico de palanca lesivo en el inicio.',
    ajuste_biomecanico_sugerido: 'Elevar en el plano escapular (30° adelantado) hasta los 85-90°, nunca por encima del hombro.'
  },
  {
    nombre: 'Arnold Press con Mancuernas',
    patron: 'empuje_vertical',
    cadena: 'CCA',
    dificultad: 'intermedio',
    musculos_principales: 'Deltoides anterior y lateral, Tríceps',
    precaucion_clinica: 'La rotación controlada promueve activación suave del manguito rotador.',
    ajuste_biomecanico_sugerido: 'Comenzar con palmas hacia el rostro y rotar suavemente a medida que suben las mancuernas.'
  },

  // ============================================================================
  // 6. TRACCIÓN HORIZONTAL
  // ============================================================================
  {
    nombre: 'Remo en Polea Baja con Agarre Estrecho y Apoyo en Pies',
    patron: 'traccion_horizontal',
    cadena: 'CCA',
    dificultad: 'inicial',
    musculos_principales: 'Dorsal Ancho, Romboides, Trapecio Medio, Bíceps',
    precaucion_clinica: 'Mantener columna neutral sin flexión espinal dinámica al iniciar el jalón.',
    ajuste_biomecanico_sugerido: 'Iniciar el movimiento con la retracción escapular antes de flectar los codos.'
  },
  {
    nombre: 'Remo Invertido en TRX o Barra Fija con Agarre Supino',
    patron: 'traccion_horizontal',
    cadena: 'CCC',
    dificultad: 'intermedio',
    musculos_principales: 'Romboides, Dorsal, Deltoides Posterior, Core',
    precaucion_clinica: 'Excelente activación de estabilizadores escapulares con carga regulable por inclinación.',
    ajuste_biomecanico_sugerido: 'Cuerpo en plancha rígida recta; glúteos y abdomen apretados.'
  },
  {
    nombre: 'Remo Unilateral con Mancuerna Apoyo en Banco 3 Puntos (Serrucho)',
    patron: 'traccion_horizontal',
    cadena: 'CCA',
    dificultad: 'intermedio',
    musculos_principales: 'Dorsal Ancho, Bíceps, Multifidos contralaterales',
    precaucion_clinica: 'Evitar rotación del torso para no cargar la articulación sacroilíaca.',
    ajuste_biomecanico_sugerido: 'Llevar la mancuerna hacia la cadera en arco de elipse, no directo a la axila.'
  },
  {
    nombre: 'Remo con Pecho Apoyado en Banco Inclinado (Chest Supported Row)',
    patron: 'traccion_horizontal',
    cadena: 'CCA',
    dificultad: 'inicial',
    musculos_principales: 'Trapecio Medio, Romboides, Redondo Mayor, Dorsal',
    precaucion_clinica: 'Elimina al 100% la carga axial y compresiva sobre la columna lumbar (ideal para hernias o lumbalgias).',
    ajuste_biomecanico_sugerido: 'Apoyar el pecho firmemente en banco a 30°; traccionar llevando los codos hacia atrás con pausa de 1 seg.'
  },
  {
    nombre: 'Face Pull en Polea Alta con Cuerda y Rotación Externa',
    patron: 'traccion_horizontal',
    cadena: 'CCA',
    dificultad: 'inicial',
    musculos_principales: 'Deltoides Posterior, Infraespinoso, Redondo Menor, Trapecio Medio/Superior',
    precaucion_clinica: 'Ejercicio indispensable de salud y reprogramación escapular para deportistas que pasan horas sentados.',
    ajuste_biomecanico_sugerido: 'Traccionar hacia los ojos terminando con los pulgares apuntando hacia atrás en doble bíceps.'
  },
  {
    nombre: 'Pájaros / Aperturas Inversas con Mancuernas en Banco Inclinado',
    patron: 'traccion_horizontal',
    cadena: 'CCA',
    dificultad: 'inicial',
    musculos_principales: 'Deltoides Posterior, Romboides',
    precaucion_clinica: 'Cargas livianas con técnica impecable; evitar encoger los hombros hacia las orejas.',
    ajuste_biomecanico_sugerido: 'Codos con microflexión fija; separar los brazos pensando en tocar las paredes laterales.'
  },

  // ============================================================================
  // 7. TRACCIÓN VERTICAL
  // ============================================================================
  {
    nombre: 'Jalón al Pecho en Polea con Agarre Neutro Medio',
    patron: 'traccion_vertical',
    cadena: 'CCA',
    dificultad: 'inicial',
    musculos_principales: 'Dorsal Ancho, Redondo Mayor, Bíceps',
    precaucion_clinica: 'NUNCA trasnuca. Llevar hacia la clavícula con ligera inclinación del tronco (15°).',
    ajuste_biomecanico_sugerido: 'Traccionar pensando en clavar los codos en los bolsillos del pantalón.'
  },
  {
    nombre: 'Jalón Unilateral en Polea Alta con Agarre Neutro',
    patron: 'traccion_vertical',
    cadena: 'CCA',
    dificultad: 'intermedio',
    musculos_principales: 'Dorsal Ancho (fibras ilíacas), Oblicuo interno',
    precaucion_clinica: 'Permite un recorrido anatómico perfecto respetando la orientación de las fibras del dorsal.',
    ajuste_biomecanico_sugerido: 'Ligera flexión lateral del tronco al final de la tracción para acortamiento máximo del dorsal.'
  },
  {
    nombre: 'Dominadas Asistidas con Banda Elástica',
    patron: 'traccion_vertical',
    cadena: 'CCC',
    dificultad: 'avanzado',
    musculos_principales: 'Dorsal, Bíceps, Braquial, Serrato',
    precaucion_clinica: 'No dejarse caer bruscamente en el extremo excéntrico para no impactar glenohumeral.',
    ajuste_biomecanico_sugerido: 'Descenso controlado en 3 segundos; pecho en dirección a la barra.'
  },
  {
    nombre: 'Dominadas Supinas (Chin-Ups) con Agarre al Ancho de Hombros',
    patron: 'traccion_vertical',
    cadena: 'CCC',
    dificultad: 'avanzado',
    musculos_principales: 'Dorsal Ancho, Bíceps Braquial, Braquiorradial',
    precaucion_clinica: 'Evitar si hay epitrocleítis (codo de golfista) o molestias en flexores de antebrazo.',
    ajuste_biomecanico_sugerido: 'Comenzar desde descompresión colgada pero activa con escápulas deprimidas.'
  },
  {
    nombre: 'Pullover en Polea Alta con Cuerda / Barra Recta (Brazos Semirrígidos)',
    patron: 'traccion_vertical',
    cadena: 'CCA',
    dificultad: 'inicial',
    musculos_principales: 'Dorsal Ancho, Redondo Mayor, Tríceps (cabeza larga)',
    precaucion_clinica: 'Aísla el dorsal sin participación sustancial de los flexores del codo.',
    ajuste_biomecanico_sugerido: 'Torso inclinado 30°; empujar la barra hacia los muslos sin doblar los codos.'
  },

  // ============================================================================
  // 8. ANTI-ROTACIÓN, ESTABILIDAD Y CORE FUNCIONAL
  // ============================================================================
  {
    nombre: 'Press Pallof Antirrotacional con Banda o Polea',
    patron: 'anti_rotacion_core',
    cadena: 'CCC',
    dificultad: 'inicial',
    musculos_principales: 'Oblicuos internos/externos, Transverso Abdominal, Glúteos',
    precaucion_clinica: 'Resistencia isométrica pura sin cizallamiento vertebral para discopatías.',
    ajuste_biomecanico_sugerido: 'Extender brazos al frente, mantener 3 segundos sin rotar torso ni pelvis.'
  },
  {
    nombre: 'Plancha Lateral sobre Antebrazo con Elevación de Pierna',
    patron: 'anti_rotacion_core',
    cadena: 'CCC',
    dificultad: 'intermedio',
    musculos_principales: 'Cuadrado Lumbar, Glúteo Medio, Oblicuos',
    precaucion_clinica: 'Alta activación de estabilizadores lumbares con mínimo índice de compresión discal.',
    ajuste_biomecanico_sugerido: 'Alineación recta oreja-hombro-cadera-tobillo; codo justo bajo el hombro.'
  },
  {
    nombre: 'Bird-Dog (Perro de Caza) con Control Pélvico',
    patron: 'anti_rotacion_core',
    cadena: 'CCC',
    dificultad: 'inicial',
    musculos_principales: 'Multífidos, Erectores, Glúteo Mayor, Deltoides posterior',
    precaucion_clinica: 'Pilar de McGill para rehabilitación de columna lumbar y dolor inespecífico.',
    ajuste_biomecanico_sugerido: 'Extensión sin hiperextender columna lumbar; dedo gordo del pie y mano rozan piso al volver.'
  },
  {
    nombre: 'Deadbug (Bicho Muerto) con Presión Lumbar Activa',
    patron: 'anti_rotacion_core',
    cadena: 'CCC',
    dificultad: 'inicial',
    musculos_principales: 'Transverso del Abdomen, Recto Abdominal, Psoas Iliaco',
    precaucion_clinica: 'Reeducación de control motor lumbo-pélvico; la columna baja nunca debe despegarse de la colchoneta.',
    ajuste_biomecanico_sugerido: 'Extender brazo y pierna opuesta exhalando todo el aire; mantener contacto lumbar total.'
  },
  {
    nombre: 'Paseo del Granjero Unilateral (Suitcase Carry)',
    patron: 'anti_rotacion_core',
    cadena: 'CCC',
    dificultad: 'intermedio',
    musculos_principales: 'Cuadrado Lumbar contralateral, Oblicuos, Glúteo Medio, Agarre',
    precaucion_clinica: 'Desafío asimétrico que entrena la resistencia anti-inclinación lateral en bipedestación real.',
    ajuste_biomecanico_sugerido: 'Caminar erguido sin ladearse hacia el lado del peso; pasos cortos y estables.'
  },
  {
    nombre: 'Rueda Abdominal de Rodillas (Ab Wheel Rollout)',
    patron: 'anti_rotacion_core',
    cadena: 'CCC',
    dificultad: 'avanzado',
    musculos_principales: 'Recto Abdominal, Dorsal Ancho, Serrato Anterior',
    precaucion_clinica: 'Ejercicio anti-extensión de altísima demanda. NO usar si el alumno no puede evitar arquear la zona lumbar.',
    ajuste_biomecanico_sugerido: 'Comenzar con pelvis en retroversión activa; avanzar solo hasta donde se mantenga el abdomen apretado.'
  },
  {
    nombre: 'Plancha Frontal RKC con Máxima Tensión Isométrica',
    patron: 'anti_rotacion_core',
    cadena: 'CCC',
    dificultad: 'intermedio',
    musculos_principales: 'Core total, Glúteos, Cuádriceps',
    precaucion_clinica: 'Evita sostener planchas pasivas largas con caída pélvica. Son series cortas de 10-15 segundos a máxima potencia.',
    ajuste_biomecanico_sugerido: 'Jalar los codos hacia los dedos de los pies y apretar glúteos como si quisiera doblar la colchoneta.'
  }
];