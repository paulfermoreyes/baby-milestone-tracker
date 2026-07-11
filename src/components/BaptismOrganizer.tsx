"use client";

import { useState, useEffect } from "react";
import { doc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Crown,
  Plus,
  Trash,
  Pencil,
  Warning,
  Sparkle,
  UserPlus
} from "@phosphor-icons/react";

export type InviteeRole = "godfather" | "godmother" | "priest" | "guest" | "other";
export type InviteeStatus = "confirmed" | "pending" | "declined";

export interface Invitee {
  id: string;
  name: string;
  role: InviteeRole;
  status: InviteeStatus;
}

interface BaptismEventData {
  date: string;
  time: string;
  venueName: string;
  venueAddress: string;
  invitees: Invitee[];
}

export default function BaptismOrganizer() {
  const { user, familyId } = useAuth();
  
  // Event details state
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [invitees, setInvitees] = useState<Invitee[]>([]);
  
  // UI states
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // Input fields for editing event
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editVenueName, setEditVenueName] = useState("");
  const [editVenueAddress, setEditVenueAddress] = useState("");
  
  // Form input states for new invitee
  const [newInviteeName, setNewInviteeName] = useState("");
  const [newInviteeRole, setNewInviteeRole] = useState<InviteeRole>("guest");
  const [newInviteeStatus, setNewInviteeStatus] = useState<InviteeStatus>("pending");
  
  const [activeFilter, setActiveFilter] = useState<"all" | "godparents" | "guests">("all");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  // Real-time Firestore sync or localStorage fallback
  useEffect(() => {
    if (!isClient) return;

    if (!user) {
      // Guest mode
      const localData = localStorage.getItem("lumina_guest_baptism");
      if (localData) {
        try {
          const parsed = JSON.parse(localData) as BaptismEventData;
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setDate(parsed.date || "");
          setTime(parsed.time || "");
          setVenueName(parsed.venueName || "");
          setVenueAddress(parsed.venueAddress || "");
          setInvitees(parsed.invitees || []);
        } catch (e) {
          console.error("Failed to parse guest baptism data", e);
        }
      }
      return;
    }

    // Authenticated Firestore sync
    const docRef = familyId
      ? doc(db, "families", familyId, "baptism", "event")
      : doc(db, "baptism", user.uid);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setDate(data.date || "");
          setTime(data.time || "");
          setVenueName(data.venueName || "");
          setVenueAddress(data.venueAddress || "");
          setInvitees(data.invitees || []);
        }
      },
      (err) => {
        console.error("Error reading baptism event from Firestore:", err);
      }
    );

    return () => unsubscribe();
  }, [user, familyId, isClient]);

  // Sync event details edit form states
  const startEditing = () => {
    setEditDate(date);
    setEditTime(time);
    setEditVenueName(venueName);
    setEditVenueAddress(venueAddress);
    setIsEditingEvent(true);
  };

  const handleSaveEventDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      // Local storage guest mode
      const guestData = {
        date: editDate,
        time: editTime,
        venueName: editVenueName,
        venueAddress: editVenueAddress,
        invitees
      };
      setDate(editDate);
      setTime(editTime);
      setVenueName(editVenueName);
      setVenueAddress(editVenueAddress);
      localStorage.setItem("lumina_guest_baptism", JSON.stringify(guestData));
      setIsEditingEvent(false);
      return;
    }

    try {
      const docRef = familyId
        ? doc(db, "families", familyId, "baptism", "event")
        : doc(db, "baptism", user.uid);

      await setDoc(
        docRef,
        {
          date: editDate,
          time: editTime,
          venueName: editVenueName,
          venueAddress: editVenueAddress,
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
          userId: user.uid
        },
        { merge: true }
      );

      setDate(editDate);
      setTime(editTime);
      setVenueName(editVenueName);
      setVenueAddress(editVenueAddress);
      setIsEditingEvent(false);
    } catch (err) {
      console.error("Failed to save event details:", err);
      alert("Failed to save event details to the cloud.");
    }
  };

  const saveInvitees = async (updatedInvitees: Invitee[]) => {
    if (!user) {
      const guestData = {
        date,
        time,
        venueName,
        venueAddress,
        invitees: updatedInvitees
      };
      setInvitees(updatedInvitees);
      localStorage.setItem("lumina_guest_baptism", JSON.stringify(guestData));
      return;
    }

    try {
      const docRef = familyId
        ? doc(db, "families", familyId, "baptism", "event")
        : doc(db, "baptism", user.uid);

      await setDoc(
        docRef,
        {
          invitees: updatedInvitees,
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
          userId: user.uid
        },
        { merge: true }
      );
      setInvitees(updatedInvitees);
    } catch (err) {
      console.error("Failed to save invitees:", err);
      alert("Failed to save invitee list.");
    }
  };

  const handleAddInvitee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInviteeName.trim()) return;

    const newInvitee: Invitee = {
      id: Math.random().toString(36).substring(7),
      name: newInviteeName.trim(),
      role: newInviteeRole,
      status: newInviteeStatus
    };

    const updated = [...invitees, newInvitee];
    await saveInvitees(updated);

    // Reset invitee form fields
    setNewInviteeName("");
    setNewInviteeRole("guest");
    setNewInviteeStatus("pending");
  };

  const handleDeleteInvitee = async (id: string) => {
    const updated = invitees.filter((inv) => inv.id !== id);
    await saveInvitees(updated);
  };

  const handleUpdateStatus = async (id: string, status: InviteeStatus) => {
    const updated = invitees.map((inv) => (inv.id === id ? { ...inv, status } : inv));
    await saveInvitees(updated);
  };

  const triggerAuthModal = () => {
    const dialog = document.querySelector("dialog.auth-dialog") as HTMLDialogElement;
    if (dialog) dialog.showModal();
  };

  // Calculations
  const totalInvitees = invitees.length;
  const confirmedCount = invitees.filter((inv) => inv.status === "confirmed").length;
  const pendingCount = invitees.filter((inv) => inv.status === "pending").length;
  const declinedCount = invitees.filter((inv) => inv.status === "declined").length;
  
  const rsvpRate = totalInvitees > 0 ? Math.round((confirmedCount / totalInvitees) * 100) : 0;
  
  const godparents = invitees.filter((inv) => inv.role === "godfather" || inv.role === "godmother");
  const godparentsConfirmed = godparents.filter((inv) => inv.status === "confirmed").length;
  const godparentsTotal = godparents.length;

  const getCountdownText = () => {
    if (!date) return "";
    const eventDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Today is the day! 🎉";
    } else if (diffDays > 0) {
      return `${diffDays} days to go! ⏳`;
    } else {
      return `Completed (${Math.abs(diffDays)} days ago) ✅`;
    }
  };

  const getFormattedDate = () => {
    if (!date) return "No date set";
    const [year, month, day] = date.split("-");
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Filter invitees
  const filteredInvitees = invitees.filter((inv) => {
    if (activeFilter === "godparents") {
      return inv.role === "godfather" || inv.role === "godmother";
    }
    if (activeFilter === "guests") {
      return inv.role === "guest" || inv.role === "priest" || inv.role === "other";
    }
    return true;
  });

  const getRoleBadge = (role: InviteeRole) => {
    switch (role) {
      case "godfather":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border bg-indigo-500/15 border-indigo-500/30 text-indigo-400">
            <Crown size={10} weight="fill" />
            <span>Godfather</span>
          </span>
        );
      case "godmother":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border bg-pink-500/15 border-pink-500/30 text-pink-400">
            <Crown size={10} weight="fill" />
            <span>Godmother</span>
          </span>
        );
      case "priest":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-purple-500/15 border-purple-500/30 text-purple-400">
            <span>Priest</span>
          </span>
        );
      case "other":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium border bg-slate-500/10 border-slate-550 text-slate-400">
            <span>Other</span>
          </span>
        );
      case "guest":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium border bg-sky-500/10 border-sky-500/20 text-sky-400">
            <span>Guest</span>
          </span>
        );
    }
  };

  const getStatusClass = (status: InviteeStatus) => {
    switch (status) {
      case "confirmed":
        return "bg-emerald-500/15 border-emerald-500/30 text-emerald-400";
      case "declined":
        return "bg-rose-500/15 border-rose-500/30 text-rose-400";
      case "pending":
      default:
        return "bg-amber-500/15 border-amber-500/30 text-amber-400";
    }
  };

  return (
    <div className="space-y-8">
      {/* Guest Mode Banner */}
      {!user && isClient && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/20 text-xs font-semibold text-amber-400 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <Warning size={18} weight="bold" className="shrink-0" />
            <span>Guest Preview Session: Changes are saved locally and will be cleared on logout.</span>
          </div>
          <button
            onClick={triggerAuthModal}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold transition-all text-[10px] tracking-wider uppercase cursor-pointer"
          >
            Sync with Cloud
          </button>
        </div>
      )}

      {/* Main Grid: Left (Details & Form) - Right (Invitee List) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Event Organizer details & Form */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Event Details Card */}
          <div className="glass-card p-6 bg-slate-800/30 border border-slate-700/30 rounded-2xl relative overflow-hidden hover:border-slate-600/40 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkle size={14} weight="fill" />
                <span>Ceremony & Celebration</span>
              </span>
              
              {!isEditingEvent && (
                <button
                  onClick={startEditing}
                  className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-850 hover:border-slate-700 hover:text-purple-400 text-slate-400 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                >
                  <Pencil size={12} weight="bold" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {isEditingEvent ? (
              <form onSubmit={handleSaveEventDetails} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label htmlFor="event-date" className="text-xs font-bold text-slate-300">Date</label>
                  <input
                    id="event-date"
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="auth-input"
                    required
                  />
                </div>
                
                <div className="space-y-1.5 text-left">
                  <label htmlFor="event-time" className="text-xs font-bold text-slate-300">Time</label>
                  <input
                    id="event-time"
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="auth-input"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label htmlFor="event-venue-name" className="text-xs font-bold text-slate-300">Venue Name</label>
                  <input
                    id="event-venue-name"
                    type="text"
                    placeholder="e.g. St. Peter's Cathedral"
                    value={editVenueName}
                    onChange={(e) => setEditVenueName(e.target.value)}
                    className="auth-input"
                    required
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label htmlFor="event-venue-address" className="text-xs font-bold text-slate-300">Address / Location</label>
                  <textarea
                    id="event-venue-address"
                    placeholder="e.g. 123 Church St, Cityville"
                    value={editVenueAddress}
                    onChange={(e) => setEditVenueAddress(e.target.value)}
                    rows={2}
                    className="auth-input"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Save Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingEvent(false)}
                    className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-5 text-left">
                <div>
                  <h3 className="text-xl font-extrabold text-white mb-1.5">
                    {venueName || "Set Baptism Venue"}
                  </h3>
                  {date && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <span>{getCountdownText()}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-1 text-slate-300 text-xs">
                  <div className="flex items-start gap-3">
                    <Calendar size={18} weight="bold" className="text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white">Date</p>
                      <p className="text-slate-400">{getFormattedDate()}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock size={18} weight="bold" className="text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white">Time</p>
                      <p className="text-slate-400">{time ? `${time}` : "No time set"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin size={18} weight="bold" className="text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white">Location Address</p>
                      <p className="text-slate-400 leading-normal">{venueAddress || "No address set"}</p>
                    </div>
                  </div>
                </div>

                {user && familyId && (
                  <p className="text-[10px] text-indigo-400 font-semibold border-t border-slate-850/40 pt-3">
                    👥 Shared in real-time with your partner
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-5 bg-slate-800/30 border border-slate-700/30 rounded-2xl text-left">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">RSVP Rate</span>
              <div className="flex items-baseline gap-1.5 mt-2 mb-1">
                <span className="text-3xl font-black bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                  {rsvpRate}%
                </span>
                <span className="text-xs text-slate-500">confirmed</span>
              </div>
              
              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden mt-2.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                  style={{ width: `${rsvpRate}%` }}
                />
              </div>
            </div>

            <div className="glass-card p-5 bg-slate-800/30 border border-slate-700/30 rounded-2xl text-left">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Godparents</span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-3xl font-black text-pink-400">
                  {godparentsConfirmed}
                </span>
                <span className="text-xs text-slate-500">/ {godparentsTotal} RSVPs</span>
              </div>
              <p className="text-[9px] text-slate-400 mt-2 font-medium">Assigned godfather & godmother roles.</p>
            </div>
          </div>

          {/* Add Invitee Card */}
          <div className="glass-card p-6 bg-slate-800/30 border border-slate-700/30 rounded-2xl text-left">
            <h4 className="text-sm font-black text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <UserPlus size={16} weight="bold" className="text-purple-400" />
              <span>Add Guest or Godparent</span>
            </h4>

            <form onSubmit={handleAddInvitee} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="invitee-name" className="text-xs font-bold text-slate-400">Invitee Full Name</label>
                <input
                  id="invitee-name"
                  type="text"
                  placeholder="e.g. John Doe"
                  value={newInviteeName}
                  onChange={(e) => setNewInviteeName(e.target.value)}
                  className="auth-input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="invitee-role" className="text-xs font-bold text-slate-400">Assign Role</label>
                  <select
                    id="invitee-role"
                    value={newInviteeRole}
                    onChange={(e) => setNewInviteeRole(e.target.value as InviteeRole)}
                    className="auth-input cursor-pointer"
                  >
                    <option value="guest">Guest</option>
                    <option value="godfather">Godfather</option>
                    <option value="godmother">Godmother</option>
                    <option value="priest">Priest</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="invitee-status" className="text-xs font-bold text-slate-400">RSVP Status</label>
                  <select
                    id="invitee-status"
                    value={newInviteeStatus}
                    onChange={(e) => setNewInviteeStatus(e.target.value as InviteeStatus)}
                    className="auth-input cursor-pointer"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus size={14} weight="bold" />
                <span>Add to List</span>
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Invitees List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-card p-6 bg-slate-800/30 border border-slate-700/30 rounded-2xl text-left flex flex-col h-full min-h-[580px]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-850/60 mb-5">
              <div>
                <h4 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Users size={20} weight="bold" className="text-purple-400" />
                  <span>Event Invitee Directory</span>
                </h4>
                <p className="text-[10px] text-slate-450 dark:text-slate-400 font-bold block mt-1">
                  Total Guests: {totalInvitees} ({confirmedCount} Confirmed • {pendingCount} Pending • {declinedCount} Declined)
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex bg-slate-950/45 p-1 rounded-xl border border-slate-850/60">
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className={`py-1 px-3 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                    activeFilter === "all" ? "bg-slate-800 text-purple-400 shadow-sm" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("godparents")}
                  className={`py-1 px-3 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                    activeFilter === "godparents" ? "bg-slate-800 text-purple-400 shadow-sm" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Godparents
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("guests")}
                  className={`py-1 px-3 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                    activeFilter === "guests" ? "bg-slate-800 text-purple-400 shadow-sm" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Others
                </button>
              </div>
            </div>

            {/* List container */}
            {filteredInvitees.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-500 mb-3">
                  <Users size={22} weight="bold" />
                </div>
                <h5 className="text-sm font-bold text-white mb-1">No invitees found</h5>
                <p className="text-xs text-slate-400 max-w-xs leading-normal">
                  {activeFilter === "all"
                    ? "Start building your invitee directory. Add godfathers, godmothers, family, or friends using the form."
                    : activeFilter === "godparents"
                    ? "No godparents assigned yet. Select 'Godfather' or 'Godmother' role when adding."
                    : "No general guests or priests listed in this filter view."}
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto max-h-[500px] space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {filteredInvitees.map((invitee) => (
                  <div
                    key={invitee.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-xl bg-slate-900/40 border border-slate-850/50 gap-3 hover:border-slate-800 transition-colors"
                  >
                    {/* Left: Invitee info */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-950 flex items-center justify-center text-slate-450 dark:text-slate-400 border border-slate-850 text-xs font-black">
                        {invitee.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold text-white block">{invitee.name}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          {getRoleBadge(invitee.role)}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions and Status Dropdown */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 border-slate-850/30 pt-2 sm:pt-0">
                      {/* Status Selector dropdown directly in card */}
                      <select
                        value={invitee.status}
                        onChange={(e) => handleUpdateStatus(invitee.id, e.target.value as InviteeStatus)}
                        className={`py-1 px-2.5 rounded-lg border text-[10px] font-black uppercase tracking-wide cursor-pointer focus:outline-none ${getStatusClass(
                          invitee.status
                        )}`}
                      >
                        <option value="pending" className="bg-slate-950 text-amber-400">Pending</option>
                        <option value="confirmed" className="bg-slate-950 text-emerald-400">Confirmed</option>
                        <option value="declined" className="bg-slate-950 text-rose-400">Declined</option>
                      </select>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleDeleteInvitee(invitee.id)}
                        className="p-2 rounded-lg bg-slate-950 border border-slate-850 hover:border-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Remove Invitee"
                      >
                        <Trash size={12} weight="bold" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
