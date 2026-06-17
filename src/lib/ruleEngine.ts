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

  // Sync customized preventive care tips and intelligence center alerts based on current logs
  // 1. Mood rules
  if (currentMood === "Sad") {
    preventiveTips.unshift("Low mood can sometimes be alleviated by behavioral activation. Try taking a brisk 10-minute walk outside.");
    recommendations.push("Engage in a simple, low-effort hobby or task to trigger standard mental energy loops.");
  } else if (currentMood === "Stressed") {
    preventiveTips.unshift("Cortisol levels rise during stress. Practice a 4-7-8 deep breathing sequence offline to trigger your parasympathetic nervous system.");
    recommendations.push("Establish brief 'buffer zones' (5-10 mins) between heavy focus sessions or tasks to decompress.");
  } else if (currentMood === "Anxious") {
    preventiveTips.unshift("Anxiety is highly responsive to tactile centering. Use the 5-4-3-2-1 sensory method to anchor yourself.");
    recommendations.push("Limit refined sugar and excessive stimulants like strong coffee/tea to stay physically grounded.");
  } else if (currentMood === "Angry") {
    preventiveTips.unshift("Give yourself a brief 5-minute pause before executing responses; physical space helps cool acute emotional reactions.");
    recommendations.push("Channel intense physical energy into productive outlets like brisk physical stretches or rapid journaling.");
  } else if (currentMood === "Tired") {
    preventiveTips.unshift("A quick 15-20 minute power nap can restore cognitive focus margins without inducing deep sleep inertia.");
    recommendations.push("Evaluate your physical hydration levels and step away from direct screen blue-light exposure.");
  } else if (currentMood === "Lonely") {
    preventiveTips.unshift("Human connection is a somatic necessity. Reach out to a family member, supportive friend, or local peer.");
    recommendations.push("Consider working or reading in shared environments like community parks or public cafes to feel connected.");
  } else if (currentMood === "Calm") {
    preventiveTips.unshift("Nurture this state of serene balance. Save what activities or mindset contributed to your calm today.");
    recommendations.push("Take some slow, mindful steps to sustain this positive cadence throughout your week.");
  } else if (currentMood === "Happy") {
    preventiveTips.unshift("Excellent! Celebrate your positive energy and share your active joy with others around you.");
    recommendations.push("Engage in creative or high-reward tasks while your cognitive flexibility and optimism index is high.");
  } else if (currentMood === "Fearful") {
    preventiveTips.unshift("Acknowledge the fear without judgment. Penning your specific challenges makes them visual and manageable.");
    recommendations.push("Discuss persistent fears with trustworthy guides or doctors to strip their overwhelming power.");
  } else if (currentMood === "Dissociated") {
    preventiveTips.unshift("Gently ground yourself: squeeze a soft stress ball, touch cold water, or focus on physical foot contact with the floor.");
    recommendations.push("Speak aloud descriptions of your immediate physical space to support reality anchoring.");
  } else if (currentMood === "Hopeful") {
    preventiveTips.unshift("Leverage your outlook! Establish one achievable, positive goal for the days ahead.");
    recommendations.push("Document what created this feeling to establish a resilient guide for future grey days.");
  }

  // 2. Symptom rules
  if (selectedSymptoms.includes("Poor sleep") || selectedSymptoms.includes("Poor sleep / insomnia")) {
    preventiveTips.unshift("Set a hard alarm cutoff for coffee and other caffeinated food or drinks at least 8 hours before bed.");
    recommendations.push("Establish a pre-sleep routine (dim lights, no phone) to allow raw-melatonin generation.");
  }
  if (selectedSymptoms.includes("Anxiety") || selectedSymptoms.includes("Excessive worry")) {
    preventiveTips.unshift("Use scheduled 'Worry Sessions': set aside 10 minutes a day to list concerns, freeing your mind.");
    recommendations.push("Exhale twice as long as you inhale to naturally suppress standard cardiac adrenaline surges.");
  }
  if (selectedSymptoms.includes("Fatigue")) {
    preventiveTips.unshift("Drink a full glass of cool water immediately and do 3-4 gentle full-body stretches to boost blood flow.");
    recommendations.push("Prioritize complex carbohydrates and healthy proteins to keep your cellular fuel index optimized.");
  }
  if (selectedSymptoms.includes("Loss of appetite") || selectedSymptoms.includes("Low appetite")) {
    preventiveTips.unshift("Keep simple, nourishing pureed foods, soups, or dry nuts accessible so you can feed in small quantities.");
    recommendations.push("Stay hydrated with fluid nutrition (shakes, broth) if swallowing solid meals feels taxing.");
  }
  if (selectedSymptoms.includes("Overeating")) {
    preventiveTips.unshift("Take a full 20-minute gap during meals; it takes that long for hormonal satiety cues to travel to the brain.");
    recommendations.push("Sip hot, unsweetened or herbal tea when boredom signals pseudo-hunger to satisfy oral habits.");
  }
  if (selectedSymptoms.includes("Low motivation")) {
    preventiveTips.unshift("Establish 'micro-wins': commit to standard tasks for just two minutes with zero performance pressure.");
    recommendations.push("Declare one small goal aloud to build initial momentum; motion creates emotion.");
  }
  if (selectedSymptoms.includes("Headache")) {
    preventiveTips.unshift("Take a screen-free break in a semi-dark room. Gently massage temples using small circular motions.");
    recommendations.push("Ensure your neck posture isn't strained; keep chin level and pull shoulders down.");
  }
  if (selectedSymptoms.includes("Muscle tension")) {
    preventiveTips.unshift("Take a hot bath or apply warm towels to tense muscles to prompt thermal soft tissue dilation.");
    recommendations.push("Consciously drop your shoulders and unclench your jaw 3 times throughout the day.");
  }
  if (selectedSymptoms.includes("Digital eye strain")) {
    preventiveTips.unshift("Activate the 20-20-20 rule: every 20 minutes, focus on an object 20 feet away for 20 seconds.");
    recommendations.push("Ensure screen placement is slightly below your natural horizontal line of sight to reduce eye exposure.");
  }
  if (selectedSymptoms.includes("Difficulty concentrating")) {
    preventiveTips.unshift("Disable all non-crucial notifications. Set a clean, quiet 25-minute Pomodoro focus block.");
    recommendations.push("Keep your physical workspace orderly; structural clutter spawns cognitive clutter.");
  }
  if (selectedSymptoms.includes("Social withdrawal")) {
    preventiveTips.unshift("Avoid total isolation. Step outside or work in a public library where there is minimal social demand.");
    recommendations.push("Call or message one empathetic peer who doesn't exhaust your batteries.");
  }
  if (selectedSymptoms.includes("Irritability")) {
    preventiveTips.unshift("Pause and assess unmet bodily thresholds: Are you experiencing hunger, sleepiness, or dehydration?");
    recommendations.push("Step out of the active room or debate. 90 seconds of solitude can reset your nervous system.");
  }
  if (selectedSymptoms.includes("Racing thoughts")) {
    preventiveTips.unshift("Do a direct 'cognitive dump': jot down everything swirling in your head onto physical paper.");
    recommendations.push("Limit exposure to highly stimulating, fast-paced media scrolling and video widgets.");
  }
  if (selectedSymptoms.includes("Memory issues")) {
    preventiveTips.unshift("Offset mental load by using centralized task boards, physical notes, and automated repeating reminders.");
    recommendations.push("Consistently place essential daily tools (keys, cards, medication) in identical, dedicated locations.");
  }
  if (selectedSymptoms.includes("Mood swings")) {
    preventiveTips.unshift("Take notice of potential biological cycles, nutritional habits, or abrupt sleep disruption triggers.");
    recommendations.push("Commit to mild, light workouts to stabilize baseline neurochemical swings.");
  }
  if (selectedSymptoms.includes("Feeling detached from reality")) {
    preventiveTips.unshift("Establish physical contacts: grasp cold keys, feel heavy weights, or stomp feet softly on solid ground.");
    recommendations.push("State basic truths aloud, e.g., 'My name is relative, I am safe, and it is the present.'");
  }
  if (selectedSymptoms.includes("Chest tightness") || selectedSymptoms.includes("Shortness of breath") || selectedSymptoms.includes("Palpitations")) {
    preventiveTips.unshift("Sit down, relax your chest, and control your breathing: breathe in for 4s, hold for 4s, breathe out for 4s.");
    recommendations.push("Loosen tight neckwear or belts, and seek fresh, cool circulating air immediately.");
  }
  if (selectedSymptoms.includes("Physical pain")) {
    preventiveTips.unshift("Minimize painful trigger postures. Swap to warm compress support after cooling inflammatory areas.");
    recommendations.push("Engage in low-impact joint movements (e.g., slow walking or gentle stretching) to maintain mobility.");
  }
  if (selectedSymptoms.includes("Frequent urination") || selectedSymptoms.includes("Trembling or shaking") || selectedSymptoms.includes("Dizziness")) {
    preventiveTips.unshift("Sip warm or room-temperature fluid slowly. Sidestep sudden postural stand-ups.");
    recommendations.push("Monitor glucose patterns and completely steer clear of sudden energy crashes.");
  }

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
