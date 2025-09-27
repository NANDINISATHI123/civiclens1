export enum Page {
  Home = 'Home',
  Login = 'Login',
  SignUp = 'SignUp',
  AdminLogin = 'AdminLogin',
  Dashboard = 'Dashboard',
  SubmitReport = 'SubmitReport',
  ViewReport = 'ViewReport',
  Workers = 'Workers',
  Users = 'Users',
  Contact = 'Contact',
  Feedback = 'Feedback',
  LiveMap = 'LiveMap',
}

export enum UserRole {
  Admin = 'admin',
  Citizen = 'citizen',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export enum ReportStatus {
  Pending = 'Pending',
  Assigned = 'Assigned',
  InProgress = 'In Progress',
  Resolved = 'Resolved',
}

export enum ReportCategory {
  Pothole = 'Pothole',
  Graffiti = 'Graffiti',
  StreetlightOut = 'Streetlight Out',
  Trash = 'Trash & Illegal Dumping',
  DamagedSign = 'Damaged Sign',
  Other = 'Other',
}

export interface StatusUpdate {
  status: ReportStatus;
  timestamp: Date | string;
  notes?: string;
}

export interface Report {
  id: number;
  created_at: string;
  title: string;
  description: string;
  location: string;
  category: ReportCategory;
  image_url: string | null;
  image_data?: string; // For client-side use
  submitted_by: string; // user id
  submitted_by_name?: string; // user name, might be joined
  assigned_to?: number | null; // worker id
  status: ReportStatus;
  status_history: StatusUpdate[];
  vote_count: number;
}

export interface Worker {
    id: number;
    name: string;
    contact: string;
    role: string;
}
