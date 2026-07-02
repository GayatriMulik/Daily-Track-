import { useState, useEffect, useRef } from "react";
import { 
  CalendarDays, 
  BookOpen, 
  Target, 
  Loader2, 
  CheckCircle, 
  AlertCircle
} from "lucide-react";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc, 
  getDoc 
} from "firebase/firestore";
import { db } from "./firebase";
import { TodoItem, Skill, Project, Playlist, PlaylistVideo } from "./types";

// Subcomponents
import DailyTrackView from "./components/DailyTrackView";
import CalendarView from "./components/CalendarView";
import SkillsView from "./components/SkillsView";
import ProjectsView from "./components/ProjectsView";

export default function App() {
  // Date Helpers
  const getTodayDateString = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split("T")[0];
  };

  // State Declarations
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [dailyFocus, setDailyFocus] = useState<string>("");
  const [isSavingFocus, setIsSavingFocus] = useState<boolean>(false);

  // Stable Workspace Database Identifier (Requires no login, persists securely in Cloud Firestore)
  const [workspaceUserId] = useState<string>(() => {
    let storedId = localStorage.getItem("dailytrack_workspace_user_id");
    if (!storedId) {
      storedId = "usr_" + Math.random().toString(36).substring(2, 12);
      localStorage.setItem("dailytrack_workspace_user_id", storedId);
    }
    return storedId;
  });
  
  // UI Notifications & Tabs
  const [activeTab, setActiveTab] = useState<"dailytrack" | "calendar" | "skills" | "projects">("dailytrack");
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Seeding lock
  const hasSeededRef = useRef<boolean>(false);

  // Timeout ref for daily focus debounce auto-save
  const focusSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Seed default data in Cloud Database if workspace is completely new
  const seedDefaultData = async (uid: string) => {
    try {
      // 1. Seed Skills (No emojis)
      const defaultSkills = [
        { name: "Machine Learning", category: "AI & Data Science", progress: 40, level: "Intermediate" as const },
        { name: "Full-Stack Development", category: "Software Engineering", progress: 65, level: "Intermediate" as const },
        { name: "Calculus & Algebra", category: "Mathematics", progress: 20, level: "Beginner" as const }
      ];
      const skillIdMap: { [key: string]: string } = {};
      for (let i = 0; i < defaultSkills.length; i++) {
        const docRef = await addDoc(collection(db, "skills"), {
          ...defaultSkills[i],
          userId: uid,
          createdAt: new Date(Date.now() - (3 - i) * 1000).toISOString()
        });
        skillIdMap[`skill-${i + 1}`] = docRef.id;
      }

      // 2. Seed Projects (No emojis)
      const defaultProjects = [
        { name: "AI Study Assistant", description: "An interactive classroom utility designed to schedule micro-goals using adaptive models.", status: "In Progress" as const, skillsApplied: [skillIdMap["skill-1"] || "", skillIdMap["skill-2"] || ""] },
        { name: "Personal Hub", description: "A highly custom light-themed personal calendar bento grid showcasing daily habits.", status: "Idea" as const, skillsApplied: [skillIdMap["skill-2"] || ""] }
      ];
      const projectIdMap: { [key: string]: string } = {};
      for (let i = 0; i < defaultProjects.length; i++) {
        const docRef = await addDoc(collection(db, "projects"), {
          ...defaultProjects[i],
          userId: uid,
          createdAt: new Date(Date.now() - (2 - i) * 1000).toISOString()
        });
        projectIdMap[`project-${i + 1}`] = docRef.id;
      }

      // 3. Seed Todos (No emojis)
      const defaultTodos = [
        { text: "Study machine learning fundamentals and neural layers", completed: false, category: "study" as const, date: getTodayDateString(), skillId: skillIdMap["skill-1"] || "", projectId: projectIdMap["project-1"] || "" },
        { text: "Wireframe custom personal portfolio responsive layouts", completed: true, category: "coding" as const, date: getTodayDateString(), skillId: skillIdMap["skill-2"] || "", projectId: projectIdMap["project-2"] || "" },
        { text: "Setup local workspace variables and environment keys", completed: false, category: "work" as const, date: getTodayDateString(), skillId: "", projectId: projectIdMap["project-1"] || "" }
      ];
      for (let i = 0; i < defaultTodos.length; i++) {
        await addDoc(collection(db, "todos"), {
          ...defaultTodos[i],
          userId: uid,
          createdAt: new Date(Date.now() - (3 - i) * 1000).toISOString()
        });
      }

      showNotification("Cloud workspace database initialized.");
    } catch (err) {
      console.error("Failed to seed default data:", err);
    }
  };

  // Ensure selectedDate is today's date when on dailytrack tab
  useEffect(() => {
    if (activeTab === "dailytrack") {
      setSelectedDate(getTodayDateString());
    }
  }, [activeTab]);

  // Fetch / Sync Todos, Skills, Projects, Playlists & Daily Focus from Cloud Database
  useEffect(() => {
    if (!workspaceUserId) return;

    // 1. Sync Todos - Ordered client-side to prevent Firestore composite index exceptions
    const todosQuery = query(
      collection(db, "todos"),
      where("userId", "==", workspaceUserId)
    );
    const unsubscribeTodos = onSnapshot(todosQuery, (snapshot) => {
      const list: TodoItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          text: data.text || "",
          completed: !!data.completed,
          category: data.category || "other",
          date: data.date || getTodayDateString(),
          skillId: data.skillId || "",
          projectId: data.projectId || "",
          playlistId: data.playlistId || "",
          videoId: data.videoId || "",
          createdAt: data.createdAt || ""
        } as TodoItem);
      });
      
      // Client-side sort by createdAt to support instant synchronization without needing composite indexes
      list.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      });

      setTodos(list);
    }, (err) => {
      console.error("Firestore sync error:", err);
    });

    // 2. Sync Skills - Ordered client-side to prevent Firestore composite index exceptions
    const skillsQuery = query(
      collection(db, "skills"),
      where("userId", "==", workspaceUserId)
    );
    const unsubscribeSkills = onSnapshot(skillsQuery, async (snapshot) => {
      const list: Skill[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          name: data.name || "",
          category: data.category || "",
          progress: data.progress || 0,
          level: data.level || "Beginner",
          createdAt: data.createdAt || ""
        } as Skill);
      });

      // If database is completely empty, initialize it automatically with default data
      if (list.length === 0 && !hasSeededRef.current) {
        hasSeededRef.current = true;
        await seedDefaultData(workspaceUserId);
        return;
      }

      // Client-side sort
      list.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      });

      setSkills(list);
    }, (err) => {
      console.error("Firestore sync error:", err);
    });

    // 3. Sync Projects - Ordered client-side to prevent Firestore composite index exceptions
    const projectsQuery = query(
      collection(db, "projects"),
      where("userId", "==", workspaceUserId)
    );
    const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
      const list: Project[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          name: data.name || "",
          description: data.description || "",
          status: data.status || "In Progress",
          skillsApplied: data.skillsApplied || [],
          githubUrl: data.githubUrl || "",
          demoUrl: data.demoUrl || "",
          notes: data.notes || "",
          createdAt: data.createdAt || ""
        } as Project);
      });

      // Client-side sort
      list.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      });

      setProjects(list);
    }, (err) => {
      console.error("Firestore sync error:", err);
    });

    // 4. Sync YouTube Playlists
    const playlistsQuery = query(
      collection(db, "playlists"),
      where("userId", "==", workspaceUserId)
    );
    const unsubscribePlaylists = onSnapshot(playlistsQuery, (snapshot) => {
      const list: Playlist[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          name: data.name || "",
          url: data.url || "",
          skillId: data.skillId || "",
          userId: data.userId || "",
          videos: data.videos || [],
          createdAt: data.createdAt || ""
        } as Playlist);
      });

      // Client-side sort
      list.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      });

      setPlaylists(list);
    }, (err) => {
      console.error("Firestore playlist sync error:", err);
    });

    // 5. Sync Daily Focus with onSnapshot
    const docId = `${workspaceUserId}_${selectedDate}`;
    const docRef = doc(db, "dailyNotes", docId);
    const unsubscribeFocus = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setDailyFocus(docSnap.data().focusText || "");
      } else {
        setDailyFocus("");
      }
    }, (err) => {
      console.warn("Offline or failed loading focus:", err);
    });

    return () => {
      unsubscribeTodos();
      unsubscribeSkills();
      unsubscribeProjects();
      unsubscribePlaylists();
      unsubscribeFocus();
    };
  }, [workspaceUserId, selectedDate]);

  // Handle Daily Focus Saving (Debounced Auto-Save)
  const handleFocusChange = (newVal: string) => {
    setDailyFocus(newVal);
    setIsSavingFocus(true);

    if (focusSaveTimeoutRef.current) {
      clearTimeout(focusSaveTimeoutRef.current);
    }

    focusSaveTimeoutRef.current = setTimeout(async () => {
      if (workspaceUserId) {
        try {
          const docId = `${workspaceUserId}_${selectedDate}`;
          await setDoc(doc(db, "dailyNotes", docId), {
            id: docId,
            userId: workspaceUserId,
            date: selectedDate,
            focusText: newVal,
            updatedAt: new Date().toISOString()
          });
        } catch (err) {
          console.error("Error saving focus:", err);
        }
      }
      setIsSavingFocus(false);
    }, 750);
  };

  // ==========================================
  // TODO OPERATIONS
  // ==========================================
  const handleAddTodo = async (
    text: string,
    category: TodoItem["category"],
    skillId?: string,
    projectId?: string
  ) => {
    const newTodoPayload = {
      text,
      completed: false,
      category,
      date: selectedDate,
      skillId: skillId || "",
      projectId: projectId || ""
    };

    try {
      await addDoc(collection(db, "todos"), {
        ...newTodoPayload,
        userId: workspaceUserId,
        createdAt: new Date().toISOString()
      });
      showNotification("Task successfully added to cloud database.");
    } catch (err: any) {
      showNotification("Could not add task.", "error");
    }
  };

  const handleToggleTodo = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "todos", id), {
        completed: !currentStatus
      });

      // Sync back to associated YouTube playlist video if linked
      const todoSnap = await getDoc(doc(db, "todos", id));
      if (todoSnap.exists()) {
        const todoData = todoSnap.data();
        if (todoData.playlistId && todoData.videoId) {
          const playlistRef = doc(db, "playlists", todoData.playlistId);
          const playlistSnap = await getDoc(playlistRef);
          if (playlistSnap.exists()) {
            const playlistData = playlistSnap.data();
            const updatedVideos = (playlistData.videos || []).map((v: PlaylistVideo) => {
              if (v.id === todoData.videoId) {
                return { ...v, completed: !currentStatus };
              }
              return v;
            });
            await updateDoc(playlistRef, { videos: updatedVideos });
          }
        }
      }
    } catch (err) {
      showNotification("Failed to update task progress.", "error");
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      // If linked to a playlist video, clear its scheduled markers in the playlist
      const todoSnap = await getDoc(doc(db, "todos", id));
      if (todoSnap.exists()) {
        const todoData = todoSnap.data();
        if (todoData.playlistId && todoData.videoId) {
          const playlistRef = doc(db, "playlists", todoData.playlistId);
          const playlistSnap = await getDoc(playlistRef);
          if (playlistSnap.exists()) {
            const playlistData = playlistSnap.data();
            const updatedVideos = (playlistData.videos || []).map((v: PlaylistVideo) => {
              if (v.id === todoData.videoId) {
                return { ...v, todoId: "", scheduledDate: "" };
              }
              return v;
            });
            await updateDoc(playlistRef, { videos: updatedVideos });
          }
        }
      }

      await deleteDoc(doc(db, "todos", id));
      showNotification("Task permanently deleted.");
    } catch (err) {
      showNotification("Could not delete task.", "error");
    }
  };

  const handleUpdateTodoText = async (id: string, text: string) => {
    try {
      await updateDoc(doc(db, "todos", id), { text });
    } catch (err) {
      showNotification("Rename failed.", "error");
    }
  };

  // ==========================================
  // SKILLS OPERATIONS
  // ==========================================
  const handleAddSkill = async (
    name: string,
    category: string,
    level: Skill["level"],
    progress: number
  ) => {
    const payload = { name, category, level, progress };

    try {
      await addDoc(collection(db, "skills"), {
        ...payload,
        userId: workspaceUserId,
        createdAt: new Date().toISOString()
      });
      showNotification("New skill registered.");
    } catch (err) {
      showNotification("Could not register skill.", "error");
    }
  };

  const handleDeleteSkill = async (id: string) => {
    try {
      // Delete any playlists associated with this skill
      const skillPlaylists = playlists.filter(p => p.skillId === id);
      for (const p of skillPlaylists) {
        await deleteDoc(doc(db, "playlists", p.id));
      }

      await deleteDoc(doc(db, "skills", id));
      showNotification("Skill deleted from matrix.");
    } catch (err) {
      showNotification("Failed deleting skill.", "error");
    }
  };

  const handleUpdateSkillProgress = async (id: string, newProgress: number) => {
    try {
      await updateDoc(doc(db, "skills", id), { progress: newProgress });
    } catch (err) {
      console.error("Error updating skill progress:", err);
    }
  };

  // ==========================================
  // PROJECTS OPERATIONS
  // ==========================================
  const handleAddProject = async (
    name: string,
    description: string,
    status: Project["status"],
    skillsApplied: string[],
    githubUrl?: string,
    demoUrl?: string,
    notes?: string
  ) => {
    const payload = {
      name,
      description,
      status,
      skillsApplied,
      githubUrl: githubUrl || "",
      demoUrl: demoUrl || "",
      notes: notes || ""
    };

    try {
      await addDoc(collection(db, "projects"), {
        ...payload,
        userId: workspaceUserId,
        createdAt: new Date().toISOString()
      });
      showNotification("Project blueprint uploaded.");
    } catch (err) {
      showNotification("Could not upload project details.", "error");
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await deleteDoc(doc(db, "projects", id));
      showNotification("Project deleted from registry.");
    } catch (err) {
      showNotification("Failed deleting project.", "error");
    }
  };

  const handleUpdateProjectStatus = async (id: string, newStatus: Project["status"]) => {
    try {
      await updateDoc(doc(db, "projects", id), { status: newStatus });
      showNotification(`Project status changed to ${newStatus}`);
    } catch (err) {
      showNotification("Update failed.", "error");
    }
  };

  // ==========================================
  // YOUTUBE PLAYLISTS OPERATIONS
  // ==========================================
  const handleAddPlaylist = async (name: string, url: string, skillId: string, videos: PlaylistVideo[]): Promise<boolean> => {
    try {
      await addDoc(collection(db, "playlists"), {
        name,
        url,
        skillId,
        userId: workspaceUserId,
        videos,
        createdAt: new Date().toISOString()
      });

      showNotification("Playlist created successfully.");
      return true;
    } catch (err) {
      console.error(err);
      showNotification("Failed to add playlist.", "error");
      return false;
    }
  };

  const handleUpdatePlaylistVideos = async (playlistId: string, updatedVideos: PlaylistVideo[]) => {
    try {
      const playlistRef = doc(db, "playlists", playlistId);
      await updateDoc(playlistRef, { videos: updatedVideos });
    } catch (err) {
      console.error("Failed to update videos in database:", err);
      showNotification("Failed to save playlist updates.", "error");
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    try {
      await deleteDoc(doc(db, "playlists", playlistId));
      showNotification("Playlist removed.");
    } catch (err) {
      showNotification("Failed to remove playlist.", "error");
    }
  };

  const handleToggleVideoCompleted = async (playlistId: string, videoId: string, currentCompleted: boolean) => {
    try {
      const playlistRef = doc(db, "playlists", playlistId);
      const playlistSnap = await getDoc(playlistRef);
      if (!playlistSnap.exists()) return;

      const data = playlistSnap.data();
      const updatedVideos = (data.videos || []).map((v: PlaylistVideo) => {
        if (v.id === videoId) {
          return { ...v, completed: !currentCompleted };
        }
        return v;
      });

      await updateDoc(playlistRef, { videos: updatedVideos });

      // Find if there is an associated Todo item, and update its completed status too
      const targetVideo = (data.videos || []).find((v: PlaylistVideo) => v.id === videoId);
      if (targetVideo && targetVideo.todoId) {
        try {
          await updateDoc(doc(db, "todos", targetVideo.todoId), {
            completed: !currentCompleted
          });
        } catch (todoErr) {
          console.warn("Could not sync todo completed state:", todoErr);
        }
      }
    } catch (err) {
      console.error("Error toggling video completion:", err);
    }
  };

  const handleScheduleVideo = async (playlistId: string, playlistName: string, videoId: string, videoTitle: string, skillId: string, dateStr: string) => {
    try {
      // 1. Create a new Todo item in Firestore
      const newTodoRef = await addDoc(collection(db, "todos"), {
        text: `Watch ${videoTitle} from playlist: ${playlistName}`,
        completed: false,
        category: "study",
        date: dateStr,
        skillId,
        playlistId,
        videoId,
        userId: workspaceUserId,
        createdAt: new Date().toISOString()
      });

      // 2. Link this todoId and scheduledDate back inside the Playlist's video object
      const playlistRef = doc(db, "playlists", playlistId);
      const playlistSnap = await getDoc(playlistRef);
      if (playlistSnap.exists()) {
        const data = playlistSnap.data();
        const updatedVideos = (data.videos || []).map((v: PlaylistVideo) => {
          if (v.id === videoId) {
            return { 
              ...v, 
              todoId: newTodoRef.id,
              scheduledDate: dateStr
            };
          }
          return v;
        });
        await updateDoc(playlistRef, { videos: updatedVideos });
      }

      showNotification(`Video scheduled for ${dateStr}.`);
    } catch (err) {
      console.error("Error scheduling video:", err);
      showNotification("Failed to schedule video.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-between selection:bg-indigo-100 selection:text-indigo-800">
      
      {/* GLOBAL TOP BAR */}
      <header className="bg-white border-b border-zinc-200/80 sticky top-0 z-40 backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo / Title */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-serif font-bold text-base shadow-sm shadow-indigo-600/25">
              D
            </div>
            <div>
              <h1 className="font-serif text-sm font-bold tracking-tight text-zinc-900 leading-tight">
                DailyTrack
              </h1>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                Personal Progress Repository
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab("dailytrack")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === "dailytrack"
                  ? "bg-indigo-50 text-indigo-700 font-bold"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
              }`}
            >
              <CheckCircle size={14} />
              Daily Track
            </button>
            <button
              onClick={() => setActiveTab("calendar")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === "calendar"
                  ? "bg-indigo-50 text-indigo-700 font-bold"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
              }`}
            >
              <CalendarDays size={14} />
              Calendar Planner
            </button>
            <button
              onClick={() => setActiveTab("skills")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === "skills"
                  ? "bg-indigo-50 text-indigo-700 font-bold"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
              }`}
            >
              <BookOpen size={14} />
              Skills Matrix
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === "projects"
                  ? "bg-indigo-50 text-indigo-700 font-bold"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
              }`}
            >
              <Target size={14} />
              Project Portfolio
            </button>
          </nav>

          {/* Right Account Panel */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col text-right">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Workspace Database</span>
              <span className="text-[10px] text-zinc-500 font-semibold truncate max-w-[120px] font-mono">{workspaceUserId}</span>
            </div>
          </div>

        </div>
      </header>

      {/* MOBILE HEADER TAB NAVIGATION */}
      <div className="md:hidden bg-white border-b border-zinc-200/60 p-2">
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => setActiveTab("dailytrack")}
            className={`flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${
              activeTab === "dailytrack" ? "bg-indigo-50 text-indigo-700" : "text-zinc-500 hover:bg-zinc-50"
            }`}
          >
            <CheckCircle size={14} />
            <span>Today</span>
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${
              activeTab === "calendar" ? "bg-indigo-50 text-indigo-700" : "text-zinc-500 hover:bg-zinc-50"
            }`}
          >
            <CalendarDays size={14} />
            <span>Calendar</span>
          </button>
          <button
            onClick={() => setActiveTab("skills")}
            className={`flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${
              activeTab === "skills" ? "bg-indigo-50 text-indigo-700" : "text-zinc-500 hover:bg-zinc-50"
            }`}
          >
            <BookOpen size={14} />
            <span>Skills</span>
          </button>
          <button
            onClick={() => setActiveTab("projects")}
            className={`flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${
              activeTab === "projects" ? "bg-indigo-50 text-indigo-700" : "text-zinc-500 hover:bg-zinc-50"
            }`}
          >
            <Target size={14} />
            <span>Projects</span>
          </button>
        </div>
      </div>

      {/* EVENT NOTIFICATION BANNER */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className={`p-3.5 rounded-2xl border shadow-lg flex items-center gap-2.5 max-w-sm ${
            notification.type === "success" 
              ? "bg-white border-emerald-100 text-emerald-800" 
              : "bg-rose-50 border-rose-100 text-rose-800"
          }`}>
            {notification.type === "success" ? (
              <CheckCircle size={15} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={15} className="text-rose-600 shrink-0" />
            )}
            <p className="text-xs font-semibold leading-relaxed">
              {notification.message}
            </p>
          </div>
        </div>
      )}

      {/* MAIN LAYOUT CANVAS */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "dailytrack" && (
          <DailyTrackView
            todos={todos}
            onAddTodo={handleAddTodo}
            onToggleTodo={handleToggleTodo}
            onDeleteTodo={handleDeleteTodo}
            onUpdateTodoText={handleUpdateTodoText}
            skills={skills}
            projects={projects}
            dailyFocus={dailyFocus}
            onFocusChange={handleFocusChange}
            isSavingFocus={isSavingFocus}
          />
        )}

        {activeTab === "calendar" && (
          <CalendarView
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            todos={todos}
            onAddTodo={handleAddTodo}
            onToggleTodo={handleToggleTodo}
            onDeleteTodo={handleDeleteTodo}
            onUpdateTodoText={handleUpdateTodoText}
            skills={skills}
            projects={projects}
            dailyFocus={dailyFocus}
            onFocusChange={handleFocusChange}
            isSavingFocus={isSavingFocus}
          />
        )}

        {activeTab === "skills" && (
          <SkillsView
            skills={skills}
            todos={todos}
            playlists={playlists}
            onAddSkill={handleAddSkill}
            onDeleteSkill={handleDeleteSkill}
            onUpdateSkillProgress={handleUpdateSkillProgress}
            onToggleTodo={handleToggleTodo}
            onAddPlaylist={handleAddPlaylist}
            onUpdatePlaylistVideos={handleUpdatePlaylistVideos}
            onDeletePlaylist={handleDeletePlaylist}
            onToggleVideoCompleted={handleToggleVideoCompleted}
            onScheduleVideo={handleScheduleVideo}
          />
        )}

        {activeTab === "projects" && (
          <ProjectsView
            projects={projects}
            skills={skills}
            todos={todos}
            onAddProject={handleAddProject}
            onDeleteProject={handleDeleteProject}
            onUpdateProjectStatus={handleUpdateProjectStatus}
            onToggleTodo={handleToggleTodo}
          />
        )}
      </main>

      {/* FOOTER BAR */}
      <footer className="bg-zinc-900 text-zinc-450 border-t border-zinc-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <p className="text-[11px] font-serif tracking-wider italic text-zinc-400">
            "An investment in knowledge always pays the best interest." — Benjamin Franklin
          </p>
          <div className="flex justify-center items-center gap-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest font-mono">
            <span>DailyTrack Sync Engine</span>
            <span>•</span>
            <span className="text-zinc-400">Active</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
