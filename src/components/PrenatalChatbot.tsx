"use client";

import { useState, useEffect, useRef } from "react";
import { collection, query, where, orderBy, onSnapshot, limit } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { ChatCircle, Robot, Sparkle, ChartBar, Drop, ThermometerHot, X } from "@phosphor-icons/react";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
}

export default function PrenatalChatbot() {
  const { user, familyId } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Hello! I am your Lumina Prenatal Assistant. I sync directly with your dashboard database. Ask me about your kicks, blood sugar trends, milk intake, or general prenatal wellness guidelines!",
      timestamp: new Date(),
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Live Database Statistics State
  const [kickCount, setKickCount] = useState(0);
  const [milkCount, setMilkCount] = useState(0);
  const [glucoseLogs, setGlucoseLogs] = useState<{ value: number; slot: string; date: string }[]>([]);

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

  // Subscribe to Kicks, Milk, and Blood Sugar to serve as the Bot's database context
  useEffect(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    let unsubKicks = () => { };
    let unsubMilk = () => { };
    let unsubGlucose = () => { };

    if (user) {
      // 1. Subscribe to Kicks today
      let qKicks;
      if (familyId) {
        qKicks = query(
          collection(db, "families", familyId, "kicks"),
          where("createdAt", ">=", startOfDay)
        );
      } else {
        qKicks = query(
          collection(db, "kicks"),
          where("userId", "==", user.uid),
          where("createdAt", ">=", startOfDay)
        );
      }
      unsubKicks = onSnapshot(qKicks, (snapshot) => {
        setKickCount(snapshot.size);
      });

      // 2. Subscribe to Milk today
      let qMilk;
      if (familyId) {
        qMilk = query(
          collection(db, "families", familyId, "milk"),
          where("createdAt", ">=", startOfDay)
        );
      } else {
        qMilk = query(
          collection(db, "milk"),
          where("userId", "==", user.uid),
          where("createdAt", ">=", startOfDay)
        );
      }
      unsubMilk = onSnapshot(qMilk, (snapshot) => {
        setMilkCount(snapshot.size);
      });

      // 3. Subscribe to Blood Sugar records
      let qGlucose;
      if (familyId) {
        qGlucose = query(
          collection(db, "families", familyId, "bloodsugar"),
          orderBy("createdAt", "desc"),
          limit(20)
        );
      } else {
        qGlucose = query(
          collection(db, "bloodsugar"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(20)
        );
      }
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
      // Guest local storage fallback polling / reading
      const readGuestLogs = () => {
        // Kicks count simulation count
        setKickCount(0); // For simple display, kicks are usually in counter component state or localStorage
        // Let's read guest kicks from counter fallback if saved
        // Guest Milk
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

        // Guest Glucose
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
      // Simple window polling or interval for guest tracking
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

    // 1. Kick checks
    if (text.includes("kick") || text.includes("movement") || text.includes("move")) {
      return `According to my records, you have logged ${kickCount} fetal kick(s) today. Clinically, a kick count of 10 movements within a 2-hour window once or twice a day is a standard sign of a healthy, active baby. If your baby is sleeping, a glass of cold water or a light snack can help wake them up! 👣`;
    }

    // 2. Milk checks
    if (text.includes("milk") || text.includes("calcium") || text.includes("drink") || text.includes("glass") || text.includes("cup")) {
      const remaining = 2 - milkCount;
      if (milkCount >= 2) {
        return `Congratulations! You have met your daily prenatal calcium goal of at least 2 glasses of milk (logged: ${milkCount} servings today). Calcium is essential for your baby's skeletal development and protects your bone density. Brilliant job! 🥛🌟`;
      } else {
        return `You have logged ${milkCount} serving(s) of milk today. Since pregnant women need at least 2 servings per day, you should aim to drink at least ${remaining} more glass(es) today to reach your target! 🥛`;
      }
    }

    // 3. Blood sugar checks
    if (text.includes("sugar") || text.includes("glucose") || text.includes("blood sugar") || text.includes("diabetes") || text.includes("fasting")) {
      const todayLogs = glucoseLogs.filter((l) => l.date === todayStr);
      const fasting = todayLogs.find((l) => l.slot === "fasting");
      const lunch = todayLogs.find((l) => l.slot === "post-lunch");
      const dinner = todayLogs.find((l) => l.slot === "post-dinner");

      const latestFastingVal = fasting ? `${fasting.value} mg/dL` : "Not logged";
      const latestLunchVal = lunch ? `${lunch.value} mg/dL` : "Not logged";
      const latestDinnerVal = dinner ? `${dinner.value} mg/dL` : "Not logged";

      // Calculate averages from historical logs
      const fastingReadings = glucoseLogs.filter((l) => l.slot === "fasting").map((l) => l.value);
      const fastingAvg = fastingReadings.length > 0
        ? Math.round(fastingReadings.reduce((a, b) => a + b, 0) / fastingReadings.length)
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

    // 4. Summaries
    if (text.includes("summary") || text.includes("status") || text.includes("progress") || text.includes("how is my day") || text.includes("stats")) {
      const milkGoalMet = milkCount >= 2;
      return `📊 Here is your Lumina Prenatal Consolidated Status for today (${new Date().toLocaleDateString()}):
• 👣 Fetal Kicks: ${kickCount} kicks recorded.
• 🥛 Milk: ${milkCount}/2 cups logged (${milkGoalMet ? "Goal Met! 🎉" : "Pending 🥛"}).
• 🩸 Blood Sugar today: ${glucoseLogs.filter(l => l.date === todayStr).length} of 3 slots filled.

Keep up the outstanding effort tracking your milestones! Let me know if you want to dive deeper into any of these statistics.`;
    }

    // 5. Nausea or common symptoms
    if (text.includes("nausea") || text.includes("vomit") || text.includes("morning sickness") || text.includes("sick")) {
      return `Nausea and morning sickness are very common, especially in the 1st and early 2nd trimesters. 🤒 Pro-tips:
1. Eat small, frequent meals rather than large ones.
2. Keep ginger candies, ginger tea, or plain crackers near your bed.
3. Drink water between meals rather than during them.
*Always consult your physician if you experience extreme dehydration or severe vomiting (Hyperemesis Gravidarum).*`;
    }

    // 6. Contractions
    if (text.includes("contraction") || text.includes("pain") || text.includes("cramp") || text.includes("labor")) {
      return `Contractions can either be practice contractions (Braxton Hicks) or true labor. True labor contractions follow a pattern: they get closer together, last longer (usually 30-70 seconds), and strengthen over time. Remember the 5-1-1 rule: if contractions occur every 5 minutes, lasting 1 minute, for at least 1 hour, contact your health provider immediately! 🚨`;
    }

    // 7. General fallback
    return `I hear you! As your prenatal companion, I can analyze your logs. Try asking me:
- "Did I meet my milk goals today?"
- "What is my fasting blood sugar average?"
- "How is my baby's movement today?"
- "Give me a daily summary of my stats"

Or share any symptoms (like nausea, fatigue, or contractions) for helpful guides!`;
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

    // Simulate AI response stream
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
    }, 1000);
  };

  return (
    <>
      {/* Floating Chat Trigger Button in bottom right corner */}
      <div className="fixed bottom-24 right-6 lg:bottom-6 z-50">
        {isOpen ? '' :
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95 cursor-pointer relative group ${isOpen
              ? "bg-slate-800 text-cyan-400 border border-cyan-800/40"
              : "bg-gradient-to-tr from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 shadow-cyan-500/20"
              }`}
            title="Open Prenatal Chat Assistant"
          >
            <ChatCircle size={24} weight="bold" />
            {/* Pulsing indicator when closed */}
            {!isOpen && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-slate-900 animate-pulse" />
            )}
          </button>
        }
      </div>

      {/* Chat Drawer Side Panel */}
      <div
        className={`fixed z-100 transition-all duration-300 ease-out transform shadow-2xl flex flex-col backdrop-blur-2xl border border-slate-850/80 bg-slate-950/90
          bottom-24 right-4 left-4 rounded-2xl h-[480px] max-h-[calc(100dvh-130px)]
          sm:left-auto sm:right-6 sm:w-[400px] sm:h-[550px] sm:max-h-[calc(100dvh-120px)]
          ${isOpen ? "translate-y-0 opacity-100 scale-100" : "translate-y-12 opacity-0 scale-95 pointer-events-none"}
        `}
      >
        <div className="flex flex-col h-full overflow-hidden rounded-2xl">
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-850 bg-slate-900/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-slate-950">
                <Robot size={20} weight="bold" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">Lumina AI Companion</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Database Synced</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white text-xs px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Minimize</span> <X size={12} weight="bold" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
              >
                {msg.sender === "ai" && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 flex-shrink-0 flex items-center justify-center text-xs text-cyan-400">
                    <Sparkle size={14} weight="fill" />
                  </div>
                )}
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${msg.sender === "user"
                    ? "bg-gradient-to-br from-cyan-600/90 to-indigo-600/90 text-white rounded-tr-none shadow-md shadow-cyan-900/10 border border-cyan-500/20"
                    : "bg-slate-900/80 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm"
                    }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 mr-auto max-w-[85%]">
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex-shrink-0 flex items-center justify-center text-xs text-cyan-400 animate-pulse">
                  <Sparkle size={14} weight="fill" />
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 rounded-tl-none text-slate-400 text-xs flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-5 py-2 border-t border-slate-900 bg-slate-950 flex gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => handleSend("Give me a daily summary")}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ChartBar size={12} weight="bold" />
              <span>Daily Summary</span>
            </button>
            <button
              onClick={() => handleSend("What are my blood sugar averages?")}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Drop size={12} weight="bold" />
              <span>Sugar Levels</span>
            </button>
            <button
              onClick={() => handleSend("Did I meet my milk goals today?")}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-bold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Drop size={12} weight="fill" />
              <span>Milk Intake</span>
            </button>
            <button
              onClick={() => handleSend("Is nausea normal in pregnancy?")}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-bold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ThermometerHot size={12} weight="bold" />
              <span>Morning Sickness</span>
            </button>
          </div>

          {/* Input Panel */}
          <div className="p-5 border-t border-slate-850 bg-slate-900/40">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask me anything..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-white outline-none focus:border-cyan-500 text-xs h-11"
              />
              <button
                onClick={() => handleSend()}
                className="px-4 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-extrabold text-xs shadow-md shadow-cyan-500/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center h-11"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
