/**
 * Rule-Based Decision System for Vital Mind
 * Strictly IF-THEN logic as per specifications.
 */

export type MoodType = 
  | "Happy" 
  | "Sad" 
  | "Stressed" 
  | "Anxious" 
  | "Neutral" 
  | "Angry"
  | "Hopeful"
  | "Calm"
  | "Tired"
  | "Lonely"
  | "Dissociated"
  | "Fearful";

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
  | "Irritability"
  | "Poor sleep / insomnia"
  | "Low appetite"
  | "Racing thoughts"
  | "Memory issues"
  | "Mood swings"
  | "Feeling detached from reality"
  | "Suicidal thoughts"
  | "Self-harm urges"
  | "Overeating"
  | "Dizziness"
  | "Chest tightness"
  | "Shortness of breath"
  | "Palpitations"
  | "Physical pain"
  | "Frequent urination"
  | "Trembling or shaking";

export const SYMPTOMS: SymptomType[] = [
  "Racing thoughts",
  "Difficulty concentrating",
  "Memory issues",
  "Low motivation",
  "Excessive worry",
  "Mood swings",
  "Feeling detached from reality",
  "Suicidal thoughts",
  "Self-harm urges",
  "Anxiety",
  "Social withdrawal",
  "Irritability",
  "Headache",
  "Poor sleep / insomnia",
  "Poor sleep", // compat
  "Fatigue",
  "Low appetite",
  "Loss of appetite", // compat
  "Overeating",
  "Dizziness",
  "Chest tightness",
  "Shortness of breath",
  "Palpitations",
  "Physical pain",
  "Frequent urination",
  "Trembling or shaking",
  "Muscle tension",
  "Digital eye strain"
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
    warning = "Your logs suggest a persistent low mood. Reflective mapping might help illuminate these trends over time.";
    state = "Moderate";
  }

  // Rule 2: IF symptoms include "Anxiety" + "Poor sleep" / "Poor sleep / insomnia" → Suggest coping strategies
  const hasPoorSleep = selectedSymptoms.includes("Poor sleep") || selectedSymptoms.includes("Poor sleep / insomnia");
  if ((selectedSymptoms.includes("Anxiety") || selectedSymptoms.includes("Excessive worry")) && hasPoorSleep) {
    recommendations.push("Your logs suggest an interplay between elevated worry and rest. A consistent wind-down cadence might support deeper recovery.");
    state = "Moderate";
  }

  // Immediate triggers for clinical-free warm severe guidance
  if (selectedSymptoms.includes("Suicidal thoughts") || selectedSymptoms.includes("Self-harm urges")) {
    state = "Severe";
    warning = "Your logs suggest you are carrying some deep weights. Please remember that you are not alone, and specialized care guides are close at hand.";
    recommendations.unshift("Navigate to Crisis Support to speak with individuals who care and understand.");
  }

  // Rule 3: IF repeated negative mood OR severe symptoms → Trigger alert
  const negativeMoods = ["Sad", "Stressed", "Anxious", "Angry", "Lonely", "Dissociated", "Fearful", "Tired"];
  const negativeFrequency = recentMoods.filter(m => negativeMoods.includes(m)).length + (negativeMoods.includes(currentMood) ? 1 : 0);
  
  if (negativeFrequency >= 5 || selectedSymptoms.length >= 4) {
    state = "Severe";
  }

  // General Feedbacks based on state
  if (state === "Mild") {
    recommendations.push("Practice regular movement or light activity to nourish your mood.");
    recommendations.push("Ensure you protect time for restful sleep tonight.");
    recommendations.push("Hydration supports mental clarity and stamina.");
  } else if (state === "Moderate") {
    recommendations.push("Keep mapping your experiences daily to highlight beneficial habits.");
    recommendations.push("Consider expressing these sentiments to a trusted friend or guide.");
    recommendations.push("Gently taper screens and active stimuli before heading to bed.");
  } else if (state === "Severe") {
    recommendations.push("We recommend exploring specialized guidance from an empathetic care worker.");
    recommendations.push("Reach out to any of our listed helpline supporters whenever you need a safe branch.");
    if (!warning) {
      warning = "Your logs suggest a high level of stress. Caring professional resources can help unpack this safely.";
    }
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
