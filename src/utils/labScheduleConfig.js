// Configuração dos horários disponíveis por dia da semana no Laboratório de Apoio

export const LAB_SCHEDULE = {
  0: [], // Domingo - sem atendimento
  1: [ // Segunda-feira
    "13:30 - 14:30",
    "14:30 - 15:30",
    "15:30 - 16:30",
    "16:30 - 17:30"
  ],
  2: [ // Terça-feira
    "13:30 - 14:30",
    "14:30 - 15:30"
  ],
  3: [ // Quarta-feira
    "13:30 - 14:30",
    "14:30 - 15:30",
    "15:30 - 16:30",
    "16:30 - 17:30"
  ],
  4: [ // Quinta-feira
    "07:30 - 08:30",
    "08:30 - 09:30",
    "09:30 - 10:30",
    "10:30 - 11:30",
    "13:30 - 14:30",
    "14:30 - 15:30",
    "15:30 - 16:30",
    "16:30 - 17:30"
  ],
  5: [ // Sexta-feira
    "13:30 - 14:30",
    "14:30 - 15:30",
    "15:30 - 16:30",
    "16:30 - 17:30"
  ],
  6: [ // Sábado
    "07:30 - 08:30",
    "08:30 - 09:30"
  ]
};

export const WEEKDAY_NAMES = {
  0: "Domingo",
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado"
};

/**
 * Retorna os horários disponíveis para uma data específica
 * @param {string} dateString - Data no formato YYYY-MM-DD
 * @returns {Array} Array com os horários disponíveis
 */
export function getAvailableTimeSlotsForDate(dateString) {
  const date = new Date(dateString + "T12:00:00"); // Meio-dia para evitar problemas de timezone
  const dayOfWeek = date.getDay();
  return LAB_SCHEDULE[dayOfWeek] || [];
}

/**
 * Verifica se uma data tem horários disponíveis
 * @param {string} dateString - Data no formato YYYY-MM-DD
 * @returns {boolean}
 */
export function hasAvailableSlots(dateString) {
  return getAvailableTimeSlotsForDate(dateString).length > 0;
}

/**
 * Retorna o nome do dia da semana para uma data
 * @param {string} dateString - Data no formato YYYY-MM-DD
 * @returns {string}
 */
export function getWeekdayName(dateString) {
  const date = new Date(dateString + "T12:00:00");
  const dayOfWeek = date.getDay();
  return WEEKDAY_NAMES[dayOfWeek];
}