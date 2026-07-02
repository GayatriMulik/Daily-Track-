import { useState, FormEvent } from "react";
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Award, 
  Check, 
  CheckCircle, 
  Layers, 
  Activity, 
  Clock,
  Youtube,
  ExternalLink,
  Calendar,
  ChevronDown,
  ChevronUp,
  Play,
  X,
  Loader2,
  Edit2,
  Save,
  FileText
} from "lucide-react";
import { Skill, TodoItem, Playlist, PlaylistVideo } from "../types";

interface SkillsViewProps {
  skills: Skill[];
  todos: TodoItem[];
  playlists: Playlist[];
  onAddSkill: (name: string, category: string, level: Skill["level"], progress: number) => void;
  onDeleteSkill: (id: string) => void;
  onUpdateSkillProgress: (id: string, progress: number) => void;
  onToggleTodo: (id: string, current: boolean) => void;
  onAddPlaylist: (name: string, url: string, skillId: string, videos: PlaylistVideo[]) => Promise<boolean>;
  onUpdatePlaylistVideos: (playlistId: string, updatedVideos: PlaylistVideo[]) => void;
  onDeletePlaylist: (playlistId: string) => void;
  onToggleVideoCompleted: (playlistId: string, videoId: string, currentCompleted: boolean) => void;
  onScheduleVideo: (playlistId: string, playlistName: string, videoId: string, videoTitle: string, skillId: string, dateStr: string) => void;
}

export default function SkillsView({
  skills,
  todos,
  playlists,
  onAddSkill,
  onDeleteSkill,
  onUpdateSkillProgress,
  onToggleTodo,
  onAddPlaylist,
  onUpdatePlaylistVideos,
  onDeletePlaylist,
  onToggleVideoCompleted,
  onScheduleVideo
}: SkillsViewProps) {
  // Skill form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Fundamentals");
  const [customCategory, setCustomCategory] = useState("");
  const [level, setLevel] = useState<Skill["level"]>("Beginner");
  const [progress, setProgress] = useState(10);
  const [showAddForm, setShowAddForm] = useState(false);

  // YouTube Playlists states
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null);
  const [addingPlaylistSkillId, setAddingPlaylistSkillId] = useState<string | null>(null);
  const [playlistName, setPlaylistName] = useState("");
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [playlistVideosCount, setPlaylistVideosCount] = useState<number>(10);
  const [creationType, setCreationType] = useState<'simple' | 'custom'>('simple');
  const [customVideosText, setCustomVideosText] = useState("");
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editingVideoTitle, setEditingVideoTitle] = useState("");
  const [selectedVideoNotesId, setSelectedVideoNotesId] = useState<string | null>(null);
  const [videoNotesText, setVideoNotesText] = useState("");
  const [videoUrlText, setVideoUrlText] = useState("");
  const [newVideoTitle, setNewVideoTitle] = useState("");
  
  const [schedulingVideo, setSchedulingVideo] = useState<{ playlistId: string; videoId: string; videoTitle: string } | null>(null);
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<string>(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split("T")[0];
  });

  // Suggestions for categories
  const suggestedCategories = [
    "Fundamentals",
    "Machine Learning",
    "Deep Learning / NLP",
    "LLMs & RAG",
    "Agents & Apps",
    "MLOps / Systems",
    "Personal Growth",
    "Health & Fitness"
  ];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalCategory = category === "custom" ? customCategory.trim() : category;
    onAddSkill(name.trim(), finalCategory || "General", level, progress);
    
    // reset form
    setName("");
    setCustomCategory("");
    setProgress(10);
    setShowAddForm(false);
  };

  const getRelativeDateString = (dateStr: string) => {
    try {
      const parts = dateStr.split("-");
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* VIEW HEADER & TOGGLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-lg font-bold text-zinc-900 flex items-center gap-1.5">
            <BookOpen size={20} className="text-indigo-600 animate-pulse" />
            Skills Tracker
          </h2>
          <p className="text-xs text-zinc-500">
            Define, update, and track your ongoing expertise domains. Associate daily tasks with skills to automatically register hours and progress.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-indigo-600/10 flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-center"
        >
          <Plus size={14} />
          {showAddForm ? "Hide Form" : "Add New Skill"}
        </button>
      </div>

      {/* NEW SKILL CREATION FORM */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-zinc-200/85 p-5 rounded-2xl shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
          <h3 className="font-serif text-sm font-bold text-zinc-900">Configure Skill parameters</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Skill Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Prompt Engineering, Data Structures"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white text-zinc-800 font-medium"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Skill Domain Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200 text-zinc-600 text-xs px-2.5 py-2 rounded-lg focus:outline-hidden cursor-pointer"
              >
                {suggestedCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="custom">-- Custom Category --</option>
              </select>
            </div>
          </div>

          {category === "custom" && (
            <div className="animate-in fade-in duration-100">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Custom Category Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Fine Tuning, UI Design"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white text-zinc-800 font-medium"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Expertise level</label>
              <div className="flex gap-2">
                {(["Beginner", "Intermediate", "Advanced"] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLevel(l)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      level === l
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-2xs font-bold"
                        : "bg-zinc-50 border-zinc-200/80 hover:bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Current Competence: {progress}%</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progress}
                  onChange={(e) => setProgress(parseInt(e.target.value))}
                  className="flex-1 accent-indigo-600 h-1.5 bg-zinc-100 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs font-mono text-zinc-500 font-bold w-8 text-right">{progress}%</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs font-bold text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 border border-zinc-200/60 px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs shadow-indigo-600/10"
            >
              Create Skill Matrix
            </button>
          </div>
        </form>
      )}

      {/* SKILLS CARDS GRID */}
      {skills.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 border border-dashed border-zinc-200 rounded-2xl bg-white shadow-xs">
          <Award size={36} className="text-zinc-300 mb-3" />
          <h4 className="font-serif text-sm font-bold text-zinc-700">No Tracked Skills Registered</h4>
          <p className="text-xs text-zinc-400 max-w-sm mt-1.5 leading-relaxed">
            Create skill capsules (e.g. Learning Python, Cooking, Chemistry) to structure your daily habits. Your checklist items can feed directly into these expertise scores.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-200/60 px-3.5 py-2 rounded-xl transition-all cursor-pointer mt-4"
          >
            Create Your First Skill
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {skills.map((skill) => {
            // Find todos associated with this skill
            const skillTodos = todos.filter((t) => t.skillId === skill.id);
            const completedTodos = skillTodos.filter((t) => t.completed);
            
            // Level badges helper
            const levelColors = {
              Beginner: "bg-emerald-50 text-emerald-700 border-emerald-100",
              Intermediate: "bg-indigo-50 text-indigo-700 border-indigo-100",
              Advanced: "bg-amber-50 text-amber-700 border-amber-100"
            };

            return (
              <div
                key={skill.id}
                className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-zinc-300 hover:shadow-sm transition-all"
              >
                
                {/* CARD UPPER RAIL */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                      {skill.category}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete the skill "${skill.name}"? This will not delete the associated todos.`)) {
                          onDeleteSkill(skill.id);
                        }
                      }}
                      className="p-1 text-zinc-300 hover:text-rose-500 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Skill"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <h3 className="font-serif text-base font-bold text-zinc-900 leading-tight">
                    {skill.name}
                  </h3>

                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-md ${levelColors[skill.level]}`}>
                      {skill.level}
                    </span>
                    
                    <span className="text-[10px] font-medium text-zinc-400">
                      • {skillTodos.length} associated {skillTodos.length === 1 ? "task" : "tasks"}
                    </span>
                  </div>
                </div>

                {/* SLIDER/PROGRESS SECTION */}
                <div className="space-y-1.5 bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                  <div className="flex justify-between items-center text-[10px] font-semibold text-zinc-500">
                    <span>Expertise Progress</span>
                    <span className="font-mono text-zinc-800 font-bold">{skill.progress}%</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={skill.progress}
                      onChange={(e) => onUpdateSkillProgress(skill.id, parseInt(e.target.value))}
                      className="flex-1 accent-indigo-600 h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* ASSOCIATED CHECKLIST PREVIEW */}
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                    <span>Target Activities</span>
                    <span>{completedTodos.length}/{skillTodos.length} completed</span>
                  </div>

                  {skillTodos.length === 0 ? (
                    <p className="text-[10px] text-zinc-400 italic">
                      No scheduled task assigned to this skill yet. Schedule one in the Daily Planner!
                    </p>
                  ) : (
                    <div className="max-h-28 overflow-y-auto space-y-1 pr-1 border border-zinc-100 rounded-lg p-1.5 bg-zinc-50/20">
                      {skillTodos.map((todo) => (
                        <div key={todo.id} className="flex items-center justify-between gap-2 text-[11px] py-1 px-1.5 rounded-md hover:bg-white border border-transparent hover:border-zinc-150 transition-colors">
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              type="button"
                              onClick={() => onToggleTodo(todo.id, todo.completed)}
                              className="shrink-0 p-0.5 cursor-pointer"
                            >
                              {todo.completed ? (
                                <CheckCircle size={12} className="text-emerald-500" />
                              ) : (
                                <div className="w-3 h-3 rounded-full border border-zinc-300 bg-white" />
                              )}
                            </button>
                            <span className={`truncate font-semibold ${todo.completed ? "text-zinc-400 line-through" : "text-zinc-700"}`}>
                              {todo.text}
                            </span>
                          </div>
                          
                          <span className="text-[8px] font-mono text-zinc-400 font-bold shrink-0">
                            {getRelativeDateString(todo.date)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* YOUTUBE COURSE PLAYLIST TRACKER */}
                <div className="space-y-3 pt-2 border-t border-zinc-100">
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setExpandedSkillId(expandedSkillId === skill.id ? null : skill.id)}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 uppercase tracking-wider hover:text-indigo-800 transition-colors cursor-pointer"
                    >
                      <Youtube size={13} className="text-rose-500 shrink-0" />
                      <span>YouTube Playlists ({(playlists.filter(p => p.skillId === skill.id)).length})</span>
                      {expandedSkillId === skill.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>
                    
                    {expandedSkillId === skill.id && addingPlaylistSkillId !== skill.id && (
                      <button
                        type="button"
                        onClick={() => {
                          setPlaylistName("");
                          setPlaylistUrl("");
                          setPlaylistVideosCount(10);
                          setAddingPlaylistSkillId(skill.id);
                        }}
                        className="text-[9px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/50 px-2 py-0.5 rounded-md transition-all cursor-pointer"
                      >
                        Add Playlist
                      </button>
                    )}
                  </div>

                  {expandedSkillId === skill.id && (
                    <div className="space-y-3 p-1.5 bg-zinc-50/50 rounded-xl border border-zinc-100/80 animate-in fade-in duration-150">
                      {/* ADD PLAYLIST FORM */}
                      {addingPlaylistSkillId === skill.id && (
                        <div className="space-y-3 p-3 bg-white rounded-lg border border-zinc-200 shadow-2xs">
                          <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
                            <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-wide">Configure Study Playlist</span>
                            <button
                              type="button"
                              onClick={() => setAddingPlaylistSkillId(null)}
                              className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
                            >
                              <X size={12} />
                            </button>
                          </div>

                          <div className="space-y-2">
                            <div className="space-y-1">
                              <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Course Title / Subject Name</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Next.js 15 App Router Masterclass"
                                value={playlistName}
                                onChange={(e) => setPlaylistName(e.target.value)}
                                className="w-full px-2 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white text-zinc-800 font-medium"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Playlist / Course URL (Optional)</label>
                              <input
                                type="url"
                                placeholder="e.g. https://youtube.com/playlist?list=..."
                                value={playlistUrl}
                                onChange={(e) => setPlaylistUrl(e.target.value)}
                                className="w-full px-2 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white text-zinc-800 font-medium"
                              />
                            </div>

                            {/* Mode switcher tabs */}
                            <div className="space-y-1.5 pt-1">
                              <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Syllabus Import Mode</label>
                              <div className="grid grid-cols-2 gap-1.5 p-0.5 bg-zinc-100 rounded-lg">
                                <button
                                  type="button"
                                  onClick={() => setCreationType('simple')}
                                  className={`text-[9px] font-bold py-1 rounded-md transition-all cursor-pointer ${creationType === 'simple' ? 'bg-white text-indigo-600 shadow-3xs' : 'text-zinc-500 hover:text-zinc-800'}`}
                                >
                                  Quick Lesson Count
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCreationType('custom')}
                                  className={`text-[9px] font-bold py-1 rounded-md transition-all cursor-pointer ${creationType === 'custom' ? 'bg-white text-indigo-600 shadow-3xs' : 'text-zinc-500 hover:text-zinc-800'}`}
                                >
                                  Paste Custom Topics
                                </button>
                              </div>
                            </div>

                            {creationType === 'simple' ? (
                              <div className="space-y-1 animate-in slide-in-from-top-1 duration-150">
                                <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Total Lessons to Track</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="100"
                                  required
                                  value={playlistVideosCount}
                                  onChange={(e) => setPlaylistVideosCount(parseInt(e.target.value) || 1)}
                                  className="w-full px-2 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white text-zinc-800 font-medium"
                                />
                                <span className="text-[8px] text-zinc-400 italic">Will instantly pre-generate sequential video slots.</span>
                              </div>
                            ) : (
                              <div className="space-y-1 animate-in slide-in-from-top-1 duration-150">
                                <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Video / Topic Titles (one per line)</label>
                                <textarea
                                  rows={4}
                                  placeholder="e.g.&#10;01. Welcome and Concepts&#10;02. Practical Demo&#10;03. Production Deployment"
                                  value={customVideosText}
                                  onChange={(e) => setCustomVideosText(e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white text-zinc-800 font-mono"
                                />
                                <span className="text-[8px] text-zinc-400 italic">We'll turn each line into a custom checkable lesson.</span>
                              </div>
                            )}
                          </div>

                          <div className="flex justify-end gap-1.5 pt-1.5 border-t border-zinc-100">
                            <button
                              type="button"
                              onClick={() => setAddingPlaylistSkillId(null)}
                              className="text-[9px] font-bold text-zinc-500 hover:text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 px-2 py-1 rounded-md transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={!playlistName.trim()}
                              onClick={async () => {
                                if (!playlistName.trim()) return;

                                let generatedVideos: PlaylistVideo[] = [];
                                if (creationType === 'simple') {
                                  generatedVideos = Array.from({ length: playlistVideosCount }, (_, i) => ({
                                    id: `video-${Date.now()}-${i + 1}`,
                                    title: `Lesson ${i + 1}`,
                                    completed: false,
                                    notes: "",
                                    videoUrl: ""
                                  }));
                                } else {
                                  const lines = customVideosText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                                  if (lines.length === 0) {
                                    lines.push("Lesson 1: Introduction");
                                  }
                                  generatedVideos = lines.map((line, i) => ({
                                    id: `video-${Date.now()}-${i + 1}`,
                                    title: line,
                                    completed: false,
                                    notes: "",
                                    videoUrl: ""
                                  }));
                                }

                                const success = await onAddPlaylist(playlistName.trim(), playlistUrl.trim(), skill.id, generatedVideos);
                                if (success) {
                                  setPlaylistName("");
                                  setPlaylistUrl("");
                                  setCustomVideosText("");
                                  setAddingPlaylistSkillId(null);
                                }
                              }}
                              className="text-[9px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-2.5 py-1 rounded-md transition-all cursor-pointer shadow-xs shadow-indigo-600/10 animate-pulse-once"
                            >
                              Instantly Setup Course
                            </button>
                          </div>
                        </div>
                      )}

                      {/* PLAYLISTS LIST */}
                      {(playlists.filter(p => p.skillId === skill.id)).length === 0 ? (
                        addingPlaylistSkillId !== skill.id && (
                          <p className="text-[10px] text-zinc-400 italic text-center py-2">
                            No playlists registered for this skill. Add one to track course videos!
                          </p>
                        )
                      ) : (
                        <div className="space-y-4">
                          {(playlists.filter(p => p.skillId === skill.id)).map((playlist) => {
                            const totalVideos = playlist.videos.length;
                            const watchedVideos = playlist.videos.filter(v => v.completed).length;
                            const remainingVideos = totalVideos - watchedVideos;
                            const percent = totalVideos > 0 ? Math.round((watchedVideos / totalVideos) * 100) : 0;

                            return (
                              <div key={playlist.id} className="p-2 bg-white border border-zinc-150 rounded-xl space-y-2.5 shadow-2xs">
                                {/* Playlist Header */}
                                <div className="flex justify-between items-start">
                                  <div className="min-w-0">
                                    <h4 className="text-[11px] font-bold text-zinc-800 truncate leading-tight">
                                      {playlist.name}
                                    </h4>
                                    {playlist.url && (
                                      <a
                                        href={playlist.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        referrerPolicy="no-referrer"
                                        className="text-[9px] text-zinc-400 hover:text-rose-500 flex items-center gap-0.5 mt-0.5 transition-colors"
                                      >
                                        <ExternalLink size={9} />
                                        <span>Course Link</span>
                                      </a>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`Remove the playlist "${playlist.name}"?`)) {
                                        onDeletePlaylist(playlist.id);
                                      }
                                    }}
                                    className="p-1 text-zinc-300 hover:text-rose-500 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Delete Playlist"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>

                                {/* Playlist Progress stats */}
                                <div className="space-y-1">
                                  <div className="flex justify-between items-center text-[9px] text-zinc-500 font-semibold">
                                    <span>Progress: {percent}%</span>
                                    <span>{watchedVideos}/{totalVideos} Watched • {remainingVideos} Left</span>
                                  </div>
                                  <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Scrollable list of Videos */}
                                <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 border border-zinc-100 rounded-xl p-1.5 bg-zinc-50/40">
                                  {playlist.videos.map((video, idx) => {
                                    const isSchedulingThis = schedulingVideo?.playlistId === playlist.id && schedulingVideo?.videoId === video.id;
                                    const isEditingThis = editingVideoId === video.id;
                                    const isNotesOpen = selectedVideoNotesId === video.id;

                                    // Inline handlers for specific playlist
                                    const handleRenameVideo = (newTitle: string) => {
                                      if (!newTitle.trim()) return;
                                      const updated = playlist.videos.map(v => v.id === video.id ? { ...v, title: newTitle.trim() } : v);
                                      onUpdatePlaylistVideos(playlist.id, updated);
                                      setEditingVideoId(null);
                                    };

                                    const handleDeleteVideo = () => {
                                      const updated = playlist.videos.filter(v => v.id !== video.id);
                                      onUpdatePlaylistVideos(playlist.id, updated);
                                    };

                                    const handleSaveNotesAndUrl = (notesVal: string, urlVal: string) => {
                                      const updated = playlist.videos.map(v => v.id === video.id ? { ...v, notes: notesVal, videoUrl: urlVal } : v);
                                      onUpdatePlaylistVideos(playlist.id, updated);
                                      setSelectedVideoNotesId(null);
                                    };

                                    const handleUnscheduleVideo = () => {
                                      const updated = playlist.videos.map(v => v.id === video.id ? { ...v, todoId: "", scheduledDate: "" } : v);
                                      onUpdatePlaylistVideos(playlist.id, updated);
                                    };

                                    return (
                                      <div key={video.id} className="flex flex-col space-y-1.5 p-1.5 rounded-lg border border-zinc-200/50 bg-white shadow-3xs hover:shadow-2xs transition-all duration-150">
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <button
                                              type="button"
                                              onClick={() => onToggleVideoCompleted(playlist.id, video.id, video.completed)}
                                              className="p-0.5 cursor-pointer shrink-0"
                                              title={video.completed ? "Mark incomplete" : "Mark completed"}
                                            >
                                              {video.completed ? (
                                                <CheckCircle size={13} className="text-indigo-600" />
                                              ) : (
                                                <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-300 bg-white hover:border-indigo-400 transition-colors" />
                                              )}
                                            </button>

                                            {isEditingThis ? (
                                              <input
                                                type="text"
                                                autoFocus
                                                value={editingVideoTitle}
                                                onChange={(e) => setEditingVideoTitle(e.target.value)}
                                                onKeyDown={(e) => {
                                                  if (e.key === "Enter") handleRenameVideo(editingVideoTitle);
                                                  if (e.key === "Escape") setEditingVideoId(null);
                                                }}
                                                onBlur={() => handleRenameVideo(editingVideoTitle)}
                                                className="px-1.5 py-0.5 text-[10px] text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-medium w-full"
                                              />
                                            ) : (
                                              <div className="flex items-center gap-1.5 min-w-0">
                                                <span 
                                                  onDoubleClick={() => {
                                                    setEditingVideoId(video.id);
                                                    setEditingVideoTitle(video.title);
                                                  }}
                                                  className={`text-[10px] truncate cursor-pointer font-medium select-none ${video.completed ? "text-zinc-400 line-through font-normal" : "text-zinc-700 font-bold"}`}
                                                  title="Double-click to rename lesson"
                                                >
                                                  L{idx + 1}: {video.title}
                                                </span>

                                                {video.videoUrl && (
                                                  <a
                                                    href={video.videoUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    referrerPolicy="no-referrer"
                                                    className="text-indigo-500 hover:text-indigo-700 p-0.5 shrink-0 transition-colors"
                                                    title="Go to lesson video link"
                                                  >
                                                    <ExternalLink size={10} />
                                                  </a>
                                                )}
                                              </div>
                                            )}
                                          </div>

                                          {/* Buttons / Controls per video */}
                                          <div className="flex items-center gap-1 shrink-0">
                                            {/* Notes Button */}
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (isNotesOpen) {
                                                  setSelectedVideoNotesId(null);
                                                } else {
                                                  setSelectedVideoNotesId(video.id);
                                                  setVideoNotesText(video.notes || "");
                                                  setVideoUrlText(video.videoUrl || "");
                                                }
                                              }}
                                              className={`p-1 rounded-md transition-all cursor-pointer ${isNotesOpen ? "text-indigo-600 bg-indigo-50" : (video.notes ? "text-amber-500 hover:bg-amber-50" : "text-zinc-400 hover:text-indigo-600 hover:bg-zinc-100")}`}
                                              title="Add Study Notes & Link"
                                            >
                                              <FileText size={11} />
                                            </button>

                                            {/* Date Scheduler */}
                                            {video.todoId ? (
                                              <div className="flex items-center gap-0.5 bg-emerald-50 border border-emerald-100 rounded-md px-1 py-0.5" title={`Scheduled for ${video.scheduledDate}`}>
                                                <span className="text-[8px] font-mono font-bold text-emerald-700">
                                                  {video.scheduledDate ? video.scheduledDate.substring(5) : "Sync"}
                                                </span>
                                                <button
                                                  type="button"
                                                  onClick={handleUnscheduleVideo}
                                                  className="text-emerald-400 hover:text-emerald-600 p-px rounded-sm hover:bg-emerald-100/50 transition-colors cursor-pointer"
                                                  title="Unschedule task"
                                                >
                                                  <X size={8} />
                                                </button>
                                              </div>
                                            ) : (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  if (isSchedulingThis) {
                                                    setSchedulingVideo(null);
                                                  } else {
                                                    setSchedulingVideo({
                                                      playlistId: playlist.id,
                                                      videoId: video.id,
                                                      videoTitle: video.title
                                                    });
                                                  }
                                                }}
                                                className={`p-1 rounded-md transition-all cursor-pointer ${isSchedulingThis ? "text-indigo-600 bg-indigo-50" : "text-zinc-400 hover:text-indigo-600 hover:bg-zinc-100"}`}
                                                title="Assign to date as a task"
                                              >
                                                <Calendar size={11} />
                                              </button>
                                            )}

                                            {/* Rename/Edit click */}
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (isEditingThis) {
                                                  handleRenameVideo(editingVideoTitle);
                                                } else {
                                                  setEditingVideoId(video.id);
                                                  setEditingVideoTitle(video.title);
                                                }
                                              }}
                                              className="p-1 text-zinc-400 hover:text-zinc-600 rounded-md hover:bg-zinc-100 transition-colors cursor-pointer"
                                              title="Rename Lesson"
                                            >
                                              <Edit2 size={11} />
                                            </button>

                                            {/* Delete lesson */}
                                            <button
                                              type="button"
                                              onClick={handleDeleteVideo}
                                              className="p-1 text-zinc-350 hover:text-rose-500 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                                              title="Remove lesson from syllabus"
                                            >
                                              <X size={11} />
                                            </button>
                                          </div>
                                        </div>

                                        {/* Collapsible Edit Notes & URL Drawer */}
                                        {isNotesOpen && (
                                          <div className="p-2 bg-zinc-50 border border-zinc-200 rounded-md space-y-2 animate-in slide-in-from-top-1 duration-150">
                                            <div className="space-y-1">
                                              <label className="text-[8px] text-zinc-400 font-bold uppercase block">Lesson Watch URL</label>
                                              <input
                                                type="url"
                                                placeholder="e.g. https://www.youtube.com/watch?v=..."
                                                value={videoUrlText}
                                                onChange={(e) => setVideoUrlText(e.target.value)}
                                                className="w-full px-1.5 py-1 text-[10px] bg-white border border-zinc-200 rounded-md focus:outline-hidden text-zinc-700 font-medium"
                                              />
                                            </div>
                                            <div className="space-y-1">
                                              <label className="text-[8px] text-zinc-400 font-bold uppercase block">Study Notes / Core Takeaways</label>
                                              <textarea
                                                rows={3}
                                                placeholder="Write down definitions, code snippets, key ideas, or questions here..."
                                                value={videoNotesText}
                                                onChange={(e) => setVideoNotesText(e.target.value)}
                                                className="w-full px-1.5 py-1 text-[10px] bg-white border border-zinc-200 rounded-md focus:outline-hidden text-zinc-700 font-medium"
                                              />
                                            </div>
                                            <div className="flex justify-end gap-1.5">
                                              <button
                                                type="button"
                                                onClick={() => setSelectedVideoNotesId(null)}
                                                className="text-[8px] font-bold text-zinc-500 hover:bg-zinc-150 px-2 py-0.5 rounded transition-all cursor-pointer"
                                              >
                                                Discard
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleSaveNotesAndUrl(videoNotesText, videoUrlText)}
                                                className="text-[8px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-2 py-0.5 rounded transition-all flex items-center gap-1 cursor-pointer"
                                              >
                                                <Save size={9} />
                                                Save Lesson Details
                                              </button>
                                            </div>
                                          </div>
                                        )}

                                        {/* Inline scheduler date picker form */}
                                        {isSchedulingThis && (
                                          <div className="flex items-center gap-1.5 pt-1 px-1 bg-indigo-50/40 border border-indigo-100 rounded-md animate-in fade-in duration-100">
                                            <input
                                              type="date"
                                              value={selectedScheduleDate}
                                              onChange={(e) => setSelectedScheduleDate(e.target.value)}
                                              className="text-[9px] bg-white border border-zinc-200 rounded px-1 py-0.5 focus:outline-hidden font-mono font-bold text-zinc-700"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => {
                                                onScheduleVideo(playlist.id, playlist.name, video.id, video.title, skill.id, selectedScheduleDate);
                                                setSchedulingVideo(null);
                                              }}
                                              className="text-[8px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-1.5 py-0.5 rounded transition-all shrink-0 cursor-pointer"
                                            >
                                              Confirm
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setSchedulingVideo(null)}
                                              className="text-zinc-400 hover:text-zinc-600 shrink-0 cursor-pointer"
                                            >
                                              <X size={10} />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}

                                  {/* Manual Add Video/Lesson Row */}
                                  <div className="pt-1.5 border-t border-zinc-100/80">
                                    <div className="flex gap-1.5">
                                      <input
                                        type="text"
                                        placeholder="+ Add single manual video topic..."
                                        value={newVideoTitle}
                                        onChange={(e) => setNewVideoTitle(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" && newVideoTitle.trim()) {
                                            const newVideo = {
                                              id: `video-${Date.now()}`,
                                              title: newVideoTitle.trim(),
                                              completed: false,
                                              notes: "",
                                              videoUrl: ""
                                            };
                                            onUpdatePlaylistVideos(playlist.id, [...playlist.videos, newVideo]);
                                            setNewVideoTitle("");
                                          }
                                        }}
                                        className="w-full px-2 py-1 text-[9px] bg-white border border-zinc-200 rounded-md focus:outline-hidden text-zinc-700"
                                      />
                                      <button
                                        type="button"
                                        disabled={!newVideoTitle.trim()}
                                        onClick={() => {
                                          const newVideo = {
                                            id: `video-${Date.now()}`,
                                            title: newVideoTitle.trim(),
                                            completed: false,
                                            notes: "",
                                            videoUrl: ""
                                          };
                                          onUpdatePlaylistVideos(playlist.id, [...playlist.videos, newVideo]);
                                          setNewVideoTitle("");
                                        }}
                                        className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded-md transition-all border border-transparent hover:border-indigo-100 cursor-pointer whitespace-nowrap"
                                      >
                                        + Add Lesson
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* QUICK GUIDE FOOTER CARD */}
      <div className="bg-white border border-zinc-200/80 p-4 rounded-xl text-xs text-zinc-500 flex items-start gap-3 shadow-2xs">
        <Activity size={16} className="text-indigo-500 flex-shrink-0 mt-0.5 animate-pulse" />
        <div>
          <span className="font-semibold text-zinc-800 block mb-0.5">How skills mapping drives focus</span>
          Rather than keeping lists random, assign your day's study tasks or projects directly to a specific skill. As you check off todos, your competence grows, giving you visual feedback on your long-term dedication.
        </div>
      </div>

    </div>
  );
}
