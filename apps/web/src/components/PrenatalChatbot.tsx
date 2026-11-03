"use client";

import { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useBaby } from "@/context/BabyContext";
import { CareLog, subscribeCareLogs, calculateCareSummary24h } from "@/lib/baby";
import {
  ChatCircle,
  Robot,
  Sparkle,
  Baby as BabyIcon,
  X,
} from "@phosphor-icons/react";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
}

export default function PrenatalChatbot() {
  const { user, familyId } = useAuth();
  const { baby, activeMode } = useBaby();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Hello! I am your Lumina Clinical Companion. I sync directly with your dashboard database. Ask me about feedings, diapers, clinical milestones, blood sugar, or general newborn and prenatal guidelines!",
      timestamp: new Date(),
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Live Database Statistics State (Prenatal)
  const [kickCount, setKickCount] = useState(0);
  const [milkCount, setMilkCount] = useState(0);
  const [glucoseLogs, setGlucoseLogs] = useState<
    { value: number; slot: string; date: string }[]
  >([]);

  // Live Database Statistics State (Newborn)
  const [babyCareLogs, setBabyCareLogs] = useState<CareLog[]>([]);

  // Format Helper
  const getLocalDateString = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const date = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${date}`;
  };
  const todayStr = getLocalDateString();

  // Scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, isOpen]);

  // Subscribe to Baby Care Logs if newborn profile exists
  useEffect(() => {
    if (!user || !baby?.id) return;
    const unsub = subscribeCareLogs(familyId, user.uid, baby.id, setBabyCareLogs);
    return () => unsub();
  }, [user, familyId, baby?.id]);

  // Subscribe to Kicks, Milk, and Blood Sugar to serve as the Bot's database context
  useEffect(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    let unsubKicks = () => {};
    let unsubMilk = () => {};
    let unsubGlucose = () => {};

    if (user && familyId) {
      // 1. Subscribe to Kicks today
      const qKicks = query(
        collection(db, "families", familyId, "kicks"),
        where("createdAt", ">=", startOfDay),
      );
      unsubKicks = onSnapshot(qKicks, (snapshot) => {
        setKickCount(snapshot.size);
      });

      // 2. Subscribe to Milk today
      const qMilk = query(
        collection(db, "families", familyId, "milk"),
        where("createdAt", ">=", startOfDay),
      );
      unsubMilk = onSnapshot(qMilk, (snapshot) => {
        setMilkCount(snapshot.size);
      });

      // 3. Subscribe to Blood Sugar records
      const qGlucose = query(
        collection(db, "families", familyId, "bloodsugar"),
        orderBy("createdAt", "desc"),
        limit(20),
      );
      unsubGlucose = onSnapshot(qGlucose, (snapshot) => {
        const temp: { value: number; slot: string; date: string }[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          temp.push({
            value: Number(data.value),
            slot: data.slot,
            date: data.date,
          });
        });
        setGlucoseLogs(temp);
      });
    } else {
      // Guest fallback
      const readGuestLogs = () => {
        setKickCount(0);
        const guestMilk = localStorage.getItem("lumina_guest_milk");
        if (guestMilk) {
          try {
            setMilkCount(JSON.parse(guestMilk).length);
          } catch {
            setMilkCount(0);
          }
        } else {
          setMilkCount(0);
        }

        const guestGlucose = localStorage.getItem("lumina_guest_bloodsugar");
        if (guestGlucose) {
          try {
            setGlucoseLogs(JSON.parse(guestGlucose));
          } catch {
            setGlucoseLogs([]);
          }
        } else {
          setGlucoseLogs([]);
        }
      };

      readGuestLogs();
      const interval = setInterval(readGuestLogs, 3000);
      return () => clearInterval(interval);
    }

    return () => {
      unsubKicks();
      unsubMilk();
      unsubGlucose();
    };
  }, [user, familyId]);

  // Answer matching engine (local database NLP processor)
  const generateResponse = (userText: string): string => {
    const text = userText.toLowerCase();
    const isNewborn = activeMode === "newborn" || !!baby;

    // Newborn-specific responses
    if (isNewborn) {
      const summary24h = calculateCareSummary24h(babyCareLogs);

      // 1. Meconium / Stool / Poop questions
      if (
        text.includes("meconium") ||
        text.includes("poop") ||
        text.includes("stool") ||
        text.includes("black") ||
        text.includes("green") ||
        text.includes("yellow")
      ) {
        return `💩 **Newborn Stool Progression Guide**:
• **Days 1–2**: Meconium is normal! It is thick, tarry, and black or dark greenish-black (composed of swallowed amniotic fluid & skin cells).
• **Days 2–4**: Stools transition to army-green and brownish-yellow as colostrum & milk are digested.
• **Day 5+**: Stools should turn golden/mustard-yellow with a loose, seedy texture (especially for breastfed babies) or pasty tan (for formula).
🚨 **Red Flags**: If stool is white/chalky (liver sign), contains bright red blood, or remains tarry black after Day 5, contact your pediatrician.`;
      }

      // 2. Cluster Feeding & Night 2
      if (
        text.includes("cluster") ||
        text.includes("night 2") ||
        text.includes("often") ||
        text.includes("every 30") ||
        text.includes("nurse so much")
      ) {
        return `🤱 **Surviving Cluster Feeding & Night 2**:
Night 2 is universally known in pediatric medicine as "Cluster Feeding Night"!
• **Why it happens**: Your baby is waking up from the initial birth recovery slumber and instinctively nurses frequently (every 30–60 minutes) to stimulate Mom's prolactin receptors and bring in mature milk.
• **Normal Newborn Stomach Capacity**: Day 1: 5–7 ml (cherry); Day 2: 10–15 ml (walnut); Day 3: 22–27 ml (apricot).
• **Pro-Tips**: Feed on demand, do skin-to-skin, keep a giant water bottle handy, and have your partner handle burping and diaper changes so Mom can rest between latches.`;
      }

      // 3. Waking a sleepy newborn
      if (
        text.includes("wake") ||
        text.includes("sleepy") ||
        text.includes("won't wake") ||
        text.includes("waking")
      ) {
        return `😴 **How to Wake a Sleepy Newborn to Feed**:
Newborns must feed 8–12 times per 24 hours (every 2–3 hours from start of feed). If baby is very sleepy:
1. **Undress**: Strip baby down to their diaper.
2. **Skin-to-Skin**: Place baby bare-chested against your chest.
3. **Diaper Change**: Changing their diaper gently stimulates them.
4. **Cool Damp Cloth**: Lightly wipe baby's forehead or feet.
5. **Burp Position**: Sit baby upright supporting the jaw/chest and gently massage their back.`;
      }

      // 4. Umbilical cord care
      if (text.includes("cord") || text.includes("umbilical") || text.includes("stump")) {
        return `🩺 **Umbilical Cord Stump Care**:
• Keep it clean, dry, and exposed to air.
• Fold the top waistband of the diaper down below the stump to prevent urine contamination.
• Sponge-bathe baby until the cord stump naturally falls off (typically 7–21 days).
• Never pull or tug on it. Contact your doctor if you see red spreading skin around the base, foul-smelling yellow pus, or active bleeding.`;
      }

      // 5. Weight loss & Jaundice
      if (
        text.includes("weight") ||
        text.includes("jaundice") ||
        text.includes("yellow skin") ||
        text.includes("regain")
      ) {
        return `⚖️ **Newborn Weight & Jaundice**:
• **Weight Loss**: It is clinically normal for newborns to lose up to 7%–10% of their birth weight in the first 3–4 days. They should stop losing weight and regain birth weight by Day 10–14.
• **Jaundice (Bilirubin)**: Mild yellowing of the skin and whites of eyes often peaks around Days 3–5. Frequent feedings help baby clear bilirubin through wet and dirty diapers! If yellowing spreads down to baby's abdomen or thighs, notify your pediatrician.`;
      }

      // 6. Safe Sleep
      if (text.includes("sleep") || text.includes("crib") || text.includes("bassinet") || text.includes("abc")) {
        return `🌙 **Safe Sleep ABCs (AAP Guidelines)**:
• **A - Alone**: In their own crib or bassinet with a firm mattress and tight fitted sheet. No pillows, blankets, bumpers, or plush toys.
• **B - Back**: Always place baby to sleep on their back for all naps and night sleep.
• **C - Clear Crib**: Keep the sleeping area clear of loose bedding. Room-sharing with parents for the first 6 months reduces SIDS risk by up to 50%!`;
      }

      // 7. Today's live stats breakdown for baby
      if (
        text.includes("summary") ||
        text.includes("status") ||
        text.includes("stats") ||
        text.includes("today")
      ) {
        const babyName = baby?.name || "Baby";
        return `📊 **Today's Newborn Status for ${babyName}**:
• 🍼 Feeds logged: ${summary24h.totalFeeds} (${summary24h.nursingFeeds} nursing, ${summary24h.bottleFeeds} bottle)
• 💧 Wet diapers: ${summary24h.wetDiapers}
• 💩 Dirty diapers: ${summary24h.dirtyDiapers}
• 🤱 Next nursing side recommendation: ${summary24h.nextBreastSide ? summary24h.nextBreastSide.toUpperCase() : "Either side"}

You are doing an incredible job in these initial days! Let me know if you have any questions about stool colors, feeding intervals, or weight recovery.`;
      }
    }

    // Prenatal checks
    // 1. Kick checks
    if (text.includes("kick") || text.includes("movement") || text.includes("move")) {
      return `According to my records, you have logged ${kickCount} fetal kick(s) today. Clinically, a kick count of 10 movements within a 2-hour window once or twice a day is a standard sign of a healthy, active baby. If your baby is sleeping, a glass of cold water or a light snack can help wake them up! 👣`;
    }

    // 2. Milk checks
    if (
      text.includes("milk") ||
      text.includes("calcium") ||
      text.includes("drink") ||
      text.includes("glass") ||
      text.includes("cup")
    ) {
      const remaining = 2 - milkCount;
      if (milkCount >= 2) {
        return `Congratulations! You have met your daily prenatal calcium goal of at least 2 glasses of milk (logged: ${milkCount} servings today). Calcium is essential for your baby's skeletal development and protects your bone density. Brilliant job! 🥛🌟`;
      } else {
        return `You have logged ${milkCount} serving(s) of milk today. Since pregnant women need at least 2 servings per day, you should aim to drink at least ${remaining} more glass(es) today to reach your target! 🥛`;
      }
    }

    // 3. Blood sugar checks
    if (
      text.includes("sugar") ||
      text.includes("glucose") ||
      text.includes("blood sugar") ||
      text.includes("diabetes") ||
      text.includes("fasting")
    ) {
      const todayLogs = glucoseLogs.filter((l) => l.date === todayStr);
      const fasting = todayLogs.find((l) => l.slot === "fasting");
      const lunch = todayLogs.find((l) => l.slot === "post-lunch");
      const dinner = todayLogs.find((l) => l.slot === "post-dinner");

      const latestFastingVal = fasting ? `${fasting.value} mg/dL` : "Not logged";
      const latestLunchVal = lunch ? `${lunch.value} mg/dL` : "Not logged";
      const latestDinnerVal = dinner ? `${dinner.value} mg/dL` : "Not logged";

      const fastingReadings = glucoseLogs
        .filter((l) => l.slot === "fasting")
        .map((l) => l.value);
      const fastingAvg =
        fastingReadings.length > 0
          ? Math.round(
              fastingReadings.reduce((a, b) => a + b, 0) / fastingReadings.length,
            )
          : null;

      let response = `Here is your current Gestational Diabetes logs breakdown:\n`;
      response += `• Fasting: ${latestFastingVal} (Target: < 95)\n`;
      response += `• Post-Lunch: ${latestLunchVal} (Target: < 140)\n`;
      response += `• Post-Dinner: ${latestDinnerVal} (Target: < 140)\n\n`;

      if (fastingAvg) {
        response += `Your historical average fasting level is ${fastingAvg} mg/dL. `;
        if (fastingAvg >= 95) {
          response += `This average is elevated (target is < 95). We recommend sharing these trends with your OB-GYN. Pro-tip: Try a complex-carb high-protein evening snack to help regulate fasting morning levels! 🩸`;
        } else {
          response += `Which is in the excellent healthy range! Way to manage your prenatal nutrition! 🌟`;
        }
      } else if (todayLogs.length === 0) {
        response += `No blood sugar readings recorded today. Please enter a value in one of the slot cards to compile stats!`;
      }

      return response;
    }

    // 4. Contractions
    if (
      text.includes("contraction") ||
      text.includes("pain") ||
      text.includes("cramp") ||
      text.includes("labor")
    ) {
      return `Contractions can either be practice contractions (Braxton Hicks) or true labor. True labor contractions follow a pattern: they get closer together, last longer (usually 30-70 seconds), and strengthen over time. Remember the 5-1-1 rule: if contractions occur every 5 minutes, lasting 1 minute, for at least 1 hour, contact your health provider immediately! 🚨`;
    }

    // 5. General fallback
    if (isNewborn) {
      return `I'm here to support you with your newborn! You can ask me:
• "Is black meconium normal today?"
• "Why is baby cluster feeding tonight?"
• "How do we wake a sleepy baby to nurse?"
• "What are safe sleep guidelines?"
• "Give me today's care stats"`;
    }

    return `I hear you! As your prenatal companion, I can analyze your logs. Try asking me:
- "Did I meet my milk goals today?"
- "What is my fasting blood sugar average?"
- "How is my baby's movement today?"
- "Give me a daily summary of my stats"`;
  };

  const handleSend = (textToSend?: string) => {
    const rawText = textToSend || inputVal;
    if (!rawText.trim()) return;

    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      sender: "user",
      text: rawText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputVal("");
    setIsTyping(true);

    setTimeout(() => {
      const responseText = generateResponse(rawText);
      const aiMessage: Message = {
        id: Math.random().toString(36).substring(7),
        sender: "ai",
        text: responseText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 600);
  };

  // Listen for custom event from Newborn Dashboard 1-tap questions
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ question?: string }>;
      setIsOpen(true);
      if (customEvent.detail?.question) {
        handleSend(customEvent.detail.question);
      }
    };
    window.addEventListener("open-lumina-chat", handler);
    return () => window.removeEventListener("open-lumina-chat", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isNewborn = activeMode === "newborn" || !!baby;

  return (
    <>
      {/* Floating Chat Trigger Button in bottom right corner */}
      <div className="fixed bottom-24 right-6 lg:bottom-6 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95 cursor-pointer relative group ${
              isNewborn
                ? "bg-gradient-to-tr from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 shadow-cyan-500/20"
                : "bg-gradient-to-tr from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 shadow-cyan-500/20"
            }`}
            title="Open AI Clinical Assistant"
          >
            {isNewborn ? (
              <BabyIcon size={26} weight="bold" />
            ) : (
              <ChatCircle size={24} weight="bold" />
            )}
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-slate-900 animate-pulse" />
          </button>
        )}
      </div>

      {/* Chat Drawer Side Panel */}
      <div
        className={`fixed z-[160] transition-all duration-300 ease-out transform shadow-2xl flex flex-col backdrop-blur-2xl border border-slate-850/80 bg-slate-950/95
          bottom-24 right-4 left-4 rounded-3xl h-[480px] max-h-[calc(100dvh-130px)]
          sm:left-auto sm:right-6 sm:w-[400px] sm:h-[560px] sm:max-h-[calc(100dvh-120px)]
          ${isOpen ? "translate-y-0 opacity-100 scale-100" : "translate-y-12 opacity-0 scale-95 pointer-events-none"}
        `}
      >
        <div className="flex flex-col h-full overflow-hidden rounded-3xl">
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-slate-850 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-slate-950 ${
                  isNewborn
                    ? "bg-gradient-to-tr from-cyan-400 to-blue-500"
                    : "bg-gradient-to-tr from-cyan-500 to-indigo-500"
                }`}
              >
                {isNewborn ? (
                  <BabyIcon size={20} weight="bold" />
                ) : (
                  <Robot size={20} weight="bold" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">
                  {isNewborn
                    ? `Lumina Pediatric Assistant ${baby ? `(${baby.name})` : ""}`
                    : "Lumina AI Companion"}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                    Clinical Guidance Synced
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white text-xs px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Close</span> <X size={12} weight="bold" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${
                  msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {msg.sender === "ai" && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 flex-shrink-0 flex items-center justify-center text-xs text-cyan-400">
                    <Sparkle size={14} weight="fill" />
                  </div>
                )}
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                    msg.sender === "user"
                      ? "bg-gradient-to-br from-cyan-600/90 to-blue-600/90 text-white rounded-tr-none shadow-md border border-cyan-500/20"
                      : "bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 max-w-[80%] mr-auto">
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex-shrink-0 flex items-center justify-center text-xs text-cyan-400 animate-pulse">
                  <Sparkle size={14} weight="fill" />
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 rounded-tl-none flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-4 py-2 bg-slate-950/40 border-t border-slate-850/60 overflow-x-auto scrollbar-none flex gap-2">
            {isNewborn ? (
              <>
                <button
                  onClick={() => handleSend("Is sticky black meconium normal?")}
                  className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-[10px] text-cyan-300 border border-slate-800 hover:border-slate-700 whitespace-nowrap transition-colors cursor-pointer"
                >
                  💩 Meconium Normal?
                </button>
                <button
                  onClick={() => handleSend("Why is baby cluster feeding?")}
                  className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-[10px] text-cyan-300 border border-slate-800 hover:border-slate-700 whitespace-nowrap transition-colors cursor-pointer"
                >
                  🤱 Cluster Feeding
                </button>
                <button
                  onClick={() => handleSend("How to wake a sleepy newborn?")}
                  className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-[10px] text-cyan-300 border border-slate-800 hover:border-slate-700 whitespace-nowrap transition-colors cursor-pointer"
                >
                  😴 Wake Sleepy Baby
                </button>
                <button
                  onClick={() => handleSend("Give me today's care stats")}
                  className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-[10px] text-cyan-300 border border-slate-800 hover:border-slate-700 whitespace-nowrap transition-colors cursor-pointer"
                >
                  📊 Today&apos;s Stats
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleSend("Did I meet my milk goals today?")}
                  className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-[10px] text-cyan-300 border border-slate-800 hover:border-slate-700 whitespace-nowrap transition-colors cursor-pointer"
                >
                  🥛 Milk Progress
                </button>
                <button
                  onClick={() => handleSend("What is my fasting blood sugar average?")}
                  className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-[10px] text-cyan-300 border border-slate-800 hover:border-slate-700 whitespace-nowrap transition-colors cursor-pointer"
                >
                  🩸 Blood Sugar
                </button>
                <button
                  onClick={() => handleSend("How are my kicks today?")}
                  className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-[10px] text-cyan-300 border border-slate-800 hover:border-slate-700 whitespace-nowrap transition-colors cursor-pointer"
                >
                  👣 Kick Counts
                </button>
              </>
            )}
          </div>

          {/* Chat Input Field */}
          <div className="p-3 bg-slate-900/60 border-t border-slate-850">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder={
                  isNewborn
                    ? "Ask about meconium, feeding, sleep..."
                    : "Ask about kicks, blood sugar, symptoms..."
                }
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 transition-colors"
              />
              <button
                type="submit"
                disabled={!inputVal.trim()}
                className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex-shrink-0"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
