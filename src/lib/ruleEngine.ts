/**
 * Rule-Based Decision System for Vital Mind
 * Strictly IF-THEN logic as per specifications.
 */

export type MoodType = "Happy" | "Sad" | "Stressed" | "Anxious" | "Neutral" | "Angry";
export type SymptomType = 
  | "Poor sleep" 
  | "Anxiety" 
  | "Fatigue" 
  | "Loss of appetite" 
  | "Low motivation"
  | "Headache"
  | "Muscle tension"
  | "Digital eye strain"
  | "Difficulty concentrating"
  | "Social withdrawal"
  | "Excessive worry"
  | "Irritability";

export const SYMPTOMS: SymptomType[] = [
  "Poor sleep",
  "Anxiety",
  "Fatigue",
  "Loss of appetite",
  "Low motivation",
  "Headache",
  "Muscle tension",
  "Digital eye strain",
  "Difficulty concentrating",
  "Social withdrawal",
  "Excessive worry",
  "Irritability"
];
export type WellnessState = "Mild" | "Moderate" | "Severe";

export interface EvaluationResult {
  state: WellnessState;
  warning?: string;
  recommendations: string[];
  preventiveTips: string[];
}

export function evaluateWellness(
  currentMood: MoodType,
  recentMoods: MoodType[],
  selectedSymptoms: SymptomType[],
  recentSymptoms: SymptomType[][] = []
): EvaluationResult {
  let state: WellnessState = "Mild";
  const recommendations: string[] = [];
  const preventiveTips: string[] = [
    "Schedule your annual physical check-up if you haven't this year.",
    "Ensure you're up to date with your vaccinations for adults (e.g., HPV, Hepatitis).",
    "Monitor your blood pressure and heart rate occasionally.",
    "Regularly self-check for any physical abnormalities."
  ];
  let warning: string | undefined;

  // Persistent Symptom Detection (if logged in 2 of the last 3 entries)
  const fatigueLogs = recentSymptoms.slice(0, 3).filter(logs => logs.includes("Fatigue")).length;
  const sleepLogs = recentSymptoms.slice(0, 3).filter(logs => logs.includes("Poor sleep")).length;

  if (fatigueLogs >= 2 || (selectedSymptoms.includes("Fatigue") && fatigueLogs >= 1)) {
    warning = "Persistent fatigue detected over multiple logs. This could indicate underlying physical stress or nutritional gaps. Consider a routine check-up.";
    recommendations.push("Prioritize high-quality protein and complex carbs to stabilize energy levels.");
  }

  if (sleepLogs >= 2 || (selectedSymptoms.includes("Poor sleep") && sleepLogs >= 1)) {
    warning = "Recurring sleep issues identified. Quality rest is vital for young adults to prevent burnout.";
    recommendations.push("Implement a strict 'no-screen' policy 45 minutes before sleep.");
  }

  // Symptom-specific immediate feedback
  if (selectedSymptoms.includes("Loss of appetite")) {
    recommendations.push("If low appetite persists, try liquid nutrition (smoothies/soups) to maintain calorie intake.");
  }
  if (selectedSymptoms.includes("Digital eye strain")) {
    recommendations.push("Follow the 20-20-20 rule: every 20 mins, look 20 feet away for 20 seconds.");
  }
  if (selectedSymptoms.includes("Headache")) {
    recommendations.push("Keep hydrated and monitor if headaches correlate with specific triggers or light.");
  }
  if (selectedSymptoms.includes("Muscle tension")) {
    recommendations.push("Regular light stretching can prevent chronic muscle pain and stress buildup.");
  }
  if (selectedSymptoms.includes("Social withdrawal")) {
    recommendations.push("Social connection is a health pillar; try one low-pressure interaction today.");
  }
  if (selectedSymptoms.includes("Difficulty concentrating")) {
    recommendations.push("Focus on single-tasking and take scheduled 'brain breaks' every hour.");
  }

  // Rule 1: IF mood = "Sad" for 3+ consecutive entries → Show warning message
  const consecutiveSad = recentMoods.slice(0, 2).every(m => m === "Sad") && currentMood === "Sad";
  if (consecutiveSad) {
    warning = "You've been feeling sad for several days. Persistent low mood in young people deserves proactive attention.";
    state = "Moderate";
  }

  // Rule 2: IF symptoms include "Anxiety" + "Poor sleep" → Suggest coping strategies
  if (selectedSymptoms.includes("Anxiety") && selectedSymptoms.includes("Poor sleep")) {
    recommendations.push("Anxiety and sleep often affect each other. Consider mindfulness apps or guided meditation.");
    state = "Moderate";
  }

  // Rule 3: IF repeated negative mood OR severe symptoms → Trigger alert
  const negativeMoods = ["Sad", "Stressed", "Anxious", "Angry"];
  const negativeFrequency = recentMoods.filter(m => negativeMoods.includes(m)).length + (negativeMoods.includes(currentMood) ? 1 : 0);
  
  if (negativeFrequency >= 5 || selectedSymptoms.length >= 4) {
    state = "Severe";
  }

  // General Feedbacks based on state
  if (state === "Mild") {
    recommendations.push("Practice regular exercise to maintain your mood.");
    recommendations.push("Ensure you get at least 7-8 hours of sleep tonight.");
    recommendations.push("Stay hydrated and maintain a healthy diet.");
  } else if (state === "Moderate") {
    recommendations.push("Keep tracking your feelings daily to notice patterns.");
    recommendations.push("Consider talking to a trusted friend or mentor about how you feel.");
    recommendations.push("Limit caffeine and screen time before bed.");
  } else if (state === "Severe") {
    recommendations.push("We strongly recommend reaching out to a mental health professional.");
    recommendations.push("Contact one of the helplines in the Resources section for immediate support.");
    warning = "Your current state suggests you may need professional support. Please don't go through this alone.";
  }

  return { state, warning, recommendations, preventiveTips };
}

export const HELPLINES = [
  { name: "Nigeria Suicide Prevention Initiative", number: "0806 210 6493" },
  { name: "Mentally Aware Nigeria Initiative (MANI)", number: "0809 111 6264" },
  { name: "Lagos State Mental Health Helpline", number: "0803 123 0330" },
  { name: "NEMA (National Emergency Management Agency)", number: "112" },
];

export const RESOURCES = [
  {
    title: "Understanding Depression",
    content: "Depression is more than just feeling sad; it is a serious medical condition. Early identification and professional help are key.",
    fullGuide: "https://www.who.int/news-room/fact-sheets/detail/depression"
  },
  {
    title: "Anxiety & Young Adults",
    content: "Persistent worry can affect physical health. Cognitive Behavioral Therapy (CBT) and lifestyle changes are highly effective.",
    fullGuide: "https://www.nimh.nih.gov/health/topics/anxiety-disorders"
  },
  {
    title: "Sleep & Health",
    content: "Consistent sleep is vital for mental and physical recovery. Aim for 7-9 hours of quality rest per night.",
    fullGuide: "https://www.sleepfoundation.org/how-sleep-works/why-do-we-need-sleep"
  },
  {
    title: "Nutrition & Mood",
    content: "Balanced nutrition supports neurotransmitter function. Focus on whole grains, proteins, and healthy fats.",
    fullGuide: "https://www.health.harvard.edu/blog/nutritional-psychiatry-your-brain-on-food-201511168626"
  },
  {
    title: "Physical Activity",
    content: "Exercise releases endorphins. Even 15 minutes of walking can significantly boost mood and energy levels.",
    fullGuide: "https://www.who.int/news-room/fact-sheets/detail/physical-activity"
  },
  {
    title: "Stress Management",
    content: "Deep breathing and mindfulness techniques can lower cortisol levels and improve response to stressors.",
    fullGuide: "https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/"
  },
  {
    title: "Public Health Safety",
    content: "Stay informed about seasonal health alerts and vaccination benefits for Nigerian communities.",
    fullGuide: "https://ncdc.gov.ng/"
  },
  {
    title: "Substance Use Education",
    content: "Understanding the impact of substances on the developing brain is crucial for long-term mental health.",
    fullGuide: "https://www.samhsa.gov/find-help/national-helpline"
  }
];
