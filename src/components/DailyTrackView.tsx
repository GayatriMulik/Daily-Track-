import { useState, FormEvent } from "react";
import { 
  Check, 
  Trash2, 
  Plus, 
  Search, 
  Edit3, 
  Smile, 
  X, 
  CheckCircle,
  BookOpen,
  Target,
  Sparkles
} from "lucide-react";
import { TodoItem, Skill, Project } from "../types";

interface DailyTrackViewProps {
  todos: TodoItem[];
  onAddTodo: (text: string, category: TodoItem["category"], skillId?: string, projectId?: string) => void;
  onToggleTodo: (id: string, current: boolean) => void;
  onDeleteTodo: (id: string) => void;
  onUpdateTodoText: (id: string, text: string) => void;
  skills: Skill[];
  projects: Project[];
  dailyFocus: string;
  onFocusChange: (val: string) => void;
  isSavingFocus: boolean;
}

export default function DailyTrackView({
  todos,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
  onUpdateTodoText,
  skills,
  projects,
  dailyFocus,
  onFocusChange,
  isSavingFocus
}: DailyTrackViewProps) {
  // Helper to get today's date string
  const getTodayDateString = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split("T")[0];
  };

  const todayStr = getTodayDateString();

  // Todo Form Fields
  const [newTodoText, setNewTodoText] = useState("");
  const [newTodoCategory, setNewTodoCategory] = useState<TodoItem["category"]>("study");
  const [newTodoSkill, setNewTodoSkill] = useState("");
  const [newTodoProject, setNewTodoProject] = useState("");

  // Editing Todo
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingTodoText, setEditingTodoText] = useState("");

  // Filters & Search
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "completed">("all");
  const [filterCategory, setFilterCategory] = useState<TodoItem["category"] | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Today's Todos
  const todayTodos = todos.filter((t) => t.date === todayStr);
  const totalCount = todayTodos.length;
  const completedCount = todayTodos.filter((t) => t.completed).length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filter & Search Logic
  const filteredTodos = todayTodos.filter((todo) => {
    const matchesStatus = 
      filterStatus === "all" ||
      (filterStatus === "active" && !todo.completed) ||
      (filterStatus === "completed" && todo.completed);

    const matchesCategory = 
      filterCategory === "all" || todo.category === filterCategory;

    const matchesSearch = 
      todo.text.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesCategory && matchesSearch;
  });

  const handleAddSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;

    onAddTodo(
      newTodoText.trim(),
      newTodoCategory,
      newTodoSkill || undefined,
      newTodoProject || undefined
    );

    setNewTodoText("");
    setNewTodoSkill("");
    setNewTodoProject("");
  };

  const handleSaveEdit = (todoId: string) => {
    if (!editingTodoText.trim()) return;
    onUpdateTodoText(todoId, editingTodoText.trim());
    setEditingTodoId(null);
  };

  const formatHumanDate = (dateStr: string) => {
    try {
      const parts = dateStr.split("-");
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return date.toLocaleDateString("en-US", { 
        weekday: "long", 
        month: "long", 
        day: "numeric",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* HEADER PROGRESS CONTAINER */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-mono text-indigo-600 uppercase tracking-widest font-bold">Daily Track</span>
              <span className="text-zinc-300">•</span>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold">Today</span>
            </div>
            <h3 className="font-serif text-2xl font-extrabold text-zinc-900 tracking-tight">
              {formatHumanDate(todayStr)}
            </h3>
          </div>

          {/* Progress metrics badge */}
          <div className="flex items-center gap-2 text-xs bg-indigo-50/50 border border-indigo-100/55 p-2 rounded-xl shrink-0 self-start sm:self-center">
            <span className="font-bold text-indigo-700 font-mono">{completionPercentage}% Done</span>
            <span className="text-zinc-300">|</span>
            <span className="text-zinc-600 font-medium">{completedCount}/{totalCount} Tasks</span>
          </div>
        </div>

        {/* Micro Progress Bar */}
        <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>

        {/* Daily logs section */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center text-[11px]">
            <label className="font-bold text-zinc-500 uppercase tracking-wider font-mono flex items-center gap-1">
              <Edit3 size={11} className="text-zinc-400" />
              Today's Main Focus & Goals
            </label>
            <span className="text-zinc-400 font-semibold text-[10px]">
              {isSavingFocus ? "Saving changes..." : "All Changes Saved"}
            </span>
          </div>
          <textarea
            placeholder="What is your ultimate goal for today? Note it down..."
            rows={2}
            value={dailyFocus}
            onChange={(e) => onFocusChange(e.target.value)}
            className="w-full p-3 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 transition-all text-zinc-700 leading-relaxed resize-none font-medium"
          />
        </div>
      </div>

      {/* ACTIVE CHECKLIST CONTAINER */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-5">
        
        <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
          <h4 className="font-serif text-sm font-bold text-zinc-850 flex items-center gap-1.5">
            <CheckCircle size={15} className="text-indigo-600" />
            <span>Active Checklist</span>
          </h4>
        </div>

        {/* ADD TASK FORM */}
        <form onSubmit={handleAddSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              required
              placeholder="Add a task for today..."
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              className="flex-1 px-3.5 py-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all font-medium text-zinc-800"
            />
            
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-indigo-600/10 flex items-center justify-center gap-1 cursor-pointer shrink-0"
            >
              <Plus size={14} />
              Add Task
            </button>
          </div>

          {/* METADATA DROPDOWNS: Category, Skill, Project */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {/* Category selector */}
            <div>
              <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Domain Category</label>
              <select
                value={newTodoCategory}
                onChange={(e) => setNewTodoCategory(e.target.value as TodoItem["category"])}
                className="w-full bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200 text-zinc-600 text-xs px-2.5 py-1.5 rounded-lg focus:outline-hidden cursor-pointer"
              >
                <option value="study">📚 Study</option>
                <option value="coding">💻 Coding</option>
                <option value="math">📐 Math</option>
                <option value="research">🔬 Research</option>
                <option value="personal">🏡 Personal</option>
                <option value="health">🌱 Health</option>
                <option value="work">💼 Work</option>
                <option value="other">☕ Other</option>
              </select>
            </div>

            {/* Skill association dropdown */}
            <div>
              <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Associate Skill</label>
              <select
                value={newTodoSkill}
                onChange={(e) => setNewTodoSkill(e.target.value)}
                className="w-full bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200 text-zinc-600 text-xs px-2.5 py-1.5 rounded-lg focus:outline-hidden cursor-pointer"
              >
                <option value="">-- None --</option>
                {skills.map((s) => (
                  <option key={s.id} value={s.id}>
                    ⚡ {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Project association dropdown */}
            <div>
              <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Associate Project</label>
              <select
                value={newTodoProject}
                onChange={(e) => setNewTodoProject(e.target.value)}
                className="w-full bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200 text-zinc-600 text-xs px-2.5 py-1.5 rounded-lg focus:outline-hidden cursor-pointer"
              >
                <option value="">-- None --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    🚀 {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>

        {/* FILTER & SEARCH CAPABILITIES */}
        <div className="pt-2 border-t border-zinc-100 flex flex-col md:flex-row gap-3 md:items-center justify-between">
          
          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-zinc-50 p-0.5 rounded-lg border border-zinc-200/60 w-fit">
            {(["all", "active", "completed"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterStatus(tab)}
                className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer capitalize ${
                  filterStatus === tab
                    ? "bg-white text-zinc-950 shadow-2xs border border-zinc-200/50"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search query box */}
          <div className="relative max-w-xs w-full">
            <Search size={12} className="absolute left-2.5 top-2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search today's tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7.5 pr-2 py-1 text-[11px] bg-zinc-50 border border-zinc-200/70 rounded-lg focus:outline-hidden text-zinc-700 font-medium placeholder:text-zinc-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1.5 text-zinc-400 hover:text-zinc-600"
              >
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        {/* TASKS LIST */}
        <div className="space-y-1.5 pt-1">
          {filteredTodos.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12 px-4 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
              <Smile size={24} className="text-zinc-300 mb-2" />
              <h5 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">No Tasks Scheduled</h5>
              <p className="text-[10px] text-zinc-400 max-w-xs mt-1">
                {totalCount === 0 
                  ? "Schedule a study milestone, coding check-in, or workout to keep your daily streak alive!"
                  : "No results match your active search filters."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {filteredTodos.map((todo) => {
                const isEditing = editingTodoId === todo.id;
                const matchedSkill = skills.find((s) => s.id === todo.skillId);
                const matchedProject = projects.find((p) => p.id === todo.projectId);

                // Category style badges
                const categoryBadges: Record<TodoItem["category"], { bg: string; text: string; label: string }> = {
                  personal: { bg: "bg-orange-50 text-orange-700 border-orange-100", text: "text-orange-700", label: "Personal" },
                  work: { bg: "bg-blue-50 text-blue-700 border-blue-100", text: "text-blue-700", label: "Work" },
                  study: { bg: "bg-purple-50 text-purple-700 border-purple-100", text: "text-purple-700", label: "Study" },
                  coding: { bg: "bg-indigo-50 text-indigo-700 border-indigo-100", text: "text-indigo-750", label: "Coding" },
                  math: { bg: "bg-teal-50 text-teal-700 border-teal-100", text: "text-teal-700", label: "Math" },
                  research: { bg: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100", text: "text-fuchsia-750", label: "Research" },
                  health: { bg: "bg-emerald-50 text-emerald-700 border-emerald-100", text: "text-emerald-700", label: "Health" },
                  other: { bg: "bg-zinc-100 text-zinc-700 border-zinc-200/60", text: "text-zinc-650", label: "Other" }
                };
                const badge = categoryBadges[todo.category || "other"];

                return (
                  <div
                    key={todo.id}
                    className={`flex items-start justify-between gap-3 py-3 px-2 rounded-lg transition-colors ${
                      isEditing ? "bg-indigo-50/20" : "hover:bg-zinc-50/55"
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Checkbox button */}
                      <button
                        type="button"
                        onClick={() => onToggleTodo(todo.id, todo.completed)}
                        className="shrink-0 p-0.5 mt-0.5 cursor-pointer focus:outline-hidden"
                      >
                        {todo.completed ? (
                          <div className="w-4.5 h-4.5 bg-indigo-600 text-white rounded-full flex items-center justify-center border border-indigo-600 shadow-xs transition-all scale-105">
                            <Check size={10} strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="w-4.5 h-4.5 rounded-full border-2 border-zinc-300 hover:border-indigo-500 bg-white transition-colors" />
                        )}
                      </button>

                      {/* Text/Input Editor */}
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 flex-1">
                          <input
                            type="text"
                            value={editingTodoText}
                            onChange={(e) => setEditingTodoText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit(todo.id);
                              if (e.key === "Escape") setEditingTodoId(null);
                            }}
                            className="flex-1 px-2 py-1 text-xs bg-white border border-zinc-300 rounded focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-medium text-zinc-950"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(todo.id)}
                            className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-500 text-[10px] cursor-pointer transition-colors"
                          >
                            <Check size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTodoId(null)}
                            className="p-1 bg-zinc-200 text-zinc-600 rounded hover:bg-zinc-300 text-[10px] cursor-pointer transition-colors"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 min-w-0">
                          <p 
                            className={`text-xs font-semibold leading-relaxed cursor-pointer break-words ${
                              todo.completed 
                                ? "text-zinc-400 line-through decoration-zinc-300/80" 
                                : "text-zinc-800 hover:text-indigo-600"
                            }`}
                            onClick={() => {
                              setEditingTodoId(todo.id);
                              setEditingTodoText(todo.text);
                            }}
                            title="Click to edit task"
                          >
                            {todo.text}
                          </p>

                          {/* Linked elements */}
                          {(matchedSkill || matchedProject) && (
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              {matchedSkill && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-indigo-600 bg-indigo-50/50 px-1.5 py-0.5 rounded-md border border-indigo-100">
                                  <BookOpen size={9} />
                                  {matchedSkill.name}
                                </span>
                              )}
                              {matchedProject && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50/50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                                  <Target size={9} />
                                  {matchedProject.name}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right column: category + delete */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border rounded-md ${badge?.bg}`}>
                        {badge?.label || "Other"}
                      </span>

                      <button
                        type="button"
                        onClick={() => onDeleteTodo(todo.id)}
                        className="p-1 text-zinc-300 hover:text-rose-500 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Task"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
