import { useState, FormEvent } from "react";
import { 
  Target, 
  Plus, 
  Trash2, 
  ExternalLink, 
  GitBranch, 
  CheckCircle, 
  Clock, 
  FileText, 
  Check 
} from "lucide-react";
import { Project, Skill, TodoItem } from "../types";

interface ProjectsViewProps {
  projects: Project[];
  skills: Skill[];
  todos: TodoItem[];
  onAddProject: (
    name: string,
    description: string,
    status: Project["status"],
    skillsApplied: string[],
    githubUrl?: string,
    demoUrl?: string,
    notes?: string
  ) => void;
  onDeleteProject: (id: string) => void;
  onUpdateProjectStatus: (id: string, status: Project["status"]) => void;
  onToggleTodo: (id: string, current: boolean) => void;
}

export default function ProjectsView({
  projects,
  skills,
  todos,
  onAddProject,
  onDeleteProject,
  onUpdateProjectStatus,
  onToggleTodo
}: ProjectsViewProps) {
  // Project creation form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Project["status"]>("In Progress");
  const [skillsApplied, setSkillsApplied] = useState<string[]>([]);
  const [githubUrl, setGithubUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSkillToggle = (skillId: string) => {
    setSkillsApplied((prev) => 
      prev.includes(skillId) 
        ? prev.filter((id) => id !== skillId) 
        : [...prev, skillId]
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    onAddProject(
      name.trim(),
      description.trim(),
      status,
      skillsApplied,
      githubUrl.trim() || undefined,
      demoUrl.trim() || undefined,
      notes.trim() || undefined
    );

    // Reset Form
    setName("");
    setDescription("");
    setStatus("In Progress");
    setSkillsApplied([]);
    setGithubUrl("");
    setDemoUrl("");
    setNotes("");
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
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-lg font-bold text-zinc-900 flex items-center gap-1.5">
            <Target size={20} className="text-indigo-600 animate-pulse" />
            Project Tracker
          </h2>
          <p className="text-xs text-zinc-500">
            Keep track of development, portfolios, or personal build projects. Group your daily checklist items inside projects for organized tracking.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-indigo-600/10 flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-center"
        >
          <Plus size={14} />
          {showAddForm ? "Hide Form" : "Add New Project"}
        </button>
      </div>

      {/* NEW PROJECT FORM */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-zinc-200/85 p-5 rounded-2xl shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
          <h3 className="font-serif text-sm font-bold text-zinc-900">Define Project Blueprint</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Project Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Portfolio Website, AI Study Bot"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white text-zinc-800 font-medium"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Current Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Project["status"])}
                className="w-full bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200 text-zinc-600 text-xs px-2.5 py-2.5 rounded-lg focus:outline-hidden cursor-pointer"
              >
                <option value="Idea">💡 Idea Stage</option>
                <option value="In Progress">🛠️ In Progress</option>
                <option value="Completed">✅ Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Project Description</label>
            <textarea
              required
              rows={2}
              placeholder="Briefly describe the goals of this project and what you intend to build..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white text-zinc-700 leading-relaxed resize-none"
            />
          </div>

          {/* INTEGRATED SKILL CHECKBOXES */}
          <div>
            <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1.5">Apply Tracked Skills</label>
            {skills.length === 0 ? (
              <p className="text-[10px] text-zinc-400 italic">
                You haven't added any tracked skills yet. Skills created in the Skills Tab will appear here.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-zinc-50 border border-zinc-200/60 rounded-xl">
                {skills.map((skill) => {
                  const isChecked = skillsApplied.includes(skill.id);
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => handleSkillToggle(skill.id)}
                      className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all cursor-pointer ${
                        isChecked
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold shadow-2xs"
                          : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                      }`}
                    >
                      {isChecked && "✓ "}⚡ {skill.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Repository URL (optional)</label>
              <input
                type="url"
                placeholder="https://github.com/..."
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white text-zinc-800 font-medium"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Live Demo URL (optional)</label>
              <input
                type="url"
                placeholder="https://my-live-app.vercel.app"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white text-zinc-800 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Technical Notes & Specifications (optional)</label>
            <textarea
              rows={2}
              placeholder="List core tech stack, APIs, libraries, databases or next milestones..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white text-zinc-700 leading-relaxed resize-none"
            />
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
              Deploy Project Target
            </button>
          </div>
        </form>
      )}

      {/* PROJECTS LIST GRID */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 border border-dashed border-zinc-200 rounded-2xl bg-white shadow-xs">
          <GitBranch size={36} className="text-zinc-300 mb-3" />
          <h4 className="font-serif text-sm font-bold text-zinc-700">No Projects Tracked</h4>
          <p className="text-xs text-zinc-400 max-w-sm mt-1.5 leading-relaxed">
            Register your active builds, thesis, coding models, or personal goals. Group your daily tasks underneath these projects for high-level visualization.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-200/60 px-3.5 py-2 rounded-xl transition-all cursor-pointer mt-4"
          >
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {projects.map((project) => {
            // Find todos associated with this project
            const projectTodos = todos.filter((t) => t.projectId === project.id);
            const completedTodos = projectTodos.filter((t) => t.completed);

            // Status Badge Helpers
            const statusStyles = {
              Idea: "bg-amber-50 text-amber-700 border-amber-100",
              "In Progress": "bg-indigo-50 text-indigo-700 border-indigo-100",
              Completed: "bg-emerald-50 text-emerald-700 border-emerald-100"
            };

            return (
              <div
                key={project.id}
                className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row gap-6 hover:border-zinc-300 transition-all"
              >
                
                {/* LEFT BLOCK: TITLE, DETAILS, STATUS & LINKS */}
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <select
                          value={project.status}
                          onChange={(e) => onUpdateProjectStatus(project.id, e.target.value as Project["status"])}
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 border rounded-lg focus:outline-hidden cursor-pointer ${statusStyles[project.status]}`}
                        >
                          <option value="Idea">💡 Idea</option>
                          <option value="In Progress">🛠️ In Progress</option>
                          <option value="Completed">✅ Completed</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete the project "${project.name}"? This will not delete the associated todos.`)) {
                            onDeleteProject(project.id);
                          }
                        }}
                        className="p-1 text-zinc-300 hover:text-rose-500 rounded-md hover:bg-rose-50 transition-colors cursor-pointer self-start"
                        title="Delete Project"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <h3 className="font-serif text-lg font-bold text-zinc-900 leading-tight">
                      {project.name}
                    </h3>

                    <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                      {project.description}
                    </p>
                  </div>

                  {/* Skills Applied Tags */}
                  {project.skillsApplied && project.skillsApplied.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-400 block">Required Skills</span>
                      <div className="flex flex-wrap gap-1">
                        {project.skillsApplied.map((skillId) => {
                          const skill = skills.find((s) => s.id === skillId);
                          if (!skill) return null;
                          return (
                            <span key={skillId} className="text-[9px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200/50 px-2 py-0.5 rounded-md">
                              ⚡ {skill.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Notes / Specifications */}
                  {project.notes && (
                    <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3 text-xs leading-relaxed text-zinc-600 space-y-1">
                      <span className="font-bold text-[9px] text-zinc-400 font-mono uppercase tracking-wider block">Tech Stack & Notes</span>
                      <p className="whitespace-pre-line font-medium">{project.notes}</p>
                    </div>
                  )}

                  {/* External Repository & Demo Links */}
                  {(project.githubUrl || project.demoUrl) && (
                    <div className="flex items-center gap-3 pt-1">
                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          referrerPolicy="no-referrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 hover:text-indigo-600 transition-colors"
                        >
                          <GitBranch size={13} />
                          Repository
                          <ExternalLink size={10} />
                        </a>
                      )}
                      {project.demoUrl && (
                        <a
                          href={project.demoUrl}
                          target="_blank"
                          referrerPolicy="no-referrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 hover:text-indigo-600 transition-colors"
                        >
                          <ExternalLink size={13} />
                          Live Prototype
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* RIGHT BLOCK: LIST OF ASSOCIATED TASKS */}
                <div className="md:w-72 bg-zinc-50 border border-zinc-100 rounded-2xl p-4 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center pb-2 border-b border-zinc-200/60">
                      <span className="font-serif text-xs font-bold text-zinc-800">Project Tasks</span>
                      <span className="text-[10px] font-mono font-bold text-zinc-500">
                        {completedTodos.length}/{projectTodos.length} Completed
                      </span>
                    </div>

                    {projectTodos.length === 0 ? (
                      <p className="text-[10px] text-zinc-400 italic">
                        No active daily tasks linked to this project. Link tasks in the Calendar Daily Planner!
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {projectTodos.map((todo) => (
                          <div key={todo.id} className="flex items-center justify-between gap-2 text-[11px] py-1 px-1.5 bg-white border border-zinc-150 rounded-lg hover:border-zinc-300 transition-all">
                            <div className="flex items-center gap-1.5 min-w-0">
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

                  {/* Tiny progress bar helper */}
                  <div className="space-y-1">
                    <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${projectTodos.length > 0 ? Math.round((completedTodos.length / projectTodos.length) * 100) : 0}%` }}
                      ></div>
                    </div>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
