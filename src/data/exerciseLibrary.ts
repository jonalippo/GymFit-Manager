import { LibraryExercise } from '../types';

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  // Sentadilla / Patrón dominante de rodilla
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
    nombre: 'Sentadilla en Caja (Box Squat) con Barra Hexagonal',
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
    musculos_principales: 'Glúteos, Isquiotibiales',
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

  // Bisagra de Cadera / Patrón dominante posterior
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
    nombre: 'Good Morning con Banda Elástica Asistida',
    patron: 'bisagra',
    cadena: 'CCC',
    dificultad: 'inicial',
    musculos_principales: 'Cadena Posterior, Multifidos',
    precaucion_clinica: 'Reeducación de disociación lumbo-pélvica con bajo brazo de palanca.',
    ajuste_biomecanico_sugerido: 'Banda sujeta en hombros; ritmo controlado 3-0-1.'
  },

  // Empuje Horizontal
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
    nombre: 'Press en Máquina Convergente con Tope de Rango',
    patron: 'empuje_horizontal',
    cadena: 'CCA',
    dificultad: 'inicial',
    musculos_principales: 'Pectoral, Deltoides anterior',
    precaucion_clinica: 'Limitar retroversión del húmero para proteger el labrum y cápsula anterior.',
    ajuste_biomecanico_sugerido: 'Configurar el tope a nivel del esternón.'
  },

  // Empuje Vertical
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

  // Tracción Horizontal
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
    nombre: 'Remo Invertido en TRX o Barra Multipower (Inverted Row)',
    patron: 'traccion_horizontal',
    cadena: 'CCC',
    dificultad: 'intermedio',
    musculos_principales: 'Romboides, Dorsal, Deltoides Posterior, Core',
    precaucion_clinica: 'Excelente activación de estabilizadores escapulares con carga regulable por inclinación.',
    ajuste_biomecanico_sugerido: 'Cuerpo en plancha rígida recta; glúteos y abdomen apretados.'
  },
  {
    nombre: 'Remo Unilateral con Mancuerna Apoyo en Banco 3 Puntos',
    patron: 'traccion_horizontal',
    cadena: 'CCA',
    dificultad: 'intermedio',
    musculos_principales: 'Dorsal Ancho, Bíceps, Multifidos contralaterales',
    precaucion_clinica: 'Evitar rotación del torso para no cargar la articulación sacroilíaca.',
    ajuste_biomecanico_sugerido: 'Llevar la mancuerna hacia la cadera en arco de elipse, no directo a la axila.'
  },

  // Tracción Vertical
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
    nombre: 'Dominadas Asistidas con Banda Elástica / Máquina Gravitrón',
    patron: 'traccion_vertical',
    cadena: 'CCC',
    dificultad: 'avanzado',
    musculos_principales: 'Dorsal, Bíceps, Braquial, Serrato',
    precaucion_clinica: 'No dejarse caer bruscamente en el extremo excéntrico para no impactar glenohumeral.',
    ajuste_biomecanico_sugerido: 'Descenso controlado en 3 segundos; pecho en dirección a la barra.'
  },

  // Lunge / Unilateral
  {
    nombre: 'Zancada Estática (Split Squat) Búlgaro con Apoyo en Banco',
    patron: 'lunge_unilateral',
    cadena: 'CCC',
    dificultad: 'avanzado',
    musculos_principales: 'Glúteo Mayor pierna anterior, Cuádriceps',
    precaucion_clinica: 'Evaluar estabilidad de rodilla en valgo dinámico; no colapsar el arco plantar.',
    ajuste_biomecanico_sugerido: 'Inclinación de 20° del torso para focalizar en glúteo y reducir estrés patelar.'
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

  // Anti-Rotación y Core Funcional
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
  }
];
