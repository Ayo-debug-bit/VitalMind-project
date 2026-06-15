// High fidelity definitions and helpers for the requested Wellness upgrades.

export interface BaselineQuestion {
  id: string;
  text: string;
  textYo?: string;
  textIg?: string;
  textHa?: string;
  options: { value: number; label: string; labelYo?: string; labelIg?: string; labelHa?: string }[];
}

export const BASELINE_QUESTIONS: BaselineQuestion[] = [
  {
    id: "pleasure",
    text: "Little interest or pleasure in doing things?",
    textYo: "Kò sí ìfẹ́ tàbí ìdùnnú láti ṣe nǹkan?",
    textIg: "Enweghị mmasị ma ọ bụ ụtọ n'ime ihe?",
    textHa: "Karancin sha'awa ko jin daɗin yin abubuwa?",
    options: [
      { value: 0, label: "Not at all", labelYo: "Rárá", labelIg: "Rárá", labelHa: "Ko kadan" },
      { value: 1, label: "Several days", labelYo: "Ọjọ́ díẹ̀", labelIg: "Banyere ụbọchị", labelHa: "Kwanaki da yawa" },
      { value: 2, label: "More than half the days", labelYo: "Ju rẹ́sìbẹ́ lọ", labelIg: "Gabala ọkara ụbọchị", labelHa: "Rabin kwanaki" },
      { value: 3, label: "Nearly every day", labelYo: "Fẹ́rẹ̀ẹ́ gbogbo ọjọ́", labelIg: "Ihe fọrọ nke nta kwa ụbọchị", labelHa: "Kusan kowace rana" }
    ]
  },
  {
    id: "depressed",
    text: "Feeling down, depressed, or hopeless?",
    textYo: "Rírẹwù tàbí aini ireti?",
    textIg: "Ahụ ruru ala ma ọ bụ enweghị nchekwube?",
    textHa: "Jin kasala, bakin ciki ko rashin fata?",
    options: [
      { value: 0, label: "Not at all", labelYo: "Rárá", labelIg: "Rárá", labelHa: "Ko kadan" },
      { value: 1, label: "Several days", labelYo: "Ọjọ́ díẹ̀", labelIg: "Banyere ụbọchị", labelHa: "Kwanaki da yawa" },
      { value: 2, label: "More than half the days", labelYo: "Ju rẹ́sìbẹ́ lọ", labelIg: "Gabala ọkara ụbọchị", labelHa: "Rabin kwanaki" },
      { value: 3, label: "Nearly every day", labelYo: "Fẹ́rẹ̀ẹ́ gbogbo ọjọ́", labelIg: "Ihe fọrọ nke nta kwa ụbọchị", labelHa: "Kusan kowace rana" }
    ]
  },
  {
    id: "anxious",
    text: "Feeling nervous, anxious, or on edge?",
    textYo: "Àníyàn tàbí ríru ọkàn?",
    textIg: "Ụjọ ma ọ bụ mkpọtụ obi?",
    textHa: "Jin tsoro, fargaba ko fushin kai?",
    options: [
      { value: 0, label: "Not at all", labelYo: "Rárá", labelIg: "Rárá", labelHa: "Ko kadan" },
      { value: 1, label: "Several days", labelYo: "Ọjọ́ díẹ̀", labelIg: "Banyere ụbọchị", labelHa: "Kwanaki da yawa" },
      { value: 2, label: "More than half the days", labelYo: "Ju rẹ́sìbẹ́ lọ", labelIg: "Gabala ọkara ụbọchị", labelHa: "Rabin kwanaki" },
      { value: 3, label: "Nearly every day", labelYo: "Fẹ́rẹ̀ẹ́ gbogbo ọjọ́", labelIg: "Ihe fọrọ nke nta kwa ụbọchị", labelHa: "Kusan kowace rana" }
    ]
  },
  {
    id: "worrying",
    text: "Trouble controlling or stopping worrying?",
    textYo: "Kò sí agbára láti dáwọ́ àníyàn?",
    textIg: "Mkpọtụ banyere nchegbu dị ukwuu?",
    textHa: "Rashin iya sarrafa damuwa ko tsaida ita?",
    options: [
      { value: 0, label: "Not at all", labelYo: "Rárá", labelIg: "Rárá", labelHa: "Ko kadan" },
      { value: 1, label: "Several days", labelYo: "Ọjọ́ díẹ̀", labelIg: "Banyere ụbọchị", labelHa: "Kwanaki da yawa" },
      { value: 2, label: "More than half the days", labelYo: "Ju rẹ́sìbẹ́ lọ", labelIg: "Gabala ọkara ụbọchị", labelHa: "Rabin kwanaki" },
      { value: 3, label: "Nearly every day", labelYo: "Fẹ́rẹ̀ẹ́ gbogbo ọjọ́", labelIg: "Ihe fọrọ nke nta kwa ụbọchị", labelHa: "Kusan kowace rana" }
    ]
  },
  {
    id: "sleep_quality",
    text: "How would you rate your general rest quality recently?",
    textYo: "Bawo ni sùn rẹ ati agbara rẹ?",
    textIg: "Kedu ka ihi ụra na ike gị dị?",
    textHa: "Yaya ingancin barcinka yake a halin yanzu?",
    options: [
      { value: 0, label: "Excellent Rest", labelYo: "Dára gan", labelIg: "Mma kachasị", labelHa: "Barci mai kyau" },
      { value: 1, label: "Fairly Good", labelYo: "Dára rẹ́ẹ́rẹ́", labelIg: "Mma nke ọma", labelHa: "Barci mai dama-dama" },
      { value: 2, label: "Interrupted Rest", labelYo: "Kò dára púpọ̀", labelIg: "Nchegbu ụra", labelHa: "Barci mara katsewa" },
      { value: 3, label: "Severe Insomnia", labelYo: "Kò sí oorun rárá", labelIg: "Enweghị ụra ọ bụla", labelHa: "Rashin barci kwata-kwata" }
    ]
  }
];

export interface DoctorAppointment {
  id: string;
  doctorName: string;
  dateTime: string;
  discussedNotes: string;
  clinicalAdvice: string;
  completed: boolean;
  createdAt: string;
}

export interface MedicationReminder {
  id: string;
  medicationName: string;
  dosage: string;
  timeOfDay: string; // e.g., "08:00"
  enabled: boolean;
}

export interface SafetyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

// Generate tip dynamically based on current mood & symptoms
export function getContextualTip(mood: string, symptoms: string[]): string {
  const isAnxious = mood === "Anxious" || mood === "Stressed";
  const hasChestTightness = symptoms.includes("Chest tightness") || symptoms.includes("Shortness of breath");
  if (isAnxious && hasChestTightness) {
    return "💡 Grounding breathing: Focus on chest relaxation. Sit upright, breathe in slowly for 4 seconds, hold for 4, and exhale smoothly through pursed lips for 6 seconds. Continue for 3 minutes to downregulate panic pathways.";
  }

  const hasPoorSleep = symptoms.includes("Poor sleep") || symptoms.includes("Poor sleep / insomnia") || symptoms.includes("Fatigue");
  if (hasPoorSleep && (mood === "Tired" || mood === "Sad")) {
    return "💡 Core rest strategy: Eliminate all emitting screen lights 45 minutes prior to rest. Keep physical surroundings cold and quiet to allow deep biological repair.";
  }

  if (symptoms.includes("Racing thoughts") || symptoms.includes("Difficulty concentrating") || mood === "Dissociated") {
    return "💡 Grounding exercise: Locate 5 visible items, 4 physical sensations, 3 auditory notes, 2 scents, and take 1 deep sip of water. This visual & somatic circuit resets focus and reduces dissociation.";
  }

  if (symptoms.includes("Suicidal thoughts") || symptoms.includes("Self-harm urges")) {
    return "💡 Priority safety check-in: Caring professionals understand exactly what you are carrying. Please tap on 'Get Help Now' or notify a trusted emergency contact to share the load. Rest is possible.";
  }

  if (mood === "Angry" || mood === "Fearful") {
    return "💡 Somatic cooling: Gently place a cold damp cloth or splash cold water onto your face. Exhale slower than you inhale. This stimulates the vagus nerve and physical containment.";
  }

  // General default tip
  return "💡 Micro-connection: Drink 500ml of clean water, step outside into natural lighting for 10 minutes, and do a light somatic stretch. Wellness is incremental.";
}

// Calculate streak details based on chronological logs
export function calculateStreak(moodLogs: { timestamp: any }[]): {
  currentStreak: number;
  highestStreak: number;
} {
  if (moodLogs.length === 0) return { currentStreak: 0, highestStreak: 0 };

  const sortedDates = moodLogs
    .map(log => {
      const ts = log.timestamp;
      if (!ts) return null;
      if (typeof ts.toDate === 'function') return ts.toDate();
      if (ts.seconds !== undefined) return new Date(ts.seconds * 1000);
      return new Date(ts);
    })
    .filter((d): d is Date => d !== null && !isNaN(d.getTime()))
    .map(d => {
      const copy = new Date(d);
      copy.setHours(0, 0, 0, 0);
      return copy.getTime();
    })
    // Deduplicate same calendar days
    .filter((val, index, arr) => arr.indexOf(val) === index)
    .sort((a, b) => b - a); // descending order

  if (sortedDates.length === 0) return { currentStreak: 0, highestStreak: 0 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Check if they logged today or yesterday to preserve the streak
  const lastLogDate = sortedDates[0];
  const isEligible = lastLogDate === today.getTime() || lastLogDate === yesterday.getTime();

  if (!isEligible) {
    // Current streak has expired, but look for gaps to calculate historical peak
    let currentStreak = 0;
    let maxHistory = 0;
    let temp = 1;
    for (let i = 0; i < sortedDates.length - 1; i++) {
      const diffDays = (sortedDates[i] - sortedDates[i + 1]) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        temp++;
      } else {
        if (temp > maxHistory) maxHistory = temp;
        temp = 1;
      }
    }
    if (temp > maxHistory) maxHistory = temp;
    return { currentStreak: 0, highestStreak: maxHistory };
  }

  let currentStreak = 1;
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const diffDays = (sortedDates[i] - sortedDates[i + 1]) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      currentStreak++;
    } else {
      break; // current streak broken
    }
  }

  // Calculate highest historical streak
  let maxStreak = currentStreak;
  let tempStreak = 1;
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const diffDays = (sortedDates[i] - sortedDates[i + 1]) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      tempStreak++;
    } else {
      if (tempStreak > maxStreak) maxStreak = tempStreak;
      tempStreak = 1;
    }
  }
  if (tempStreak > maxStreak) maxStreak = tempStreak;

  return { currentStreak, highestStreak: maxStreak };
}

// Generate fully automated Weekly & Monthly reports based on historical wellness records
export interface WellnessReport {
  type: "weekly" | "monthly";
  durationDays: number;
  totalLogsCount: number;
  averageMoodScore: number;
  dominantMood: string;
  frequentSymptoms: string[];
  evaluationIndicator: string;
  actionableInsight: string;
  timelineData: { day: string; score: number }[];
}

export function generateWellnessReport(
  moodLogs: { mood: string; timestamp: any }[],
  symptomLogs: { symptoms: string[]; timestamp: any }[],
  days: number = 7
): WellnessReport {
  const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

  const relevantMoods = moodLogs.filter(log => {
    let t = Date.now();
    if (log.timestamp) {
      if (typeof log.timestamp.toDate === 'function') t = log.timestamp.toDate().getTime();
      else if (log.timestamp.seconds) t = log.timestamp.seconds * 1000;
      else t = new Date(log.timestamp).getTime();
    }
    return t >= cutoffTime;
  });

  const relevantSymptoms = symptomLogs.filter(log => {
    let t = Date.now();
    if (log.timestamp) {
      if (typeof log.timestamp.toDate === 'function') t = log.timestamp.toDate().getTime();
      else if (log.timestamp.seconds) t = log.timestamp.seconds * 1000;
      else t = new Date(log.timestamp).getTime();
    }
    return t >= cutoffTime;
  });

  // Calculate values
  const totalLogs = relevantMoods.length;
  
  // Calculate average score
  const getScore = (m: string) => {
    switch (m) {
      case "Happy": case "Calm": case "Hopeful": return 5;
      case "Neutral": return 3;
      case "Sad": case "Tired": case "Lonely": return 2;
      case "Stressed": case "Anxious": case "Angry": case "Fearful": case "Dissociated": return 1;
      default: return 3;
    }
  };

  const scoreSum = relevantMoods.reduce((sum, log) => sum + getScore(log.mood), 0);
  const avgScore = totalLogs > 0 ? Number((scoreSum / totalLogs).toFixed(1)) : 3.0;

  // Dominant Mood
  const moodCounts: Record<string, number> = {};
  relevantMoods.forEach(log => {
    moodCounts[log.mood] = (moodCounts[log.mood] || 0) + 1;
  });
  let dominantMood = "None";
  let maxCount = 0;
  Object.keys(moodCounts).forEach(m => {
    if (moodCounts[m] > maxCount) {
      maxCount = moodCounts[m];
      dominantMood = m;
    }
  });

  // Most frequent symptoms
  const symptomCounts: Record<string, number> = {};
  relevantSymptoms.forEach(log => {
    log.symptoms.forEach(s => {
      symptomCounts[s] = (symptomCounts[s] || 0) + 1;
    });
  });
  const frequentSymptoms = Object.keys(symptomCounts)
    .sort((a, b) => symptomCounts[b] - symptomCounts[a])
    .slice(0, 3);

  // Evaluation general Indicator
  let evaluationIndicator = "Stabile";
  if (avgScore >= 4.0) evaluationIndicator = "Thriving";
  else if (avgScore <= 2.2) evaluationIndicator = "In distress / Fatigued";
  else if (avgScore < 3.2) evaluationIndicator = "Sub-optimal / Stressed";

  // Actionable Insight Generator
  let actionableInsight = "Consistency in logging helps configure your baseline analysis. Keep up the high effort!";
  if (dominantMood === "Anxious" || dominantMood === "Stressed") {
    const timesPlural = maxCount > 1 ? `${maxCount} times` : "once";
    actionableInsight = `You reported ${dominantMood.toLowerCase()} ${timesPlural} this period. Our records suggest physical triggers like screen overuse or late sleeping can escalate this strain.`;
  } else if (dominantMood === "Sad" || dominantMood === "Lonely") {
    actionableInsight = `Refining your daily micro-routines might lessen heavy phases. Consider expressing these emotions to your designated Wellness contact.`;
  } else if (frequentSymptoms.includes("Fatigue") || frequentSymptoms.includes("Poor sleep / insomnia") || frequentSymptoms.includes("Poor sleep")) {
    actionableInsight = `Physical exhaustion alters neural regulation. Try introducing a non-negotiable bedtime window and hydrate fully.`;
  } else if (avgScore >= 4.0) {
    actionableInsight = "Your reports show highly stabilized wellness scores. Maintain these active boundary conditions to protect your energy!";
  }

  // General weekly graph
  const timelineData = [...relevantMoods]
    .sort((a, b) => {
      let ta = 0, tb = 0;
      if (a.timestamp) ta = a.timestamp.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
      if (b.timestamp) tb = b.timestamp.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
      return ta - tb;
    })
    .map((log, i) => {
      let label = `Log ${i + 1}`;
      if (log.timestamp) {
        const d = log.timestamp.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
        label = d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
      }
      return {
        day: label,
        score: getScore(log.mood)
      };
    });

  return {
    type: days === 7 ? "weekly" : "monthly",
    durationDays: days,
    totalLogsCount: totalLogs,
    averageMoodScore: avgScore,
    dominantMood,
    frequentSymptoms,
    evaluationIndicator,
    actionableInsight,
    timelineData
  };
}
