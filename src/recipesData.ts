import { Recipe } from './types';

export const RECIPES_DATA: Recipe[] = [
  // ================= 1. DESAYUNOS (10) =================
  {
    id: 'desayuno-1',
    title: 'Papilla de Avena cremosa con Plátano y Canela',
    category: 'desayunos',
    prepMin: 5,
    cookMin: 8,
    ageLabel: '+6 meses',
    minAgeMonths: 6,
    emoji: '🥣',
    ingredients: [
      { name: 'Avena en copos suaves', grams: 30 },
      { name: 'Plátano maduro machacado', grams: 60 },
      { name: 'Agua purificada o leche materna/fórmula', grams: 120 },
      { name: 'Canela de Ceilán en polvo', grams: 1, notes: 'pizca suave' }
    ],
    steps: [
      'Cocinar la avena con el agua o leche a fuego lento durante 6 a 8 minutos, revolviendo con cuchara de madera.',
      'Retirar del fuego y mezclar con el plátano bien machacado hasta obtener una textura aterciopelada.',
      'Espolvorear una mínima pizca de canela de Ceilán y dejar enfriar a temperatura tibia antes de servir.'
    ],
    nutrition: 'Aporta fibra soluble betaglucano, energía de liberación sostenida y potasio para el desarrollo muscular.',
    storage: 'Consumir recién preparado o refrigerar máximo 24 horas en recipiente de vidrio hermético.',
    tips: 'Ideal para iniciar el día con saciedad prolongada sin necesidad de azúcares añadidos.'
  },
  {
    id: 'desayuno-2',
    title: 'Pancakes de Avena y Manzana al vapor',
    category: 'desayunos',
    prepMin: 8,
    cookMin: 6,
    ageLabel: '+7 meses',
    minAgeMonths: 7,
    emoji: '🥞',
    ingredients: [
      { name: 'Harina de avena integral', grams: 40 },
      { name: 'Puré de manzana cocida', grams: 50 },
      { name: 'Yema de huevo pasteurizada', grams: 20 },
      { name: 'Aceite de oliva virgen extra', grams: 3, notes: 'para pincelar la sartén' }
    ],
    steps: [
      'Integrar en un cuenco el puré de manzana, la yema y la harina de avena hasta formar una masa espesa pero vertible.',
      'Calentar la sartén antiadherente a fuego bajo con apenas unas gotas de aceite de oliva virgen extra.',
      'Verter pequeñas porciones del tamaño de la palma de la mano del bebé; voltear cuando salgan pequeñas burbujas.',
      'Cocinar 2 minutos por el otro lado y dejar entibiar.'
    ],
    nutrition: 'Rico en colina para el cerebro infantil, carbohidratos complejos y pectina digestiva.',
    storage: 'Se pueden congelar en bolsitas individuales hasta 1 mes. Descongelar a temperatura ambiente.',
    tips: 'Formato ideal para agarre palmar temprano en método BLW o transición mixta.'
  },
  {
    id: 'desayuno-3',
    title: 'Crema de Quinoa tibia con Pera pochada',
    category: 'desayunos',
    prepMin: 5,
    cookMin: 15,
    ageLabel: '+6 meses',
    minAgeMonths: 6,
    emoji: '🍐',
    ingredients: [
      { name: 'Quinoa bien lavada', grams: 25 },
      { name: 'Pera madura en cubos pequeños', grams: 70 },
      { name: 'Agua purificada', grams: 150 }
    ],
    steps: [
      'Lavar la quinoa varias veces bajo el grifo en colador fino para eliminar saponinas.',
      'Hervir la quinoa y los cubos de pera en el agua durante 15 minutos hasta que la quinoa reviente y la pera esté muy suave.',
      'Triturar o pisar con tenedor hasta conseguir la textura adecuada según la etapa del bebé.'
    ],
    nutrition: 'Proteína vegetal de alto valor biológico con todos los aminoácidos esenciales y fibra suave.',
    storage: 'Guardar en la nevera hasta 2 días. Calentar ligeramente al baño maría antes de ofrecer.',
    tips: 'La pera pochada facilita el tránsito intestinal y aporta dulzura natural irresistible.'
  },
  {
    id: 'desayuno-4',
    title: 'Huevito Revuelto suave con Puré de Aguacate',
    category: 'desayunos',
    prepMin: 4,
    cookMin: 4,
    ageLabel: '+6 meses',
    minAgeMonths: 6,
    emoji: '🍳',
    ingredients: [
      { name: 'Huevo fresco entero bien batido', grams: 50 },
      { name: 'Aguacate maduro en puré', grams: 35 },
      { name: 'Aceite de oliva virgen extra', grams: 3 }
    ],
    steps: [
      'Batir el huevo enérgicamente con un tenedor.',
      'Pincelar una sartén antiadherente con aceite y cocinar a fuego muy suave removiendo constantemente para que quede cremoso y no seco.',
      'Asegurarse de que esté bien cocido (sin partes crudas).',
      'Acompañar con el puré de aguacate fresco machacado al momento.'
    ],
    nutrition: 'Proteínas completas, ácidos grasos monoinsaturados saludables (omega 9) y luteína para la vista.',
    storage: 'Consumir inmediatamente; el huevo cocinado no se recomienda recalentar para bebés.',
    tips: 'Ofrecer en trocitos blandos alargados si practica BLW o desmigado con cuchara.'
  },
  {
    id: 'desayuno-5',
    title: 'Gachas de Mijo dulce con Melocotón',
    category: 'desayunos',
    prepMin: 5,
    cookMin: 12,
    ageLabel: '+7 meses',
    minAgeMonths: 7,
    emoji: '🍑',
    ingredients: [
      { name: 'Mijo pelado', grams: 30 },
      { name: 'Melocotón pelado maduro', grams: 60 },
      { name: 'Agua', grams: 120 }
    ],
    steps: [
      'Cocer el mijo en agua hirviendo durante 12 minutos hasta que absorba el líquido y esté tierno.',
      'Cocinar al vapor el melocotón por 5 minutos y machacar con tenedor.',
      'Mezclar el mijo tibio con el puré de melocotón aromático.'
    ],
    nutrition: 'Excelente fuente de hierro vegetal, magnesio y vitamina A.',
    storage: 'Consumir en el día o refrigerar 24h.',
    tips: 'El mijo no contiene gluten y es muy digestivo para pancitas sensibles.'
  },
  {
    id: 'desayuno-6',
    title: 'Tostaditas de Pan de Centeno con Puré de Ciruela',
    category: 'desayunos',
    prepMin: 4,
    cookMin: 3,
    ageLabel: '+8 meses',
    minAgeMonths: 8,
    emoji: '🍞',
    ingredients: [
      { name: 'Pan de centeno sin sal añadida', grams: 25 },
      { name: 'Ciruela roja madura pelada y cocida', grams: 45 },
      { name: 'Semillas de chía molidas', grams: 1 }
    ],
    steps: [
      'Cortar el pan en bastones de dos dedos de ancho y tostar ligeramente para evitar que se haga una bola en la boca.',
      'Pisar la ciruela cocida con la chía molida para formar una mermelada casera instantánea.',
      'Untar finamente sobre el pan y presentar al bebé.'
    ],
    nutrition: 'Estimula la masticación y previene el estreñimiento infantil de manera natural.',
    storage: 'El puré de ciruela dura 3 días en refrigeración.',
    tips: 'Vigilar siempre la textura del pan para garantizar una deglución cómoda y segura.'
  },
  {
    id: 'desayuno-7',
    title: 'Polenta tierna con Ricotta casera y Arándanos',
    category: 'desayunos',
    prepMin: 3,
    cookMin: 7,
    ageLabel: '+9 meses',
    minAgeMonths: 9,
    emoji: '🫐',
    ingredients: [
      { name: 'Harina de maíz precocida (polenta)', grams: 25 },
      { name: 'Ricotta o requesón bajo en sodio', grams: 20 },
      { name: 'Arándanos cocidos y aplastados', grams: 25 },
      { name: 'Agua', grams: 100 }
    ],
    steps: [
      'Llevar el agua a ebullición y agregar la polenta en forma de lluvia sin dejar de batir durante 3 minutos.',
      'Incorporar la ricotta tibia hasta que quede sedosa.',
      'Servir en el tazón con los arándanos previamente hervidos 3 minutos y completamente aplastados.'
    ],
    nutrition: 'Calcio bioasimilable, polifenoles antioxidantes y energía rápida.',
    storage: 'La polenta cuaja al enfriar; añadir una cucharadita de leche tibia al recalentar.',
    tips: 'Los arándanos siempre deben ofrecerse aplastados para prevenir atragantamiento.'
  },
  {
    id: 'desayuno-8',
    title: 'Pudin tibio de Chía con Mango y Leche de Avena',
    category: 'desayunos',
    prepMin: 5,
    cookMin: 2,
    ageLabel: '+8 meses',
    minAgeMonths: 8,
    emoji: '🥭',
    ingredients: [
      { name: 'Semillas de chía hidratadas', grams: 10 },
      { name: 'Bebida de avena o leche habitual', grams: 60 },
      { name: 'Mango maduro en puré aterciopelado', grams: 50 }
    ],
    steps: [
      'Dejar reposar la chía con la leche durante al menos 30 minutos hasta que gelifique.',
      'Calentar apenas unos segundos para quitar el frío de la nevera.',
      'Cubrir con el puré fresco de mango dulce.'
    ],
    nutrition: 'Gran aporte de ácidos grasos esenciales Omega-3 y mucílagos protectores estomacales.',
    storage: 'Dura 24 horas en el refrigerador.',
    tips: 'Textura suave y gelatinosa ideal para explorar con cuchara o dedos.'
  },
  {
    id: 'desayuno-9',
    title: 'Crepes de Espinaca tierna y Plátano',
    category: 'desayunos',
    prepMin: 6,
    cookMin: 5,
    ageLabel: '+7 meses',
    minAgeMonths: 7,
    emoji: '🥬',
    ingredients: [
      { name: 'Hojas de espinaca baby limpias', grams: 20 },
      { name: 'Plátano mediano maduro', grams: 60 },
      { name: 'Huevo campero', grams: 50 },
      { name: 'Harina de avena', grams: 20 }
    ],
    steps: [
      'Triturar las espinacas con el plátano, huevo y harina hasta lograr una mezcla verde homogénea.',
      'Cocinar en sartén antiadherente a fuego medio-bajo 2 minutos por lado.',
      'Enrollar y cortar en cilindros pequeños fáciles de sujetar.'
    ],
    nutrition: 'Hierro no hemo, ácido fólico y vitamina C que ayuda a su absorción.',
    storage: 'Consumir en el día o congelar enrolladas.',
    tips: 'Una forma atractiva y colorida de incorporar verduras de hoja verde desde temprano.'
  },
  {
    id: 'desayuno-10',
    title: 'Papilla de Tapioca y Papaya perfumada',
    category: 'desayunos',
    prepMin: 5,
    cookMin: 10,
    ageLabel: '+6 meses',
    minAgeMonths: 6,
    emoji: '🌺',
    ingredients: [
      { name: 'Fécula o perlas finas de tapioca', grams: 20 },
      { name: 'Puré de papaya madura', grams: 60 },
      { name: 'Agua', grams: 120 }
    ],
    steps: [
      'Cocinar la tapioca en agua hirviendo removiendo hasta que esté completamente transparente.',
      'Retirar del calor y mezclar con la papaya madura tamizada.',
      'Servir tibia en porciones pequeñas.'
    ],
    nutrition: 'Enzima papaína que favorece la digestión estomacal y alta en provitamina A.',
    storage: 'Consumir recién elaborada.',
    tips: 'Ideal para días de calor o cuando el bebé tiene la pancita inquieta.'
  },

  // ================= 2. ALMUERZOS (10) =================
  {
    id: 'almuerzo-1',
    title: 'Puré Dorado de Pollo, Calabaza y Zanahoria',
    category: 'almuerzos',
    prepMin: 8,
    cookMin: 18,
    ageLabel: '+6 meses',
    minAgeMonths: 6,
    emoji: '🥕',
    ingredients: [
      { name: 'Pechuga de pollo sin piel ni grasa', grams: 35 },
      { name: 'Calabaza dulce en dados', grams: 70 },
      { name: 'Zanahoria pelada en rodajas', grams: 40 },
      { name: 'Aceite de oliva virgen extra en crudo', grams: 3 }
    ],
    steps: [
      'Cocinar al vapor el pollo junto con la calabaza y la zanahoria durante 18 minutos hasta que todo esté extremadamente tierno.',
      'Triturar con un poco del caldo de cocción al vapor hasta alcanzar la consistencia deseada.',
      'Añadir al final el hilo de aceite de oliva en crudo para preservar todos sus antioxidantes.'
    ],
    nutrition: 'Proteína magra para el crecimiento celular, betacarotenos y vitamina E vegetal.',
    storage: 'Apto para congelar en porciones de cubitera durante 2 meses.',
    tips: 'La calabaza aporta una textura cremosa natural sin necesidad de añadir lácteos.'
  },
  {
    id: 'almuerzo-2',
    title: 'Guisito Suave de Lentejas Rojas con Bonitato',
    category: 'almuerzos',
    prepMin: 10,
    cookMin: 20,
    ageLabel: '+7 meses',
    minAgeMonths: 7,
    emoji: '🍲',
    ingredients: [
      { name: 'Lentejas rojas peladas (sin piel)', grams: 25 },
      { name: 'Boniato / Batata dulce', grams: 60 },
      { name: 'Puerro (solo parte blanca)', grams: 15 },
      { name: 'Laurel aromático (retirar al final)', grams: 1 }
    ],
    steps: [
      'Rehogar suavemente el puerro con agua para ablandar.',
      'Añadir las lentejas rojas bien lavadas, el boniato en cubitos y la hoja de laurel con 180 ml de agua.',
      'Cocer 20 minutos hasta que las lentejas rojas se deshagan naturalmente.',
      'Retirar obligatoriamente el laurel y pisar con tenedor.'
    ],
    nutrition: 'Hierro vegetal de fácil digestión, zinc y almidones resistentes prebióticos.',
    storage: 'Dura 48 horas en heladera. Espesa al enfriarse; aligerar con agua hervida.',
    tips: 'Las lentejas rojas no tienen pellejo exterior, por lo que no causan cólicos ni gases.'
  },
  {
    id: 'almuerzo-3',
    title: 'Medallones de Ternera con Puré de Calabacín',
    category: 'almuerzos',
    prepMin: 10,
    cookMin: 15,
    ageLabel: '+7 meses',
    minAgeMonths: 7,
    emoji: '🥩',
    ingredients: [
      { name: 'Carne magra de ternera picada', grams: 35 },
      { name: 'Calabacín pelado', grams: 60 },
      { name: 'Patata cocida pequeña', grams: 40 },
      { name: 'Aceite de oliva virgen extra', grams: 3 }
    ],
    steps: [
      'Formar un medallón suave con la ternera picada y cocinar al vapor o a la plancha suave sin dorar en exceso.',
      'Cocer el calabacín y la patata al vapor durante 12 minutos.',
      'Triturar las verduras con la carne hasta lograr un puré fino con textura o servir el medallón desmenuzado.'
    ],
    nutrition: 'Hierro hemo de máxima biodisponibilidad para prevenir la anemia infantil y vitamina B12.',
    storage: 'Refrigerar máximo 24 horas.',
    tips: 'Esencial a partir de los 6 meses cuando las reservas congénitas de hierro comienzan a descender.'
  },
  {
    id: 'almuerzo-4',
    title: 'Merluza al Vapor sobre Cama de Brócoli y Patata',
    category: 'almuerzos',
    prepMin: 6,
    cookMin: 12,
    ageLabel: '+8 meses',
    minAgeMonths: 8,
    emoji: '🐟',
    ingredients: [
      { name: 'Lomo de merluza fresca sin espinas', grams: 35 },
      { name: 'Floretes de brócoli tierno', grams: 45 },
      { name: 'Patata pelada', grams: 50 },
      { name: 'Aceite de oliva virgen extra', grams: 3 }
    ],
    steps: [
      'Revisar minuciosamente la merluza con los dedos limpios para asegurar 100% ausencia de espinas.',
      'Cocinar al vapor el brócoli, la patata y la merluza en la misma vaporera durante 10-12 minutos.',
      'Desmigar la merluza con tenedor y pisar las verduras con aceite de oliva.'
    ],
    nutrition: 'Ácidos grasos Omega-3 DHA esenciales para el desarrollo neuronal y visual.',
    storage: 'Consumir siempre en el momento por frescura del pescado.',
    tips: 'El pescado blanco ofrece un sabor neutro muy bien aceptado por los bebés.'
  },
  {
    id: 'almuerzo-5',
    title: 'Arroz Meloso con Pavo y Calabaza Asada',
    category: 'almuerzos',
    prepMin: 8,
    cookMin: 22,
    ageLabel: '+7 meses',
    minAgeMonths: 7,
    emoji: '🍚',
    ingredients: [
      { name: 'Arroz de grano redondo', grams: 25 },
      { name: 'Solomillo de pavo en trocitos', grams: 30 },
      { name: 'Calabaza moscada', grams: 50 },
      { name: 'Caldo suave de verduras casero sin sal', grams: 180 }
    ],
    steps: [
      'Cocer el pavo y el arroz en el caldo de verduras casero a fuego medio-bajo durante 20 minutos hasta que quede bien meloso.',
      'Incorporar la calabaza previamente cocida y machacada.',
      'Remover bien para ligar los sabores y dejar entibiar.'
    ],
    nutrition: 'Triptófano para un buen descanso, proteínas digestivas y energía sana.',
    storage: 'Guardar refrigerado 24 horas.',
    tips: 'El arroz bien cocido y meloso es una base suave excelente para introducir nuevas proteínas.'
  },
  {
    id: 'almuerzo-6',
    title: 'Pasta Estrellita con Ragú de Verduras y Tomate dulce',
    category: 'almuerzos',
    prepMin: 6,
    cookMin: 12,
    ageLabel: '+8 meses',
    minAgeMonths: 8,
    emoji: '🍝',
    ingredients: [
      { name: 'Pasta pequeña (estrellitas o letras)', grams: 25 },
      { name: 'Tomate maduro pelado y sin semillas', grams: 40 },
      { name: 'Calabacín y zanahoria rallados fino', grams: 40 },
      { name: 'Orégano molido', grams: 1, notes: 'pizca aromática' }
    ],
    steps: [
      'Cocer la pasta según indicaciones en agua hirviendo sin sal hasta que esté muy blanda.',
      'En un cazo cocinar el tomate con el calabacín y zanahoria hasta formar una salsa suave y densa.',
      'Mezclar la pasta con el ragú y servir tibio.'
    ],
    nutrition: 'Licopeno antioxidante, carbohidratos de absorción gradual y fibra suave.',
    storage: 'Refrigerar hasta 2 días en fiambrera.',
    tips: 'La pasta diminuta ejercita la deglución y el movimiento lingual sin peligro.'
  },
  {
    id: 'almuerzo-7',
    title: 'Cuscús con Salmón al Vapor y Guisantes tiernos',
    category: 'almuerzos',
    prepMin: 6,
    cookMin: 10,
    ageLabel: '+9 meses',
    minAgeMonths: 9,
    emoji: '🍣',
    ingredients: [
      { name: 'Cuscús integral de trigo', grams: 25 },
      { name: 'Salmón fresco limpio sin espinas ni piel', grams: 30 },
      { name: 'Guisantes congelados tiernos hervidos', grams: 30 },
      { name: 'Agua hirviendo', grams: 50 }
    ],
    steps: [
      'Hidratar el cuscús vertiendo el agua hirviendo y tapando durante 5 minutos.',
      'Cocinar el salmón al vapor 8 minutos y desmenuzar finamente.',
      'Aplastarlos guisantes tiernos con tenedor y mezclar todo con una gota de aceite.'
    ],
    nutrition: 'Omega-3 EPA/DHA de alta concentración, vitamina D y proteínas completas.',
    storage: 'Consumir en el día.',
    tips: 'Aplastad siempre los guisantes redondos para que pierdan su forma esférica.'
  },
  {
    id: 'almuerzo-8',
    title: 'Crema de Garbanzos y Espinacas con Yema',
    category: 'almuerzos',
    prepMin: 8,
    cookMin: 15,
    ageLabel: '+8 meses',
    minAgeMonths: 8,
    emoji: '🧆',
    ingredients: [
      { name: 'Garbanzos cocidos sin piel', grams: 40 },
      { name: 'Espinacas cocidas bien picadas', grams: 25 },
      { name: 'Yema de huevo duro rallada', grams: 15 },
      { name: 'Aceite de oliva virgen extra', grams: 3 }
    ],
    steps: [
      'Retirar la piel de los garbanzos cocidos frotándolos con un paño limpio para máxima digestibilidad.',
      'Triturar los garbanzos y las espinacas con agua tibia hasta que no queden grumos.',
      'Decorar con la yema de huevo cocido finamente rallada por encima.'
    ],
    nutrition: 'Hierro vegetal + hierro animal con sinergia de absorción y ácido fólico.',
    storage: 'Refrigerar 24-48 horas.',
    tips: 'Quitar la pielecilla a las legumbres en los primeros meses previene flatulencias.'
  },
  {
    id: 'almuerzo-9',
    title: 'Albóndigas blanditas de Conejo y Manzana',
    category: 'almuerzos',
    prepMin: 12,
    cookMin: 14,
    ageLabel: '+9 meses',
    minAgeMonths: 9,
    emoji: '🧆',
    ingredients: [
      { name: 'Carne picada de conejo o pollo tierno', grams: 40 },
      { name: 'Manzana madura rallada', grams: 30 },
      { name: 'Copos de avena fina', grams: 10 }
    ],
    steps: [
      'Mezclar la carne con la manzana rallada y la avena para formar pelotitas esponjosas.',
      'Cocer al vapor durante 14 minutos para que queden jugosas y se desarmen al presionar entre encías.',
      'Servir a temperatura agradable.'
    ],
    nutrition: 'Carne hipoalergénica baja en grasas saturadas y rica en vitaminas del complejo B.',
    storage: 'Se pueden congelar una vez cocidas hasta por 1 mes.',
    tips: 'La manzana rallada aporta la humedad necesaria para que las albóndigas no queden secas.'
  },
  {
    id: 'almuerzo-10',
    title: 'Risotto de Quinoa con Pimiento Rojo y Ternera',
    category: 'almuerzos',
    prepMin: 7,
    cookMin: 16,
    ageLabel: '+8 meses',
    minAgeMonths: 8,
    emoji: '🫑',
    ingredients: [
      { name: 'Quinoa real lavada', grams: 25 },
      { name: 'Pimiento rojo asado sin piel', grams: 30 },
      { name: 'Carne picada magra', grams: 30 },
      { name: 'Aceite de oliva', grams: 3 }
    ],
    steps: [
      'Hervir la quinoa durante 14 minutos.',
      'Saltear la carne con el pimiento asado en puré.',
      'Unificar todo y triturar ligeramente para integrar.'
    ],
    nutrition: 'Vitamina C concentrada del pimiento rojo que triplica la asimilación del hierro de la ternera.',
    storage: 'Dura 2 días en refrigeración hermética.',
    tips: 'Combinar pimiento o cítricos con carne es la regla de oro para evitar anemias.'
  },

  // ================= 3. BLW (Baby-Led Weaning) (10) =================
  {
    id: 'blw-1',
    title: 'Bastones de Boniato Asado con Romero suave',
    category: 'blw',
    prepMin: 8,
    cookMin: 25,
    ageLabel: '+6 meses',
    minAgeMonths: 6,
    emoji: '🍠',
    ingredients: [
      { name: 'Boniato / Batata dulce grande', grams: 120 },
      { name: 'Aceite de oliva virgen extra', grams: 5 },
      { name: 'Romero seco finamente pulverizado', grams: 1 }
    ],
    steps: [
      'Pelar el boniato y cortar en bastones del grosor y largo del dedo índice de un adulto.',
      'Pintar con aceite de oliva y hornear a 180°C durante 20-25 minutos.',
      'Comprobar el punto: debe poder aplastarse sin esfuerzo entre los dedos pulgar e índice del adulto.'
    ],
    nutrition: 'Carbohidratos complejos amigables con el intestino, betacaroteno y potasio.',
    storage: 'Refrigerar hasta 3 días en recipiente hermético.',
    tips: 'La regla de oro en BLW: si puedes aplastarlo con tus dos dedos, el bebé podrá gestionarlo con sus encías.'
  },
  {
    id: 'blw-2',
    title: 'Árboles de Brócoli al Vapor con Semillas de Sésamo molidas',
    category: 'blw',
    prepMin: 5,
    cookMin: 10,
    ageLabel: '+6 meses',
    minAgeMonths: 6,
    emoji: '🥦',
    ingredients: [
      { name: 'Floretes de brócoli con tallo largo', grams: 80 },
      { name: 'Sésamo blanco molido fino', grams: 3 },
      { name: 'Aceite de oliva virgen extra', grams: 2 }
    ],
    steps: [
      'Cortar el brócoli dejando un tallo largo que sirva de mango natural para el puño del bebé.',
      'Cocinar al vapor 10 minutos hasta que el tallo esté bien blando pero conserve la estructura.',
      'Pincelar con aceite de oliva y rebozar ligeramente en sésamo molido para evitar que resbale.'
    ],
    nutrition: 'Calcio de excelente disponibilidad, sulforafano y vitamina C.',
    storage: 'Consumir en el día.',
    tips: 'El sésamo molido añade fricción facilitando que las manos del bebé no resbalen al agarrarlo.'
  },
  {
    id: 'blw-3',
    title: 'Hamburguesitas BLW de Ternera y Calabacín',
    category: 'blw',
    prepMin: 10,
    cookMin: 8,
    ageLabel: '+6 meses',
    minAgeMonths: 6,
    emoji: '🍔',
    ingredients: [
      { name: 'Carne picada de ternera magra', grams: 60 },
      { name: 'Calabacín rallado y escurrido', grams: 35 },
      { name: 'Copos de avena triturados', grams: 10 }
    ],
    steps: [
      'Rallar el calabacín y estrujar con las manos para extraer el exceso de agua.',
      'Mezclar con la carne y la avena formando minihamburguesas alargadas.',
      'Cocinar en sartén antiadherente tapada a fuego lento 4 minutos por lado hasta que estén bien cocidas y tiernas.'
    ],
    nutrition: 'Aporte de zinc y hierro hemo en formato autoservicio.',
    storage: 'Se pueden congelar cocidas o crudas por 1 mes.',
    tips: 'Hazlas en forma ovalada alargada para que sobresalgan del puñito del bebé al agarrarlas.'
  },
  {
    id: 'blw-4',
    title: 'Gajos de Aguacate Rebozados en Harina de Avena',
    category: 'blw',
    prepMin: 4,
    cookMin: 0,
    ageLabel: '+6 meses',
    minAgeMonths: 6,
    emoji: '🥑',
    ingredients: [
      { name: 'Aguacate maduro pero firme', grams: 70 },
      { name: 'Harina de avena o semillas de chía molidas', grams: 10 }
    ],
    steps: [
      'Cortar el aguacate en gajos gruesos longitudinales.',
      'Rebozar cada gajo en la harina de avena o chía para dar textura antideslizante.',
      'Ofrecer directamente al bebé en su bandeja.'
    ],
    nutrition: 'Grasas saludables cruciales para el desarrollo de la mielina cerebral infantil.',
    storage: 'Consumir recién cortado para evitar oxidación.',
    tips: 'El aguacate sin rebozar suele resbalar y frustrar al bebé en sus primeras semanas de BLW.'
  },
  {
    id: 'blw-5',
    title: 'Tiras de Pechuga de Pollo Pochada con Aromas',
    category: 'blw',
    prepMin: 5,
    cookMin: 15,
    ageLabel: '+6 meses',
    minAgeMonths: 6,
    emoji: '🍗',
    ingredients: [
      { name: 'Solomillo de pollo tierno', grams: 60 },
      { name: 'Agua con una ramita de perejil para pochar', grams: 200 }
    ],
    steps: [
      'Pochar el solomillo entero a fuego muy suave en agua hirviendo durante 12-15 minutos.',
      'Verificar que esté totalmente cocido en el interior sin resecarse.',
      'Cortar a favor de la fibra en tiras de dos dedos de grosor.'
    ],
    nutrition: 'Proteínas limpias de fácil asimilación muscular.',
    storage: 'Refrigerar en tupper hasta 2 días.',
    tips: 'Cocer a fuego muy bajo asegura que las fibras de la carne queden jugosas y se desmenucen con facilidad.'
  },
  {
    id: 'blw-6',
    title: 'Bastones de Zanahoria al Vapor con Aceite de Oliva',
    category: 'blw',
    prepMin: 5,
    cookMin: 14,
    ageLabel: '+6 meses',
    minAgeMonths: 6,
    emoji: '🥕',
    ingredients: [
      { name: 'Zanahorias medianas peladas', grams: 100 },
      { name: 'Aceite de oliva virgen extra', grams: 3 }
    ],
    steps: [
      'Cortar las zanahorias en bastones gruesos uniformes.',
      'Cocer al vapor durante 14 minutos exactos.',
      'Comprobar que no ofrezca resistencia al apretar entre dos dedos.',
      'Aderezar con unas gotas de aceite de oliva tibio.'
    ],
    nutrition: 'Betacarotenos y prebióticos protectores de la microbiota.',
    storage: 'Duran 3 días en la nevera.',
    tips: 'Nunca ofrecer zanahoria cruda a niños menores de 4 años por alto riesgo de atragantamiento.'
  },
  {
    id: 'blw-7',
    title: 'Fritatta suave de Calabacín en Tiras BLW',
    category: 'blw',
    prepMin: 8,
    cookMin: 10,
    ageLabel: '+7 meses',
    minAgeMonths: 7,
    emoji: '🥧',
    ingredients: [
      { name: 'Huevo campero entero batido', grams: 50 },
      { name: 'Calabacín rallado fino', grams: 40 },
      { name: 'Ricotta o queso bajo en sal', grams: 15 }
    ],
    steps: [
      'Batir el huevo con el calabacín y la ricotta.',
      'Verter en molde apto para horno o sartén pequeña a fuego bajo con tapa.',
      'Cocinar hasta que cuaje completamente y cortar en tiras anchas para el bebé.'
    ],
    nutrition: 'Colina y proteínas de alto valor biológico.',
    storage: 'Refrigerar hasta 2 días.',
    tips: 'Excelente opción para desayunos, almuerzos o meriendas transportables.'
  },
  {
    id: 'blw-8',
    title: 'Medias Lunas de Manzana al Horno con Canela',
    category: 'blw',
    prepMin: 6,
    cookMin: 18,
    ageLabel: '+6 meses',
    minAgeMonths: 6,
    emoji: '🍎',
    ingredients: [
      { name: 'Manzana dulce (Fuji o Gala) pelada', grams: 100 },
      { name: 'Canela de Ceilán en polvo', grams: 1 },
      { name: 'Agua para la bandeja de horno', grams: 20 }
    ],
    steps: [
      'Pelar y descorazonar la manzana, cortándola en gajos gruesos.',
      'Colocar en una fuente con unas cucharadas de agua en el fondo para generar vapor.',
      'Espolvorear canela y hornear a 180°C durante 18 minutos hasta que se deshaga en la boca.'
    ],
    nutrition: 'Pectina que nutre las bacterias protectoras del colon y dulzor aromático.',
    storage: 'Refrigerar hasta 3 días.',
    tips: 'Al igual que la zanahoria, la manzana cruda debe evitarse siempre.'
  },
  {
    id: 'blw-9',
    title: 'Albóndigas de Salmón y Patata al Vapor',
    category: 'blw',
    prepMin: 10,
    cookMin: 12,
    ageLabel: '+8 meses',
    minAgeMonths: 8,
    emoji: '🐟',
    ingredients: [
      { name: 'Salmón fresco sin piel ni espinas', grams: 50 },
      { name: 'Patata cocida machacada', grams: 40 },
      { name: 'Eneldo fresco picadito', grams: 1 }
    ],
    steps: [
      'Picar el salmón a cuchillo muy fino y unir con la patata machacada y el eneldo.',
      'Formar cilindros o croquetitas alargadas.',
      'Cocinar al vapor 10-12 minutos.'
    ],
    nutrition: 'DHA y ácidos grasos poliinsaturados esenciales para el cerebro.',
    storage: 'Consumir en 24 horas.',
    tips: 'La patata actúa como aglutinante natural libre de huevo y gluten.'
  },
  {
    id: 'blw-10',
    title: 'Espirales de Pasta de Lentejas con Aceite de Oliva',
    category: 'blw',
    prepMin: 2,
    cookMin: 8,
    ageLabel: '+8 meses',
    minAgeMonths: 8,
    emoji: '🍝',
    ingredients: [
      { name: 'Pasta fusilli de 100% harina de lentejas rojas', grams: 35 },
      { name: 'Aceite de oliva virgen extra', grams: 3 }
    ],
    steps: [
      'Hervir la pasta de lentejas rojas un par de minutos más de lo indicado en el paquete para que quede sumamente tierna.',
      'Escurrir y bañar con aceite de oliva.',
      'Servir tibia directamente en la bandeja.'
    ],
    nutrition: 'Hierro vegetal concentrado y carbohidratos en una sola pieza comestible.',
    storage: 'Consumir en el día.',
    tips: 'La forma de espiral (fusilli) es perfecta para practicar la pinza y el agarre palmar.'
  },

  // ================= 4. UNTABLES (10) =================
  {
    id: 'untable-1',
    title: 'Hummus de Guisantes Verdes y Menta suave',
    category: 'untables',
    prepMin: 6,
    cookMin: 5,
    ageLabel: '+7 meses',
    minAgeMonths: 7,
    emoji: '🌿',
    ingredients: [
      { name: 'Guisantes verdes tiernos cocidos', grams: 80 },
      { name: 'Aceite de oliva virgen extra', grams: 10 },
      { name: 'Hoja de menta fresca', grams: 1 },
      { name: 'Agua de cocción', grams: 20 }
    ],
    steps: [
      'Cocer los guisantes 5 minutos hasta que estén suaves.',
      'Triturar intensamente con el aceite, la hojita de menta y agua de cocción hasta lograr una pasta fina sin pieles perceptibles.',
      'Untar sobre bastones de verdura o tostaditas aptas.'
    ],
    nutrition: 'Proteína vegetal fresca, clorofila y vitaminas del grupo B.',
    storage: 'Refrigerar en frasco cerrado hasta por 3 días.',
    tips: 'Color verde brillante muy estimulante visualmente para el bebé.'
  },
  {
    id: 'untable-2',
    title: 'Mantequilla Casera de Manzana Asada (Apple Butter)',
    category: 'untables',
    prepMin: 5,
    cookMin: 30,
    ageLabel: '+6 meses',
    minAgeMonths: 6,
    emoji: '🍏',
    ingredients: [
      { name: 'Manzanas dulces peladas y troceadas', grams: 200 },
      { name: 'Canela en polvo', grams: 1 },
      { name: 'Agua', grams: 50 }
    ],
    steps: [
      'Cocinar las manzanas con el agua y la canela a fuego muy lento durante 30 minutos hasta que caramelicen de forma natural.',
      'Triturar con batidora hasta obtener una crema untable sedosa y oscura.'
    ],
    nutrition: 'Pectina concentrada y dulzura natural sin azúcar refinado.',
    storage: 'Dura hasta 7 días refrigerado en frasco esterilizado.',
    tips: 'Sustituto ideal y saludable para mermeladas comerciales.'
  },
  {
    id: 'untable-3',
    title: 'Paté Cremoso de Pollo Asado y Calabaza',
    category: 'untables',
    prepMin: 8,
    cookMin: 15,
    ageLabel: '+7 meses',
    minAgeMonths: 7,
    emoji: '🥣',
    ingredients: [
      { name: 'Pechuga de pollo cocida', grams: 50 },
      { name: 'Puré de calabaza horneada', grams: 50 },
      { name: 'Aceite de oliva virgen extra', grams: 6 }
    ],
    steps: [
      'Triturar el pollo caliente con el puré de calabaza y el aceite de oliva hasta que no quede ninguna hebra.',
      'Añadir una cucharada de caldo tibio si se busca consistencia más ligera.'
    ],
    nutrition: 'Proteínas cárnicas y betacaroteno en textura untable.',
    storage: 'Refrigerar hasta 48 horas.',
    tips: 'Perfecto para untar en bastoncitos de pan o tortitas de arroz para bebés.'
  },
  {
    id: 'untable-4',
    title: 'Hummus Tradicional de Garbanzo sin Sal ni Tahini crudo',
    category: 'untables',
    prepMin: 5,
    cookMin: 0,
    ageLabel: '+7 meses',
    minAgeMonths: 7,
    emoji: '🫓',
    ingredients: [
      { name: 'Garbanzos cocidos sin piel', grams: 80 },
      { name: 'Aceite de oliva virgen extra', grams: 10 },
      { name: 'Zumo de naranja dulce o agua tibia', grams: 15 },
      { name: 'Comino en polvo', grams: 1, notes: 'mínima pizca' }
    ],
    steps: [
      'Pelar los garbanzos para asegurar máxima ligereza gástrica.',
      'Triturar con el aceite de oliva, la pizca de comino y el zumo de naranja o agua tibia.',
      'Servir a temperatura ambiente.'
    ],
    nutrition: 'Hierro no hemo, ácido fólico y magnesio.',
    storage: 'Dura 3 días en frío.',
    tips: 'El comino ayuda a prevenir gases de las legumbres.'
  },
  {
    id: 'untable-5',
    title: 'Crema Untable de Aguacate y Ricotta fresca',
    category: 'untables',
    prepMin: 3,
    cookMin: 0,
    ageLabel: '+6 meses',
    minAgeMonths: 6,
    emoji: '🥑',
    ingredients: [
      { name: 'Aguacate maduro machacado', grams: 50 },
      { name: 'Ricotta o requesón fresco sin sal', grams: 40 },
      { name: 'Gotitas de aceite de oliva', grams: 2 }
    ],
    steps: [
      'Mezclar enérgicamente con un tenedor el aguacate con la ricotta hasta lograr una crema homogénea.',
      'Servir al momento.'
    ],
    nutrition: 'Calcio y ácidos grasos monoinsaturados esenciales para el cerebro.',
    storage: 'Consumir en el día para que el aguacate conserve su frescura.',
    tips: 'Untar en gajitos de pepino pelado o panecillos.'
  },
  {
    id: 'untable-6',
    title: 'Puré Untable de Remolacha y Manzana',
    category: 'untables',
    prepMin: 6,
    cookMin: 15,
    ageLabel: '+7 meses',
    minAgeMonths: 7,
    emoji: '🍠',
    ingredients: [
      { name: 'Remolacha cocida al vapor', grams: 40 },
      { name: 'Manzana dulce cocida', grams: 60 },
      { name: 'Aceite de oliva', grams: 3 }
    ],
    steps: [
      'Triturar la remolacha y la manzana cocidas junto con el aceite hasta obtener un dip sedoso de color magenta intenso.',
      'Dejar enfriar antes de ofrecer.'
    ],
    nutrition: 'Antioxidantes betalaínas y fibra soluble.',
    storage: 'Dura 3 días en refrigeración.',
    tips: 'Color divertido que atrae muchísimo la atención de los más pequeños.'
  },
  {
    id: 'untable-7',
    title: 'Crema Untable de Semillas de Calabaza (Pumpkin Butter)',
    category: 'untables',
    prepMin: 5,
    cookMin: 5,
    ageLabel: '+8 meses',
    minAgeMonths: 8,
    emoji: '🎃',
    ingredients: [
      { name: 'Semillas de calabaza crudas sin sal tostadas', grams: 60 },
      { name: 'Aceite de girasol alto oleico o de oliva suave', grams: 10 }
    ],
    steps: [
      'Tostar ligeramente las semillas de calabaza en sartén 3 minutos sin quemar.',
      'Triturar en procesador potente con el aceite durante varios minutos hasta que suelten su grasa y se vuelva una crema untable fina.'
    ],
    nutrition: 'Zinc fundamental para el sistema inmunológico y triptófano.',
    storage: 'Dura 2 semanas en alacena en frasco limpio.',
    tips: 'Excelente alternativa segura y libre de alérgenos comunes como el cacahuete.'
  },
  {
    id: 'untable-8',
    title: 'Dip Suave de Zanahoria Asada y Cilantro',
    category: 'untables',
    prepMin: 5,
    cookMin: 20,
    ageLabel: '+7 meses',
    minAgeMonths: 7,
    emoji: '🥕',
    ingredients: [
      { name: 'Zanahorias asadas al horno con un poco de agua', grams: 100 },
      { name: 'Aceite de oliva virgen extra', grams: 8 },
      { name: 'Hoja de cilantro fresco picado', grams: 1 }
    ],
    steps: [
      'Asar las zanahorias hasta que los bordes caramelicen sutilmente.',
      'Triturar con el aceite y la hoja de cilantro hasta que quede brillante y untuosa.'
    ],
    nutrition: 'Vitamina A biodisponible gracias a la combinación con grasa saludable.',
    storage: 'Refrigerar 4 días.',
    tips: 'El toque de cilantro introduce perfiles de sabor aromáticos complejos de manera sutil.'
  },
  {
    id: 'untable-9',
    title: 'Mousse Untable de Hígado de Pollo y Pera dulce',
    category: 'untables',
    prepMin: 6,
    cookMin: 12,
    ageLabel: '+8 meses',
    minAgeMonths: 8,
    emoji: '🫀',
    ingredients: [
      { name: 'Higadito de pollo fresco muy bien lavado y limpio', grams: 30 },
      { name: 'Pera dulce cocida', grams: 50 },
      { name: 'Aceite de oliva', grams: 4 }
    ],
    steps: [
      'Cocinar el hígado de pollo a fondo en agua hirviendo durante 12 minutos (debe estar 100% cocido por dentro).',
      'Triturar con la pera dulce cocida y el aceite para suavizar el sabor ferroso.'
    ],
    nutrition: 'Bomba de hierro hemo y vitamina A; se recomienda ofrecer máximo 1 vez por semana.',
    storage: 'Consumir en el día o congelar en miniporciones.',
    tips: 'La pera neutraliza el sabor fuerte del hígado haciéndolo irresistible para el bebé.'
  },
  {
    id: 'untable-10',
    title: 'Untable Cremoso de Ricotta y Plátano',
    category: 'untables',
    prepMin: 3,
    cookMin: 0,
    ageLabel: '+6 meses',
    minAgeMonths: 6,
    emoji: '🍌',
    ingredients: [
      { name: 'Plátano muy maduro', grams: 50 },
      { name: 'Ricotta fresca pasteurizada baja en sodio', grams: 50 },
      { name: 'Pizca de canela', grams: 1 }
    ],
    steps: [
      'Pisar el plátano hasta hacerlo puré líquido.',
      'Añadir la ricotta y la canela batiendo con tenedor hasta que quede aireado.',
      'Untar en tortitas o servir con cuchara.'
    ],
    nutrition: 'Calcio y potasio para el desarrollo óseo.',
    storage: 'Dura 24 horas en frío.',
    tips: 'Un untable dulce y cremoso ideal para meriendas saludables.'
  },

  // ================= 5. BEBIDAS (10) =================
  {
    id: 'bebida-1',
    title: 'Agua Infusionada con Manzana y Canela (Fría/Tibia)',
    category: 'bebidas',
    prepMin: 5,
    cookMin: 10,
    ageLabel: '+6 meses',
    minAgeMonths: 6,
    emoji: '🫖',
    ingredients: [
      { name: 'Gajos de manzana dulce limpia con piel', grams: 50 },
      { name: 'Ramita de canela de Ceilán', grams: 2 },
      { name: 'Agua purificada', grams: 250 }
    ],
    steps: [
      'Hervir el agua con la manzana y la canela durante 10 minutos para que el agua absorba los aromas naturales.',
      'Colar meticulosamente y dejar entibiar por completo.',
      'Servir en vasito de aprendizaje abierto.'
    ],
    nutrition: 'Hidratación suave con sabor natural, sin azúcares añadidos ni jugos procesados.',
    storage: 'Consumir en 24 horas.',
    tips: 'Enseña al bebé a beber en vasito abierto sin boquillas para un óptimo desarrollo orofacial.'
  },
  {
    id: 'bebida-2',
    title: 'Caldo Clarificado de Huesos y Verduras',
    category: 'bebidas',
    prepMin: 10,
    cookMin: 45,
    ageLabel: '+7 meses',
    minAgeMonths: 7,
    emoji: '🥣',
    ingredients: [
      { name: 'Carcasa de pollo o hueso de ternera limpio', grams: 150 },
      { name: 'Zanahoria, puerro y calabacín', grams: 100 },
      { name: 'Agua purificada', grams: 600 }
    ],
    steps: [
      'Cocer a fuego muy lento durante 45 minutos retirando la espuma superior.',
      'Colar dos veces para retirar cualquier impureza y desengrasar en frío.',
      'Ofrecer tibio en vasito con cuchara o sorbos.'
    ],
    nutrition: 'Colágeno, electrolitos naturales, gelatina y aminoácidos que sellan el intestino.',
    storage: 'Dura 3 días en heladera o 3 meses congelado en cubiteras.',
    tips: 'Reconfortante en días de resfriado o cuando el bebé rechaza sólidos por dentición.'
  },
  {
    id: 'bebida-3',
    title: 'Batido Suave de Leche de Avena con Pera Cocida',
    category: 'bebidas',
    prepMin: 4,
    cookMin: 5,
    ageLabel: '+7 meses',
    minAgeMonths: 7,
    emoji: '🥛',
    ingredients: [
      { name: 'Bebida de avena sin azúcares ni aceites añadidos', grams: 120 },
      { name: 'Pera dulce cocida al vapor', grams: 60 }
    ],
    steps: [
      'Triturar la bebida de avena con la pera cocida hasta que quede una bebida homogénea y ligera.',
      'Servir fresco o a temperatura ambiente.'
    ],
    nutrition: 'Fibra soluble y saciedad ligera.',
    storage: 'Consumir en el día.',
    tips: 'Asegúrate de que la bebida vegetal no contenga azúcares añadidos en su etiqueta.'
  },
  {
    id: 'bebida-4',
    title: 'Agua de Ciruela para el Tránsito Lento',
    category: 'bebidas',
    prepMin: 3,
    cookMin: 12,
    ageLabel: '+6 meses',
    minAgeMonths: 6,
    emoji: '🫐',
    ingredients: [
      { name: 'Ciruelas pasas sin hueso bien lavadas', grams: 30 },
      { name: 'Agua purificada', grams: 200 }
    ],
    steps: [
      'Hervir las ciruelas pasas en el agua durante 12 minutos hasta que el agua tome un color ámbar profundo.',
      'Colar con tamiz fino presionando apenas las ciruelas.',
      'Servir a temperatura ambiente en pequeñas tomas de 30-50 ml.'
    ],
    nutrition: 'Sorbitol natural que ablanda las heces de forma fisiológica y segura.',
    storage: 'Refrigerar hasta 48 horas.',
    tips: 'El remedio pediátrico natural por excelencia para el estreñimiento de inicio de AC.'
  },
  {
    id: 'bebida-5',
    title: 'Infusión Suave de Manzanilla con Rodajita de Naranja',
    category: 'bebidas',
    prepMin: 3,
    cookMin: 4,
    ageLabel: '+8 meses',
    minAgeMonths: 8,
    emoji: '🌼',
    ingredients: [
      { name: 'Flores de manzanilla natural ecológica', grams: 2 },
      { name: 'Rodajita de naranja dulce', grams: 10 },
      { name: 'Agua purificada', grams: 150 }
    ],
    steps: [
      'Infusionar la manzanilla en agua caliente durante solo 3 minutos para que no amargue.',
      'Retirar las flores, añadir la rodajita de naranja 2 minutos y colar.',
      'Servir tibia.'
    ],
    nutrition: 'Apigenina de efecto calmante y carminativo.',
    storage: 'Consumir en el día.',
    tips: 'Excelente en la rutina nocturna antes de ir a dormir para inducir calma.'
  },
  {
    id: 'bebida-6',
    title: 'Agua Fresca de Pepino y Melón',
    category: 'bebidas',
    prepMin: 5,
    cookMin: 0,
    ageLabel: '+7 meses',
    minAgeMonths: 7,
    emoji: '🥒',
    ingredients: [
      { name: 'Pepino pelado y sin semillas', grams: 30 },
      { name: 'Melón maduro dulce', grams: 50 },
      { name: 'Agua purificada', grams: 150 }
    ],
    steps: [
      'Licuar el pepino y el melón con el agua.',
      'Pasar por colador de malla muy fina para retirar toda la pulpa fibrosa.',
      'Ofrecer fresca en días calurosos.'
    ],
    nutrition: 'Hidratación con electrolitos y frescura digestiva.',
    storage: 'Consumir en el día.',
    tips: 'Ideal para hidratar a bebés que juegan mucho al aire libre en verano.'
  },
  {
    id: 'bebida-7',
    title: 'Leche Dorada Infantil con Leche Materna / Fórmula',
    category: 'bebidas',
    prepMin: 3,
    cookMin: 3,
    ageLabel: '+7 meses',
    minAgeMonths: 7,
    emoji: '✨',
    ingredients: [
      { name: 'Leche materna o fórmula tibia', grams: 120 },
      { name: 'Cúrcuma pura en polvo', grams: 0.5, notes: 'mínima pizca microscópica' },
      { name: 'Pizca de canela de Ceilán', grams: 0.5 }
    ],
    steps: [
      'Calentar apenas a 37°C la leche y disolver con batidor manual las especias.',
      'Verificar temperatura en la muñeca antes de dar al bebé.'
    ],
    nutrition: 'Inmunoglobulinas maternas potenciadas con antioxidantes suaves.',
    storage: 'Consumir al momento.',
    tips: 'Una bebida reconfortante y calentita para noches frías.'
  },
  {
    id: 'bebida-8',
    title: 'Smoothie Cremoso de Plátano y Aguacate con Agua de Coco',
    category: 'bebidas',
    prepMin: 4,
    cookMin: 0,
    ageLabel: '+8 meses',
    minAgeMonths: 8,
    emoji: '🥥',
    ingredients: [
      { name: 'Plátano maduro', grams: 40 },
      { name: 'Aguacate maduro', grams: 20 },
      { name: 'Agua purificada o de coco natural', grams: 100 }
    ],
    steps: [
      'Triturar todo hasta lograr una textura aterciopelada bebible con pajita o vasito.',
      'Ofrecer a media tarde.'
    ],
    nutrition: 'Potasio, magnesio y grasas monoinsaturadas saludables.',
    storage: 'Consumir en el momento para evitar pardeamiento.',
    tips: 'Nutritivo y denso para bebés con bajo peso o apetito caprichoso.'
  },
  {
    id: 'bebida-9',
    title: 'Agua Aromatizada de Sandía y Albahaca tierna',
    category: 'bebidas',
    prepMin: 4,
    cookMin: 0,
    ageLabel: '+7 meses',
    minAgeMonths: 7,
    emoji: '🍉',
    ingredients: [
      { name: 'Sandía fresca sin semillas', grams: 60 },
      { name: 'Hoja de albahaca fresca machacada', grams: 1 },
      { name: 'Agua purificada', grams: 120 }
    ],
    steps: [
      'Pisar la sandía con tenedor en el agua y añadir la albahaca 10 minutos.',
      'Filtrar completamente para que quede solo agua coloreada con aroma natural.'
    ],
    nutrition: 'Licopeno y agua biológica pura.',
    storage: 'Consumir en 12 horas.',
    tips: 'Despierta el sentido del olfato del bebé con aromáticas frescas.'
  },
  {
    id: 'bebida-10',
    title: 'Horchata Casera de Avena sin Azúcar',
    category: 'bebidas',
    prepMin: 8,
    cookMin: 10,
    ageLabel: '+7 meses',
    minAgeMonths: 7,
    emoji: '🌾',
    ingredients: [
      { name: 'Copos de avena integral', grams: 30 },
      { name: 'Agua purificada', grams: 300 },
      { name: 'Canela de Ceilán', grams: 1 }
    ],
    steps: [
      'Hervir la avena con la canela en el agua durante 8 minutos.',
      'Dejar enfriar y triturar.',
      'Filtrar a través de una gasa o colador de tela para obtener una leche de avena sedosa.'
    ],
    nutrition: 'Betaglucanos calmantes de la mucosa digestiva.',
    storage: 'Dura 48 horas en heladera en botella de vidrio.',
    tips: 'Mucho más sana y nutritiva que las bebidas de avena industriales que llevan aceites y sales.'
  },

  // ================= 6. POSTRES (10) =================
  {
    id: 'postre-1',
    title: 'Crema Brûlée Infantil de Plátano y Yema al Horno',
    category: 'postres',
    prepMin: 6,
    cookMin: 15,
    ageLabel: '+7 meses',
    minAgeMonths: 7,
    emoji: '🍮',
    ingredients: [
      { name: 'Plátano muy maduro bien pisado', grams: 70 },
      { name: 'Yema de huevo pasteurizada', grams: 20 },
      { name: 'Leche materna o fórmula', grams: 40 },
      { name: 'Canela de Ceilán', grams: 1 }
    ],
    steps: [
      'Mezclar el puré de plátano con la yema y la leche hasta formar una cremita.',
      'Verter en moldes pequeños y hornear al baño maría a 160°C durante 15 minutos hasta que cuaje.',
      'Dejar enfriar totalmente en nevera antes de desmoldar.'
    ],
    nutrition: 'Colina para el neurodesarrollo y proteína de fácil digestión sin azúcar añadido.',
    storage: 'Refrigerar hasta 48 horas.',
    tips: 'Textura de flan que fascina a los bebés.'
  },
  {
    id: 'postre-2',
    title: 'Compota de Manzana Asada y Vainilla Natural',
    category: 'postres',
    prepMin: 6,
    cookMin: 20,
    ageLabel: '+6 meses',
    minAgeMonths: 6,
    emoji: '🍎',
    ingredients: [
      { name: 'Manzanas Golden maduras peladas', grams: 150 },
      { name: 'Semillas del interior de una vaina de vainilla', grams: 0.5 },
      { name: 'Agua', grams: 40 }
    ],
    steps: [
      'Cocinar en cazuela a fuego bajo las manzanas con el agua y la vainilla tapado 20 minutos.',
      'Triturar con tenedor o batidora hasta lograr una compota sedosa.'
    ],
    nutrition: 'Pectina intestinal y dulzura natural reconfortante.',
    storage: 'Dura 5 días en la nevera en frasco de cristal hermético.',
    tips: 'La vainilla natural aporta un perfume dulce sin requerir endulzantes.'
  },
  {
    id: 'postre-3',
    title: 'Gelatina Casera de Pera con Agar-Agar',
    category: 'postres',
    prepMin: 5,
    cookMin: 5,
    ageLabel: '+7 meses',
    minAgeMonths: 7,
    emoji: '🍮',
    ingredients: [
      { name: 'Puré de pera cocida colado', grams: 120 },
      { name: 'Agua purificada', grams: 60 },
      { name: 'Agar-agar en polvo ecológico', grams: 1.5 }
    ],
    steps: [
      'Disolver el agar-agar en el agua y hervir a borbotones durante 2 minutos exactos.',
      'Mezclar vigorosamente con el puré de pera tibio.',
      'Verter en moldes de silicona con formas divertidas y refrigerar 30 minutos hasta que gelifique.'
    ],
    nutrition: 'Minerales marinos procedentes del alga y textura estimulante para la exploración sensorial.',
    storage: 'Refrigerar hasta 3 días.',
    tips: 'El agar-agar gelifica a temperatura ambiente y se deshace con el calor de la boca del bebé.'
  },
  {
    id: 'postre-4',
    title: 'Mousse Ligera de Mango y Yogur Natural',
    category: 'postres',
    prepMin: 5,
    cookMin: 0,
    ageLabel: '+9 meses',
    minAgeMonths: 9,
    emoji: '🥭',
    ingredients: [
      { name: 'Mango maduro muy dulce', grams: 60 },
      { name: 'Yogur natural sin azúcar pasteurizado', grams: 60 }
    ],
    steps: [
      'Triturar el mango hasta que no queden hilachas.',
      'Batir el yogur con movimientos envolventes junto con el mango para incorporar aire.',
      'Servir en vasitos de postre.'
    ],
    nutrition: 'Probióticos vivos benéficos para la flora intestinal y vitamina C.',
    storage: 'Consumir en 24 horas.',
    tips: 'Introduce el yogur siempre natural, entero y sin edulcorantes.'
  },
  {
    id: 'postre-5',
    title: 'Piruletas Blanditas de Plátano y Frambuesa',
    category: 'postres',
    prepMin: 6,
    cookMin: 0,
    ageLabel: '+8 meses',
    minAgeMonths: 8,
    emoji: '🍭',
    ingredients: [
      { name: 'Plátano cortado en rodajas gruesas', grams: 60 },
      { name: 'Puré de frambuesas tamizadas sin semillas', grams: 30 }
    ],
    steps: [
      'Cocinar las frambuesas 2 minutos y pasar por colador de tela para retirar 100% de las pepitas.',
      'Bañar las rodajas de plátano con el coulis rojo.',
      'Servir fresquitas.'
    ],
    nutrition: 'Antocianinas protectoras y potasio en divertida presentación bicolor.',
    storage: 'Consumir en el momento.',
    tips: 'Colar las pepitas de las frambuesas evita irritación en la garganta del bebé.'
  },
  {
    id: 'postre-6',
    title: 'Arroz con Leche Infantil Cremoso',
    category: 'postres',
    prepMin: 5,
    cookMin: 25,
    ageLabel: '+8 meses',
    minAgeMonths: 8,
    emoji: '🍚',
    ingredients: [
      { name: 'Arroz redondo', grams: 25 },
      { name: 'Bebida de avena o leche materna/fórmula', grams: 180 },
      { name: 'Corteza de limón limpia (sin parte blanca)', grams: 3 },
      { name: 'Canela de Ceilán en rama', grams: 2 }
    ],
    steps: [
      'Cocer el arroz con la canela y corteza de limón en la leche a fuego muy suave durante 25 minutos.',
      'Retirar obligatoriamente la canela y el limón.',
      'Triturar parcialmente o pisar hasta textura cremosa.'
    ],
    nutrition: 'Calcio y almidones reconfortantes.',
    storage: 'Dura 2 días refrigerado.',
    tips: 'El clásico postre familiar adaptado sin un solo gramo de azúcar.'
  },
  {
    id: 'postre-7',
    title: 'Mini Soufflé de Calabaza dulce y Ricotta',
    category: 'postres',
    prepMin: 8,
    cookMin: 18,
    ageLabel: '+8 meses',
    minAgeMonths: 8,
    emoji: '🧁',
    ingredients: [
      { name: 'Puré de calabaza asada dulce', grams: 60 },
      { name: 'Ricotta fresca pasteurizada', grams: 30 },
      { name: 'Clara de huevo montada a punto de nieve', grams: 25 }
    ],
    steps: [
      'Integrar la calabaza con la ricotta.',
      'Incorporar la clara montada con suavidad para mantener el aire.',
      'Hornear en molde pequeño a 170°C durante 18 minutos hasta que se infle y dore sutilmente.'
    ],
    nutrition: 'Textura nube ultrasuave ideal para masticación temprana.',
    storage: 'Consumir recién templado.',
    tips: 'Se derrite literalmente en la boca del bebé.'
  },
  {
    id: 'postre-8',
    title: 'Paletas Heladas de Melocotón y Leche Materna (Alivio Dentición)',
    category: 'postres',
    prepMin: 5,
    cookMin: 0,
    ageLabel: '+6 meses',
    minAgeMonths: 6,
    emoji: '🍦',
    ingredients: [
      { name: 'Puré de melocotón maduro al vapor', grams: 50 },
      { name: 'Leche materna o fórmula', grams: 50 }
    ],
    steps: [
      'Mezclar ambos ingredientes y verter en moldes de silicona para mordedor helado.',
      'Congelar al menos 3 horas.',
      'Ofrecer bajo supervisión para calmar las encías inflamadas.'
    ],
    nutrition: 'Efecto antiinflamatorio térmico local con alimento completo.',
    storage: 'Congelado hasta por 1 mes.',
    tips: 'El frío actúa como anestésico natural inigualable cuando rompen los primeros dientes.'
  },
  {
    id: 'postre-9',
    title: 'Pudín Suave de Caqui Persimon y Cacao puro',
    category: 'postres',
    prepMin: 4,
    cookMin: 0,
    ageLabel: '+10 meses',
    minAgeMonths: 10,
    emoji: '🍫',
    ingredients: [
      { name: 'Caqui persimon muy maduro pelado', grams: 100 },
      { name: 'Cacao puro 100% desgrasado sin azúcar', grams: 2, notes: 'media cucharadita' }
    ],
    steps: [
      'Triturar el caqui con el cacao puro durante 2 minutos.',
      'Refrigerar 2 horas: el caqui cuaja por sí solo como si fuera una natilla de chocolate.',
      'Servir frío.'
    ],
    nutrition: 'Magnesio, polifenoles y textura chocolatosa 100% frutal.',
    storage: 'Dura 24 horas en frío.',
    tips: 'La magia de la pectina del caqui crea un postre de chocolate saludable sin cocción ni gelatinas.'
  },
  {
    id: 'postre-10',
    title: 'Yogur con Puré de Arándanos y Semillas de Cáñamo',
    category: 'postres',
    prepMin: 3,
    cookMin: 3,
    ageLabel: '+9 meses',
    minAgeMonths: 9,
    emoji: '🫐',
    ingredients: [
      { name: 'Yogur griego natural sin azúcar', grams: 70 },
      { name: 'Arándanos cocidos y triturados', grams: 30 },
      { name: 'Semillas de cáñamo peladas molidas', grams: 3 }
    ],
    steps: [
      'Hervir los arándanos 3 minutos y triturar.',
      'Colocar el yogur en la base, verter el coulis morado y espolvorear el cáñamo molido.'
    ],
    nutrition: 'Grasas de alta densidad, proteínas vegetales y antioxidantes.',
    storage: 'Consumir en el día.',
    tips: 'Las semillas de cáñamo son ricas en omega 3 y 6 en perfecta proporción biológica.'
  },

  // ================= 7. ÚNICOS (Platos Completos en 1 Tazón) (10) =================
  {
    id: 'unico-1',
    title: 'Tazón Único de Salmón, Batata y Brócoli Cremoso',
    category: 'unicos',
    prepMin: 8,
    cookMin: 18,
    ageLabel: '+7 meses',
    minAgeMonths: 7,
    emoji: '🥗',
    ingredients: [
      { name: 'Lomo de salmón fresco sin espinas', grams: 30 },
      { name: 'Boniato / batata dulce', grams: 50 },
      { name: 'Floretes de brócoli al vapor', grams: 30 },
      { name: 'Aceite de oliva virgen extra', grams: 3 }
    ],
    steps: [
      'Cocer al vapor el salmón, boniato y brócoli juntos durante 16 minutos.',
      'Pisar el boniato como base cremosa, desmenuzar el salmón revisando espinas y picar fino el brócoli.',
      'Unificar todo con un hilo de aceite de oliva en un plato único equilibrado.'
    ],
    nutrition: 'Plato completo que aporta proteína animal de calidad, carbohidrato complejo, verdura verde y lípido sano.',
    storage: 'Consumir recién hecho.',
    tips: 'El concepto de plato único asegura que el bebé no se llene solo con un grupo de alimentos.'
  },
  {
    id: 'unico-2',
    title: 'Bowl Completo de Ternera, Polenta y Calabacín',
    category: 'unicos',
    prepMin: 6,
    cookMin: 15,
    ageLabel: '+7 meses',
    minAgeMonths: 7,
    emoji: '🍲',
    ingredients: [
      { name: 'Carne magra picada de ternera', grams: 35 },
      { name: 'Polenta tierna cocida', grams: 50 },
      { name: 'Calabacín tierno salteado en agua', grams: 40 },
      { name: 'Aceite de oliva', grams: 3 }
    ],
    steps: [
      'Cocinar la ternera a la plancha suave con el calabacín picadito.',
      'Preparar la polenta cremosa.',
      'Mezclar en el tazón para ofrecer textura combinada fácil de engullir.'
    ],
    nutrition: 'Hierro de alta asimilación con carbohidratos energéticos para bebés activos.',
    storage: 'Refrigerar 24 horas.',
    tips: 'Ideal para bebés que se distraen si ven muchos platitos separados.'
  },
  {
    id: 'unico-3',
    title: 'Cazuelita de Lentejas Rojas con Arroz y Calabaza',
    category: 'unicos',
    prepMin: 8,
    cookMin: 22,
    ageLabel: '+7 meses',
    minAgeMonths: 7,
    emoji: '🥣',
    ingredients: [
      { name: 'Lentejas rojas peladas', grams: 25 },
      { name: 'Arroz blanco de grano redondo', grams: 15 },
      { name: 'Calabaza dulce en cubos', grams: 50 },
      { name: 'Caldo de verduras sin sal', grams: 200 }
    ],
    steps: [
      'Hervir las lentejas con el arroz y la calabaza en el caldo durante 22 minutos hasta consistencia pastosa.',
      'Pisar con prensapuré.'
    ],
    nutrition: 'Proteína vegetal completa gracias a la combinación canónica legumbre + cereal.',
    storage: 'Dura 2 días en refrigerador.',
    tips: 'La mezcla de legumbre y cereal proporciona un aminograma tan completo como el de la carne.'
  },
  {
    id: 'unico-4',
    title: 'Plato Completo de Pavo con Aguacate y Quinoa Real',
    category: 'unicos',
    prepMin: 8,
    cookMin: 15,
    ageLabel: '+7 meses',
    minAgeMonths: 7,
    emoji: '🥑',
    ingredients: [
      { name: 'Pechuga de pavo picada muy fina', grams: 35 },
      { name: 'Quinoa real hervida suave', grams: 40 },
      { name: 'Aguacate maduro en dados blandos', grams: 30 }
    ],
    steps: [
      'Cocinar el pavo al vapor con la quinoa.',
      'Añadir el aguacate fresco al servir para que conserve todas sus propiedades intactas.'
    ],
    nutrition: 'Grasas monoinsaturadas y aminoácidos esenciales.',
    storage: 'Consumir en el día.',
    tips: 'Digestión muy liviana apta para cenas de bebés inquietos.'
  },
  {
    id: 'unico-5',
    title: 'Tazón Tricolor de Bacalao Fresco, Patata y Judías Verdes',
    category: 'unicos',
    prepMin: 7,
    cookMin: 14,
    ageLabel: '+8 meses',
    minAgeMonths: 8,
    emoji: '🐟',
    ingredients: [
      { name: 'Lomo de bacalao fresco desalado sin espinas', grams: 35 },
      { name: 'Patata nueva al vapor', grams: 50 },
      { name: 'Judías verdes redondas tiernas', grams: 30 },
      { name: 'Aceite de oliva virgen extra', grams: 4 }
    ],
    steps: [
      'Cocer las judías y la patata al vapor 14 minutos.',
      'Añadir el bacalao los últimos 6 minutos de vapor.',
      'Desmigar el pescado con tenedor y aplastar las verduras.'
    ],
    nutrition: 'Yodo esencial para el tiroides y fósforo celular.',
    storage: 'Consumir en el día.',
    tips: 'El pescado blanco cocinado con patata tiene una textura mantecosa natural.'
  },
  {
    id: 'unico-6',
    title: 'Guiso Completo de Conejo, Zanahoria y Cuscús',
    category: 'unicos',
    prepMin: 8,
    cookMin: 20,
    ageLabel: '+8 meses',
    minAgeMonths: 8,
    emoji: '🥕',
    ingredients: [
      { name: 'Carne magra de conejo sin huesos', grams: 35 },
      { name: 'Zanahoria en rodajas finas', grams: 40 },
      { name: 'Cuscús hidratado', grams: 30 },
      { name: 'Aceite de oliva', grams: 3 }
    ],
    steps: [
      'Cocinar la carne de conejo y zanahorias en agua hirviendo hasta que la carne se deshebre sola.',
      'Deshebrar la carne muy finamente y mezclar con el cuscús inflado.'
    ],
    nutrition: 'Proteína hipoalergénica de altísima digestibilidad.',
    storage: 'Refrigerar 24 horas.',
    tips: 'Tradicionalmente recomendada por pediatras en bebés con intolerancias.'
  },
  {
    id: 'unico-7',
    title: 'Bowl de Pollo, Remolacha y Arroz con Aceite de Oliva',
    category: 'unicos',
    prepMin: 8,
    cookMin: 18,
    ageLabel: '+7 meses',
    minAgeMonths: 7,
    emoji: '🍗',
    ingredients: [
      { name: 'Muslo de pollo deshuesado y sin piel', grams: 35 },
      { name: 'Remolacha cocida', grams: 30 },
      { name: 'Arroz blanco cocido', grams: 40 },
      { name: 'Aceite de oliva', grams: 3 }
    ],
    steps: [
      'Cocer el pollo hasta que esté bien tierno.',
      'Triturar junto con la remolacha y el arroz hasta unificar en un arroz rosado llamativo.'
    ],
    nutrition: 'Hierro, folatos y energía sostenida.',
    storage: 'Dura 48 horas en la nevera.',
    tips: 'El color rosa intenso despierta el interés visual de bebés inapetentes.'
  },
  {
    id: 'unico-8',
    title: 'Estofadito Ligero de Pescado Blanco, Guisantes y Pasta Letras',
    category: 'unicos',
    prepMin: 6,
    cookMin: 12,
    ageLabel: '+8 meses',
    minAgeMonths: 8,
    emoji: '🐠',
    ingredients: [
      { name: 'Pescado blanco (lenguado o merluza)', grams: 35 },
      { name: 'Guisantes cocidos y aplastados', grams: 30 },
      { name: 'Pasta de letras tierna', grams: 25 },
      { name: 'Caldo de pescado casero suave', grams: 150 }
    ],
    steps: [
      'Cocer la pasta de letras en el caldo casero.',
      'Agregar el pescado desmenuzado en los últimos 4 minutos.',
      'Integrar los guisantes aplastados y un hilo de aceite de oliva.'
    ],
    nutrition: 'Proteína de fácil masticación y deglución con vitaminas del grupo B.',
    storage: 'Consumir en el día.',
    tips: 'La pasta de letras anima la curiosidad del bebé durante la comida.'
  },
  {
    id: 'unico-9',
    title: 'Cazuela de Huevo Poché, Espinacas y Puré de Patata',
    category: 'unicos',
    prepMin: 8,
    cookMin: 10,
    ageLabel: '+7 meses',
    minAgeMonths: 7,
    emoji: '🥚',
    ingredients: [
      { name: 'Huevo campero entero bien cocido', grams: 50 },
      { name: 'Espinacas tiernas cocidas y picadas', grams: 30 },
      { name: 'Puré casero de patata', grams: 50 },
      { name: 'Aceite de oliva virgen extra', grams: 3 }
    ],
    steps: [
      'Cocer el huevo duro (10 minutos para asegurar yema y clara totalmente firmes).',
      'Picar el huevo muy finito y mezclar con el puré caliente de patatas y espinacas.'
    ],
    nutrition: 'Todos los aminoácidos indispensables, luteína para la retina y colina cerebral.',
    storage: 'Consumir en el momento.',
    tips: 'Asegurarse de que el huevo esté 100% cuajado en menores de 1 año.'
  },
  {
    id: 'unico-10',
    title: 'Bowl de Tofu Sedoso, Calabaza y Fideos de Arroz',
    category: 'unicos',
    prepMin: 6,
    cookMin: 10,
    ageLabel: '+8 meses',
    minAgeMonths: 8,
    emoji: '🥣',
    ingredients: [
      { name: 'Tofu sedoso pasteurizado', grams: 40 },
      { name: 'Puré de calabaza caliente', grams: 50 },
      { name: 'Fideos finos de arroz cocidos y cortados cortos', grams: 30 },
      { name: 'Aceite de sésamo suave', grams: 2 }
    ],
    steps: [
      'Hervir los fideos de arroz 4 minutos y cortar con tijera para que no queden largos.',
      'Desmenuzar el tofu sedoso en la calabaza caliente e incorporar los fideos.',
      'Añadir unas gotas de aceite de sésamo para perfumar.'
    ],
    nutrition: 'Calcio vegetal de alta disponibilidad e isoflavonas suaves.',
    storage: 'Refrigerar hasta 2 días.',
    tips: 'Excelente opción vegetariana completa y suave para la digestión infantil.'
  },

  // ================= 8. FRÍOS (10) =================
  {
    id: 'frio-1',
    title: 'Gazpachito Suave de Tomate Maduro y Melón Dulce',
    category: 'frios',
    prepMin: 8,
    cookMin: 0,
    ageLabel: '+8 meses',
    minAgeMonths: 8,
    emoji: '🍅',
    ingredients: [
      { name: 'Tomate pera muy maduro pelado y sin pepitas', grams: 80 },
      { name: 'Melón dulce maduro', grams: 60 },
      { name: 'Aceite de oliva virgen extra', grams: 6 },
      { name: 'Agua fría purificada', grams: 30 }
    ],
    steps: [
      'Pelar el tomate escaldándolo 30 segundos en agua hirviendo y retirar todas las semillas con una cuchara.',
      'Triturar el tomate con el melón, el aceite y el agua hasta que quede una sopa fría extrafina.',
      'Servir fresco pero no helado.'
    ],
    nutrition: 'Licopeno, vitaminas A y C y rehidratación inmediata en épocas de calor.',
    storage: 'Dura 24 horas en frío.',
    tips: 'El melón neutraliza completamente la acidez natural del tomate sin necesidad de sal ni azúcar.'
  },
  {
    id: 'frio-2',
    title: 'Tartar Suave de Aguacate y Mango en Daditos BLW',
    category: 'frios',
    prepMin: 6,
    cookMin: 0,
    ageLabel: '+8 meses',
    minAgeMonths: 8,
    emoji: '🥑',
    ingredients: [
      { name: 'Aguacate maduro en daditos de 1 cm', grams: 40 },
      { name: 'Mango dulce maduro en daditos de 1 cm', grams: 40 },
      { name: 'Gotitas de zumo de naranja dulce', grams: 3 }
    ],
    steps: [
      'Cortar ambas frutas en cubitos tiernos que el bebé pueda coger con sus deditos haciendo pinza.',
      'Aliñar suavemente con las gotitas de naranja para aportar brillo y evitar que el aguacate se oscurezca.'
    ],
    nutrition: 'Grasas esenciales y provitamina A para la piel y mucosas.',
    storage: 'Consumir al momento.',
    tips: 'Fantástico para practicar la pinza digital alrededor de los 8-9 meses.'
  },
  {
    id: 'frio-3',
    title: 'Sopa Fría de Pepino Pelado y Yogur Griego',
    category: 'frios',
    prepMin: 5,
    cookMin: 0,
    ageLabel: '+9 meses',
    minAgeMonths: 9,
    emoji: '🥒',
    ingredients: [
      { name: 'Pepino pelado y sin semillas', grams: 60 },
      { name: 'Yogur griego natural entero', grams: 60 },
      { name: 'Aceite de oliva virgen extra', grams: 4 },
      { name: 'Hoja de hierbabuena fresca', grams: 1 }
    ],
    steps: [
      'Triturar el pepino con el yogur, el aceite de oliva y la hierbabuena.',
      'Colar si se desea textura completamente lisa.',
      'Servir a temperatura fresca de nevera.'
    ],
    nutrition: 'Calcio lácteo, proteínas de alto valor biológico y probióticos.',
    storage: 'Consumir en el día.',
    tips: 'Sensación refrescante que calma el dolor de las encías por molares en erupción.'
  },
  {
    id: 'frio-4',
    title: 'Ensalada Rallada de Manzana y Zanahoria Tierna',
    category: 'frios',
    prepMin: 5,
    cookMin: 0,
    ageLabel: '+9 meses',
    minAgeMonths: 9,
    emoji: '🥕',
    ingredients: [
      { name: 'Zanahoria pelada y rallada extra fina con microplane', grams: 30 },
      { name: 'Manzana pelada y rallada fina', grams: 40 },
      { name: 'Aceite de oliva virgen extra', grams: 3 }
    ],
    steps: [
      'Rallar con la cara más fina del rallador para que queden hilachas completamente blandas y acuosas.',
      'Mezclar con aceite de oliva.',
      'Servir con cuchara o para exploración con los dedos.'
    ],
    nutrition: 'Fibra vegetal fresca que estimula la masticación sin riesgo de trozo duro.',
    storage: 'Consumir de inmediato.',
    tips: 'Rallar ultrafino (casi puré filamentoso) es seguro y familiariza con texturas no trituradas.'
  },
  {
    id: 'frio-5',
    title: 'Salmorejo Infantil de Manzana y Pimiento Asado',
    category: 'frios',
    prepMin: 7,
    cookMin: 0,
    ageLabel: '+8 meses',
    minAgeMonths: 8,
    emoji: '🫑',
    ingredients: [
      { name: 'Tomate pelado y sin pepitas', grams: 50 },
      { name: 'Pimiento rojo asado en frío sin piel', grams: 30 },
      { name: 'Miga de pan de barra tierno', grams: 15 },
      { name: 'Aceite de oliva virgen extra', grams: 8 }
    ],
    steps: [
      'Remojar la miga de pan en agua y escurrir.',
      'Triturar con el tomate, pimiento asado y el aceite hasta lograr una crema espesa y sedosa.',
      'Decorar con yema de huevo cocido rallada.'
    ],
    nutrition: 'Grasas monoinsaturadas cardiosaludables y licopeno.',
    storage: 'Dura 24 horas refrigerado.',
    tips: 'Una adaptación respetuosa del clásico andaluz sin ajo ni vinagre.'
  },
  {
    id: 'frio-6',
    title: 'Vasito Frío de Chía con Puré de Fresas Cocidas',
    category: 'frios',
    prepMin: 5,
    cookMin: 4,
    ageLabel: '+8 meses',
    minAgeMonths: 8,
    emoji: '🍓',
    ingredients: [
      { name: 'Semillas de chía hidratadas en agua o leche', grams: 10 },
      { name: 'Fresas cocidas 4 minutos y tamizadas', grams: 50 }
    ],
    steps: [
      'Cocer las fresas 4 minutos para ablandar y destruir posibles enzimas alergénicas.',
      'Triturar y verter sobre el gel de chía frío.',
      'Servir con cuchara.'
    ],
    nutrition: 'Omega-3 de origen vegetal y vitamina C antioxidante.',
    storage: 'Refrigerar 24 horas.',
    tips: 'Cocer las fresas ligeramente en las primeras exposiciones disminuye reactividad alérgica.'
  },
  {
    id: 'frio-7',
    title: 'Crema Fría de Calabacín y Queso Fresco sin Sal',
    category: 'frios',
    prepMin: 6,
    cookMin: 10,
    ageLabel: '+7 meses',
    minAgeMonths: 7,
    emoji: '🥣',
    ingredients: [
      { name: 'Calabacín cocido al vapor y enfriado', grams: 80 },
      { name: 'Queso fresco tipo burgos sin sal pasteurizado', grams: 30 },
      { name: 'Aceite de oliva virgen extra', grams: 3 }
    ],
    steps: [
      'Cocer el calabacín al vapor, escurrir bien y dejar enfriar en la nevera.',
      'Triturar con el queso fresco y aceite hasta consistencia aterciopelada.',
      'Servir fresquito en plato hondo.'
    ],
    nutrition: 'Calcio, potasio y digestión liviana.',
    storage: 'Dura 48 horas refrigerado.',
    tips: 'Plato estrella para cenas de verano.'
  },
  {
    id: 'frio-8',
    title: 'Barquitos Fríos de Endivia con Puré de Aguacate y Pollo',
    category: 'frios',
    prepMin: 6,
    cookMin: 0,
    ageLabel: '+9 meses',
    minAgeMonths: 9,
    emoji: '🥗',
    ingredients: [
      { name: 'Pollo cocido desmigado frío', grams: 30 },
      { name: 'Aguacate machacado con tenedor', grams: 30 },
      { name: 'Hojitas tiernas de endivia baby lavadas', grams: 15 }
    ],
    steps: [
      'Mezclar el pollo con el aguacate como un paté fresco.',
      'Rellenar las hojitas de endivia para que el bebé las agarre como una cuchara natural comestible.'
    ],
    nutrition: 'Proteínas y grasas insaturadas.',
    storage: 'Consumir en el día.',
    tips: 'La forma de barquito incentiva la autonomía para comer con las manos.'
  },
  {
    id: 'frio-9',
    title: 'Crema Helada Express de Plátano y Arándanos (Nice Cream)',
    category: 'frios',
    prepMin: 4,
    cookMin: 0,
    ageLabel: '+8 meses',
    minAgeMonths: 8,
    emoji: '🍨',
    ingredients: [
      { name: 'Plátano congelado en rodajitas', grams: 70 },
      { name: 'Arándanos cocidos congelados', grams: 30 },
      { name: 'Cucharada de leche materna o fórmula', grams: 15 }
    ],
    steps: [
      'Triturar en procesador potente el plátano congelado con los arándanos y la leche hasta lograr textura cremosa de helado.',
      'Ofrecer de inmediato antes de que se derrita.'
    ],
    nutrition: 'Helado 100% frutal sin azúcares ni grasas saturadas.',
    storage: 'Consumir recién hecho.',
    tips: 'Sensación helada que entusiasma a los bebés en días de calor.'
  },
  {
    id: 'frio-10',
    title: 'Rollitos Fríos de Pepino con Requesón y Pera',
    category: 'frios',
    prepMin: 6,
    cookMin: 0,
    ageLabel: '+9 meses',
    minAgeMonths: 9,
    emoji: '🥒',
    ingredients: [
      { name: 'Láminas de pepino hechas con pelador de patatas', grams: 30 },
      { name: 'Requesón o ricotta fresca sin sal', grams: 30 },
      { name: 'Pera rallada', grams: 20 }
    ],
    steps: [
      'Mezclar el requesón con la pera.',
      'Untar en las tiras ultrafinas de pepino y enrollar formando cilindros pequeños fáciles de agarrar.'
    ],
    nutrition: 'Texturas crujientes-suaves combinadas que estimulan la sensorialidad bucal.',
    storage: 'Consumir en el momento.',
    tips: 'Presentación gourmet divertida para el bebé.'
  },

  // ================= 9. SOPAS (10) =================
  {
    id: 'sopa-1',
    title: 'Sopita de Pollo y Estrellitas con Caldo Casero',
    category: 'sopas',
    prepMin: 6,
    cookMin: 14,
    ageLabel: '+7 meses',
    minAgeMonths: 7,
    emoji: '🍲',
    ingredients: [
      { name: 'Caldo casero de pollo y verduras sin sal', grams: 180 },
      { name: 'Pasta de estrellitas', grams: 20 },
      { name: 'Pechuga de pollo hervida y deshilachada muy fina', grams: 25 },
      { name: 'Zanahoria del caldo machacada', grams: 20 }
    ],
    steps: [
      'Hervir el caldo casero y cocinar las estrellitas durante 8-10 minutos hasta que estén sumamente blandas.',
      'Incorporar el pollo deshilachado en hebras minúsculas y la zanahoria machacada.',
      'Servir tibia en tazón con cuchara ergonómica.'
    ],
    nutrition: 'Hidratación nutritiva, minerales biodisponibles y proteínas suaves.',
    storage: 'Refrigerar hasta 48 horas.',
    tips: 'El confort clásico por excelencia para días de destemplanza o gripe.'
  },
  {
    id: 'sopa-2',
    title: 'Crema de Calabaza Asada y Puerro Aterciopelada',
    category: 'sopas',
    prepMin: 8,
    cookMin: 20,
    ageLabel: '+6 meses',
    minAgeMonths: 6,
    emoji: '🎃',
    ingredients: [
      { name: 'Calabaza dulce en trozos', grams: 100 },
      { name: 'Puerro (parte blanca bien lavada)', grams: 20 },
      { name: 'Patata pequeña', grams: 30 },
      { name: 'Aceite de oliva virgen extra', grams: 5 }
    ],
    steps: [
      'Rehogar el puerro con dos cucharadas de agua en una cazuela.',
      'Añadir la calabaza, la patata y cubrir con agua caliente.',
      'Cocer 18 minutos y triturar con batidora potente añadiendo el aceite en crudo al final hasta que emulsione.'
    ],
    nutrition: 'Betacarotenos antioxidantes y fibra soluble reconfortante.',
    storage: 'Apta para congelar en tarros de vidrio hasta 2 meses.',
    tips: 'La calabaza dulce es casi unánimemente adorada por los paladares de los bebés.'
  },
  {
    id: 'sopa-3',
    title: 'Sopita de Avena Caldosa con Ternera y Verduras',
    category: 'sopas',
    prepMin: 6,
    cookMin: 15,
    ageLabel: '+7 meses',
    minAgeMonths: 7,
    emoji: '🥣',
    ingredients: [
      { name: 'Caldo de carne y verduras casero', grams: 180 },
      { name: 'Copos suaves de avena integral fina', grams: 25 },
      { name: 'Carne picada magra de ternera', grams: 30 }
    ],
    steps: [
      'Llevar el caldo a ebullición y verter la avena removiendo con varilla.',
      'Añadir la carne picada y cocinar 10 minutos a fuego suave para que la avena espese el caldo formando una sopa sedosa.',
      'Dejar entibiar.'
    ],
    nutrition: 'Hierro de alta asimilación combinado con fibra soluble prebiótica.',
    storage: 'Refrigerar 24 horas.',
    tips: 'La avena caldosa es más fácil de tomar con cuchara que las pastas sueltas.'
  },
  {
    id: 'sopa-4',
    title: 'Sopa Minestrone Infantil de Verduras y Fideos',
    category: 'sopas',
    prepMin: 10,
    cookMin: 18,
    ageLabel: '+8 meses',
    minAgeMonths: 8,
    emoji: '🥬',
    ingredients: [
      { name: 'Calabacín, zanahoria y judías verdes picados diminutos', grams: 70 },
      { name: 'Fideos finos cabello de ángel cortados', grams: 20 },
      { name: 'Caldo de verduras sin sal', grams: 200 },
      { name: 'Aceite de oliva virgen extra', grams: 4 }
    ],
    steps: [
      'Cocer todas las verduras picaditas en dados diminutos (mirepoix infantil) durante 12 minutos.',
      'Añadir los fideos finos 4 minutos más.',
      'Comprobar que todas las verduritas se deshagan al presionarlas.'
    ],
    nutrition: 'Abanico multicolor de vitaminas, minerales y flavonoides vegetales.',
    storage: 'Dura 48 horas en heladera.',
    tips: 'Enseña al bebé a gestionar pedacitos pequeños en medio de un medio líquido.'
  },
  {
    id: 'sopa-5',
    title: 'Crema Suave de Calabacín y Manzana Dulce',
    category: 'sopas',
    prepMin: 6,
    cookMin: 14,
    ageLabel: '+6 meses',
    minAgeMonths: 6,
    emoji: '🍏',
    ingredients: [
      { name: 'Calabacín pelado', grams: 100 },
      { name: 'Manzana dulce pelada', grams: 50 },
      { name: 'Aceite de oliva virgen extra', grams: 4 }
    ],
    steps: [
      'Cocinar el calabacín y la manzana en agua hirviendo durante 14 minutos.',
      'Escurrir reservando el caldo y triturar añadiendo el aceite de oliva hasta lograr consistencia de terciopelo.',
      'Servir tibia.'
    ],
    nutrition: 'Fácilmente digerible, previene la acidez y aporta agua y pectina.',
    storage: 'Dura 3 días en refrigeración.',
    tips: 'La manzana disimula el sabor vegetal que algunos bebés rechazan al inicio.'
  },
  {
    id: 'sopa-6',
    title: 'Caldo de Pescado Blanco con Sémola de Trigo',
    category: 'sopas',
    prepMin: 6,
    cookMin: 10,
    ageLabel: '+8 meses',
    minAgeMonths: 8,
    emoji: '🐟',
    ingredients: [
      { name: 'Caldo suave de merluza casero', grams: 180 },
      { name: 'Sémola de trigo suave', grams: 25 },
      { name: 'Pescado blanco cocido desmigado', grams: 30 }
    ],
    steps: [
      'Llevar el caldo a ebullición y espolvorear la sémola en forma de lluvia batiendo enérgicamente 4 minutos.',
      'Incorporar el pescado desmigado con minuciosidad.',
      'Servir a temperatura tibia.'
    ],
    nutrition: 'Yodo, fósforo y carbohidratos de absorción gradual.',
    storage: 'Consumir en el día.',
    tips: 'La sémola de trigo no genera grumos y tiene una textura aterciopelada adorada por los lactantes.'
  },
  {
    id: 'sopa-7',
    title: 'Crema Tibia de Guisantes Tiernos y Patata',
    category: 'sopas',
    prepMin: 6,
    cookMin: 15,
    ageLabel: '+7 meses',
    minAgeMonths: 7,
    emoji: '🫛',
    ingredients: [
      { name: 'Guisantes verdes tiernos', grams: 70 },
      { name: 'Patata pelada troceada', grams: 50 },
      { name: 'Aceite de oliva virgen extra', grams: 4 },
      { name: 'Agua de cocción', grams: 100 }
    ],
    steps: [
      'Hervir la patata y los guisantes hasta que estén completamente blandos.',
      'Triturar con batidora y pasar obligatoriamente por un colador chino para retirar todas las pieles duras.',
      'Aliñar con el aceite de oliva.'
    ],
    nutrition: 'Proteína vegetal de calidad y potasio.',
    storage: 'Refrigerar 48 horas.',
    tips: 'Pasar por el chino es el secreto para que los guisantes no causen rechazo textural en bebés.'
  },
  {
    id: 'sopa-8',
    title: 'Sopa de Lentejas Rojas con Fideos Cabello de Ángel',
    category: 'sopas',
    prepMin: 8,
    cookMin: 16,
    ageLabel: '+7 meses',
    minAgeMonths: 7,
    emoji: '🍲',
    ingredients: [
      { name: 'Lentejas rojas peladas lavadas', grams: 25 },
      { name: 'Fideos cabello de ángel cortados cortitos', grams: 15 },
      { name: 'Caldo de verduras sin sal', grams: 200 },
      { name: 'Zanahoria rallada fina', grams: 20 }
    ],
    steps: [
      'Cocinar las lentejas rojas y la zanahoria en el caldo durante 12 minutos hasta que empiecen a deshacerse.',
      'Añadir los fideos 4 minutos más.',
      'Servir tibia.'
    ],
    nutrition: 'Hierro vegetal de gran absorción y proteínas.',
    storage: 'Dura 2 días en refrigeración.',
    tips: 'Las lentejas rojas se integran en el caldo aportándole cuerpo natural sin necesidad de harinas.'
  },
  {
    id: 'sopa-9',
    title: 'Crema de Zanahoria con Naranja y Toque de Jengibre',
    category: 'sopas',
    prepMin: 6,
    cookMin: 18,
    ageLabel: '+8 meses',
    minAgeMonths: 8,
    emoji: '🥕',
    ingredients: [
      { name: 'Zanahorias peladas en dados', grams: 120 },
      { name: 'Zumo fresco de media naranja dulce', grams: 25 },
      { name: 'Trozo diminuto de jengibre fresco cocido y retirado', grams: 2 },
      { name: 'Aceite de oliva virgen extra', grams: 4 }
    ],
    steps: [
      'Cocer las zanahorias con el agua y la rodajita de jengibre.',
      'Retirar el jengibre antes de batir.',
      'Triturar las zanahorias con el zumo de naranja y el aceite hasta emulsionar.'
    ],
    nutrition: 'Provitamina A potenciada por vitamina C cítrica.',
    storage: 'Refrigerar hasta 3 días.',
    tips: 'Aroma fresco y vibrante que estimula los receptores gustativos del bebé.'
  },
  {
    id: 'sopa-10',
    title: 'Sopita Reparadora de Arroz y Zanahoria (Efecto Astringente)',
    category: 'sopas',
    prepMin: 5,
    cookMin: 25,
    ageLabel: '+6 meses',
    minAgeMonths: 6,
    emoji: '🥣',
    ingredients: [
      { name: 'Arroz blanco de grano redondo', grams: 25 },
      { name: 'Zanahoria pelada rallada fina', grams: 50 },
      { name: 'Agua purificada abundante', grams: 350 },
      { name: 'Aceite de oliva virgen extra', grams: 3 }
    ],
    steps: [
      'Hervir el arroz con la zanahoria a fuego lento durante 25 minutos para que el agua se cargue de almidón y caroteno.',
      'Pisar con tenedor hasta obtener una sopa densa pero fluida.',
      'Añadir el aceite de oliva antes de servir tibia.'
    ],
    nutrition: 'Almidón protector que recubre y desinflama las paredes estomacales.',
    storage: 'Consumir en el día.',
    tips: 'La receta clásica indicada en episodios de deposiciones blandas o diarrea leve.'
  },

  // ================= 10. COLACIONES / SNACKS (10) =================
  {
    id: 'colacion-1',
    title: 'Galletitas Blandas de Plátano y Avena (2 Ingredientes)',
    category: 'colaciones',
    prepMin: 5,
    cookMin: 12,
    ageLabel: '+6 meses',
    minAgeMonths: 6,
    emoji: '🍪',
    ingredients: [
      { name: 'Plátano muy maduro', grams: 80 },
      { name: 'Copos suaves de avena integral', grams: 50 },
      { name: 'Canela de Ceilán opcional', grams: 1 }
    ],
    steps: [
      'Aplastar el plátano con tenedor hasta hacerlo papilla líquida.',
      'Añadir la avena y mezclar bien dejando reposar 5 minutos para que absorba humedad.',
      'Formar montoncitos aplanados en bandeja con papel de hornear.',
      'Hornear a 180°C durante 12-14 minutos hasta que los bordes tomen color pero el centro permanezca esponjoso y blando.'
    ],
    nutrition: 'Fibra, carbohidratos de asimilación lenta y potasio sin aditivos.',
    storage: 'Conservar en lata hermética hasta 3 días o congelar 1 mes.',
    tips: 'El snack estrella del Baby-Led Weaning por su textura que no produce migajas duras.'
  },
  {
    id: 'colacion-2',
    title: 'Muffins Suaves de Manzana y Zanahoria',
    category: 'colaciones',
    prepMin: 10,
    cookMin: 18,
    ageLabel: '+7 meses',
    minAgeMonths: 7,
    emoji: '🧁',
    ingredients: [
      { name: 'Manzana dulce rallada', grams: 40 },
      { name: 'Zanahoria rallada fina', grams: 30 },
      { name: 'Huevo campero batido', grams: 50 },
      { name: 'Harina de avena integral', grams: 40 },
      { name: 'Aceite de oliva virgen extra', grams: 8 }
    ],
    steps: [
      'Batir el huevo con el aceite y mezclar con las verduras ralladas y la harina de avena.',
      'Verter en minimoldes de magdalenas de silicona.',
      'Hornear a 180°C durante 18 minutos hasta que al pinchar con un palillo salga limpio.'
    ],
    nutrition: 'Vitaminas A y E, fibra y proteínas en formato para llevar al parque.',
    storage: 'Duran 3 días en recipiente hermético o se pueden congelar individualmente.',
    tips: 'Ideales para viajes en coche o meriendas fuera de casa.'
  },
  {
    id: 'colacion-3',
    title: 'Yogur con Puré de Melocotón y Semillas de Chía Molidas',
    category: 'colaciones',
    prepMin: 4,
    cookMin: 0,
    ageLabel: '+9 meses',
    minAgeMonths: 9,
    emoji: '🍑',
    ingredients: [
      { name: 'Yogur natural sin azúcar pasteurizado', grams: 70 },
      { name: 'Melocotón maduro pisado con tenedor', grams: 40 },
      { name: 'Semillas de chía molidas al momento', grams: 2 }
    ],
    steps: [
      'Colocar el yogur en un cuenco pequeño.',
      'Añadir el puré de melocotón fresco por encima y espolvorear la chía molida.',
      'Servir a media mañana o media tarde.'
    ],
    nutrition: 'Calcio bioasimilable, probióticos vivos y grasas omega 3.',
    storage: 'Consumir inmediatamente tras mezclar.',
    tips: 'Moler las semillas de chía permite al organismo del bebé aprovechar todos sus ácidos grasos.'
  },
  {
    id: 'colacion-4',
    title: 'Gofres Blanditos de Calabaza y Canela',
    category: 'colaciones',
    prepMin: 8,
    cookMin: 6,
    ageLabel: '+7 meses',
    minAgeMonths: 7,
    emoji: '🧇',
    ingredients: [
      { name: 'Puré de calabaza asada', grams: 60 },
      { name: 'Harina de avena o espelta', grams: 40 },
      { name: 'Huevo batido', grams: 50 },
      { name: 'Pizca de canela de Ceilán', grams: 1 }
    ],
    steps: [
      'Unir todos los ingredientes en un cuenco con varilla hasta lograr una crema densa.',
      'Pincelar la gofrera con aceite de oliva y verter la mezcla.',
      'Cocinar 4-6 minutos hasta que queden esponjosos y cortar en barritas.'
    ],
    nutrition: 'Carbohidratos complejos y betacarotenos.',
    storage: 'Se pueden tostar ligeramente al sacarlos de la nevera o congelador.',
    tips: 'La cuadrícula del gofre ofrece una textura rugosa fantástica para el agarre de los bebés.'
  },
  {
    id: 'colacion-5',
    title: 'Palitos de Polenta al Horno con Orégano',
    category: 'colaciones',
    prepMin: 8,
    cookMin: 15,
    ageLabel: '+8 meses',
    minAgeMonths: 8,
    emoji: '🌽',
    ingredients: [
      { name: 'Polenta cocida en agua y enfriada en bloque', grams: 100 },
      { name: 'Aceite de oliva virgen extra', grams: 5 },
      { name: 'Orégano seco molido', grams: 1 }
    ],
    steps: [
      'Cortar la polenta ya cuajada y fría en bastones rectangulares.',
      'Pincelar con aceite de oliva y espolvorear el orégano.',
      'Hornear a 200°C durante 15 minutos para que hagan una corteza suave exterior sin endurecerse.'
    ],
    nutrition: 'Energía de liberación prolongada libre de gluten.',
    storage: 'Consumir en el día.',
    tips: 'Un snack salado diferente a las opciones frutales.'
  },
  {
    id: 'colacion-6',
    title: 'Puré Bicolor de Pera y Arándanos en Bolsita Reutilizable',
    category: 'colaciones',
    prepMin: 6,
    cookMin: 6,
    ageLabel: '+6 meses',
    minAgeMonths: 6,
    emoji: '🫐',
    ingredients: [
      { name: 'Pera madura cocida al vapor', grams: 70 },
      { name: 'Arándanos cocidos aplastados y colados', grams: 30 }
    ],
    steps: [
      'Triturar las dos frutas por separado.',
      'Colocar en capas en una bolsita tipo pouch reutilizable.',
      'Ofrecer para que el bebé experimente la succión controlada.'
    ],
    nutrition: 'Antioxidantes naturales y agua de hidratación.',
    storage: 'Dura 24 horas en frío.',
    tips: 'Rellenar pouches caseros es más económico y libre de concentrados artificiales que los comprados.'
  },
  {
    id: 'colacion-7',
    title: 'Daditos de Queso Fresco sin Sal con Puré de Ciruela',
    category: 'colaciones',
    prepMin: 3,
    cookMin: 0,
    ageLabel: '+9 meses',
    minAgeMonths: 9,
    emoji: '🧀',
    ingredients: [
      { name: 'Queso fresco bajo en sodio pasteurizado', grams: 40 },
      { name: 'Puré de ciruela madura casero', grams: 30 }
    ],
    steps: [
      'Cortar el queso fresco en cubos blanditos que puedan aplastarse con los dedos.',
      'Acompañar con el puré de ciruela para mojar (dipping infantil).'
    ],
    nutrition: 'Proteínas de caseína láctea y calcio.',
    storage: 'Consumir al momento.',
    tips: 'Excelente práctica de motricidad fina y coordinación mano-boca.'
  },
  {
    id: 'colacion-8',
    title: 'Bolitas Energéticas de Avena, Dátiles y Coco Rallado',
    category: 'colaciones',
    prepMin: 10,
    cookMin: 0,
    ageLabel: '+10 meses',
    minAgeMonths: 10,
    emoji: '🥥',
    ingredients: [
      { name: 'Dátiles Medjool sin hueso hidratados en agua tibia', grams: 40 },
      { name: 'Copos de avena fina', grams: 50 },
      { name: 'Coco rallado sin azúcar', grams: 15 },
      { name: 'Agua tibia de remojo', grams: 15 }
    ],
    steps: [
      'Triturar los dátiles hidratados con la avena y el agua hasta formar una pasta maleable.',
      'Formar bolitas del tamaño de una cereza grande con las palmas de las manos húmedas.',
      'Rebozar en coco rallado muy fino y enfriar en nevera.'
    ],
    nutrition: 'Hierro vegetal, potasio y ácidos grasos de cadena media.',
    storage: 'Duran 7 días en el frigorífico.',
    tips: 'Snack súper saciante para salidas largas o días de mucho movimiento.'
  },
  {
    id: 'colacion-9',
    title: 'Rodajas de Plátano con Mantequilla de Almendra Suave',
    category: 'colaciones',
    prepMin: 3,
    cookMin: 0,
    ageLabel: '+8 meses',
    minAgeMonths: 8,
    emoji: '🍌',
    ingredients: [
      { name: 'Plátano cortado en rodajas gruesas', grams: 60 },
      { name: 'Crema de almendra 100% pura sin sal ni azúcar', grams: 8 }
    ],
    steps: [
      'Colocar las rodajas de plátano en un platito.',
      'Poner una capa ultrafina de mantequilla de almendra sobre cada rodaja (nunca una cucharada entera para evitar riesgo de adherencia en el paladar).'
    ],
    nutrition: 'Vitamina E, calcio vegetal y grasas cardiosaludables.',
    storage: 'Consumir al momento.',
    tips: 'La mantequilla de frutos secos SIEMPRE debe untarse en capa finísima en menores de 3 años.'
  },
  {
    id: 'colacion-10',
    title: 'Tortitas de Arroz y Maíz con Hummus Dulce de Manzana',
    category: 'colaciones',
    prepMin: 4,
    cookMin: 0,
    ageLabel: '+8 meses',
    minAgeMonths: 8,
    emoji: '🍘',
    ingredients: [
      { name: 'Minigalletas o tortitas de arroz para bebés sin sal', grams: 15 },
      { name: 'Mantequilla de manzana asada casera', grams: 25 }
    ],
    steps: [
      'Untar la compota espesa de manzana sobre las tortitas de textura crujiente blanda.',
      'Ofrecer directamente en las manos del bebé.'
    ],
    nutrition: 'Digestión ligera y alivio de picor en encías gracias al efecto crujiente suave.',
    storage: 'Consumir en el momento para que la tortita no se ablande en exceso.',
    tips: 'Elige siempre tortitas específicas para bebés formuladas sin sodio añadido.'
  }
];
