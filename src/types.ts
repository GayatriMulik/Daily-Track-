export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  category: 'study' | 'coding' | 'math' | 'research' | 'personal' | 'health' | 'work' | 'other';
  durationMinutes?: number;
  date: string;
  skillId?: string;    // Link to a specific skill
  projectId?: string;  // Link to a specific project
  playlistId?: string; // Link to a playlist
  videoId?: string;    // Link to a specific video index/ID in playlist
  createdAt?: string;
  userId?: string;
}

export interface PlaylistVideo {
  id: string; // unique within playlist
  title: string;
  completed: boolean;
  todoId?: string; // ID of the scheduled todo item if assigned
  scheduledDate?: string; // Scheduled date string e.g. "2026-07-02"
  notes?: string;
  videoUrl?: string;
}

export interface Playlist {
  id: string;
  name: string;
  url?: string; // YouTube URL
  skillId: string; // assigned skill
  userId: string;
  videos: PlaylistVideo[];
  createdAt?: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  progress: number; // 0 to 100
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  createdAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'Idea' | 'In Progress' | 'Completed';
  skillsApplied: string[]; // List of skill names/IDs
  githubUrl?: string;
  demoUrl?: string;
  notes?: string;
  createdAt?: string;
}

export interface DailyStats {
  completedTodos: number;
  totalTodos: number;
  studyTimeMinutes: number;
}
